/**
 * Redis Cache Module for Le Continent
 * Provides distributed caching across multiple server instances
 * Optimized for faster site loading
 */

// Load environment variables first
require('dotenv').config();

const Redis = require('ioredis');
const zlib = require('zlib');
const { promisify } = require('util');
const gzipAsync = promisify(zlib.gzip);
const gunzipAsync = promisify(zlib.gunzip);

// Redis configuration
const REDIS_URL = process.env.REDIS_URL || process.env.REDISCLOUD_URL || null;
const CACHE_TTL = parseInt(process.env.CACHE_TTL) || 300; // 5 minutes default
const COMPRESSION_THRESHOLD = 999999999; // Disabled compression for better performance

// Auth-specific cache settings
const AUTH_CACHE_TTL = parseInt(process.env.AUTH_CACHE_TTL) || 3600; // 1 hour for auth data (default changed for better performance)
const SESSION_CACHE_TTL = parseInt(process.env.SESSION_CACHE_TTL) || 3600; // 1 hour for session data

// Content cache settings - longer TTL for static content
const CONTENT_CACHE_TTL = parseInt(process.env.CONTENT_CACHE_TTL) || 600; // 10 minutes for content
const VILLAGE_CACHE_TTL = parseInt(process.env.VILLAGE_CACHE_TTL) || 900; // 15 minutes for village data

let redis = null;
let useRedis = false;

// Fallback in-memory cache (when Redis is not available)
const memoryCache = new Map();

// Cache statistics
let cacheStats = {
  hits: 0,
  misses: 0,
  sets: 0
};

function getCacheKey(...parts) {
  return parts.filter(p => p).join(':');
}

// Initialize Redis connection with optimizations
async function initRedis() {
  if (REDIS_URL) {
    try {
      redis = new Redis(REDIS_URL, {
        // Connection optimizations
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        lazyConnect: true,
        connectTimeout: 5000,
        commandTimeout: 3000,
        
        // Performance optimizations
        enableReadyCheck: true,
        enableOfflineQueue: true,
        
        // Keep connection alive
        keepAlive: true,
        family: 4,
        
        // Pipeline optimizations
        pipeline: true,
      });

      // Performance: Use-hiaddr for better performance on some networks
      // redis.options('family', 4);
      
      // Connection event handlers
      redis.on('connect', () => {
        console.log('[Cache] Connected to Redis');
        useRedis = true;
      });

      redis.on('ready', () => {
        console.log('[Cache] Redis ready for operations');
        useRedis = true;
      });

      redis.on('error', (err) => {
        console.log('[Cache] Redis error, falling back to memory:', err.message);
        useRedis = false;
      });

      redis.on('close', () => {
        console.log('[Cache] Redis connection closed');
        useRedis = false;
      });

      await redis.connect();
      
      // Test connection
      await redis.ping();
      console.log('[Cache] Redis connection verified');
      
      return true;
    } catch (err) {
      console.log('[Cache] Failed to connect to Redis, using memory cache:', err.message);
      return false;
    }
  } else {
    console.log('[Cache] No REDIS_URL provided, using in-memory cache');
    return false;
  }
}

// Compress data before caching
function compressData(data) {
  return new Promise(async (resolve, reject) => {
    try {
      const jsonString = JSON.stringify(data);
      if (jsonString.length > COMPRESSION_THRESHOLD) {
        const compressed = await gzipAsync(Buffer.from(jsonString));
        resolve(compressed.toString('base64'));
      } else {
        resolve(jsonString);
      }
    } catch (err) {
      reject(err);
    }
  });
}

// Decompress data after retrieval
function decompressData(data) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!data) {
        resolve(null);
        return;
      }

      // Check if data looks like base64 encoded compressed data
      // Compressed data typically starts with specific gzip header bytes
      if (typeof data === 'string') {
        // Try to detect if it's base64 compressed data
        // Gzip compressed data in base64 often starts with 'H4sI' when encoded
        if (data.startsWith('H4sI') || (data.length > 20 && /^[A-Za-z0-9+/=]+$/.test(data))) {
          try {
            const buffer = Buffer.from(data, 'base64');
            // Check for gzip magic number (0x1f 0x8b)
            if (buffer[0] === 0x1f && buffer[1] === 0x8b) {
              const decompressed = await gunzipAsync(buffer);
              resolve(JSON.parse(decompressed.toString()));
              return;
            }
          } catch (e) {
            // Not valid compressed data, continue to try as JSON
          }
        }

        // Try to parse as JSON directly
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          // Not JSON either - return as string
          resolve(data);
        }
      } else {
        resolve(data);
      }
    } catch (e) {
      // On any error, return original data if possible
      resolve(data);
    }
  });
}

