/**
 * Feedback, Bug Reporting, and Feature Request Service
 * Persists user feedback, bug reports, and beta telemetry to Firestore
 */

import { collection, doc, setDoc, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db, ensureFirebaseAuth } from "../lib/firebase";
import { FeedbackSubmission } from "../types";

const LOCAL_FEEDBACK_KEY = "munim_cached_feedback";

export function getLocalFeedback(): FeedbackSubmission[] {
  try {
    const raw = localStorage.getItem(LOCAL_FEEDBACK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveLocalFeedback(items: FeedbackSubmission[]): void {
  try {
    localStorage.setItem(LOCAL_FEEDBACK_KEY, JSON.stringify(items.slice(0, 50)));
  } catch (e) {}
}

export async function submitFeedback(input: {
  type: "bug" | "feature" | "rating" | "accounting_query" | "general";
  module?: string;
  title: string;
  description: string;
  rating?: number;
  userEmail?: string;
  contactEmail?: string;
  deviceInfo?: string;
}): Promise<{ success: boolean; id: string; error?: string }> {
  try {
    const id = `fb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const user = await ensureFirebaseAuth();
    const userId = user?.uid || "anon_user";

    const submission: FeedbackSubmission = {
      id,
      userId,
      type: input.type,
      module: input.module || "General",
      title: input.title.trim().slice(0, 200),
      description: input.description.trim().slice(0, 4000),
      rating: input.rating,
      contactEmail: (input.userEmail || input.contactEmail)?.trim(),
      createdAt: new Date().toISOString(),
      userAgent: input.deviceInfo || (typeof navigator !== "undefined" ? navigator.userAgent : "Node/Server"),
    };

    const local = getLocalFeedback();
    saveLocalFeedback([submission, ...local]);

    if (user?.uid) {
      try {
        const docRef = doc(db, "feedback", id);
        await setDoc(docRef, submission);
      } catch (e) {
        console.warn("Feedback cloud sync warning (saved locally):", e);
      }
    }

    return { success: true, id };
  } catch (err: any) {
    return { success: false, id: "", error: err?.message || "Failed to submit feedback" };
  }
}

export async function fetchUserFeedback(): Promise<FeedbackSubmission[]> {
  try {
    const user = await ensureFirebaseAuth();
    if (user?.uid) {
      const feedbackRef = collection(db, "feedback");
      const q = query(feedbackRef, where("userId", "==", user.uid), orderBy("createdAt", "desc"), limit(20));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const items: FeedbackSubmission[] = [];
        snap.forEach((d) => items.push(d.data() as FeedbackSubmission));
        saveLocalFeedback(items);
        return items;
      }
    }
  } catch (e) {}

  return getLocalFeedback();
}

export async function fetchAllFeedbackForAdmin(): Promise<FeedbackSubmission[]> {
  try {
    const user = await ensureFirebaseAuth();
    if (!user) return [];
    const feedbackRef = collection(db, "feedback");
    const q = query(feedbackRef, orderBy("createdAt", "desc"), limit(100));
    const snap = await getDocs(q);
    const items: FeedbackSubmission[] = [];
    snap.forEach((d) => items.push(d.data() as FeedbackSubmission));
    return items;
  } catch (e) {
    console.warn("Failed to fetch admin feedback:", e);
    return [];
  }
}

