import React, { createContext, useContext, useState, useEffect } from 'react';
import { normalizeCode } from '../utils/codeGenerator';

const AuthContext = createContext(null);

const SESSION_STORAGE_KEY = 'vortex_chat_user_session';
const CODES_STORAGE_KEY = 'vortex_local_codes';

export const TEST_BYPASS_CODES = [];

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

  // Admin login with local verification
  const adminLogin = async (email, password) => {
    setLoading(true);
    try {
      if (email === 'info.shorif0000@gmail.com') {
        const adminUser = {
          uid: 'admin_local_id',
          email: 'info.shorif0000@gmail.com',
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
      } else {
        throw new Error('Admin email must be info.shorif0000@gmail.com');
      }
    } finally {
      setLoading(false);
    }
  };

  // Validate Access Code & Join Room
  const validateAndJoinWithCode = async (rawCode, userName) => {
    const code = normalizeCode(rawCode);
    if (!code) {
      throw new Error('Please enter an access code.');
    }
    if (!userName || !userName.trim()) {
      throw new Error('Please enter your name.');
    }

    setLoading(true);

    try {
      // Check stored access codes
      const storedCodes = localStorage.getItem(CODES_STORAGE_KEY);
      let localCodesList = storedCodes ? JSON.parse(storedCodes) : [];

      let matchedCode = localCodesList.find((c) => c.code === code);

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

        // Update usage count
        matchedCode.currentUses = (matchedCode.currentUses || 0) + 1;
        matchedCode.assignedUserName = userName.trim();
        matchedCode.lastActive = new Date().toISOString();
        localStorage.setItem(CODES_STORAGE_KEY, JSON.stringify(localCodesList));
      } else {
        throw new Error('Sorry, this access code is invalid or has expired. Please ask the Admin for a new code.');
      }

      // Create local user session
      const sessionObj = {
        sessionId: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        code: code,
        userName: userName.trim(),
        role: 'temp_user',
        isAdmin: false,
        joinedAt: new Date().toISOString(),
      };

      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionObj));

      const tempUserObj = {
        uid: sessionObj.sessionId,
        userName: userName.trim(),
        code: code,
        role: 'temp_user',
        isAdmin: false,
        joinedAt: sessionObj.joinedAt,
      };

      setUser(tempUserObj);
      return tempUserObj;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      setUser(null);
    } finally {
      setLoading(false);
    }
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