async function setCache(key, value, ttl = CACHE_TTL) {
  cacheStats.sets++;
  try {
    if (useRedis && redis) {
      const serialized = await compressData(value);
      await redis.setex(key, ttl, serialized);
    } else {
      // Fallback to memory cache
      memoryCache.set(key, {
        value,
        expires: Date.now() + (ttl * 1000)
      });
    }
  } catch (err) {
    console.error('[Cache] Set error:', err.message);
    // Fallback to memory
    memoryCache.set(key, {
      value,
      expires: Date.now() + (ttl * 1000)
    });
  }
}

async function getCache(key) {
  try {
    if (useRedis && redis) {
      const data = await redis.get(key);
      if (data) {
        cacheStats.hits++;
        return await decompressData(data);
      }
      cacheStats.misses++;
      return null;
    } else {
      // Fallback to memory cache
      const cached = memoryCache.get(key);
      if (!cached) {
        cacheStats.misses++;
        return null;
      }
      if (cached.expires < Date.now()) {
        memoryCache.delete(key);
        cacheStats.misses++;
        return null;
      }
      cacheStats.hits++;
      return cached.value;
    }
  } catch (err) {
    console.error('[Cache] Get error:', err.message);
    cacheStats.misses++;
    return null;
  }
}

async function deleteCache(key) {
  try {
    if (useRedis && redis) {
      await redis.del(key);
    } else {
      memoryCache.delete(key);
    }
  } catch (err) {
    console.error('[Cache] Delete error:', err.message);
  }
}

async function deleteCachePattern(pattern) {
  try {
    if (useRedis && redis) {
      // Use SCAN instead of KEYS for better performance
      const stream = redis.scanStream({
        match: pattern,
        count: 100
      });
      
      const keysToDelete = [];
      for await (const keys of stream) {
        keysToDelete.push(...keys);
      }
      
      if (keysToDelete.length > 0) {
        await redis.del(...keysToDelete);
      }
    } else {
      // For memory cache
      const patternStr = pattern.replace('*', '');
      for (const key of memoryCache.keys()) {
        if (key.includes(patternStr)) {
          memoryCache.delete(key);
        }
      }
    }
  } catch (err) {
    console.error('[Cache] Delete pattern error:', err.message);
  }
}

// Get cache statistics
function getCacheStats() {
  const total = cacheStats.hits + cacheStats.misses;
  const hitRate = total > 0 ? ((cacheStats.hits / total) * 100).toFixed(2) : 0;
  return {
    ...cacheStats,
    hitRate: `${hitRate}%`,
    memoryCacheSize: memoryCache.size
  };
}

// Reset cache statistics
function resetCacheStats() {
  cacheStats = { hits: 0, misses: 0, sets: 0 };
}

// Pre-warm cache with frequently accessed data
async function warmCache(key, fetchFn, ttl = CONTENT_CACHE_TTL) {
  try {
    const cached = await getCache(key);
    if (cached) return cached;
    
    const data = await fetchFn();
    if (data) {
      await setCache(key, data, ttl);
    }
    return data;
  } catch (err) {
    console.error('[Cache] Warm cache error:', err.message);
    return null;
  }
}

async function closeRedis() {
  if (redis) {
    await redis.quit();
  }
}

module.exports = {
  initRedis,
  setCache,
  getCache,
  deleteCache,
  deleteCachePattern,
  closeRedis,
  getCacheKey,
  getCacheStats,
  resetCacheStats,
  warmCache,
  CACHE_TTL,
  AUTH_CACHE_TTL,
  SESSION_CACHE_TTL,
  CONTENT_CACHE_TTL,
  VILLAGE_CACHE_TTL
};
