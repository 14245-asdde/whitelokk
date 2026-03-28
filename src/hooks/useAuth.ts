import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { UserProfile } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (snap.exists()) {
            setProfile(snap.data() as UserProfile);
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  return { user, profile, loading, setProfile };
}
