"use client";

import { useEffect, useState } from "react";
import { FirebaseProvider } from "./provider";
import { initializeFirebase, type FirebaseServices } from "./index";

// This component ensures that Firebase is initialized only on the client side.
export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [services, setServices] = useState<FirebaseServices | null>(null);

  useEffect(() => {
    // This effect runs only on the client, after the component mounts.
    if (typeof window !== "undefined") {
      setServices(initializeFirebase());
    }
  }, []);

  if (!services) {
    // Returning null will render nothing until Firebase is initialized.
    // You could also render a loading spinner here.
    return null;
  }

  return <FirebaseProvider services={services}>{children}</FirebaseProvider>;
}
