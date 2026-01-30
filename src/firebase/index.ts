"use client";

import { FirebaseApp, initializeApp, getApps, getApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAA7tZTnalUv4OCAsU_wMe6WGlsMdSMiEU",
  authDomain: "studio-8728271286-596e7.firebaseapp.com",
  projectId: "studio-8728271286-596e7",
  storageBucket: "studio-8728271286-596e7.appspot.com",
  messagingSenderId: "881712555776",
  appId: "1:881712555776:web:3fe086790944534dbfb5e5",
};

export type FirebaseServices = {
    app: FirebaseApp;
    auth: Auth;
    firestore: Firestore;
};

let firebaseServices: FirebaseServices | null = null;

export const initializeFirebase = (): FirebaseServices => {
    if (typeof window === 'undefined') {
        throw new Error("Firebase can only be initialized on the client.");
    }
    
    if (firebaseServices) {
        return firebaseServices;
    }
    
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const firestore = getFirestore(app);

    firebaseServices = { app, auth, firestore };
    return firebaseServices;
}

export * from './provider';
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';