import { useState, useEffect } from 'react';
import { generateAccessCode, normalizeCode } from '../utils/codeGenerator';
import { rtdb, ref, set, remove, onValue } from '../services/firebase';

const CODES_STORAGE_KEY = 'vortex_local_codes';
const SYNC_CHANNEL_NAME = 'vortex_chat_channel';

export const useAccessCodes = () => {
  const [accessCodes, setAccessCodes] = useState(() => {
    try {
      const stored = localStorage.getItem(CODES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);

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
          setAccessCodes([]);
          localStorage.setItem(CODES_STORAGE_KEY, JSON.stringify([]));
        }
        setLoading(false);
      }, (err) => {
        console.warn('Firebase accessCodes listener error, using local:', err);
        setLoading(false);
      });
    } catch (e) {
      console.error('Error connecting to Firebase accessCodes:', e);
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
    const cleanCode = normalizeCode(code);
    
    let expiresAt = null;
    if (durationHours && durationHours > 0) {
      expiresAt = new Date(Date.now() + durationHours * 3600000).toISOString();
    }

    const newCodeObj = {
      id: `code_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      code,
      cleanCode,
      createdAt: new Date().toISOString(),
      expiresAt,
      isActive: true,
      maxUses: maxUses || 1,
      currentUses: 0,
      assignedUserName: null,
      lastActive: null,
    };

    // Instant local state update
    setAccessCodes((prev) => [newCodeObj, ...prev]);
    
    try {
      const stored = localStorage.getItem(CODES_STORAGE_KEY);
      const currentList = stored ? JSON.parse(stored) : [];
      localStorage.setItem(CODES_STORAGE_KEY, JSON.stringify([newCodeObj, ...currentList]));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }

    // Sync to Firebase (under accessCodes/ AND codes_index/)
    set(ref(rtdb, `accessCodes/${newCodeObj.id}`), newCodeObj).catch(console.warn);
    set(ref(rtdb, `codes_index/${cleanCode}`), newCodeObj).catch(console.warn);

    notifySync();
    return newCodeObj;
  };

  /**
   * Deactivates/Enables a code instantly.
   */
  const toggleCodeStatus = async (codeId, currentStatus) => {
    let targetCode = null;
    setAccessCodes((prev) =>
      prev.map((c) => {
        if (c.id === codeId) {
          targetCode = { ...c, isActive: !currentStatus };
          return targetCode;
        }
        return c;
      })
    );

    if (targetCode) {
      const cleanCode = normalizeCode(targetCode.code);
      set(ref(rtdb, `accessCodes/${codeId}/isActive`), !currentStatus).catch(console.warn);
      set(ref(rtdb, `codes_index/${cleanCode}/isActive`), !currentStatus).catch(console.warn);
    }

    notifySync();
  };

  /**
   * Deletes a code permanently from Firebase + LocalStorage.
   */
  const deleteCode = async (codeId) => {
    let deletedCodeString = null;
    setAccessCodes((prev) => {
      const found = prev.find((c) => c.id === codeId);
      if (found) deletedCodeString = found.code;
      return prev.filter((c) => c.id !== codeId);
    });

    try {
      const stored = localStorage.getItem(CODES_STORAGE_KEY);
      if (stored) {
        const list = JSON.parse(stored).filter((c) => c.id !== codeId);
        localStorage.setItem(CODES_STORAGE_KEY, JSON.stringify(list));
      }
    } catch (e) {
      console.warn('LocalStorage delete error:', e);
    }

    // Permanently remove nodes from Firebase
    remove(ref(rtdb, `accessCodes/${codeId}`)).catch(console.warn);
    if (deletedCodeString) {
      const cleanCode = normalizeCode(deletedCodeString);
      remove(ref(rtdb, `codes_index/${cleanCode}`)).catch(console.warn);
    }

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
