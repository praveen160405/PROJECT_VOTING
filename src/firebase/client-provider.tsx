"use client";

import React from 'react';

// This provider is no longer necessary due to a simplified Firebase initialization.
// It is kept in the project to avoid breaking the file structure, but it no longer provides any context.
export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
