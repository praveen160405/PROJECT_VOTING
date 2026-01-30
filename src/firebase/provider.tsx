"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDF18uonLy32TMh3-s6qPS26TOL7k3aHDo",
  authDomain: "verity-vote-e-voting.firebaseapp.com",
  projectId: "verity-vote-e-voting",
  storageBucket: "verity-vote-e-voting.appspot.com",
  messagingSenderId: "574880499259",
  appId: "1:574880499259:web:9643a6bed713833d7b878f",
  measurementId: "G-9XG5YE7L04"
};

interface FirebaseContextValue {
    auth: Auth;
    firestore: Firestore;
    app: FirebaseApp;
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

export function FirebaseProvider({ children }: { children: ReactNode }) {
    const [services, setServices] = useState<FirebaseContextValue | null>(null);

    useEffect(() => {
        const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        const auth = getAuth(app);
        const firestore = getFirestore(app);
        setServices({ auth, firestore, app });
    }, []);

    return (
        <FirebaseContext.Provider value={services}>
            {children}
        </FirebaseContext.Provider>
    );
}

export const useFirebase = () => {
    const context = useContext(FirebaseContext);
    if (context === undefined) {
        throw new Error('useFirebase must be used within a FirebaseProvider');
    }
    return context;
};
