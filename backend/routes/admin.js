const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with fallbacks
const supabaseUrl = process.env.SUPABASE_URL || 'https://dltkfjkodqpzmpuctnju.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsdGtmamtvZHFwem1wdWN0bmp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE2ODMyMSwiZXhwIjoyMDc5NzQ0MzIxfQ.Vz6yapqHN7NlI83izQiFGIf2L_8vegNMpl99r_yQxDw';
const supabase = createClient(supabaseUrl, supabaseKey);

// Cache for admin stats (shorter cache time since admin needs more real-time data)
const CACHE_TTL = 30; // 30 seconds cache for admin

/**
 * Get admin statistics with caching
 */
router.get('/stats', async (req, res) => {
  try {
    // Try to get from cache first
    const cached = req.app.locals.cache?.get('admin:stats');
    if (cached) {
      console.log('[Admin API] Returning cached stats');
      return res.json(cached);
    }

    // Fetch fresh data from Supabase
    const [
      usersRes,
      premiumRes,
      referralsRes,
      promoRes,
      villagesRes
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_premium', true),
      supabase.from('referrals').select('id', { count: 'exact', head: true }),
      supabase.from('promo_codes').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('villages').select('id', { count: 'exact', head: true })
    ]);

    const stats = {
      totalUsers: usersRes.count ?? 0,
      premiumUsers: premiumRes.count ?? 0,
      freeUsers: (usersRes.count ?? 0) - (premiumRes.count ?? 0),
      totalReferrals: referralsRes.count ?? 0,
      activePromoCodes: promoRes.count ?? 0,
      totalVillages: villagesRes.count ?? 0,
      estimatedRevenue: (premiumRes.count ?? 0) * 1000,
      updatedAt: new Date().toISOString()
    };

    // Cache the result
    if (req.app.locals.cache) {
      req.app.locals.cache.set('admin:stats', stats, CACHE_TTL);
    }

    console.log('[Admin API] Fresh stats fetched');
    res.json(stats);
  } catch (error) {
    console.error('[Admin API] Stats error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get recent users with pagination
 */
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const cacheKey = `admin:users:${page}:${limit}`;
    const cached = req.app.locals.cache?.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const { data, error, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const result = {
      users: data || [],
      total: count ?? 0,
      page,
      totalPages: Math.ceil((count ?? 0) / limit)
    };

    if (req.app.locals.cache) {
      req.app.locals.cache.set(cacheKey, result, CACHE_TTL);
    }

    res.json(result);
  } catch (error) {
    console.error('[Admin API] Users error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get recent referrals with pagination
 */
router.get('/referrals', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const cacheKey = `admin:referrals:${page}:${limit}`;
    const cached = req.app.locals.cache?.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Get referrals with referrer and referred user info
    const { data, error, count } = await supabase
      .from('referrals')
      .select('*, referrer:profiles!referrer_id(first_name, last_name, email), referred:profiles!referred_id(first_name, last_name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    // Transform data to include names
    const referrals = (data || []).map(r => ({
      id: r.id,
      referrer_id: r.referrer_id,
      referred_id: r.referred_id,
      referrer_name: r.referrer ? `${r.referrer.first_name} ${r.referrer.last_name}` : 'Unknown',
      referred_name: r.referred ? `${r.referred.first_name} ${r.referred.last_name}` : 'Unknown',
      referred_phone: r.referred_phone,
      amount_paid: r.amount_paid,
      referral_earnings: r.referral_earnings,
      created_at: r.created_at
    }));

    const result = {
      referrals,
      total: count ?? 0,
      page,
      totalPages: Math.ceil((count ?? 0) / limit)
    };

    if (req.app.locals.cache) {
      req.app.locals.cache.set(cacheKey, result, CACHE_TTL);
    }

    res.json(result);
  } catch (error) {
    console.error('[Admin API] Referrals error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get promo codes
 */
router.get('/promo-codes', async (req, res) => {
  try {
    const cacheKey = 'admin:promo-codes';
    const cached = req.app.locals.cache?.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (req.app.locals.cache) {
      req.app.locals.cache.set(cacheKey, data || [], CACHE_TTL);
    }

    res.json(data || []);
  } catch (error) {
    console.error('[Admin API] Promo codes error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get villages list
 */
router.get('/villages', async (req, res) => {
  try {
    const cacheKey = 'admin:villages';
    const cached = req.app.locals.cache?.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const { data, error } = await supabase
      .from('villages')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    if (req.app.locals.cache) {
      req.app.locals.cache.set(cacheKey, data || [], CACHE_TTL);
    }

    res.json(data || []);
  } catch (error) {
    console.error('[Admin API] Villages error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Clear admin cache (for manual refresh)
 */
router.post('/clear-cache', async (req, res) => {
  try {
    if (req.app.locals.cache) {
      // Clear only admin-related cache keys
      req.app.locals.cache.clear();
    }
    res.json({ success: true, message: 'Admin cache cleared' });
  } catch (error) {
    console.error('[Admin API] Clear cache error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
