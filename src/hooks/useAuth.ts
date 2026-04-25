import React from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types';

export function useAuth() {
  const [user, setUser] = React.useState<User | null>(null);
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [profileMissing, setProfileMissing] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setProfileMissing(false);
      
      if (firebaseUser) {
        setLoading(true);
        try {
          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile({ uid: docSnap.id, ...docSnap.data() } as UserProfile);
            setProfileMissing(false);
          } else {
            setProfile(null);
            setProfileMissing(true);
          }
        } catch (err) {
          console.error("Error fetching profile:", err);
          // Don't mark as missing if it's a network/permission error
          setProfile(null);
        } finally {
          setLoading(false);
        }
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async (uid: string) => {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setProfile({ uid: docSnap.id, ...docSnap.data() } as UserProfile);
      setProfileMissing(false);
      return true;
    }
    return false;
  };

  return { user, profile, loading, profileMissing, refreshProfile };
}
