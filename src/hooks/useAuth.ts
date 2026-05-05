import { useEffect, useState } from 'react';
import { onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types';

const ADMIN_EMAIL = 'na0871039@gmail.com';

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Sync with Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        let userProfile: UserProfile;

        if (!userDoc.exists()) {
          // Create profile
          userProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'Reader',
            photoURL: firebaseUser.photoURL || '',
            isAdmin: firebaseUser.email === ADMIN_EMAIL,
            createdAt: serverTimestamp() as any,
          };
          await setDoc(userDocRef, userProfile);
        } else {
          userProfile = userDoc.data() as UserProfile;
          // Ensure isAdmin is updated if it was changed manually or via hardcoded email
          if (firebaseUser.email === ADMIN_EMAIL && !userProfile.isAdmin) {
             await setDoc(userDocRef, { ...userProfile, isAdmin: true }, { merge: true });
             userProfile.isAdmin = true;
          }
        }
        setUser(userProfile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const logout = () => signOut(auth);

  return { user, loading, login, logout };
}
