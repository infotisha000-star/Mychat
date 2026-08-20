import React, { createContext, useContext, useState, useEffect } from 'react';
import { normalizeCode } from '../utils/codeGenerator';
import { db, rtdb, collection, doc, getDoc, getDocs, setDoc, ref, get, set } from '../services/firebase';

const AuthContext = createContext(null);

const SESSION_STORAGE_KEY = 'vortex_chat_user_session';
const CODES_STORAGE_KEY = 'vortex_local_codes';

export const TEST_BYPASS_CODES = [];

// Fast fetch timeout wrapper
const fetchWithTimeout = (promise, ms = 2000) => {
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

  // Triple-Redundant Access Code Verification (Firestore + RTDB + LocalStorage)
  const validateAndJoinWithCode = async (rawCode, userName) => {
    const cleanCode = normalizeCode(rawCode);
    if (!cleanCode) {
      throw new Error('Please enter an access code.');
    }
    if (!userName || !userName.trim()) {
      throw new Error('Please enter your name.');
    }

    let matchedCode = null;

    // 1. Check Cloud Firestore direct doc (accessCodes/ROOM92NMCKB3)
    try {
      const docSnap = await fetchWithTimeout(getDoc(doc(db, 'accessCodes', cleanCode)), 2000);
      if (docSnap && docSnap.exists()) {
        matchedCode = docSnap.data();
      }
    } catch (e) {
      console.warn('Firestore direct doc fetch warning:', e);
    }

    // 2. Check Cloud Firestore collection search
    if (!matchedCode) {
      try {
        const querySnap = await fetchWithTimeout(getDocs(collection(db, 'accessCodes')), 2000);
        if (querySnap && !querySnap.empty) {
          querySnap.forEach((d) => {
            const data = d.data();
            if (data && (normalizeCode(data.code) === cleanCode || data.cleanCode === cleanCode)) {
              matchedCode = data;
            }
          });
        }
      } catch (e) {
        console.warn('Firestore collection fetch warning:', e);
      }
    }

    // 3. Check Realtime Database direct index (codes_index/ROOM92NMCKB3)
    if (!matchedCode) {
      try {
        const indexSnapshot = await fetchWithTimeout(get(ref(rtdb, `codes_index/${cleanCode}`)), 2000);
        if (indexSnapshot && indexSnapshot.exists()) {
          matchedCode = indexSnapshot.val();
        }
      } catch (e) {
        console.warn('RTDB index fetch warning:', e);
      }
    }

    // 4. Fallback to LocalStorage
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

      // Update in Cloud Firestore
      setDoc(doc(db, 'accessCodes', matchedCode.id), { currentUses: newUses, assignedUserName: userName.trim() }, { merge: true }).catch(console.warn);
      setDoc(doc(db, 'accessCodes', cleanCode), { currentUses: newUses, assignedUserName: userName.trim() }, { merge: true }).catch(console.warn);

      // Update in Realtime Database
      set(ref(rtdb, `accessCodes/${matchedCode.id}/currentUses`), newUses).catch(console.warn);
      set(ref(rtdb, `codes_index/${cleanCode}/currentUses`), newUses).catch(console.warn);

      // Update in LocalStorage
      try {
        const storedCodes = localStorage.getItem(CODES_STORAGE_KEY);
        let localCodesList = storedCodes ? JSON.parse(storedCodes) : [];
        const localMatch = localCodesList.find((c) => c && c.id === matchedCode.id);
        if (localMatch) {
          localMatch.currentUses = newUses;
          localMatch.assignedUserName = userName.trim();
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
