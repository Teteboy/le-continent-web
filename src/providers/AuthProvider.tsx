import { useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

/**
 * AuthProvider initializes auth state ONCE for the entire app.
 *
 * Key design decisions:
 * 1. Single point of auth init — prevents multiple concurrent Supabase auth
 *    lock acquisitions from multiple useAuth() callers.
 * 2. No separate getSession() call — onAuthStateChange fires INITIAL_SESSION
 *    on subscribe (Supabase v2), which is sufficient. Calling both
 *    simultaneously caused lock contention.
 * 3. supabase.ts uses a serial-queue lock instead of Web Locks to prevent
 *    "Lock broken by another request with the 'steal' option." errors.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { setUser, setSession, setProfile, setLoading, reset } = useAuthStore();

  useEffect(() => {
    let cancelled = false;

    const fetchProfile = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        if (cancelled) return;
        if (!error && data) {
          setProfile(data);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    // onAuthStateChange fires INITIAL_SESSION on subscribe in Supabase v2,
    // so no separate getSession() call is needed (which caused concurrent
    // lock acquisitions and "Lock broken" errors).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (cancelled) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
