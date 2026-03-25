/**
 * Referral Management API Routes
 * Handles referral code validation, creation, and tracking
 */

const express = require('express');
const router = express.Router();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dltkfjkodqpzmpuctnju.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsdGtmamtvZHFwem1wdWN0bmp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE2ODMyMSwiZXhwIjoyMDc5NzQ0MzIxfQ.Vz6yapqHN7NlI83izQiFGIf2L_8vegNMpl99r_yQxDw';

/**
 * GET /api/referrals/validate/:code
 * Validate a referral code exists and get referrer details
 */
router.get('/validate/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const cleanCode = code.trim().toUpperCase();

    console.log('[ReferralAPI] Validating code:', cleanCode);

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?select=id,promo_code,first_name,last_name,email&ilike(promo_code,${encodeURIComponent(cleanCode)})`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    if (!response.ok) {
      return res.status(400).json({ 
        valid: false, 
        error: 'Failed to validate referral code' 
      });
    }

    const referrers = await response.json();
    const referrer = referrers?.find(r => r.promo_code?.toUpperCase() === cleanCode);

    if (!referrer) {
      console.warn('[ReferralAPI] Code not found:', cleanCode);
      return res.json({ 
        valid: false, 
        error: 'Referral code not found' 
      });
    }

    console.log('[ReferralAPI] ✅ Valid code found for:', referrer.id);
    res.json({
      valid: true,
      referrer: {
        id: referrer.id,
        name: `${referrer.first_name} ${referrer.last_name}`,
        email: referrer.email
      }
    });

  } catch (error) {
    console.error('[ReferralAPI] Validation error:', error);
    res.status(500).json({ valid: false, error: 'Validation failed' });
  }
});

/**
 * POST /api/referrals/create
 * Create a new referral record
 */
router.post('/create', async (req, res) => {
  try {
    const { referrerId, referredId, referredName, referredPhone } = req.body;

    if (!referrerId || !referredId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('[ReferralAPI] Creating referral:', { referrerId, referredId });

    const response = await fetch(`${SUPABASE_URL}/rest/v1/referrals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        referrer_id: referrerId,
        referred_id: referredId,
        referred_name: referredName || 'Unknown',
        referred_phone: referredPhone || null,
        amount_paid: 0,
        referral_earnings: 0,
        created_at: new Date().toISOString()
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[ReferralAPI] Create error:', error);
      return res.status(500).json({ error: 'Failed to create referral' });
    }

    const result = await response.json();
    console.log('[ReferralAPI] ✅ Referral created:', result[0]?.id);

    res.json({
      success: true,
      referral: result[0]
    });

  } catch (error) {
    console.error('[ReferralAPI] Creation exception:', error);
    res.status(500).json({ error: 'Referral creation failed' });
  }
});

/**
 * GET /api/referrals/list/:userId
 * Get all referrals for a user
 */
router.get('/list/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    console.log('[ReferralAPI] Fetching referrals for:', userId);

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/referrals?referrer_id=eq.${userId}&order=created_at.desc`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    if (!response.ok) {
      console.error('[ReferralAPI] Fetch error:', response.status);
      return res.status(500).json({ error: 'Failed to fetch referrals' });
    }

    const referrals = await response.json();
    console.log('[ReferralAPI] Found referrals:', referrals.length);

    res.json({
      success: true,
      count: referrals.length,
      referrals
    });

  } catch (error) {
    console.error('[ReferralAPI] Fetch exception:', error);
    res.status(500).json({ error: 'Failed to fetch referrals' });
  }
});

/**
 * GET /api/referrals/stats/:userId
 * Get referral statistics for a user
 */
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    console.log('[ReferralAPI] Fetching stats for:', userId);

    // Get user profile
    const profileRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=promo_code,referral_earnings,referral_count`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    if (!profileRes.ok) {
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }

    const profiles = await profileRes.json();
    const profile = profiles[0];

    if (!profile) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get referral count
    const referralsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/referrals?referrer_id=eq.${userId}&select=id`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    const referrals = await referralsRes.json();

    res.json({
      success: true,
      stats: {
        promoCode: profile.promo_code,
        totalReferrals: referrals.length,
        totalEarnings: profile.referral_earnings || 0,
        commissionPerReferral: 500, // FCFA
        conversionRate: '0%' // Can be calculated if you track views
      }
    });

  } catch (error) {
    console.error('[ReferralAPI] Stats exception:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
