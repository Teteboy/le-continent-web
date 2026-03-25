import { supabase } from '@/lib/supabase';
import { QueryClient } from '@tanstack/react-query';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Real-time data synchronization service
 * Subscribes to database changes and invalidates React Query caches
 */

const subscriptions: Map<string, RealtimeChannel> = new Map();

export function setupDataSync(queryClient: QueryClient) {
  // Subscribe to referral changes for the current user
  subscribeToReferrals(queryClient);
  // Subscribe to profile changes
  subscribeToProfiles(queryClient);
}

function subscribeToReferrals(queryClient: QueryClient) {
  const referralSub = supabase
    .channel('public:referrals')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'referrals' },
      (payload) => {
        console.log('[DataSync] Referral change detected:', payload.eventType, payload);
        
        // Only invalidate if it's an INSERT or UPDATE for a tracked user
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const referrerId = payload.new?.referrer_id;
          if (referrerId) {
            console.log('[DataSync] Invalidating referrals for user:', referrerId);
            // Invalidate only for the specific referrer
            queryClient.invalidateQueries({ 
              queryKey: ['referrals', referrerId],
              exact: true 
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
        console.log('[DataSync] Profile change detected:', payload);
        // Invalidate profile queries
        if (payload.new?.id) {
          queryClient.invalidateQueries({ queryKey: ['profile', payload.new.id] });
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[DataSync] Subscribed to profile changes');
      }
    });

  subscriptions.set('profiles', profileSub);
}

export function cleanupDataSync() {
  subscriptions.forEach((sub) => {
    if (sub) {
      supabase.removeChannel(sub);
    }
  });
  subscriptions.clear();
}
