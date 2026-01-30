"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAA7tZTnalUv4OCAsU_wMe6WGlsMdSMiEU",
  authDomain: "studio-8728271286-596e7.firebaseapp.com",
  projectId: "studio-8728271286-596e7",
  storageBucket: "studio-8728271286-596e7.appspot.com",
  messagingSenderId: "881712555776",
  appId: "1:881712555776:web:3fe086790944534dbfb5e5",
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
