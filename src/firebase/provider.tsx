"use client";

import React from 'react';

// This provider and its associated hooks are deprecated.
// Firebase services should now be imported directly from '@/firebase'.
// This file is kept to avoid breaking the file structure.

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useFirebaseApp() {
    throw new Error("useFirebaseApp is deprecated. Import 'app' from '@/firebase' instead.");
}

export function useAuth() {
    throw new Error("useAuth is deprecated. Import 'auth' from '@/firebase' instead.");
}

export function useFirestore() {
    throw new Error("useFirestore is deprecated. Import 'firestore' from '@/firebase' instead.");
}
