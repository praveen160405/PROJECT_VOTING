import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// IMPORTANT: This file is updated with your project's Firebase configuration.
// For local development, you should set these values in your environment variables.
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAA7tZTnalUv4OCAsU_wMe6WGlsMdSMiEU",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "studio-8728271286-596e7.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "studio-8728271286-596e7",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "881712555776",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:881712555776:web:3fe086790944534dbfb5e5",
};

export function initializeFirebase() {
  const apps = getApps();
  const app = apps.length ? apps[0] : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  return { app, auth, firestore };
}
