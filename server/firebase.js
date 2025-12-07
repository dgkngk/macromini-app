import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK
// On Cloud Run, this uses Application Default Credentials automatically.
// Locally, it looks for GOOGLE_APPLICATION_CREDENTIALS env var.
if (getApps().length === 0) {
  initializeApp();
}

export const db = getFirestore();
export const auth = getAuth();