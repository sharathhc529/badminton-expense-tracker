/**
 * Default Firebase project config, used when no override is saved via the
 * Cloud Config modal and no VITE_FIREBASE_* build-time env vars are set.
 *
 * These values are safe to ship in the public bundle — Firebase's web config
 * is not a secret (Google's own docs state this explicitly); the actual
 * access boundary is enforced server-side by Firestore Security Rules.
 */
export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAvsdlkcyb2YLg4492MyoXLMTqBwVPNnNU',
  authDomain: 'shuttleledger.firebaseapp.com',
  projectId: 'shuttleledger',
  storageBucket: 'shuttleledger.firebasestorage.app',
  messagingSenderId: '899094758444',
  appId: '1:899094758444:web:809219a127ca23e6f63d89',
};
