import { useEffect, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { setupDataSync, cleanupDataSync } from '../services/dataSync';

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
  const { setUser, setSession, setProfile, setLoading } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;

    // Initialize real-time data sync
    setupDataSync(queryClient);

    // Safety timeout - set loading to false after 5 seconds max
    const timeoutId = setTimeout(() => {
      if (!cancelled) {
        setLoading(false);
      }
    }, 5000);

    const fetchProfile = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        if (cancelled) {
          if (data) setProfile(data);
          return;
        }
        if (!error && data) {
          setProfile(data);
        } else if (error) {
          if (data) setProfile(data);
        }
      } catch {
        // Silent fail - profile will be fetched on next attempt
      } finally {
        if (!cancelled) {
          clearTimeout(timeoutId);
          setLoading(false);
        }
      }
    };

    // Track last user ID to detect token refresh
    let lastUserId: string | null = null;
    
    // onAuthStateChange fires INITIAL_SESSION on subscribe in Supabase v2
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (cancelled) return;
        
        setSession(session);
        const currentUser = session?.user ?? null;
        
        // If user was previously logged in and now is null (but not SIGNED_OUT),
        // this is likely a token refresh - don't clear profile
        const isSignOut = event === 'SIGNED_OUT';
        
        if (!currentUser && lastUserId && !isSignOut) {
          setUser(null);
          return;
        }
        
        // Update last user ID
        lastUserId = currentUser?.id ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          await fetchProfile(currentUser.id);
        } else if (isSignOut) {
          clearTimeout(timeoutId);
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
      cleanupDataSync();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
