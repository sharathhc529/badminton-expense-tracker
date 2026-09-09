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
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Firestore,
} from 'firebase/firestore';

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

  return null;
}

export function saveFirebaseConfig(config: FirebaseConfig): void {
  localStorage.setItem(STORAGE_KEY_FIREBASE_CONFIG, JSON.stringify(config));
  window.location.reload();
}

export function clearFirebaseConfig(): void {
  localStorage.removeItem(STORAGE_KEY_FIREBASE_CONFIG);
  window.location.reload();
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
    db = getFirestore(app);
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
  if (auth) {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      return {
        uid: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'Player',
        email: user.email || '',
        photoURL: user.photoURL || undefined,
      };
    } catch (err: any) {
      console.error('Firebase Google login failed, falling back to profile prompt', err);
    }
  }

  // Fallback demo user simulation if Firebase keys are not yet configured
  const existingMock = localStorage.getItem('shuttleledger_current_user');
  if (existingMock) {
    return JSON.parse(existingMock);
  }

  const defaultUser = {
    uid: 'user_sharath_' + Math.random().toString(36).substring(2, 7),
    name: 'Sharath Chandra',
    email: 'sharathhc529@gmail.com',
    photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=Sharath',
  };
  localStorage.setItem('shuttleledger_current_user', JSON.stringify(defaultUser));
  return defaultUser;
}

export async function logoutUser(): Promise<void> {
  if (auth) {
    await fbSignOut(auth);
  }
  localStorage.removeItem('shuttleledger_current_user');
}
