import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore, Firestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const dbId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? firebaseConfig.firestoreDatabaseId
  : undefined;

let firestoreDb: Firestore;
try {
  firestoreDb = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  }, dbId);
} catch {
  firestoreDb = dbId ? getFirestore(app, dbId) : getFirestore(app);
}

export const db: Firestore = firestoreDb;
export default app;
