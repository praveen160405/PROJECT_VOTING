"use client";

import { useState, useEffect } from 'react';
import { onSnapshot, getDocs, Query, DocumentData } from 'firebase/firestore';

interface UseCollectionOptions {
  live?: boolean;
}

export function useCollection<T>(
  q: Query<DocumentData> | null,
  options: UseCollectionOptions = { live: true }
) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!q) {
      setLoading(false);
      return;
    }

    if (!options.live) {
      getDocs(q)
        .then((snapshot) => {
          const docs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          } as T));
          setData(docs);
          setLoading(false);
        })
        .catch((err) => {
          setError(err);
          setLoading(false);
        });
      return;
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as T));
        setData(docs);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
    // Using JSON.stringify on the query is a simple way to create a dependency,
    // but it might not be perfectly stable for complex queries.
    // For more robust scenarios, consider a library that serializes Firestore queries.
  }, [q ? JSON.stringify(q) : null, options.live]);

  return { data, loading, error };
}
