"use client";

import { useState, useEffect } from 'react';
import { onSnapshot, query, collection, where, getDocs, Query, DocumentData } from 'firebase/firestore';

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
  }, [JSON.stringify(q), options.live]); // Simple serialization for dependency array

  return { data, loading, error };
}
