import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { db, ensureFirebaseAuth } from "../lib/firebase";
import { QueryRecord } from "../types";

const LOCAL_STORAGE_KEY = "indialedger_cached_queries";
const MAX_LOCAL_CACHE = 100;

// Read local fallback cache
function getLocalCachedQueries(): QueryRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to read local queries cache:", e);
    return [];
  }
}

// Write local fallback cache
function saveLocalCachedQueries(queries: QueryRecord[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(queries.slice(0, MAX_LOCAL_CACHE)));
  } catch (e) {
    console.error("Failed to save local queries cache:", e);
  }
}

/**
 * Log any query executed in the app (AI advisor, voucher, receipt OCR, GST calc, setoff, financials)
 * Associates record strictly with current authenticated user's UID.
 */
export async function logQueryToDatabase(
  record: Omit<QueryRecord, "id" | "createdAt"> & { id?: string; createdAt?: string }
): Promise<string> {
  const queryId = record.id || `q_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const timestamp = record.createdAt || new Date().toISOString();

  const user = await ensureFirebaseAuth();
  const userId = user?.uid || record.userId || "anon_local_user";

  const newRecord: QueryRecord = {
    id: queryId,
    userId,
    queryType: record.queryType,
    title: record.title.slice(0, 500),
    queryText: record.queryText.slice(0, 20000),
    resultSummary: record.resultSummary ? record.resultSummary.slice(0, 20000) : undefined,
    payload: record.payload || {},
    createdAt: timestamp,
    status: record.status || "completed",
    tags: record.tags || [record.queryType],
  };

  // 1. Instantly save to local cache so user immediately sees it in UI
  const currentLocal = getLocalCachedQueries();
  const updatedLocal = [newRecord, ...currentLocal.filter((q) => q.id !== queryId)];
  saveLocalCachedQueries(updatedLocal);

  // 2. Persist to Cloud Firestore database with user authorization
  if (user?.uid) {
    try {
      const docRef = doc(db, "queries", queryId);
      await setDoc(docRef, newRecord);
    } catch (firestoreError) {
      console.warn("Firestore sync warning (record saved to local cache):", firestoreError);
    }
  }

  return queryId;
}

/**
 * Fetch all queries for the authenticated user from Firestore with local cache merge
 */
export async function fetchQueriesFromDatabase(limitCount: number = 100): Promise<QueryRecord[]> {
  try {
    const user = await ensureFirebaseAuth();
    if (user?.uid) {
      const queriesRef = collection(db, "queries");
      const q = query(
        queriesRef,
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const records: QueryRecord[] = [];
        snapshot.forEach((docSnap) => {
          records.push(docSnap.data() as QueryRecord);
        });
        saveLocalCachedQueries(records);
        return records;
      }
    }
  } catch (err) {
    console.warn("Could not fetch from Firestore, serving from local cache:", err);
  }

  return getLocalCachedQueries();
}

/**
 * Real-time subscription to queries collection for current authenticated user
 */
export function subscribeToQueries(
  callback: (records: QueryRecord[]) => void,
  limitCount: number = 100
): Unsubscribe {
  let unsubscribeFirestore: Unsubscribe = () => {};

  ensureFirebaseAuth().then((user) => {
    if (!user?.uid) {
      callback(getLocalCachedQueries());
      return;
    }

    try {
      const queriesRef = collection(db, "queries");
      const q = query(
        queriesRef,
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );

      unsubscribeFirestore = onSnapshot(
        q,
        (snapshot) => {
          const records: QueryRecord[] = [];
          snapshot.forEach((docSnap) => {
            records.push(docSnap.data() as QueryRecord);
          });
          saveLocalCachedQueries(records);
          callback(records);
        },
        (error) => {
          console.warn("Firestore snapshot listener failed, using local cache:", error);
          callback(getLocalCachedQueries());
        }
      );
    } catch (e) {
      console.warn("Firestore subscription error:", e);
      callback(getLocalCachedQueries());
    }
  });

  return () => {
    unsubscribeFirestore();
  };
}

/**
 * Delete a specific query by ID
 */
export async function deleteQueryFromDatabase(id: string): Promise<void> {
  // Remove from local cache
  const local = getLocalCachedQueries().filter((q) => q.id !== id);
  saveLocalCachedQueries(local);

  try {
    const user = await ensureFirebaseAuth();
    if (user?.uid) {
      const docRef = doc(db, "queries", id);
      await deleteDoc(docRef);
    }
  } catch (e) {
    console.error("Failed to delete query from Firestore:", e);
  }
}

/**
 * Clear all queries for the current user
 */
export async function clearAllQueriesFromDatabase(): Promise<void> {
  const local = getLocalCachedQueries();
  saveLocalCachedQueries([]);

  try {
    const user = await ensureFirebaseAuth();
    if (user?.uid) {
      const promises = local.map((q) => deleteDoc(doc(db, "queries", q.id)));
      await Promise.allSettled(promises);
    }
  } catch (e) {
    console.error("Failed to clear all queries from Firestore:", e);
  }
}
