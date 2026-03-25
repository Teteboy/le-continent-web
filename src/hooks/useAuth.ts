import { supabase, clearCache } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useQueryClient } from '@tanstack/react-query';

/**
 * useAuth is a pure store selector — no side effects.
 * Auth initialization is handled once by AuthProvider (src/providers/AuthProvider.tsx).
 * This prevents the "Lock broken by another request" Supabase auth error
 * that occurred when multiple components each created their own
 * onAuthStateChange subscriptions concurrently.
 */
export function useAuth() {
  const { user, session, profile, loading, setProfile, setLoading, reset } = useAuthStore();
  const queryClient = useQueryClient();

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (!error && data) {
        setProfile(data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      // Cancel all pending queries first - this is synchronous and fast
      queryClient.cancelQueries();
      
      // Clear all query cache - synchronous operation
      queryClient.clear();
      
      // Clear Supabase data cache as well
      clearCache();
      
      // Reset the auth store immediately - this clears user, session, and profile
      // Do this FIRST before waiting for Supabase to avoid delays
      reset();
      
      // Sign out from Supabase in the background - don't await
      // This makes logout instantaneous
      supabase.auth.signOut({ scope: 'global' }).catch(() => {});
      
    } catch (err: unknown) {
      console.error('Logout error:', err);
      reset();
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return {
    user,
    session,
    profile,
    loading,
    signOut,
    refetchProfile: refreshProfile,
  };
}
