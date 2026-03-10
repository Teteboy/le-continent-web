import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

/**
 * useAuth is a pure store selector — no side effects.
 * Auth initialization is handled once by AuthProvider (src/providers/AuthProvider.tsx).
 * This prevents the "Lock broken by another request" Supabase auth error
 * that occurred when multiple components each created their own
 * onAuthStateChange subscriptions concurrently.
 */
export function useAuth() {
  const { user, session, profile, loading, setProfile, setLoading, reset } = useAuthStore();

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
    await supabase.auth.signOut();
    reset();
  };

  return {
    user,
    session,
    profile,
    loading,
    signOut,
    refetchProfile: () => user && fetchProfile(user.id),
  };
}
