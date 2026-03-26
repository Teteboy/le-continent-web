import { useEffect, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { setupDataSync, cleanupDataSync } from '../services/dataSync';
import { profileApi } from '../lib/api-client';
import { toast } from 'sonner';
import type { UserProfile } from '../types';

/**
 * AuthProvider initializes auth state ONCE for the entire app.
 *
 * Key design decisions:
 * 1. Single point of auth init — prevents multiple concurrent Supabase auth
 *    lock acquisitions from multiple useAuth() callers.
 * 2. No separate getSession() call — onAuthStateChange fires INITIAL_SESSION
 *    on subscribe (Supabase v2), which is sufficient.
 * 3. visibilitychange listener — refreshes session & profile when user returns
 *    to the tab after long inactivity (prevents stale/empty profile).
 * 4. Token expiry detection — if session is expired on tab focus, user is
 *    signed out cleanly instead of leaving stale auth state.
 * 5. Periodic session refresh — proactively refreshes token before expiration.
 * 6. Profile is fetched from backend API (not Supabase directly) for consistency.
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

    // Track last fetched profile time for stale-check on visibility change
    let lastProfileFetch = 0;
    const PROFILE_STALE_MS = 5 * 60 * 1000; // 5 minutes

    const fetchProfile = async (userId: string) => {
      try {
        const response = await profileApi.get(userId);
        const data = (response as { profile?: UserProfile }).profile;
        if (cancelled) return;
        if (data) {
          setProfile(data);
          lastProfileFetch = Date.now();
        } else if (response.error) {
          console.warn('[AuthProvider] Profile fetch error:', response.error);
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

    // Track last user ID to detect user changes
    let lastUserId: string | null = null;

    // onAuthStateChange fires INITIAL_SESSION on subscribe in Supabase v2
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (cancelled) return;

        setSession(session);
        const currentUser = session?.user ?? null;
        const isSignOut = event === 'SIGNED_OUT';

        if (!currentUser) {
          lastUserId = null;
          setUser(null);
          if (isSignOut) {
            setProfile(null);
          }
          clearTimeout(timeoutId);
          setLoading(false);
          return;
        }

        const isNewUser = currentUser.id !== lastUserId;
        lastUserId = currentUser.id;
        setUser(currentUser);

        // Fetch profile on sign-in, new user, or token refresh
        if (isNewUser || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await fetchProfile(currentUser.id);
        } else {
          clearTimeout(timeoutId);
          setLoading(false);
        }
      }
    );

    /**
     * Visibility change handler — fires when user switches back to the tab.
     * Refreshes the session and profile if stale (> PROFILE_STALE_MS old).
     * If session has expired, signs the user out cleanly.
     */
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible' || cancelled) return;

      const timeSinceLastFetch = Date.now() - lastProfileFetch;
      // Skip if profile was fetched recently
      if (timeSinceLastFetch < PROFILE_STALE_MS) return;

      try {
        // Ask Supabase to return the current (possibly refreshed) session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session?.user) {
          // Session expired or invalid — sign out the user cleanly
          if (lastUserId) {
            console.warn('[AuthProvider] Session expired on tab focus — signing out');
            supabase.auth.signOut({ scope: 'local' }).catch(() => {});
            if (!cancelled) {
              setUser(null);
              setProfile(null);
              setSession(null);
              lastUserId = null;
              toast.error('Session expirée', {
                description: 'Veuillez vous reconnecter.',
                duration: 5000,
              });
            }
          }
          return;
        }

        // Session is still valid — refresh the profile via backend API
        lastProfileFetch = Date.now();
        const profileResponse = await profileApi.get(session.user.id);
        const profileData = (profileResponse as { profile?: UserProfile }).profile;

        if (profileData && !cancelled) {
          setProfile(profileData);
        }
      } catch (err) {
        console.warn('[AuthProvider] Visibility refresh error:', err);
      }
    };

    /**
     * Periodic token refresh — runs every 25 minutes to keep session fresh.
     * Supabase tokens typically expire after 1 hour, so we refresh at 25min mark.
     */
    const refreshInterval = setInterval(async () => {
      if (cancelled) return;

      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session?.user) {
          // Session is invalid, clear it
          if (lastUserId) {
            supabase.auth.signOut({ scope: 'local' }).catch(() => {});
            if (!cancelled) {
              setUser(null);
              setProfile(null);
              setSession(null);
              lastUserId = null;
            }
          }
          return;
        }

        // Refresh the session to get a new token
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

        if (refreshError || !refreshData?.user) {
          console.warn('[AuthProvider] Token refresh failed:', refreshError?.message);
          return;
        }

        // Refresh profile data via backend API
        lastProfileFetch = Date.now();
        const profileResponse = await profileApi.get(session.user.id);
        const profileData = (profileResponse as { profile?: UserProfile }).profile;

        if (profileData && !cancelled) {
          setProfile(profileData);
        }
      } catch (err) {
        console.warn('[AuthProvider] Periodic refresh error:', err);
      }
    }, 25 * 60 * 1000); // 25 minutes

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      clearInterval(refreshInterval);
      subscription.unsubscribe();
      cleanupDataSync();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
