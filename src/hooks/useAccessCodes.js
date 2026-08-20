import { useState, useEffect, useCallback } from 'react';
import { generateAccessCode, normalizeCode } from '../utils/codeGenerator';

const CODES_STORAGE_KEY = 'vortex_local_codes';
const SYNC_CHANNEL_NAME = 'vortex_chat_channel';

const INITIAL_MOCK_CODES = [];

export const useAccessCodes = () => {
  const [accessCodes, setAccessCodes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load codes from localStorage
  const loadCodes = useCallback(() => {
    try {
      const stored = localStorage.getItem(CODES_STORAGE_KEY);
      if (stored) {
        setAccessCodes(JSON.parse(stored));
      } else {
        localStorage.setItem(CODES_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_CODES));
        setAccessCodes(INITIAL_MOCK_CODES);
      }
    } catch (e) {
      console.error('Error loading access codes:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCodes();

    const handleStorage = (e) => {
      if (e.key === CODES_STORAGE_KEY) {
        loadCodes();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [loadCodes]);

  const notifySync = () => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel(SYNC_CHANNEL_NAME);
      bc.postMessage({ type: 'SYNC_STATE' });
      bc.close();
    }
  };

  /**
   * Generates a new access code locally.
   */
  const createAccessCode = async (durationHours = 24, maxUses = 1) => {
    const code = generateAccessCode('ROOM');
    
    let expiresAt = null;
    if (durationHours && durationHours > 0) {
      expiresAt = new Date(Date.now() + durationHours * 3600000).toISOString();
    }

    const newCodeObj = {
      id: `code_${Date.now()}`,
      code,
      createdAt: new Date().toISOString(),
      expiresAt,
      isActive: true,
      maxUses: maxUses || 1,
      currentUses: 0,
      assignedUserName: null,
      lastActive: null,
    };

    const updated = [newCodeObj, ...accessCodes];
    setAccessCodes(updated);
    localStorage.setItem(CODES_STORAGE_KEY, JSON.stringify(updated));
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
    notifySync();
  };

  /**
   * Deletes a code permanently.
   */
  const deleteCode = async (codeId) => {
    const updated = accessCodes.filter((c) => c.id !== codeId);
    setAccessCodes(updated);
    localStorage.setItem(CODES_STORAGE_KEY, JSON.stringify(updated));
    notifySync();
  };

  return {
    accessCodes,
    loading,
    createAccessCode,
    toggleCodeStatus,
    deleteCode,
    reloadCodes: loadCodes,
  };
};
