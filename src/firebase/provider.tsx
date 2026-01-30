"use client";

import React, { createContext, useContext } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseServices } from './index';

const FirebaseContext = createContext<FirebaseServices | null>(null);

// This provider makes the Firebase services available to the rest of the app.
export function FirebaseProvider({
  children,
  services,
}: {
  children: React.ReactNode;
  services: FirebaseServices;
}) {
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
  const services = useFirebase();
  return services?.app ?? null;
};

export const useAuth = (): Auth | null => {
  const services = useFirebase();
  return services?.auth ?? null;
};

export const useFirestore = (): Firestore | null => {
  const services = useFirebase();
  return services?.firestore ?? null;
};
