import { useEffect, useRef } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, increment, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

export function useViewTracker(username: string, viewerUid?: string, profileUid?: string) {
  const tracked = useRef(false);

  useEffect(() => {
    if (!username || tracked.current) return;
    if (viewerUid && profileUid && viewerUid === profileUid) return;

    const track = async () => {
      try {
        const key = `view_${username}`;
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, '1');

        const q = query(collection(db, 'users'), where('username', '==', username));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const userDoc = snap.docs[0];
          await updateDoc(doc(db, 'users', userDoc.id), {
            views: increment(1)
          });
          const viewLogRef = doc(db, 'viewLogs', `${username}_${Date.now()}`);
          await setDoc(viewLogRef, {
            username,
            viewedAt: Date.now(),
          });
        }
        tracked.current = true;
      } catch (e) {
        console.error('View tracking error:', e);
      }
    };

    track();
  }, [username, viewerUid, profileUid]);
}
