"use client";

import { useEffect, useState } from "react";
import { FirebaseProvider } from "./provider";
import { initializeFirebase } from "./index";
import type { FirebaseServices } from './types';

// This component ensures that Firebase is initialized only on the client side.
export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [services, setServices] = useState<FirebaseServices | null>(null);

  useEffect(() => {
    // This effect runs only on the client, after the component mounts.
    setServices(initializeFirebase());
  }, []);

  return <FirebaseProvider services={services}>{children}</FirebaseProvider>;
}
