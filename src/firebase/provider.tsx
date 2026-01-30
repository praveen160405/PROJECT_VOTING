"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { initializeFirebase, type FirebaseServices } from './index';

const FirebaseContext = createContext<FirebaseServices | null>(null);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<FirebaseServices | null>(null);

  useEffect(() => {
    // This effect runs only on the client, after the component mounts,
    // ensuring that Firebase is never initialized on the server.
    const firebaseServices = initializeFirebase();
    setServices(firebaseServices);
  }, []);

  return (
    <FirebaseContext.Provider value={services}>
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = (): FirebaseServices | null => {
  return useContext(FirebaseContext);
};

export const useFirebaseApp = (): FirebaseApp | null => {
  return useFirebase()?.app ?? null;
};

export const useAuth = (): Auth | null => {
  return useFirebase()?.auth ?? null;
};

export const useFirestore = (): Firestore | null => {
  return useFirebase()?.firestore ?? null;
};
