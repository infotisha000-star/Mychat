import { useState, useEffect } from 'react';
import { generateAccessCode } from '../utils/codeGenerator';
import { rtdb, ref, set, remove, onValue } from '../services/firebase';

const CODES_STORAGE_KEY = 'vortex_local_codes';
const SYNC_CHANNEL_NAME = 'vortex_chat_channel';

export const useAccessCodes = () => {
  const [accessCodes, setAccessCodes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load & listen to access codes from Firebase Realtime Database
  useEffect(() => {
    let unsubscribe = null;
    try {
      const codesRef = ref(rtdb, 'accessCodes');
      unsubscribe = onValue(codesRef, (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          const list = Array.isArray(val)
            ? val.filter(Boolean)
            : Object.values(val);
          
          // Sort newest first
          list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setAccessCodes(list);
          localStorage.setItem(CODES_STORAGE_KEY, JSON.stringify(list));
        } else {
          // If empty in Firebase (e.g. manually deleted or empty)
          setAccessCodes([]);
          localStorage.setItem(CODES_STORAGE_KEY, JSON.stringify([]));
        }
        setLoading(false);
      }, (err) => {
        console.warn('Firebase accessCodes listener error, using local:', err);
        const stored = localStorage.getItem(CODES_STORAGE_KEY);
        if (stored) setAccessCodes(JSON.parse(stored));
        setLoading(false);
      });
    } catch (e) {
      console.error('Error connecting to Firebase accessCodes:', e);
      const stored = localStorage.getItem(CODES_STORAGE_KEY);
      if (stored) setAccessCodes(JSON.parse(stored));
      setLoading(false);
    }

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const notifySync = () => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel(SYNC_CHANNEL_NAME);
      bc.postMessage({ type: 'SYNC_STATE' });
      bc.close();
    }
  };

  /**
   * Generates a new access code and saves to Firebase + LocalStorage instantly.
   */
  const createAccessCode = async (durationHours = 24, maxUses = 1) => {
    const code = generateAccessCode('ROOM');
    
    let expiresAt = null;
    if (durationHours && durationHours > 0) {
      expiresAt = new Date(Date.now() + durationHours * 3600000).toISOString();
    }

    const newCodeObj = {
      id: `code_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      code,
      createdAt: new Date().toISOString(),
      expiresAt,
      isActive: true,
      maxUses: maxUses || 1,
      currentUses: 0,
      assignedUserName: null,
      lastActive: null,
    };

    // Instant local state update
    const updated = [newCodeObj, ...accessCodes];
    setAccessCodes(updated);
    localStorage.setItem(CODES_STORAGE_KEY, JSON.stringify(updated));

    // Non-blocking Firebase write
    set(ref(rtdb, `accessCodes/${newCodeObj.id}`), newCodeObj).catch((e) => {
      console.warn('Firebase set accessCode failed:', e);
    });

    notifySync();
    return newCodeObj;
  };

  /**
   * Deactivates/Enables a code instantly.
   */
  const toggleCodeStatus = async (codeId, currentStatus) => {
    const updated = accessCodes.map((c) => {
      if (c.id === codeId) {
        return { ...c, isActive: !currentStatus };
      }
      return c;
    });

    setAccessCodes(updated);
    localStorage.setItem(CODES_STORAGE_KEY, JSON.stringify(updated));

    set(ref(rtdb, `accessCodes/${codeId}/isActive`), !currentStatus).catch((e) => {
      console.warn('Firebase toggle code failed:', e);
    });

    notifySync();
  };

  /**
   * Deletes a code permanently from Firebase + LocalStorage.
   */
  const deleteCode = async (codeId) => {
    const updated = accessCodes.filter((c) => c.id !== codeId);
    setAccessCodes(updated);
    localStorage.setItem(CODES_STORAGE_KEY, JSON.stringify(updated));

    // Permanently remove node from Firebase
    remove(ref(rtdb, `accessCodes/${codeId}`)).catch((e) => {
      console.warn('Firebase delete code failed:', e);
    });

    notifySync();
  };

  return {
    accessCodes,
    loading,
    createAccessCode,
    toggleCodeStatus,
    deleteCode,
  };
};
