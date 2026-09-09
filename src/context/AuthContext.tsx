import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, loginWithGoogle, logoutUser, onAuthStateChanged } from '../services/firebase';

export const ADMIN_EMAIL = 'sharathhc529@gmail.com';

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
  };

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
