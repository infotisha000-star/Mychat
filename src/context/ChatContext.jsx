import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { db, rtdb, collection, doc, setDoc, deleteDoc, onSnapshot, ref, set, onValue } from '../services/firebase';
import { playSendSound, playReceiveSound } from '../utils/soundEffects';
import { sendIncomingMessageNotification, requestNotificationPermission } from '../services/notificationService';

const ChatContext = createContext(null);

const MESSAGES_KEY = 'vortex_local_messages';
const SESSIONS_KEY = 'vortex_local_sessions';
const SYNC_CHANNEL_NAME = 'vortex_chat_channel';

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState(() => {
    try {
      const storedMsgs = localStorage.getItem(MESSAGES_KEY);
      return storedMsgs ? JSON.parse(storedMsgs) : [];
    } catch {
      return [];
    }
  });
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [broadcastChannel, setBroadcastChannel] = useState(null);
  const isInitialMount = useRef(true);

  // Request Notification permission on user login
  useEffect(() => {
    if (user) {
      requestNotificationPermission();
    }
  }, [user]);

  // Sync BroadcastChannel locally
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
      setBroadcastChannel(channel);

      channel.onmessage = (event) => {
        if (event.data?.type === 'SYNC_STATE') {
          loadStateFromStorage();
        }
      };

      return () => channel.close();
    }
  }, []);

  // Update pinned messages whenever messages change
  useEffect(() => {
    setPinnedMessages(messages.filter((m) => m.pinned && !m.deleted));
  }, [messages]);

  // Listen for online reconnection to auto-sync state
  useEffect(() => {
    const handleOnlineSync = () => {
      loadStateFromStorage();
    };
    window.addEventListener('online', handleOnlineSync);
    return () => window.removeEventListener('online', handleOnlineSync);
  }, []);

  // Dual Realtime Stream Listener (Cloud Firestore + Realtime Database)
  useEffect(() => {
    let unsubFirestore = null;
    let unsubRTDB = null;

    const mergeAndSetMessages = (newList) => {
      setMessages((prev) => {
        const msgMap = new Map();
        const prevIds = new Set(prev.map((m) => m.id));

        // Keep existing
        prev.forEach((m) => m && m.id && msgMap.set(m.id, m));
        
        let hasIncomingNewMessage = false;
        let incomingMsgObj = null;

        // Merge new
        newList.forEach((m) => {
          if (m && m.id) {
            if (!prevIds.has(m.id) && m.senderId !== user?.uid && !isInitialMount.current) {
              hasIncomingNewMessage = true;
              incomingMsgObj = m;
            }
            msgMap.set(m.id, m);
          }
        });

        const merged = Array.from(msgMap.values());
        merged.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        localStorage.setItem(MESSAGES_KEY, JSON.stringify(merged));

        // Play audio chime and display notification for incoming message
        if (hasIncomingNewMessage && incomingMsgObj) {
          playReceiveSound();
          sendIncomingMessageNotification({
            senderName: incomingMsgObj.senderName,
            text: incomingMsgObj.text,
            media: incomingMsgObj.media,
          });
        }

        if (isInitialMount.current && merged.length > 0) {
          isInitialMount.current = false;
        }

        return merged;
      });
      setLoadingMessages(false);
    };

    // 1. Listen to Cloud Firestore messages
    try {
      const colRef = collection(db, 'messages');
      unsubFirestore = onSnapshot(colRef, (snapshot) => {
        if (!snapshot.empty) {
          const list = [];
          snapshot.forEach((d) => {
            const data = d.data();
            if (data && data.id) list.push(data);
          });
          mergeAndSetMessages(list);
        }
      }, (err) => {
        console.warn('Firestore messages listener warning:', err);
      });
    } catch (e) {
      console.warn('Firestore listener setup failed:', e);
    }

    // 2. Listen to Realtime Database messages
    try {
      const msgsRef = ref(rtdb, 'messages');
      unsubRTDB = onValue(msgsRef, (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          const list = Array.isArray(val)
            ? val.filter(Boolean)
            : Object.values(val);
          mergeAndSetMessages(list);
        }
      }, (err) => {
        console.warn('RTDB messages listener warning:', err);
      });
    } catch (e) {
      console.warn('RTDB listener setup failed:', e);
    }

    return () => {
      if (typeof unsubFirestore === 'function') unsubFirestore();
      if (typeof unsubRTDB === 'function') unsubRTDB();
    };
  }, []);

  // Sync Active User Presence in Firebase
  useEffect(() => {
    if (!user) return;
    try {
      const sessionObj = {
        id: user.uid,
        userName: user.userName || (user.isAdmin ? 'Admin' : 'User'),
        code: user.code || 'JOINED',
        joinedAt: user.joinedAt || new Date().toISOString(),
      };
      set(ref(rtdb, `presence/${user.uid}`), sessionObj).catch(console.warn);
      setDoc(doc(db, 'sessions', user.uid), sessionObj).catch(console.warn);

      // Listen to active users
      const presenceRef = ref(rtdb, 'presence');
      const unsub = onValue(presenceRef, (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          const list = Object.values(val);
          setActiveUsers(list);
          localStorage.setItem(SESSIONS_KEY, JSON.stringify(list));
        }
      });
      return () => unsub();
    } catch (e) {
      console.warn('Presence sync error:', e);
    }
  }, [user]);

  const loadStateFromStorage = useCallback(() => {
    try {
      const storedMsgs = localStorage.getItem(MESSAGES_KEY);
      let msgsList = storedMsgs ? JSON.parse(storedMsgs) : [];
      setMessages(msgsList);

      const storedSessions = localStorage.getItem(SESSIONS_KEY);
      if (storedSessions) {
        setActiveUsers(JSON.parse(storedSessions));
      }
    } catch (e) {
      console.error('Error loading state from localStorage:', e);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const notifySync = useCallback(() => {
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'SYNC_STATE' });
    }
  }, [broadcastChannel]);

  // Instant Non-blocking Send Message (Writes to Firestore + RTDB)
  const sendMessage = useCallback(async ({ text = '', media = [], replyTo = null }) => {
    if (!user) throw new Error('Not authenticated');
    if (!text.trim() && media.length === 0) {
      throw new Error('Please enter a message or attach media files.');
    }

    const senderName = user.isAdmin ? 'Admin' : (user.userName || 'User');
    const senderRole = user.isAdmin ? 'admin' : 'temp_user';

    let messageType = 'text';
    if (media.length > 0) {
      const hasVideo = media.some((m) => m.type && m.type.startsWith('video/'));
      const hasImage = media.some((m) => m.type && m.type.startsWith('image/'));
      if (hasVideo && hasImage) messageType = 'media';
      else if (hasVideo) messageType = 'video';
      else messageType = 'image';
    }

    const newMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      roomId: 'main_room',
      senderId: user.uid,
      senderName,
      senderRole,
      messageType,
      text: text.trim(),
      media,
      timestamp: new Date().toISOString(),
      edited: false,
      editCount: 0,
      deleted: false,
      pinned: false,
      replyTo: replyTo ? {
        id: replyTo.id,
        senderName: replyTo.senderName,
        text: replyTo.text || (replyTo.media?.length ? '📷 Media' : '')
      } : null,
      reactions: {},
    };

    // 1. Instant local state update (0ms delay!)
    setMessages((prev) => [...prev, newMessage]);
    playSendSound();

    try {
      const stored = localStorage.getItem(MESSAGES_KEY);
      const currentList = stored ? JSON.parse(stored) : [];
      localStorage.setItem(MESSAGES_KEY, JSON.stringify([...currentList, newMessage]));
    } catch (e) {
      console.warn('LocalStorage save warning:', e);
    }

    // 2. Dual Cloud Writes in background (Firestore + RTDB)
    setDoc(doc(db, 'messages', newMessage.id), newMessage).catch(console.warn);
    set(ref(rtdb, `messages/${newMessage.id}`), newMessage).catch(console.warn);

    notifySync();
    return newMessage.id;
  }, [user, notifySync]);

  // Instant Non-blocking Reaction Toggle
  const toggleReaction = useCallback(async (messageId, emoji) => {
    if (!user) return;
    const userId = user.uid;

    let targetMsg = null;
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          const reactions = { ...(msg.reactions || {}) };
          const currentUsers = reactions[emoji] || [];

          if (currentUsers.includes(userId)) {
            reactions[emoji] = currentUsers.filter((id) => id !== userId);
            if (reactions[emoji].length === 0) delete reactions[emoji];
          } else {
            reactions[emoji] = [...currentUsers, userId];
          }

          targetMsg = { ...msg, reactions };
          return targetMsg;
        }
        return msg;
      })
    );

    if (targetMsg) {
      setDoc(doc(db, 'messages', messageId), { reactions: targetMsg.reactions || {} }, { merge: true }).catch(console.warn);
      set(ref(rtdb, `messages/${messageId}/reactions`), targetMsg.reactions || {}).catch(console.warn);
    }

    notifySync();
  }, [user, notifySync]);

  // Instant Non-blocking Edit Message (Admin or Message Owner)
  const editMessage = useCallback(async (messageId, newText) => {
    if (!user) throw new Error('Not authenticated');

    let editedMsgObj = null;
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          if (!user.isAdmin && msg.editCount >= 3) {
            throw new Error('This message has been edited the maximum limit of 3 times.');
          }
          editedMsgObj = {
            ...msg,
            text: newText.trim(),
            edited: true,
            editCount: (msg.editCount || 0) + 1,
            editedAt: new Date().toISOString(),
          };
          return editedMsgObj;
        }
        return msg;
      })
    );

    if (editedMsgObj) {
      setDoc(doc(db, 'messages', messageId), editedMsgObj, { merge: true }).catch(console.warn);
      set(ref(rtdb, `messages/${messageId}`), editedMsgObj).catch(console.warn);
    }

    notifySync();
  }, [user, notifySync]);

  // Instant Non-blocking Soft Delete (Admin or Message Owner)
  const deleteMessage = useCallback(async (messageId) => {
    if (!user) throw new Error('Not authenticated');

    let deletedMsgObj = null;
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          deletedMsgObj = {
            ...msg,
            deleted: true,
            deletedAt: new Date().toISOString(),
          };
          return deletedMsgObj;
        }
        return msg;
      })
    );

    if (deletedMsgObj) {
      setDoc(doc(db, 'messages', messageId), deletedMsgObj, { merge: true }).catch(console.warn);
      set(ref(rtdb, `messages/${messageId}`), deletedMsgObj).catch(console.warn);
    }

    notifySync();
  }, [user, notifySync]);

  // Bulk Delete
  const deleteMultipleMessages = useCallback(async (messageIds = []) => {
    if (!user || messageIds.length === 0) return;

    const idsSet = new Set(messageIds);
    setMessages((prev) =>
      prev.map((msg) => {
        if (idsSet.has(msg.id)) {
          const deletedObj = {
            ...msg,
            deleted: true,
            deletedAt: new Date().toISOString(),
          };
          setDoc(doc(db, 'messages', msg.id), deletedObj, { merge: true }).catch(console.warn);
          set(ref(rtdb, `messages/${msg.id}`), deletedObj).catch(console.warn);
          return deletedObj;
        }
        return msg;
      })
    );

    notifySync();
  }, [user, notifySync]);

  // Admin Master Clear All Messages
  const clearAllMessages = useCallback(async () => {
    if (!user || !user.isAdmin) return;

    setMessages((prev) => {
      const allIds = prev.map((m) => m.id);
      allIds.forEach((id) => {
        setDoc(doc(db, 'messages', id), { deleted: true, deletedAt: new Date().toISOString() }, { merge: true }).catch(console.warn);
        set(ref(rtdb, `messages/${id}/deleted`), true).catch(console.warn);
      });
      return [];
    });
    localStorage.setItem(MESSAGES_KEY, JSON.stringify([]));

    notifySync();
  }, [user, notifySync]);

  // Instant Non-blocking Toggle Pin
  const togglePinMessage = useCallback(async (messageId) => {
    if (!user) throw new Error('Not authenticated');

    let pinnedObj = null;
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          pinnedObj = {
            ...msg,
            pinned: !msg.pinned,
            pinnedAt: !msg.pinned ? new Date().toISOString() : null,
            pinnedBy: !msg.pinned ? (user.displayName || user.userName || 'Admin') : null,
          };
          return pinnedObj;
        }
        return msg;
      })
    );

    if (pinnedObj) {
      setDoc(doc(db, 'messages', messageId), pinnedObj, { merge: true }).catch(console.warn);
      set(ref(rtdb, `messages/${messageId}`), pinnedObj).catch(console.warn);
    }

    notifySync();
  }, [user, notifySync]);

  // Filter messages by search query
  const filteredMessages = React.useMemo(() => {
    return searchQuery.trim()
      ? messages.filter((m) =>
          m.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.senderName?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : messages;
  }, [messages, searchQuery]);

  const value = React.useMemo(() => ({
    messages: filteredMessages,
    allMessages: messages,
    pinnedMessages,
    activeUsers,
    loadingMessages,
    searchQuery,
    setSearchQuery,
    sendMessage,
    toggleReaction,
    editMessage,
    deleteMessage,
    deleteMultipleMessages,
    clearAllMessages,
    togglePinMessage,
    loadStateFromStorage,
  }), [
    filteredMessages,
    messages,
    pinnedMessages,
    activeUsers,
    loadingMessages,
    searchQuery,
    sendMessage,
    toggleReaction,
    editMessage,
    deleteMessage,
    deleteMultipleMessages,
    clearAllMessages,
    togglePinMessage,
    loadStateFromStorage,
  ]);

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};
