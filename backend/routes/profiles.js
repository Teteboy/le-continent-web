/**
 * Profile Management API Routes
 */

const express = require('express');
const router = express.Router();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dltkfjkodqpzmpuctnju.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsdGtmamtvZHFwem1wdWN0bmp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE2ODMyMSwiZXhwIjoyMDc5NzQ0MzIxfQ.Vz6yapqHN7NlI83izQiFGIf2L_8vegNMpl99r_yQxDw';

// Import cache functions
const { setCache, getCache, deleteCache, getCacheKey, AUTH_CACHE_TTL } = require('../cache');

/**
 * GET /api/profiles/:userId
 * Get user profile
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const cacheKey = getCacheKey('profile', userId);

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Try cache first
    const cachedProfile = await getCache(cacheKey);
    if (cachedProfile) {
      console.log(`[ProfileAPI] Cache hit for profile ${userId}`);
      return res.json({
        success: true,
        profile: cachedProfile,
        fromCache: true
      });
    }

    // Cache miss - fetch from database
    console.log(`[ProfileAPI] Cache miss for profile ${userId}`);
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }

    const profiles = await response.json();
    const profile = profiles[0];

    if (profile) {
      // Cache the profile
      await setCache(cacheKey, profile, AUTH_CACHE_TTL);
      console.log(`[ProfileAPI] Cached profile for ${userId}`);
    }

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({
      success: true,
      profile,
      fromCache: false
    });

  } catch (error) {
    console.error('[ProfileAPI] Error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * PATCH /api/profiles/:userId
 * Update user profile
 */
router.patch('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    const cacheKey = getCacheKey('profile', userId);

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    console.log('[ProfileAPI] Updating profile:', userId);

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          ...updates,
          updated_at: new Date().toISOString()
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('[ProfileAPI] Update error:', error);
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    const result = await response.json();
    const updatedProfile = result[0];
    
    // Invalidate cache after update
    await deleteCache(cacheKey);
    console.log('[ProfileAPI] ✅ Profile updated, cache invalidated');

    res.json({
      success: true,
      profile: updatedProfile
    });

  } catch (error) {
    console.error('[ProfileAPI] Exception:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
