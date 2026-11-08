import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeFirestore,
  getFirestore,
  doc,
  getDoc,
  Firestore,
} from "firebase/firestore";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  Auth,
  User,
} from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App instance
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth: Auth = getAuth(app);

// Keep track of current authenticated user
let currentUser: User | null = auth.currentUser;
let authInitPromise: Promise<User | null> | null = null;

export function ensureFirebaseAuth(): Promise<User | null> {
  if (currentUser) {
    return Promise.resolve(currentUser);
  }
  if (!authInitPromise) {
    authInitPromise = new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          currentUser = user;
          unsubscribe();
          resolve(user);
        } else {
          try {
            const userCred = await signInAnonymously(auth);
            currentUser = userCred.user;
            unsubscribe();
            resolve(userCred.user);
          } catch (e) {
            console.warn("Anonymous sign-in error:", e);
            // Fallback: create mock/ephemeral user ID if offline
            resolve(null);
          }
        }
      });
    });
  }
  return authInitPromise;
}

export async function getAuthToken(): Promise<string | null> {
  const user = await ensureFirebaseAuth();
  if (user) {
    try {
      return await user.getIdToken();
    } catch (e) {
      console.warn("Could not retrieve ID token:", e);
      return null;
    }
  }
  return null;
}

// Pre-warm authentication
ensureFirebaseAuth().catch(() => {});

// Initialize Firestore with specific database ID and robust auto-detect long-polling
let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(
    app,
    {
      experimentalAutoDetectLongPolling: true,
    },
    firebaseConfig.firestoreDatabaseId || undefined
  );
} catch {
  firestoreInstance = firebaseConfig.firestoreDatabaseId
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);
}

export const db: Firestore = firestoreInstance;

// Graceful test Firestore connection helper
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return false;
    }
    const user = await ensureFirebaseAuth();
    if (!user) return false;
    await getDoc(doc(db, "queries", "probe_connection"));
    return true;
  } catch {
    return false;
  }
}

export { app };
