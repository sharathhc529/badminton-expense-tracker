import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  initializeFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Firestore,
} from 'firebase/firestore';

import { DEFAULT_FIREBASE_CONFIG } from '../config/firebaseConfig';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

const STORAGE_KEY_FIREBASE_CONFIG = 'shuttleledger_firebase_config';

// Load stored config if any
export function getSavedFirebaseConfig(): FirebaseConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FIREBASE_CONFIG);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse saved Firebase config', e);
  }

  // Check Vite env variables if available
  const env = (import.meta as any).env;
  if (env && env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID) {
    return {
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || `${env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: env.VITE_FIREBASE_APP_ID,
    };
  }

  return DEFAULT_FIREBASE_CONFIG;
}

let app: FirebaseApp | null = null;
let auth: ReturnType<typeof getAuth> | null = null;
let db: Firestore | null = null;
const googleProvider = new GoogleAuthProvider();

const activeConfig = getSavedFirebaseConfig();
if (activeConfig && activeConfig.apiKey) {
  try {
    app = getApps().length === 0 ? initializeApp(activeConfig) : getApps()[0];
    auth = getAuth(app);
    // ignoreUndefinedProperties: several optional app fields (photoURL,
    // details, monthTarget, etc.) can legitimately be undefined; Firestore
    // otherwise rejects the whole write rather than just skipping them.
    db = initializeFirestore(app, { ignoreUndefinedProperties: true });
  } catch (error) {
    console.warn('Firebase init error; falling back to offline/local mode', error);
  }
}

export { app, auth, db, googleProvider, onAuthStateChanged };
export type { FirebaseUser };

export async function loginWithGoogle(): Promise<{
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
}> {
  if (!auth) {
    throw new Error('Firebase is not configured; Google sign-in is unavailable.');
  }

  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  return {
    uid: user.uid,
    name: user.displayName || user.email?.split('@')[0] || 'Player',
    email: user.email || '',
    photoURL: user.photoURL || undefined,
  };
}

export async function logoutUser(): Promise<void> {
  if (auth) {
    await fbSignOut(auth);
  }
  localStorage.removeItem('shuttleledger_current_user');
}
