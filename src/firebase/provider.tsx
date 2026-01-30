"use client";

import { createContext, useContext, ReactNode } from 'react';
import { auth, firestore, app } from './client'; // Import the singletons
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseApp } from 'firebase/app';

interface FirebaseContextValue {
    auth: Auth;
    firestore: Firestore;
    app: FirebaseApp;
}

// The services are already initialized in client.ts
const services: FirebaseContextValue = { auth, firestore, app };

const FirebaseContext = createContext<FirebaseContextValue | null>(services);

export function FirebaseProvider({ children }: { children: ReactNode }) {
    // The provider now just passes down the pre-initialized services.
    // No useState, no useEffect.
    return (
        <FirebaseContext.Provider value={services}>
            {children}
        </FirebaseContext.Provider>
    );
}

export const useFirebase = () => {
    const context = useContext(FirebaseContext);
    if (context === undefined || context === null) {
        // This should theoretically never be thrown if the provider is at the root.
        throw new Error('useFirebase must be used within a FirebaseProvider');
    }
    return context;
};
