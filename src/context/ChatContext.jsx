import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { rtdb, ref, set, onValue } from '../services/firebase';

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

  // Firebase Realtime Database sync for Messages
  useEffect(() => {
    let unsubscribe = null;
    try {
      const msgsRef = ref(rtdb, 'messages');
      unsubscribe = onValue(msgsRef, (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          const list = Array.isArray(val)
            ? val.filter(Boolean)
            : Object.values(val);
          
          // Sort oldest to newest for chat timeline
          list.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          setMessages(list);
          localStorage.setItem(MESSAGES_KEY, JSON.stringify(list));
        }
        setLoadingMessages(false);
      }, (err) => {
        console.warn('Firebase messages sync warning, falling back to local:', err);
        setLoadingMessages(false);
      });
    } catch (e) {
      console.error('Firebase messages listener setup failed:', e);
      setLoadingMessages(false);
    }

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
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

  const notifySync = () => {
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'SYNC_STATE' });
    }
  };

  // Instant Non-blocking Send Message
  const sendMessage = async ({ text = '', media = [], replyTo = null }) => {
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

    try {
      const stored = localStorage.getItem(MESSAGES_KEY);
      const currentList = stored ? JSON.parse(stored) : [];
      localStorage.setItem(MESSAGES_KEY, JSON.stringify([...currentList, newMessage]));
    } catch (e) {
      console.warn('LocalStorage save warning:', e);
    }

    // 2. Non-blocking Firebase write (Async in background)
    set(ref(rtdb, `messages/${newMessage.id}`), newMessage).catch((e) => {
      console.warn('Firebase sendMessage background sync warning:', e);
    });

    notifySync();
    return newMessage.id;
  };

  // Instant Non-blocking Reaction Toggle
  const toggleReaction = async (messageId, emoji) => {
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
      set(ref(rtdb, `messages/${messageId}/reactions`), targetMsg.reactions || {}).catch(console.warn);
    }

    notifySync();
  };

  // Instant Non-blocking Edit Message
  const editMessage = async (messageId, newText) => {
    if (!user) throw new Error('Not authenticated');

    let editedMsgObj = null;
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          if (msg.editCount >= 3) {
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
      set(ref(rtdb, `messages/${messageId}`), editedMsgObj).catch(console.warn);
    }

    notifySync();
  };

  // Instant Non-blocking Soft Delete
  const deleteMessage = async (messageId) => {
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
      set(ref(rtdb, `messages/${messageId}`), deletedMsgObj).catch(console.warn);
    }

    notifySync();
  };

  // Bulk Delete
  const deleteMultipleMessages = async (messageIds = []) => {
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
          set(ref(rtdb, `messages/${msg.id}`), deletedObj).catch(console.warn);
          return deletedObj;
        }
        return msg;
      })
    );

    notifySync();
  };

  // Instant Non-blocking Toggle Pin
  const togglePinMessage = async (messageId) => {
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
      set(ref(rtdb, `messages/${messageId}`), pinnedObj).catch(console.warn);
    }

    notifySync();
  };

  // Filter messages by search query
  const filteredMessages = searchQuery.trim()
    ? messages.filter((m) =>
        m.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.senderName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  return (
    <ChatContext.Provider
      value={{
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
        togglePinMessage,
        loadStateFromStorage,
      }}
    >
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
