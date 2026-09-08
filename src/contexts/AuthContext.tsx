import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider, signInWithPopup, firebaseSignOut, handleFirestoreError, OperationType } from '@/lib/firebase';
import { syncUserProfileToCloudflare } from '@/lib/cloudflareService';

export interface AuthUser {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  country?: string;
  city?: string;
  bio?: string;
  website?: string;
  twitter?: string;
  instagram?: string;
  tip_link?: string;
  is_admin: boolean;
  onboarded: boolean;
  date_of_birth?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (u: AuthUser) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateTipLink?: (link: string) => void;
  signInWithGoogle: () => Promise<void>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapFirebaseUser(firebaseUser: FirebaseUser, profileData?: Record<string, unknown>): AuthUser {
  const localTip = typeof window !== 'undefined' ? localStorage.getItem(`scruttin_tip_${firebaseUser.uid}`) || undefined : undefined;
  const isAdminEmail = firebaseUser.email === 'mderrickm00@gmail.com';
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    display_name:
      (profileData?.display_name as string) ||
      firebaseUser.displayName ||
      firebaseUser.email?.split('@')[0] ||
      'Anonymous',
    avatar_url: (profileData?.avatar_url as string) || firebaseUser.photoURL || undefined,
    country: profileData?.country as string | undefined,
    city: profileData?.city as string | undefined,
    bio: profileData?.bio as string | undefined,
    website: profileData?.website as string | undefined,
    twitter: profileData?.twitter as string | undefined,
    instagram: profileData?.instagram as string | undefined,
    tip_link: (profileData?.tip_link as string) || localTip,
    is_admin: Boolean(profileData?.is_admin || isAdminEmail),
    onboarded: Boolean(profileData?.onboarded),
    date_of_birth: profileData?.date_of_birth as string | undefined,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (firebaseUser: FirebaseUser): Promise<AuthUser> => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const mapped = mapFirebaseUser(firebaseUser, snap.data());
        syncUserProfileToCloudflare(mapped);
        return mapped;
      } else {
        // Create initial Firestore profile document
        const newProfile: Record<string, unknown> = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          display_name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          avatar_url: firebaseUser.photoURL || '',
          is_admin: false,
          onboarded: false,
          created_at: new Date().toISOString(),
        };
        try {
          await setDoc(userDocRef, newProfile);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `users/${firebaseUser.uid}`);
        }
        const mapped = mapFirebaseUser(firebaseUser, newProfile);
        syncUserProfileToCloudflare(mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('Error fetching Firestore user profile:', err);
      const mapped = mapFirebaseUser(firebaseUser);
      syncUserProfileToCloudflare(mapped);
      return mapped;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const currentFbUser = auth.currentUser;
    if (currentFbUser) {
      const authUser = await fetchProfile(currentFbUser);
      setUser(authUser);
    }
  }, [fetchProfile]);

  const signInWithGoogle = useCallback(async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        const authUser = await fetchProfile(result.user);
        setUser(authUser);
      }
    } catch (error) {
      console.error('Firebase Google sign-in failed:', error);
      throw error;
    }
  }, [fetchProfile]);

  const login = useCallback((u: AuthUser) => setUser(u), []);

  const logout = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.error('Firebase sign-out error:', err);
    }
    setUser(null);
  }, []);

  const updateTipLink = useCallback((link: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      try {
        localStorage.setItem(`scruttin_tip_${prev.id}`, link);
      } catch {
        /* storage unavailable */
      }
      return { ...prev, tip_link: link || undefined };
    });
  }, []);

  const updateProfile = useCallback(async (updates: Partial<AuthUser>) => {
    if (!auth.currentUser) return;
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    try {
      await updateDoc(userDocRef, updates as Record<string, unknown>);
      syncUserProfileToCloudflare({ id: auth.currentUser.uid, ...updates });
      setUser((prev) => (prev ? { ...prev, ...updates } : prev));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mounted) return;
      if (firebaseUser) {
        try {
          const authUser = await fetchProfile(firebaseUser);
          if (mounted) {
            setUser(authUser);
            setLoading(false);
          }
        } catch {
          if (mounted) {
            setUser(mapFirebaseUser(firebaseUser));
            setLoading(false);
          }
        }
      } else {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [fetchProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshUser,
        updateTipLink,
        signInWithGoogle,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
