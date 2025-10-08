import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { getUserProfile, createUserProfile, updateUserFamily, subscribeToUserProfile } from '../lib/api';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  currentUser: SupabaseUser | null;
  userData: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  updateUserData: (data: Partial<User>) => void;
  updateUserFamily: (familyId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function signup(email: string, password: string, displayName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error('Failed to create user');

    await createUserProfile(data.user.id, {
      email: data.user.email!,
      displayName,
      familyId: '',
      role: 'member',
    });
  }

  async function login(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  }

  async function logout() {
    setUserData(null);
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  function updateUserData(data: Partial<User>) {
    if (userData) {
      setUserData({ ...userData, ...data });
    }
  }

  async function handleUpdateUserFamily(familyId: string) {
    if (currentUser) {
      await updateUserFamily(currentUser.id, familyId);
    }
  }

  useEffect(() => {
    let unsubscribeFromUserProfile: (() => void) | null = null;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);

      if (session?.user) {
        unsubscribeFromUserProfile = subscribeToUserProfile(session.user.id, (profile) => {
          setUserData(profile);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);

      if (unsubscribeFromUserProfile) {
        unsubscribeFromUserProfile();
        unsubscribeFromUserProfile = null;
      }

      if (session?.user) {
        unsubscribeFromUserProfile = subscribeToUserProfile(session.user.id, (profile) => {
          setUserData(profile);
          setLoading(false);
        });
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (unsubscribeFromUserProfile) {
        unsubscribeFromUserProfile();
      }
    };
  }, []);

  const value: AuthContextType = {
    currentUser,
    userData,
    login,
    signup,
    logout,
    loading,
    updateUserData,
    updateUserFamily: handleUpdateUserFamily,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
