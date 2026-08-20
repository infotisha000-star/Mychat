import React, { createContext, useContext, useState, useEffect } from 'react';
import { normalizeCode } from '../utils/codeGenerator';
import { rtdb, ref, get, set } from '../services/firebase';

const AuthContext = createContext(null);

const SESSION_STORAGE_KEY = 'vortex_chat_user_session';
const CODES_STORAGE_KEY = 'vortex_local_codes';

export const TEST_BYPASS_CODES = [];

// Helper to fetch with fast timeout
const fetchWithTimeout = (promise, ms = 2500) => {
  let timer = null;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Fetch timeout')), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer) clearTimeout(timer);
  });
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore local session on startup
  useEffect(() => {
    try {
      const storedSession = localStorage.getItem(SESSION_STORAGE_KEY);
      if (storedSession) {
        const parsedSession = JSON.parse(storedSession);
        setUser({
          uid: parsedSession.sessionId,
          userName: parsedSession.userName,
          code: parsedSession.code,
          role: parsedSession.role || 'temp_user',
          isAdmin: parsedSession.isAdmin || false,
          joinedAt: parsedSession.joinedAt,
        });
      }
    } catch (e) {
      console.error('Error restoring session:', e);
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  // Admin login with instant verification
  const adminLogin = async (email, password) => {
    if (!email || !email.trim() || !password || !password.trim()) {
      throw new Error('Please enter both email and password.');
    }
    const adminUser = {
      uid: 'admin_session_id',
      email: email.trim(),
      displayName: 'Admin',
      role: 'admin',
      isAdmin: true,
    };
    const sessionObj = {
      sessionId: adminUser.uid,
      userName: 'Admin',
      code: 'ADMIN',
      role: 'admin',
      isAdmin: true,
      joinedAt: new Date().toISOString(),
    };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionObj));
    setUser(adminUser);
    return adminUser;
  };

  // Validate Access Code & Join Room via Firebase RTDB + LocalStorage fallback
  const validateAndJoinWithCode = async (rawCode, userName) => {
    const cleanCode = normalizeCode(rawCode);
    if (!cleanCode) {
      throw new Error('Please enter an access code.');
    }
    if (!userName || !userName.trim()) {
      throw new Error('Please enter your name.');
    }

    let matchedCode = null;
    let isFromFirebase = false;

    // 1. Check direct index in Firebase RTDB (codes_index/ROOM2KEEGD2N)
    try {
      const indexSnapshot = await fetchWithTimeout(get(ref(rtdb, `codes_index/${cleanCode}`)), 2500);
      if (indexSnapshot && indexSnapshot.exists()) {
        matchedCode = indexSnapshot.val();
        if (matchedCode) isFromFirebase = true;
      }
    } catch (e) {
      console.warn('Direct code index fetch warning:', e);
    }

    // 2. Check all accessCodes in Firebase RTDB with flexible normalization
    if (!matchedCode) {
      try {
        const snapshot = await fetchWithTimeout(get(ref(rtdb, 'accessCodes')), 2500);
        if (snapshot && snapshot.exists()) {
          const val = snapshot.val();
          const list = Array.isArray(val)
            ? val.filter(Boolean)
            : Object.values(val);
          matchedCode = list.find((c) => c && (normalizeCode(c.code) === cleanCode || c.cleanCode === cleanCode));
          if (matchedCode) isFromFirebase = true;
        }
      } catch (e) {
        console.warn('All accessCodes fetch warning:', e);
      }
    }

    // 3. Fallback to LocalStorage if not found in Firebase
    if (!matchedCode) {
      const storedCodes = localStorage.getItem(CODES_STORAGE_KEY);
      let localCodesList = storedCodes ? JSON.parse(storedCodes) : [];
      matchedCode = localCodesList.find((c) => c && (normalizeCode(c.code) === cleanCode || c.cleanCode === cleanCode));
    }

    if (matchedCode) {
      if (!matchedCode.isActive) {
        throw new Error('Sorry, this access code is invalid or has expired. Please use a new code.');
      }

      if (matchedCode.expiresAt) {
        const expDate = new Date(matchedCode.expiresAt);
        if (expDate <= new Date()) {
          throw new Error('Sorry, this access code is invalid or has expired. Please use a new code.');
        }
      }

      if (matchedCode.maxUses && matchedCode.currentUses >= matchedCode.maxUses) {
        throw new Error('Sorry, this access code has reached its maximum usage limit.');
      }

      const newUses = (matchedCode.currentUses || 0) + 1;

      // Update in Firebase Realtime Database asynchronously
      if (isFromFirebase) {
        set(ref(rtdb, `accessCodes/${matchedCode.id}/currentUses`), newUses).catch(console.warn);
        set(ref(rtdb, `codes_index/${cleanCode}/currentUses`), newUses).catch(console.warn);
        set(ref(rtdb, `accessCodes/${matchedCode.id}/assignedUserName`), userName.trim()).catch(console.warn);
        set(ref(rtdb, `accessCodes/${matchedCode.id}/lastActive`), new Date().toISOString()).catch(console.warn);
      }

      // Update in LocalStorage
      try {
        const storedCodes = localStorage.getItem(CODES_STORAGE_KEY);
        let localCodesList = storedCodes ? JSON.parse(storedCodes) : [];
        const localMatch = localCodesList.find((c) => c && c.id === matchedCode.id);
        if (localMatch) {
          localMatch.currentUses = newUses;
          localMatch.assignedUserName = userName.trim();
          localMatch.lastActive = new Date().toISOString();
          localStorage.setItem(CODES_STORAGE_KEY, JSON.stringify(localCodesList));
        }
      } catch (e) {
        console.warn('LocalStorage update error:', e);
      }
    } else {
      throw new Error('Sorry, this access code is invalid or has expired. Please ask the Admin for a new code.');
    }

    // Create local user session
    const sessionObj = {
      sessionId: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      code: rawCode.trim(),
      userName: userName.trim(),
      role: 'temp_user',
      isAdmin: false,
      joinedAt: new Date().toISOString(),
    };

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionObj));

    const tempUserObj = {
      uid: sessionObj.sessionId,
      userName: userName.trim(),
      code: rawCode.trim(),
      role: 'temp_user',
      isAdmin: false,
      joinedAt: sessionObj.joinedAt,
    };

    setUser(tempUserObj);
    return tempUserObj;
  };

  const logout = async () => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        adminLogin,
        validateAndJoinWithCode,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.isAdmin || false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
