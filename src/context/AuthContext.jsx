import React, { createContext, useContext, useState, useEffect } from 'react';
import { normalizeCode } from '../utils/codeGenerator';
import { db, rtdb, collection, doc, getDoc, getDocs, setDoc, ref, get, set } from '../services/firebase';

const AuthContext = createContext(null);

const SESSION_STORAGE_KEY = 'vortex_chat_user_session';
const CODES_STORAGE_KEY = 'vortex_local_codes';

export const TEST_BYPASS_CODES = [];

// Fast fetch timeout wrapper
const fetchWithTimeout = (promise, ms = 1500) => {
  let timer = null;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Fetch timeout')), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer) clearTimeout(timer);
  });
};

export const AuthProvider = ({ children }) => {
  // Synchronous 0ms state initialization for instant app entry
  const [user, setUser] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const storedSession = localStorage.getItem(SESSION_STORAGE_KEY);
        if (storedSession) {
          const parsedSession = JSON.parse(storedSession);
          const expMs = parsedSession.expiresAt ? new Date(parsedSession.expiresAt).getTime() : null;
          const isExpired = expMs && !isNaN(expMs) && expMs <= Date.now();

          if (!isExpired && parsedSession.sessionId && (parsedSession.code || parsedSession.isAdmin)) {
            return {
              uid: parsedSession.sessionId,
              userName: parsedSession.userName || (parsedSession.isAdmin ? 'Admin' : 'User'),
              email: parsedSession.email || (parsedSession.isAdmin ? 'admin@vortex.app' : null),
              code: parsedSession.code || (parsedSession.isAdmin ? 'ADMIN' : 'JOINED'),
              role: parsedSession.role || (parsedSession.isAdmin ? 'admin' : 'temp_user'),
              isAdmin: !!parsedSession.isAdmin,
              joinedAt: parsedSession.joinedAt || new Date().toISOString(),
              expiresAt: parsedSession.isAdmin ? null : (parsedSession.expiresAt || null),
            };
          }
        }
      }
    } catch (e) {
      console.warn('Initial session parse notice:', e);
    }
    return null;
  });
  const [loading, setLoading] = useState(false);

  // Automatic Session Expiry Monitor (Auto Logout when Code Expires - Temp Users Only)
  useEffect(() => {
    if (!user || user.isAdmin || !user.expiresAt) return;

    const checkInterval = setInterval(() => {
      const expTime = new Date(user.expiresAt).getTime();
      if (isNaN(expTime) || Date.now() >= expTime) {
        logout();
      }
    }, 2000);

    return () => clearInterval(checkInterval);
  }, [user]);

  // Admin login with instant verification & unique per-device session id
  // Admin login with Firebase Auth / Password verification
  const adminLogin = async (email, password) => {
    if (!email || !email.trim() || !password || !password.trim()) {
      throw new Error('Please enter both email and password.');
    }

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    // 1. Try Firebase Auth sign-in
    let authSuccess = false;
    try {
      if (signInWithEmailAndPassword && auth) {
        await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        authSuccess = true;
      }
    } catch (firebaseErr) {
      console.warn('Firebase Auth signin notice:', firebaseErr.message);
    }

    // 2. Check environment admin password or fallback admin credential
    const envAdminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@vortex.app';
    const envAdminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123456';

    if (!authSuccess) {
      if (cleanEmail.toLowerCase() !== envAdminEmail.toLowerCase() || cleanPassword !== envAdminPassword) {
        throw new Error('Invalid Admin email or password.');
      }
    }

    const adminSessionId = `admin_sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const adminUser = {
      uid: adminSessionId,
      email: cleanEmail,
      userName: 'Admin',
      displayName: 'Admin',
      code: 'ADMIN',
      role: 'admin',
      isAdmin: true,
      joinedAt: new Date().toISOString(),
      expiresAt: null,
    };
    const sessionObj = {
      sessionId: adminSessionId,
      email: cleanEmail,
      userName: 'Admin',
      code: 'ADMIN',
      role: 'admin',
      isAdmin: true,
      joinedAt: adminUser.joinedAt,
      expiresAt: null,
    };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionObj));
    setUser(adminUser);
    return adminUser;
  };

  // Cloud-First Parallel Access Code Verification (Firestore + Realtime DB)
  const validateAndJoinWithCode = async (rawCode, userName) => {
    const cleanCode = normalizeCode(rawCode);
    if (!cleanCode) {
      throw new Error('Please enter an access code.');
    }
    if (!userName || !userName.trim()) {
      throw new Error('Please enter your name.');
    }

    let matchedCode = null;

    // 1. Parallel Cloud Query (Cloud Firestore doc + Cloud RTDB index)
    try {
      const [firestoreDocRes, rtdbRes] = await Promise.allSettled([
        fetchWithTimeout(getDoc(doc(db, 'accessCodes', cleanCode)), 2000),
        fetchWithTimeout(get(ref(rtdb, `codes_index/${cleanCode}`)), 2000),
      ]);

      if (firestoreDocRes.status === 'fulfilled' && firestoreDocRes.value && firestoreDocRes.value.exists()) {
        matchedCode = firestoreDocRes.value.data();
      } else if (rtdbRes.status === 'fulfilled' && rtdbRes.value && rtdbRes.value.exists()) {
        matchedCode = rtdbRes.value.val();
      }
    } catch (e) {}

    // 2. Check Cloud Firestore collection search
    if (!matchedCode) {
      try {
        const querySnap = await fetchWithTimeout(getDocs(collection(db, 'accessCodes')), 1500);
        if (querySnap && !querySnap.empty) {
          querySnap.forEach((d) => {
            const data = d.data();
            if (data && (normalizeCode(data.code) === cleanCode || data.cleanCode === cleanCode)) {
              matchedCode = data;
            }
          });
        }
      } catch (e) {}
    }

    // 3. Check Realtime Database direct index
    if (!matchedCode) {
      try {
        const indexSnapshot = await fetchWithTimeout(get(ref(rtdb, `codes_index/${cleanCode}`)), 1500);
        if (indexSnapshot && indexSnapshot.exists()) {
          matchedCode = indexSnapshot.val();
        }
      } catch (e) {}
    }

    // 4. Fallback to LocalStorage
    if (!matchedCode) {
      const storedCodes = localStorage.getItem(CODES_STORAGE_KEY);
      let localCodesList = storedCodes ? JSON.parse(storedCodes) : [];
      matchedCode = localCodesList.find((c) => c && (normalizeCode(c.code) === cleanCode || c.cleanCode === cleanCode));
    }

    if (matchedCode) {
      if (matchedCode.isActive === false) {
        throw new Error('Sorry, this access code has been deactivated by Admin.');
      }

      if (matchedCode.expiresAt) {
        const expDate = new Date(matchedCode.expiresAt);
        if (expDate <= new Date()) {
          throw new Error('Sorry, this access code has expired.');
        }
      }

      const newUses = (matchedCode.currentUses || 0) + 1;

      // Asynchronously update usage in background
      setDoc(doc(db, 'accessCodes', matchedCode.id || cleanCode), { currentUses: newUses, assignedUserName: userName.trim() }, { merge: true }).catch(console.warn);
      set(ref(rtdb, `accessCodes/${matchedCode.id || cleanCode}/currentUses`), newUses).catch(console.warn);

      // Clear any prior stale session before establishing new session
      localStorage.removeItem(SESSION_STORAGE_KEY);

      // Create local user session with expiration
      const sessionObj = {
        sessionId: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        code: rawCode.trim().toUpperCase(),
        userName: userName.trim(),
        role: 'temp_user',
        isAdmin: false,
        joinedAt: new Date().toISOString(),
        expiresAt: matchedCode.expiresAt || null,
      };

      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionObj));

      const tempUserObj = {
        uid: sessionObj.sessionId,
        userName: userName.trim(),
        code: rawCode.trim().toUpperCase(),
        role: 'temp_user',
        isAdmin: false,
        joinedAt: sessionObj.joinedAt,
        expiresAt: sessionObj.expiresAt,
      };

      setUser(tempUserObj);
      return tempUserObj;
    } else {
      throw new Error('Please enter a valid access code provided by the Admin.');
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      sessionStorage.removeItem('vortex_app_lock_bypassed_session');
    } catch (e) {}
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
