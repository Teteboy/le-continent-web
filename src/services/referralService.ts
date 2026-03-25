import { supabase } from '@/lib/supabase';
import { QueryClient } from '@tanstack/react-query';

/**
 * Referral service - handles all referral-related operations
 */

/**
 * Find referrer by code (validation only)
 */
export async function findReferrerByCode(referralCode: string) {
  if (!referralCode.trim()) {
    return { referrer: null };
  }

  try {
    const cleanCode = referralCode.trim().toUpperCase();
    console.log('[ReferralService] Looking up code:', cleanCode);

    // Find referrer by promo code (case-insensitive)
    const { data: referrers, error: searchError } = await supabase
      .from('profiles')
      .select('id, promo_code, first_name, last_name')
      .ilike('promo_code', cleanCode)
      .limit(10);

    if (searchError) {
      console.error('[ReferralService] Search error:', searchError);
      return { referrer: null, error: searchError.message };
    }

    // Find exact match (case-insensitive comparison)
    const referrer = referrers?.find(
      (r) => r.promo_code?.toUpperCase() === cleanCode
    );

    if (!referrer) {
      console.warn('[ReferralService] No referrer found for code:', cleanCode);
      return { referrer: null };
    }

    console.log('[ReferralService] Found referrer:', referrer.id);
    return { referrer };
  } catch (err) {
    console.error('[ReferralService] Lookup exception:', err);
    return { referrer: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Create referral record with user IDs
 */
export async function createReferralRecord(
  referrerId: string,
  referredId: string,
  referredName: string,
  referredPhone: string,
  queryClient?: QueryClient
) {
  try {
    console.log('[ReferralService] Creating referral:', { referrerId, referredId });

    const { data, error } = await supabase.from('referrals').insert({
      referrer_id: referrerId,
      referred_id: referredId,
      referred_name: referredName,
      referred_phone: referredPhone,
      amount_paid: 0,
      referral_earnings: 0,
      created_at: new Date().toISOString(),
    }).select('*');

    if (error) {
      console.error('[ReferralService] Insert error:', error);
      return { success: false, error: error.message };
    }

    console.log('[ReferralService] Referral created successfully:', data);

    // Only invalidate the specific referrer's queries (not all referral queries)
    if (queryClient) {
      console.log('[ReferralService] Invalidating query for referrer:', referrerId);
      queryClient.invalidateQueries({ 
        queryKey: ['referrals', referrerId],
        exact: true 
      });
    }

    return { success: true };
  } catch (err) {
    console.error('[ReferralService] Create exception:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Get referrals for a user with real-time updates
 */
export async function fetchReferralsForUser(userId: string) {
  try {
    const { data, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[ReferralService] Fetch error:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('[ReferralService] Fetch exception:', err);
    return [];
  }
}

/**
 * Verify referral code exists
 */
export async function verifyReferralCode(code: string) {
  try {
    const cleanCode = code.trim().toUpperCase();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, promo_code')
      .ilike('promo_code', cleanCode)
      .single();

    if (error || !data) {
      return false;
    }

    return data.promo_code?.toUpperCase() === cleanCode;
  } catch {
    return false;
  }
}
