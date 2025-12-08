import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Initialize Firebase Admin SDK
// On Cloud Run, this uses Application Default Credentials automatically.
// Locally, it looks for GOOGLE_APPLICATION_CREDENTIALS env var.
if (getApps().length === 0) {
  initializeApp();
}

// TODO: Replace 'macromini-test' with your actual database name.
// Check Firebase Console -> Firestore -> Data to confirm the name.
const DATABASE_ID = "macromini-test";
export const db = getFirestore(DATABASE_ID);
export const auth = getAuth();
