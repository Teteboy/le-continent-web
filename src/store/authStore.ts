import { create } from 'zustand';
import { type User, type Session } from '@supabase/supabase-js';
import type { UserProfile } from '../types';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  // Auth change listeners - components can subscribe to auth changes
  authListeners: Array<(user: User | null) => void>;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  // Subscribe to auth changes
  subscribeToAuth: (callback: (user: User | null) => void) => () => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,
  authListeners: [],
  setUser: (user) => {
    set({ user });
    // Notify all listeners
    get().authListeners.forEach(callback => callback(user));
  },
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  subscribeToAuth: (callback) => {
    set(state => ({ authListeners: [...state.authListeners, callback] }));
    // Return unsubscribe function
    return () => {
      set(state => ({ authListeners: state.authListeners.filter(cb => cb !== callback) }));
    };
  },
  // Preserve authListeners so subscribed components (e.g. LexiquePage) still get notified
  reset: () => set({ user: null, session: null, profile: null, loading: false }),
}));
