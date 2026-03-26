/**
 * Content Management API Routes
 * Handles content caching with Redis for fast loading
 */

const express = require('express');
const router = express.Router();
const { getCache, setCache, deleteCachePattern, getCacheKey, CACHE_TTL, CONTENT_CACHE_TTL } = require('../cache');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dltkfjkodqpzmpuctnju.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsdGtmamtvZHFwem1wdWN0bmp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE2ODMyMSwiZXhwIjoyMDc5NzQ0MzIxfQ.Vz6yapqHN7NlI83izQiFGIf2L_8vegNMpl99r_yQxDw';

// Valid tables for content
const VALID_TABLES = ['lexique', 'alphabet', 'proverbes', 'histoires', 'mets', 'phrases', 'medicine_traditionnel', 'cultures_books'];

/**
 * GET /api/content/villages
 * Get all villages with caching
 */
router.get('/villages', async (req, res) => {
  try {
    const cacheKey = getCacheKey('villages', 'all');
    
    // Try cache first
    const cached = await getCache(cacheKey);
    if (cached) {
      console.log('[ContentAPI] Cache hit: villages');
      return res.json(cached);
    }

    console.log('[ContentAPI] Fetching villages from database');

    const url = `${SUPABASE_URL}/rest/v1/villages?select=*&order=name.asc`;
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status}`);
    }

    const data = await response.json();
    
    // Cache for 15 minutes (villages don't change often)
    await setCache(cacheKey, data, CONTENT_CACHE_TTL);
    
    res.json(data);
  } catch (err) {
    console.error('[ContentAPI] Villages error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/content/:table
 * Get content with Redis caching and pagination
 */
router.get('/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const { 
      villageId, 
      page = 1, 
      limit = 10, 
      isPremium = false,
      search = '',
      orderBy = 'created_at',
      orderAsc = true
    } = req.query;

    // Validate table name
    if (!VALID_TABLES.includes(table)) {
      return res.status(400).json({ error: 'Invalid table' });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Build cache key
    const cacheKey = getCacheKey(
      'content', 
      table, 
      villageId || 'all',
      isPremium,
      pageNum,
      limitNum,
      search,
      orderBy
    );

    // Try cache first
    const cached = await getCache(cacheKey);
    if (cached) {
      console.log('[ContentAPI] Cache hit:', cacheKey);
      return res.set('X-Cache', 'HIT').json(cached);
    }

    console.log('[ContentAPI] Fetching from database:', table, 'page:', pageNum);

    // Build query
    let url = `${SUPABASE_URL}/rest/v1/${table}?select=*&order=${orderBy}.${orderAsc === 'true' ? 'asc' : 'desc'}`;

    // For free users, limit to 3 items per page; premium gets full pagination
    const maxItems = isPremium === 'true' ? 100000 : 3;
    url += `&limit=${Math.min(limitNum, maxItems)}&offset=${offset}`;

    if (villageId) {
      url += `&village_id=eq.${villageId}`;
    }

    // Add search if provided (only for premium users)
    // Free users get a limited set and search is not supported via API
    if (search && search.trim() && isPremium === 'true') {
      const searchTerm = encodeURIComponent(search.trim());
      // Use generic search columns based on table type
      const tableSearchColumns = {
        lexique: ['french', 'local'],
        proverbes: ['french', 'translation'],
        histoires: ['title', 'content'],
        mets: ['name', 'description'],
        phrases: ['content', 'french'],
        alphabet: ['letter', 'name'],
        medicine_traditionnel: ['title', 'category', 'ingredients'],
        cultures_books: ['title', 'author', 'description']
      };
      const columns = tableSearchColumns[table] || ['french'];
      const orFilter = columns.map(col => `${col}.ilike.*${searchTerm}*`).join(',');
      url += `&or=(${orFilter})`;
    }

    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status}`);
    }

    const data = await response.json();

    // Get total count for pagination
    let countUrl = `${SUPABASE_URL}/rest/v1/${table}?select=count`;
    if (villageId) {
      countUrl += `&village_id=eq.${villageId}`;
    }
    // Only apply search filter for premium users
    if (search && search.trim() && isPremium === 'true') {
      const searchTerm = encodeURIComponent(search.trim());
      const tableSearchColumns = {
        lexique: ['french', 'local'],
        proverbes: ['french', 'translation'],
        histoires: ['title', 'content'],
        mets: ['name', 'description'],
        phrases: ['content', 'french'],
        alphabet: ['letter', 'name'],
        medicine_traditionnel: ['title', 'category', 'ingredients'],
        cultures_books: ['title', 'author', 'description']
      };
      const columns = tableSearchColumns[table] || ['french'];
      const orFilter = columns.map(col => `${col}.ilike.*${searchTerm}*`).join(',');
      countUrl += `&or=(${orFilter})`;
    }

    const countResponse = await fetch(countUrl, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'count=exact'
      }
    });

    const total = countResponse.headers.get('content-range') 
      ? parseInt(countResponse.headers.get('content-range').split('/')[1]) 
      : data.length;

    const result = {
      items: data,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum
    };

    // Cache for 10 minutes
    await setCache(cacheKey, result, CONTENT_CACHE_TTL);
    
    res.set('X-Cache', 'MISS').json(result);
  } catch (err) {
    console.error('[ContentAPI] Content error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/content/invalidate
 * Invalidate cache (called when content is updated)
 */
router.post('/invalidate', async (req, res) => {
  try {
    const { table, villageId } = req.body;
    
    if (table) {
      await deleteCachePattern(`content:${table}*`);
    } else {
      await deleteCachePattern('content:*');
    }
    
    if (villageId) {
      await deleteCachePattern(`*:${villageId}:*`);
    }

    console.log('[ContentAPI] Cache invalidated');
    res.json({ success: true });
  } catch (err) {
    console.error('[ContentAPI] Invalidate error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
