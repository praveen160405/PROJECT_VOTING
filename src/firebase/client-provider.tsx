"use client";

import { useEffect, useState } from 'react';

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // only render children on client
  if (!isMounted) {
    return null;
  }

  return <>{children}</>;
}
