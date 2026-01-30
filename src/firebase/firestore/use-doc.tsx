"use client";

import { useState, useEffect } from 'react';
import { onSnapshot, getDoc, DocumentReference, DocumentData } from 'firebase/firestore';

interface UseDocOptions {
  live?: boolean;
}

export function useDoc<T>(
  ref: DocumentReference<DocumentData> | null,
  options: UseDocOptions = { live: true }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!ref) {
      setLoading(false);
      return;
    }

    if (!options.live) {
      getDoc(ref)
        .then((snapshot) => {
          if (snapshot.exists()) {
            setData({ id: snapshot.id, ...snapshot.data() } as T);
          } else {
            setData(null);
          }
          setLoading(false);
        })
        .catch((err) => {
          setError(err);
          setLoading(false);
        });
      return;
    }

    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        if (snapshot.exists()) {
          setData({ id: snapshot.id, ...snapshot.data() } as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [ref, options.live]);

  return { data, loading, error };
}
