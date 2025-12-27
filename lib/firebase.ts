// @ts-ignore
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Runtime Validation
const requiredFirebaseEnvVars: { configKey: keyof typeof firebaseConfig; envVar: string }[] = [
  { configKey: 'apiKey', envVar: 'VITE_FIREBASE_API_KEY' },
  { configKey: 'authDomain', envVar: 'VITE_FIREBASE_AUTH_DOMAIN' },
  { configKey: 'projectId', envVar: 'VITE_FIREBASE_PROJECT_ID' },
  { configKey: 'storageBucket', envVar: 'VITE_FIREBASE_STORAGE_BUCKET' },
  { configKey: 'messagingSenderId', envVar: 'VITE_FIREBASE_MESSAGING_SENDER_ID' },
  { configKey: 'appId', envVar: 'VITE_FIREBASE_APP_ID' },
  { configKey: 'measurementId', envVar: 'VITE_FIREBASE_MEASUREMENT_ID' }
];

const missingFirebaseEnvVars = requiredFirebaseEnvVars
  .filter(({ configKey }) => !firebaseConfig[configKey])
  .map(({ envVar }) => envVar);

if (missingFirebaseEnvVars.length > 0) {
  const errorMsg =
    `Firebase Configuration Error: The following environment variables are missing or empty: ` +
    `${missingFirebaseEnvVars.join(', ')}. ` +
    `Please check your .env file or environment variables.`;
  console.error(errorMsg);
  throw new Error(errorMsg);
}

// Initialize Firebase using the Modular SDK
// @ts-ignore
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
