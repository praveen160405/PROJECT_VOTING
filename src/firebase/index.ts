"use client";

import { FirebaseApp, initializeApp, getApps, getApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';
import type { FirebaseServices } from './types';

// This is the robust, idempotent way to initialize Firebase in a Next.js app.
export const initializeFirebase = (): FirebaseServices => {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const firestore = getFirestore(app);

    return { app, auth, firestore };
}

export type { FirebaseServices };
