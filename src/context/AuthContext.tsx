import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { auth, loginWithGoogle, logoutUser, onAuthStateChanged } from '../services/firebase';
import { useToast } from './ToastContext';

export const ADMIN_EMAIL = 'sharathhc529@gmail.com';

const IDLE_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour
const STORAGE_KEY_LAST_ACTIVITY = 'shuttleledger_last_activity';
const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

export interface CurrentUser {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  linkedMemberId?: string;
}

interface AuthContextType {
  currentUser: CurrentUser | null;
  isAdmin: boolean;
  loading: boolean;
  signInGoogle: () => Promise<CurrentUser>;
  signOut: () => Promise<void>;
  setUserProfile: (user: Partial<CurrentUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_USER = 'shuttleledger_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(true);
  const { showToast } = useToast();
  const lastWriteRef = useRef<number>(0);

  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, fbUser => {
        if (fbUser) {
          const userObj: CurrentUser = {
            uid: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Player',
            email: fbUser.email || '',
            photoURL: fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${fbUser.uid}`,
          };
          setCurrentUser(userObj);
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userObj));
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  const signInGoogle = async () => {
    setLoading(true);
    try {
      const user = await loginWithGoogle();
      setCurrentUser(user);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      return user;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await logoutUser();
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_LAST_ACTIVITY);
  };

  // Auto-logout after 1 hour of inactivity (no mouse/keyboard/touch/scroll
  // activity). The last-activity timestamp lives in localStorage so this
  // also catches the case where the tab was closed and reopened after the
  // timeout had already elapsed, not just an open idle tab.
  useEffect(() => {
    if (!currentUser) return;

    const checkIdle = () => {
      const last = Number(localStorage.getItem(STORAGE_KEY_LAST_ACTIVITY) || Date.now());
      if (Date.now() - last > IDLE_TIMEOUT_MS) {
        showToast({
          type: 'info',
          title: 'Signed Out',
          description: "You've been signed out after 1 hour of inactivity.",
        });
        signOut();
      }
    };

    const markActivity = () => {
      const now = Date.now();
      if (now - lastWriteRef.current > 5000) {
        lastWriteRef.current = now;
        localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY, String(now));
      }
    };

    checkIdle(); // catch "reopened the tab after being away for over an hour"
    markActivity(); // reset the baseline for this session

    ACTIVITY_EVENTS.forEach(evt => window.addEventListener(evt, markActivity, { passive: true }));
    const intervalId = window.setInterval(checkIdle, 60 * 1000);

    return () => {
      ACTIVITY_EVENTS.forEach(evt => window.removeEventListener(evt, markActivity));
      window.clearInterval(intervalId);
    };
  }, [currentUser]);

  const setUserProfile = (updated: Partial<CurrentUser>) => {
    if (!currentUser) return;
    const newProfile = { ...currentUser, ...updated };
    setCurrentUser(newProfile);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newProfile));
  };

  const isAdmin = currentUser ? currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() : false;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAdmin,
        loading,
        signInGoogle,
        signOut,
        setUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
