/**
 * API Client - Centralized API communication layer
 * Handles all backend API calls with error handling and logging
 */

interface ApiResponse<T = unknown> {
  success?: boolean;
  data?: T;
  error?: string;
  [key: string]: unknown;
}

interface RequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
}

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000' : 'https://api.lecontinent.cm');
const DEFAULT_TIMEOUT = 10000; // 10 seconds
const DEFAULT_RETRIES = 1;

/**
 * Fetch with timeout support
 */
async function fetchWithTimeout(
  url: string,
  options: RequestOptions = {}
): Promise<Response> {
  const timeout = options.timeout || DEFAULT_TIMEOUT;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Generic API request handler with retry logic
 */
async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE}${endpoint}`;
  const retries = options.retries ?? DEFAULT_RETRIES;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`[APIClient] ${options.method || 'GET'} ${endpoint}`);

      const response = await fetchWithTimeout(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const text = await response.text();
        try {
          const json = JSON.parse(text);
          console.error(`[APIClient] Error ${response.status}:`, json);
          return {
            error: json.error || `HTTP ${response.status}`,
          };
        } catch {
          console.error(`[APIClient] Error ${response.status}:`, text);
          return {
            error: `HTTP ${response.status}: ${text}`,
          };
        }
      }

      const data = await response.json();
      console.log(`[APIClient] ✅ Success:`, endpoint);
      return data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(
        `[APIClient] Attempt ${attempt + 1}/${retries + 1} failed:`,
        lastError.message
      );

      if (attempt < retries) {
        // Exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }

  const errorMsg = lastError?.message || 'Unknown error';
  console.error(`[APIClient] ❌ All retries failed:`, errorMsg);
  return {
    error: errorMsg,
  };
}

// ========== REFERRAL ENDPOINTS ==========

export const referralApi = {
  /**
   * Validate a referral code
   */
  validate: async (code: string) => {
    return apiRequest(`/api/referrals/validate/${encodeURIComponent(code)}`);
  },

  /**
   * Create a new referral record
   */
  create: async (payload: {
    referrerId: string;
    referredId: string;
    referredName?: string;
    referredPhone?: string;
  }) => {
    return apiRequest('/api/referrals/create', {
      method: 'POST',
      body: JSON.stringify(payload),
      retries: 2,
    });
  },

  /**
   * Get referrals for a user
   */
  list: async (userId: string) => {
    return apiRequest(`/api/referrals/list/${userId}`);
  },

  /**
   * Get referral statistics
   */
  stats: async (userId: string) => {
    return apiRequest(`/api/referrals/stats/${userId}`);
  },

  /**
   * Request withdrawal of referral earnings (min 2000 FCFA)
   */
  withdraw: async (payload: {
    userId: string;
    phone: string;
    method: 'mtn' | 'orange';
  }) => {
    return apiRequest('/api/referrals/withdraw', {
      method: 'POST',
      body: JSON.stringify(payload),
      retries: 1,
    });
  },
};

// ========== CONTENT ENDPOINTS ==========

export const contentApi = {
  /**
   * Get content with caching
   */
  get: async (table: string, options: Record<string, unknown> = {}) => {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });

    const query = params.toString();
    const endpoint = `/api/content/${table}${query ? `?${query}` : ''}`;
    return apiRequest(endpoint);
  },

  /**
   * Get content count
   */
  count: async (table: string, villageId?: string) => {
    let endpoint = `/api/content/${table}/count`;
    if (villageId) {
      endpoint += `?villageId=${villageId}`;
    }
    return apiRequest(endpoint);
  },

  /**
   * Search content
   */
  search: async (payload: {
    tables?: string[];
    query: string;
    villageId?: string;
  }) => {
    return apiRequest('/api/content/search', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Clear content cache (admin)
   */
  clearCache: async () => {
    return apiRequest('/api/content/cache/clear');
  },

  /**
   * Get cache statistics (admin)
   */
  cacheStats: async () => {
    return apiRequest('/api/content/cache/stats');
  },
};

// ========== PROFILE ENDPOINTS ==========

export const profileApi = {
  /**
   * Get user profile
   */
  get: async (userId: string) => {
    return apiRequest(`/api/profiles/${userId}`);
  },

  /**
   * Update user profile
   */
  update: async (userId: string, updates: Record<string, unknown>) => {
    return apiRequest(`/api/profiles/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
      retries: 2,
    });
  },
};

// ========== PAYMENT ENDPOINTS ==========

export const paymentApi = {
  /**
   * Initiate payment
   */
  initiate: async (payload: {
    phone: string;
    amount: number;
    method: string;
    userId?: string;
    userEmail?: string;
    userName?: string;
  }) => {
    return apiRequest('/api/payment/initiate', {
      method: 'POST',
      body: JSON.stringify(payload),
      retries: 2,
    });
  },

  /**
   * Confirm payment
   */
  confirm: async (payload: { paymentId?: string; ptn?: string }) => {
    return apiRequest('/api/payment/confirm', {
      method: 'POST',
      body: JSON.stringify(payload),
      retries: 1,
    });
  },

  /**
   * Get payment status
   */
  status: async (paymentId: string) => {
    return apiRequest(`/api/payment/status/${paymentId}`);
  },
};

// ========== HEALTH CHECK ==========

export const healthApi = {
  check: async () => {
    return apiRequest('/api/health');
  },
};

export default {
  referralApi,
  contentApi,
  profileApi,
  paymentApi,
  healthApi,
};
