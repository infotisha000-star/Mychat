import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { db, rtdb, collection, doc, setDoc, deleteDoc, onSnapshot, ref, set, onValue } from '../services/firebase';
import { playSendSound, playReceiveSound } from '../utils/soundEffects';
import { sendIncomingMessageNotification, requestNotificationPermission } from '../services/notificationService';

const ChatContext = createContext(null);

const MESSAGES_KEY = 'vortex_local_messages';
const SESSIONS_KEY = 'vortex_local_sessions';
const PINNED_IDS_KEY = 'vortex_pinned_ids';
const SYNC_CHANNEL_NAME = 'vortex_chat_channel';

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState(() => {
    try {
      const storedMsgs = localStorage.getItem(MESSAGES_KEY);
      const parsed = storedMsgs ? JSON.parse(storedMsgs) : [];
      return Array.isArray(parsed) ? parsed.filter((m) => m && m.id) : [];
    } catch {
      return [];
    }
  });

  const [pinnedIds, setPinnedIds] = useState(() => {
    try {
      const stored = localStorage.getItem(PINNED_IDS_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
    } catch {
      return new Set();
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

  // Real-time Cloud Sync for Pinned Message IDs
  useEffect(() => {
    let unsubRTDB = null;
    try {
      const idsRef = ref(rtdb, 'pinned_ids');
      unsubRTDB = onValue(idsRef, (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          const list = Array.isArray(val) ? val : Object.values(val);
          const stringList = list.map(String);
          setPinnedIds(new Set(stringList));
          try {
            localStorage.setItem(PINNED_IDS_KEY, JSON.stringify(stringList));
          } catch (e) {}
        }
      });
    } catch (e) {}
    return () => {
      if (typeof unsubRTDB === 'function') unsubRTDB();
    };
  }, []);

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

  // Update pinned messages whenever messages or pinnedIds change
  useEffect(() => {
    const valid = (Array.isArray(messages) ? messages : []).filter(
      (m) => m && m.id && (pinnedIds.has(String(m.id)) || Boolean(m.pinned)) && !m.deleted
    );
    setPinnedMessages(valid);
  }, [messages, pinnedIds]);

  // Listen for online reconnection to auto-sync state
  useEffect(() => {
    const handleOnlineSync = () => {
      loadStateFromStorage();
    };
    window.addEventListener('online', handleOnlineSync);
    return () => window.removeEventListener('online', handleOnlineSync);
  }, []);

  // Real-time Cloud Message Stream Listener with debounced state updates
  useEffect(() => {
    let unsubFirestore = null;
    let unsubRTDB = null;
    let updateTimer = null;

    const mergeAndSetMessages = (newList) => {
      if (!Array.isArray(newList) || newList.length === 0) return;

      if (updateTimer) clearTimeout(updateTimer);
      updateTimer = setTimeout(() => {
        let incomingMsgObj = null;

        setMessages((prev) => {
          const msgMap = new Map();
          const validPrev = Array.isArray(prev) ? prev.filter((m) => m && m.id) : [];
          const prevIds = new Set(validPrev.map((m) => m.id));

          validPrev.forEach((m) => msgMap.set(m.id, m));

          newList.forEach((m) => {
            if (m && m.id) {
              if (!prevIds.has(m.id) && m.senderId !== user?.uid && !isInitialMount.current) {
                incomingMsgObj = m;
              }
              const existing = msgMap.get(m.id);
              const isPinned = pinnedIds.has(String(m.id)) || Boolean(m.pinned) || Boolean(existing?.pinned);
              msgMap.set(m.id, {
                ...(existing || {}),
                ...m,
                pinned: isPinned,
              });
            }
          });

          const merged = Array.from(msgMap.values());
          merged.sort((a, b) => {
            const tA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
            const tB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
            return tA - tB;
          });

          if (isInitialMount.current && merged.length > 0) {
            isInitialMount.current = false;
          }

          return merged;
        });

        if (incomingMsgObj) {
          playReceiveSound();
          sendIncomingMessageNotification({
            senderName: incomingMsgObj.senderName,
            text: incomingMsgObj.text,
            media: incomingMsgObj.media,
          });
        }

        setLoadingMessages(false);
      }, 50);
    };

    // 1. Listen to Realtime Database messages (Primary Stream)
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

    // 2. Fallback Firestore Snapshot listener if RTDB fails
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

    return () => {
      if (updateTimer) clearTimeout(updateTimer);
      if (typeof unsubFirestore === 'function') unsubFirestore();
      if (typeof unsubRTDB === 'function') unsubRTDB();
    };
  }, [user?.uid, pinnedIds]);

  const [typingUsers, setTypingUsers] = useState({});
  const [muted, setMuted] = useState(() => {
    try { return localStorage.getItem('vortex_chat_muted') === 'true'; } catch { return false; }
  });
  const [archived, setArchived] = useState(() => {
    try { return localStorage.getItem('vortex_chat_archived') === 'true'; } catch { return false; }
  });
  const [blockedUsers, setBlockedUsers] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('vortex_blocked_users') || '[]')); } catch { return new Set(); }
  });

  // Sync Typing Indicators in RTDB
  useEffect(() => {
    let unsub = null;
    try {
      const typingRef = ref(rtdb, 'typing');
      unsub = onValue(typingRef, (snapshot) => {
        if (snapshot.exists()) {
          setTypingUsers(snapshot.val() || {});
        } else {
          setTypingUsers({});
        }
      });
    } catch (e) {}
    return () => { if (typeof unsub === 'function') unsub(); };
  }, []);

  const sendTypingStatus = useCallback((isTyping) => {
    if (!user) return;
    try {
      if (isTyping) {
        set(ref(rtdb, `typing/${user.uid}`), {
          userName: user.userName || (user.isAdmin ? 'Admin' : 'User'),
          timestamp: Date.now(),
        }).catch(console.warn);
      } else {
        set(ref(rtdb, `typing/${user.uid}`), null).catch(console.warn);
      }
    } catch (e) {}
  }, [user]);

  // Sync Active User Presence in Firebase with lastSeen
  useEffect(() => {
    if (!user) return;
    let unsub = null;

    try {
      const sessionObj = {
        id: user.uid,
        userName: user.userName || (user.isAdmin ? 'Admin' : 'User'),
        code: user.code || 'JOINED',
        joinedAt: user.joinedAt || new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        isOnline: true,
      };
      set(ref(rtdb, `presence/${user.uid}`), sessionObj).catch(console.warn);
      setDoc(doc(db, 'sessions', user.uid), sessionObj).catch(console.warn);

      // Listen to active users
      const presenceRef = ref(rtdb, 'presence');
      unsub = onValue(presenceRef, (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          const list = Object.values(val);
          setActiveUsers(list);
          setTimeout(() => {
            try {
              localStorage.setItem(SESSIONS_KEY, JSON.stringify(list));
            } catch (e) {}
          }, 100);
        }
      }, (err) => {
        console.warn('Presence listener warning:', err);
      });
    } catch (e) {
      console.warn('Presence sync error:', e);
    }

    return () => {
      if (typeof unsub === 'function') {
        try { unsub(); } catch (e) {}
      }
      if (user) {
        set(ref(rtdb, `presence/${user.uid}/isOnline`), false).catch(console.warn);
        set(ref(rtdb, `presence/${user.uid}/lastSeen`), new Date().toISOString()).catch(console.warn);
      }
    };
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
      status: 'sent',
      readBy: { [user.uid]: new Date().toISOString() },
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

    // Clear typing status on message send
    sendTypingStatus(false);

    // 2. Dual Cloud Writes in background (Firestore + RTDB)
    setDoc(doc(db, 'messages', newMessage.id), newMessage).catch(console.warn);
    set(ref(rtdb, `messages/${newMessage.id}`), newMessage).catch(console.warn);

    notifySync();
    return newMessage.id;
  }, [user, notifySync, sendTypingStatus]);

  // Mark Message as Read / Seen
  const markAsRead = useCallback((messageId) => {
    if (!user || !messageId) return;
    const nowIso = new Date().toISOString();
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId && (!msg.readBy || !msg.readBy[user.uid])) {
          const updatedReadBy = { ...(msg.readBy || {}), [user.uid]: nowIso };
          const updatedMsg = { ...msg, status: 'read', readBy: updatedReadBy };
          setDoc(doc(db, 'messages', messageId), { status: 'read', readBy: updatedReadBy }, { merge: true }).catch(console.warn);
          set(ref(rtdb, `messages/${messageId}/readBy/${user.uid}`), nowIso).catch(console.warn);
          set(ref(rtdb, `messages/${messageId}/status`), 'read').catch(console.warn);
          return updatedMsg;
        }
        return msg;
      })
    );
  }, [user]);

  // Toggle Mute Notifications
  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      try { localStorage.setItem('vortex_chat_muted', String(next)); } catch (e) {}
      return next;
    });
  }, []);

  // Toggle Archive Conversation
  const toggleArchive = useCallback(() => {
    setArchived((prev) => {
      const next = !prev;
      try { localStorage.setItem('vortex_chat_archived', String(next)); } catch (e) {}
      return next;
    });
  }, []);

  // Toggle Block User
  const toggleBlockUser = useCallback((targetUserId) => {
    setBlockedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(targetUserId)) next.delete(targetUserId);
      else next.add(targetUserId);
      try { localStorage.setItem('vortex_blocked_users', JSON.stringify(Array.from(next))); } catch (e) {}
      return next;
    });
  }, []);

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

    const targetIdStr = String(messageId);

    setPinnedIds((prevIds) => {
      const nextSet = new Set(prevIds);
      let isNowPinned = false;
      if (nextSet.has(targetIdStr)) {
        nextSet.delete(targetIdStr);
        isNowPinned = false;
      } else {
        nextSet.add(targetIdStr);
        isNowPinned = true;
      }

      const arr = Array.from(nextSet);
      try {
        localStorage.setItem(PINNED_IDS_KEY, JSON.stringify(arr));
      } catch (e) {}
      set(ref(rtdb, 'pinned_ids'), arr).catch(console.warn);
      setDoc(doc(db, 'settings', 'pinned_ids'), { ids: arr }, { merge: true }).catch(console.warn);

      setMessages((prevMsgs) => {
        const updated = prevMsgs.map((msg) => {
          if (msg && String(msg.id) === targetIdStr) {
            const updatedMsg = {
              ...msg,
              pinned: isNowPinned,
              pinnedAt: isNowPinned ? new Date().toISOString() : null,
              pinnedBy: isNowPinned ? (user.displayName || user.userName || 'Admin') : null,
            };
            setDoc(doc(db, 'messages', targetIdStr), updatedMsg, { merge: true }).catch(console.warn);
            set(ref(rtdb, `messages/${targetIdStr}`), updatedMsg).catch(console.warn);
            return updatedMsg;
          }
          return msg;
        });
        try {
          localStorage.setItem(MESSAGES_KEY, JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      return nextSet;
    });

    notifySync();
  }, [user, notifySync]);

  // Filter messages by search query
  const filteredMessages = React.useMemo(() => {
    const safeMsgs = (Array.isArray(messages) ? messages : []).filter((m) => m && m.id);
    if (!searchQuery.trim()) return safeMsgs;
    const queryLower = searchQuery.toLowerCase();
    return safeMsgs.filter((m) =>
      (typeof m.text === 'string' && m.text.toLowerCase().includes(queryLower)) ||
      (typeof m.senderName === 'string' && m.senderName.toLowerCase().includes(queryLower))
    );
  }, [messages, searchQuery]);

  const value = React.useMemo(() => ({
    messages: filteredMessages,
    allMessages: messages,
    pinnedMessages,
    activeUsers,
    typingUsers,
    sendTypingStatus,
    loadingMessages,
    searchQuery,
    setSearchQuery,
    sendMessage,
    markAsRead,
    toggleReaction,
    editMessage,
    deleteMessage,
    deleteMultipleMessages,
    clearAllMessages,
    togglePinMessage,
    muted,
    toggleMute,
    archived,
    toggleArchive,
    blockedUsers,
    toggleBlockUser,
    loadStateFromStorage,
  }), [
    filteredMessages,
    messages,
    pinnedMessages,
    activeUsers,
    typingUsers,
    sendTypingStatus,
    loadingMessages,
    searchQuery,
    sendMessage,
    markAsRead,
    toggleReaction,
    editMessage,
    deleteMessage,
    deleteMultipleMessages,
    clearAllMessages,
    togglePinMessage,
    muted,
    toggleMute,
    archived,
    toggleArchive,
    blockedUsers,
    toggleBlockUser,
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
