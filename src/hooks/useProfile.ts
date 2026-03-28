import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';

export function useProfile(username: string | undefined) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) {
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;

    const q = query(collection(db, 'users'), where('username', '==', username.toLowerCase()));
    getDocs(q).then((snap) => {
      if (snap.empty) {
        setError('Профиль не найден');
        setLoading(false);
        return;
      }
      const docRef = snap.docs[0].ref;
      unsubscribe = onSnapshot(docRef, (d) => {
        if (d.exists()) {
          setProfile(d.data() as UserProfile);
        } else {
          setError('Профиль не найден');
        }
        setLoading(false);
      });
    }).catch(() => {
      setError('Ошибка загрузки');
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [username]);

  return { profile, loading, error };
}
