import { supabase } from '@/lib/supabase';
import { QueryClient } from '@tanstack/react-query';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useAuthStore } from '@/store/authStore';
import type { UserProfile } from '@/types';

/**
 * Real-time data synchronization service
 * Subscribes to database changes and:
 *   1. Invalidates React Query caches
 *   2. Updates the Zustand auth store directly (critical for payment status updates)
 */

const subscriptions: Map<string, RealtimeChannel> = new Map();

export function setupDataSync(queryClient: QueryClient) {
  // Subscribe to referral changes for the current user
  subscribeToReferrals(queryClient);
  // Subscribe to profile changes — keeps auth store in sync without a reload
  subscribeToProfiles(queryClient);
}

function subscribeToReferrals(queryClient: QueryClient) {
  const referralSub = supabase
    .channel('public:referrals')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'referrals' },
      (payload) => {
        console.log('[DataSync] Referral change detected:', payload.eventType);

        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const referrerId = (payload.new as Record<string, unknown>)?.referrer_id;
          if (referrerId) {
            queryClient.invalidateQueries({
              queryKey: ['referrals', referrerId],
              exact: true,
            });
          }
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[DataSync] Subscribed to referral changes');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('[DataSync] Failed to subscribe to referrals');
      }
    });

  subscriptions.set('referrals', referralSub);
}

function subscribeToProfiles(queryClient: QueryClient) {
  const profileSub = supabase
    .channel('public:profiles')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'profiles' },
      (payload) => {
        const updatedProfile = payload.new as UserProfile;
        if (!updatedProfile?.id) return;

        console.log('[DataSync] Profile change detected for user:', updatedProfile.id,
          '| is_premium:', updatedProfile.is_premium);

        // 1. Invalidate React Query cache (covers any queries keyed by profile/user id)
        queryClient.invalidateQueries({ queryKey: ['profile', updatedProfile.id] });
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });

        // 2. Update Zustand auth store directly if this is the currently logged-in user.
        //    This is the critical fix: after a successful payment the backend updates
        //    Supabase → real-time event fires → we push the fresh profile into the store
        //    so the UI (premium gates, badges, etc.) updates WITHOUT requiring a page reload.
        const { user, setProfile } = useAuthStore.getState();
        if (user && user.id === updatedProfile.id) {
          console.log('[DataSync] Updating auth store profile. is_premium →', updatedProfile.is_premium);
          setProfile(updatedProfile);
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[DataSync] Subscribed to profile changes');
      } else if (status === 'CHANNEL_ERROR') {
        console.warn('[DataSync] Failed to subscribe to profile changes — real-time unavailable');
      }
    });

  subscriptions.set('profiles', profileSub);
}

export function cleanupDataSync() {
  subscriptions.forEach((sub) => {
    if (sub) supabase.removeChannel(sub);
  });
  subscriptions.clear();
}
