// Load environment variables
require('dotenv').config();

// Production Server for Le Continent
// This serves both the frontend static files and the backend API

// Immediate logging to see if server starts
console.log('[Server] Starting Le Continent server...');
console.log('[Server] Node version:', process.version);
console.log('[Server] Current directory:', process.cwd());

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const compression = require('compression');

// Add rate limiting
const rateLimit = require('express-rate-limit');

// Import Redis cache module
const { initRedis, closeRedis, setCache, getCache, deleteCache, getCacheKey, AUTH_CACHE_TTL, CACHE_TTL, CONTENT_CACHE_TTL, getCacheStats, resetCacheStats, warmCache } = require('./cache');

// Import Maviance payment services
const { 
    makePayment, 
    getPaymentInfo, 
    getPaymentItemId, 
    getErrorMessage 
} = require('./maviance');

// Import route handlers
console.log('[Server] Loading routes...');
const referralsRouter = require('./routes/referrals');
const contentRouter = require('./routes/content');
const profilesRouter = require('./routes/profiles');
const adminRouter = require('./routes/admin');
console.log('[Server] Routes loaded successfully');

// Configuration from environment variables
// Hostinger might use different env vars, try multiple options
const PORT = process.env.PORT || process.env.NODE_PORT || process.env.APP_PORT || 3000;
const HOST = process.env.HOST || process.env.NODE_HOST || '0.0.0.0';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dltkfjkodqpzmpuctnju.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsdGtmamtvZHFwem1wdWN0bmp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE2ODMyMSwiZXhwIjoyMDc5NzQ0MzIxfQ.Vz6yapqHN7NlI83izQiFGIf2L_8vegNMpl99r_yQxDw';

// Dynamic callback URLs based on the deployment domain
const getBaseUrl = () => {
    if (process.env.APP_URL) {
        return process.env.APP_URL.replace(/\/$/, '');
    }
    return 'https://api.lecontinent.cm';
};

const CALLBACK_URL = process.env.CALLBACK_URL || `${getBaseUrl()}/api/payment/webhook`;
const SUCCESS_URL = process.env.SUCCESS_URL || `${getBaseUrl()}/payment/success.html`;
const CANCEL_URL = process.env.CANCEL_URL || `${getBaseUrl()}/payment/cancel.html`;

const app = express();

// CORS - use the cors npm package for proper CORS handling
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://lecontinent.cm',
      'https://www.lecontinent.cm',
      'https://api.lecontinent.cm'
    ];
    
    // Allow if origin is in allowed list or if there's no origin
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS request from origin:', origin);
      callback(null, true);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key', 'Accept', 'Origin', 'Cache-Control'],
  credentials: true,
  optionsSuccessStatus: 204,
  maxAge: 86400
};

app.use(cors(corsOptions));

// Add compression for better performance
app.use(compression());

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: { error: 'Trop de requêtes. Veuillez réessayer plus tard.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to API routes
app.use('/api/', limiter);

// Stricter rate limit for payment endpoints
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // Only 50 payment attempts per 15 minutes
  message: { error: 'Trop de tentatives de paiement. Veuillez réessayer plus tard.' },
});
app.use('/api/payment/', paymentLimiter);

app.use(express.json());

// Payment storage (in-memory for demo; use Redis/database in production)
const payments = new Map();

// API Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth endpoints with Redis caching

// Login - cache user profile after successful authentication
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Authenticate with Supabase
        const { data: authData, error: authError } = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY
            },
            body: JSON.stringify({ email, password })
        });

        if (authError || !authData || !authData.access_token) {
            return res.status(401).json({ error: authError?.message || 'Invalid credentials' });
        }

        const userId = authData.user?.id;
        const session = authData;

        // Fetch user profile and cache it
        if (userId) {
            const profileResponse = await fetch(
                `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
                {
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`
                    }
                }
            );

            const profiles = await profileResponse.json();
            const profile = profiles[0] || null;

            // Cache the profile in Redis
            if (profile) {
                await setCache(getCacheKey('profile', userId), profile, AUTH_CACHE_TTL);
                console.log(`[Auth] Cached profile for user ${userId}`);
            }

            // Cache session info
            await setCache(getCacheKey('session', userId), {
                expires_at: session.expires_at,
                expires_in: session.expires_in
            }, AUTH_CACHE_TTL);
            console.log(`[Auth] Cached session for user ${userId}`);

            res.json({
                success: true,
                user: authData.user,
                session: authData,
                profile
            });
        } else {
            res.json({
                success: true,
                user: authData.user,
                session: authData,
                profile: null
            });
        }
    } catch (error) {
        console.error('[Auth] Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Signup - cache user profile after registration
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { email, password, options } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Register with Supabase
        const signupResponse = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY
            },
            body: JSON.stringify({
                email,
                password,
                options: options || {}
            })
        });

        const authData = await signupResponse.json();

        if (authData.error) {
            return res.status(400).json({ error: authData.error.message });
        }

        // If email confirmation is not required, fetch and cache profile
        if (authData.user && !authData.confirmation_sent_at) {
            const userId = authData.user.id;

            // Give Supabase a moment to create the profile
            setTimeout(async () => {
                try {
                    const profileResponse = await fetch(
                        `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
                        {
                            headers: {
                                'apikey': SUPABASE_KEY,
                                'Authorization': `Bearer ${SUPABASE_KEY}`
                            }
                        }
                    );
                    const profiles = await profileResponse.json();
                    const profile = profiles[0];
                    if (profile) {
                        await setCache(getCacheKey('profile', userId), profile, AUTH_CACHE_TTL);
                        console.log(`[Auth] Cached profile for new user ${userId}`);
                    }
                } catch (err) {
                    console.error('[Auth] Error caching new user profile:', err);
                }
            }, 1000);
        }

        res.json({
            success: true,
            user: authData.user,
            session: authData.session,
            message: authData.confirmation_sent_at ? 'Confirmation email sent' : 'Account created successfully'
        });
    } catch (error) {
        console.error('[Auth] Signup error:', error);
        res.status(500).json({ error: 'Signup failed' });
    }
});

// Logout - invalidate cached session and profile
app.post('/api/auth/logout', async (req, res) => {
    try {
        const { userId, accessToken } = req.body;

        // Invalidate cache
        if (userId) {
            await deleteCache(getCacheKey('profile', userId));
            await deleteCache(getCacheKey('session', userId));
            console.log(`[Auth] Cleared cache for user ${userId}`);
        }

        // Also invalidate content cache for this user (premium content)
        await deleteCachePattern('content:*');
        console.log('[Auth] Cleared content cache');

        // If access token provided, also sign out from Supabase
        if (accessToken) {
            await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${accessToken}`
                }
            });
        }

        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.error('[Auth] Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
});

// Get cached profile (for quick session validation)
app.get('/api/auth/profile/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const cacheKey = getCacheKey('profile', userId);

        // Try cache first
        const cachedProfile = await getCache(cacheKey);
        if (cachedProfile) {
            console.log(`[Auth] Cache hit for profile ${userId}`);
            return res.json({
                success: true,
                profile: cachedProfile,
                fromCache: true
            });
        }

        // Cache miss - fetch from database
        console.log(`[Auth] Cache miss for profile ${userId}`);
        const profileResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
            {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            }
        );

        const profiles = await profileResponse.json();
        const profile = profiles[0];

        if (profile) {
            // Update cache
            await setCache(cacheKey, profile, AUTH_CACHE_TTL);
        }

        res.json({
            success: true,
            profile: profile || null,
            fromCache: false
        });
    } catch (error) {
        console.error('[Auth] Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

// Refresh session - update cached session data
app.post('/api/auth/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token is required' });
        }

        // Refresh session with Supabase
        const { data: sessionData, error: refreshError } = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY
            },
            body: JSON.stringify({ refresh_token: refreshToken })
        });

        if (refreshError || !sessionData || !sessionData.access_token) {
            return res.status(401).json({ error: refreshError?.message || 'Invalid refresh token' });
        }

        const userId = sessionData.user?.id;

        // Update session cache
        if (userId) {
            await setCache(getCacheKey('session', userId), {
                expires_at: sessionData.expires_at,
                expires_in: sessionData.expires_in
            }, AUTH_CACHE_TTL);
            console.log(`[Auth] Refreshed session cache for user ${userId}`);
        }

        res.json({
            success: true,
            session: sessionData,
            user: sessionData.user
        });
    } catch (error) {
        console.error('[Auth] Refresh error:', error);
        res.status(500).json({ error: 'Session refresh failed' });
    }
});

// ===========================================
// Password Reset Routes (Phone-based via SMS)
// ===========================================

// Generate a random 6-digit code
function generateResetCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Format phone number to standard format
function formatPhoneNumber(phone) {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    // Add country code if not present
    if (digits.startsWith('237')) {
        return digits;
    }
    if (digits.startsWith('6') && digits.length === 9) {
        return '237' + digits;
    }
    if (digits.length === 9) {
        return '237' + digits;
    }
    return digits;
}

// POST /api/auth/forgot-password - Request password reset via SMS
app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        const { phone } = req.body;
        
        if (!phone) {
            return res.status(400).json({ error: 'Numéro de téléphone requis' });
        }

        const formattedPhone = formatPhoneNumber(phone);

        // Find user by phone using direct REST API
        const profileResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/profiles?phone=eq.${formattedPhone}&select=id,phone,first_name`,
            {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            }
        );
        const profiles = await profileResponse.json();
        const profile = profiles[0];

        if (!profile) {
            // Don't reveal if user exists or not
            return res.json({ message: 'Si un compte existe, un code sera envoyé par SMS' });
        }

        // Generate reset code
        const resetCode = generateResetCode();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // Save reset code to profile using direct REST API
        const updateResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/profiles?id=eq.${profile.id}`,
            {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    reset_code: resetCode,
                    reset_code_expires: expiresAt.toISOString()
                })
            }
        );

        if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            console.error('Error saving reset code:', errorText);
            return res.status(500).json({ error: 'Erreur lors de la génération du code' });
        }

        // TODO: Send SMS with reset code using Maviance or SMS service
        // For now, we'll return the code in development mode
        const isDevelopment = process.env.NODE_ENV !== 'production';
        
        console.log(`[Password Reset] Code for ${formattedPhone}: ${resetCode}`);
        
        res.json({ 
            message: 'Code de réinitialisation envoyé par SMS',
            // Remove this in production - for testing only
            devCode: isDevelopment ? resetCode : undefined,
            phone: formattedPhone.slice(-4).padStart(formattedPhone.length, '*')
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// POST /api/auth/verify-reset-code - Verify the reset code
app.post('/api/auth/verify-reset-code', async (req, res) => {
    try {
        const { phone, code } = req.body;
        
        if (!phone || !code) {
            return res.status(400).json({ error: 'Téléphone et code requis' });
        }

        const formattedPhone = formatPhoneNumber(phone);

        // Find user by phone and code using direct REST API
        const profileResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/profiles?phone=eq.${formattedPhone}&select=id,phone,reset_code,reset_code_expires`,
            {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            }
        );
        const profiles = await profileResponse.json();
        const profile = profiles[0];

        if (!profile) {
            return res.status(400).json({ error: 'Code invalide' });
        }

        // Check if code matches
        if (profile.reset_code !== code) {
            return res.status(400).json({ error: 'Code invalide' });
        }

        // Check if code has expired
        const expiresAt = new Date(profile.reset_code_expires);
        if (expiresAt < new Date()) {
            return res.status(400).json({ error: 'Code expiré' });
        }

        // Code is valid - return user ID for password update
        res.json({ 
            valid: true,
            userId: profile.id
        });

    } catch (error) {
        console.error('Verify reset code error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// POST /api/auth/reset-password - Reset password with new password
app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { userId, code, newPassword } = req.body;
        
        if (!userId || !code || !newPassword) {
            return res.status(400).json({ error: 'Tous les champs requis' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
        }

        // Find user and verify code using direct REST API
        const profileResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=id,reset_code,reset_code_expires`,
            {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            }
        );
        const profiles = await profileResponse.json();
        const profile = profiles[0];

        if (!profile) {
            return res.status(400).json({ error: 'Code invalide' });
        }

        // Check if code matches
        if (profile.reset_code !== code) {
            return res.status(400).json({ error: 'Code invalide' });
        }

        // Check if code has expired
        const expiresAt = new Date(profile.reset_code_expires);
        if (expiresAt < new Date()) {
            return res.status(400).json({ error: 'Code expiré' });
        }

        // Update password in Supabase Auth using Admin API
        const authResponse = await fetch(
            `${SUPABASE_URL}/auth/v1/admin/users/${userId}`,
            {
                method: 'PUT',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    password: newPassword
                })
            }
        );

        if (!authResponse.ok) {
            const errorText = await authResponse.text();
            console.error('Auth update error:', errorText);
            return res.status(500).json({ error: 'Erreur lors de la mise à jour du mot de passe' });
        }

        // Clear reset code using direct REST API
        await fetch(
            `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
            {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    reset_code: null,
                    reset_code_expires: null
                })
            }
        );

        res.json({ message: 'Mot de passe mis à jour avec succès' });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Validate promo code (with Redis caching)
app.get('/api/promo/validate/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const cacheKey = getCacheKey('promo', code.toUpperCase());

        if (!code) {
            return res.status(400).json({ error: 'Promo code is required' });
        }

        // Try cache first
        const cachedPromo = await getCache(cacheKey);
        if (cachedPromo) {
            console.log(`[Promo] Cache hit for code ${code}`);
            return res.json({
                success: true,
                valid: true,
                promo: cachedPromo,
                fromCache: true
            });
        }

        // Cache miss - fetch from database
        console.log(`[Promo] Cache miss for code ${code}`);
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/promo_codes?code=eq.${encodeURIComponent(code.toUpperCase())}&is_active=eq.true`,
            {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            }
        );

        const promos = await response.json();
        const promo = promos[0];

        if (promo) {
            // Cache the promo code (longer TTL since promos don't change often)
            await setCache(cacheKey, promo, CACHE_TTL * 2); // 10 minutes
            console.log(`[Promo] Cached promo code ${code}`);
            
            return res.json({
                success: true,
                valid: true,
                promo,
                fromCache: false
            });
        }

        res.json({
            success: true,
            valid: false,
            promo: null,
            fromCache: false
        });
    } catch (error) {
        console.error('[Promo] Validate error:', error);
        res.status(500).json({ error: 'Failed to validate promo code' });
    }
});

// Try multiple possible paths for frontend dist folder
// The backend could be at different levels depending on deployment
const possiblePaths = [
  path.join(__dirname, '..', '..', 'dist'),    // If backend is in /project/backend
  path.join(__dirname, '..', 'dist'),            // If backend is in /project
  path.join(__dirname, 'dist'),                  // If backend is in /project/dist
  path.resolve('./dist'),                         // Current working directory
];

// Find the first valid path
let staticPath = '';
for (const p of possiblePaths) {
  try {
    require('fs').accessSync(p);
    staticPath = p;
    console.log('[Server] Found dist folder at:', p);
    break;
  } catch (e) {
    // Path doesn't exist, try next one
  }
}

if (staticPath) {
  app.use(express.static(staticPath));
  console.log('[Server] Serving static files from:', staticPath);
} else {
  console.log('[Server] Warning: No dist folder found. Frontend static files will not be served.');
}

// Serve payment HTML files
app.use('/payment', express.static(path.join(__dirname, '..', 'public', 'payment')));

// Mount route handlers
app.use('/api/referrals', referralsRouter);
app.use('/api/content', contentRouter);
app.use('/api/profiles', profilesRouter);
app.use('/api/admin', adminRouter);

// API Routes for payments

// Initiate payment with Maviance
app.post('/api/payment/initiate', async (req, res) => {
    try {
        const { phone, amount, method, userId, userEmail, userName } = req.body;

        if (!phone || !amount || !method) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const paymentId = crypto.randomUUID();
        const reference = `LC${Date.now()}`;

        const payment = {
            id: paymentId,
            reference,
            phone,
            amount,
            method,
            userId,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        payments.set(paymentId, payment);

        console.log(`Initiating Maviance payment: ${method} - ${amount} XAF to ${phone}`);

        // Validate phone number for the payment method
        const payItemId = getPaymentItemId(phone);
        if (!payItemId) {
            payment.status = 'failed';
            payment.error = 'Invalid phone number for selected operator. Please check the number format.';
            payments.set(paymentId, payment);
            return res.status(400).json({ error: 'Invalid phone number for selected operator. Please check the number format. MTN: starts with 65X/67X/68X, Orange: starts with 655/656/657/658/659/69X' });
        }

        // Format phone number with country code for Maviance
        let formattedPhone = phone.replace(/[^0-9]/g, '');
        if (!formattedPhone.startsWith('237')) {
            formattedPhone = '237' + formattedPhone;
        }

        console.log(`Using PayItem ID: ${payItemId}`);
        console.log(`Formatted phone: ${formattedPhone}`);

        // Make payment via Maviance with formatted phone number
        const ptn = await makePayment({
            amount: amount,
            serviceNumber: formattedPhone,
            customerEmailaddress: userEmail || 'client@lecontinent.cm',
            customerName: userName || 'Client Le Continent',
            customerAddress: 'Cameroon'
        });

        console.log(`Maviance PTN: ${ptn}`);

        payment.ptn = ptn;
        payment.status = 'pending';
        payments.set(paymentId, payment);

        res.json({
            success: true,
            paymentId,
            reference,
            ptn: ptn,
            status: 'pending',
            message: 'Payment initiated. Please confirm the payment on your phone.'
        });

    } catch (error) {
        console.error('Payment initiation error:', error);
        
        let errorMessage = 'Payment initiation failed';
        const errorStr = error.message || '';
        
        if (errorStr.includes('703108') || errorStr.includes('insufficient')) {
            errorMessage = 'Solde insuffisant. Veuillez recharger votre compte et réessayer.';
        } else if (errorStr.includes('703202') || errorStr.includes('rejected') || errorStr.includes('rejecté')) {
            errorMessage = 'Paiement refusé. Veuillez vérifier votre compte et réessayer.';
        } else if (errorStr.includes('703201')) {
            errorMessage = 'Paiement non confirmé. Veuillez réessayer.';
        } else if (errorStr.includes('700')) {
            errorMessage = 'Erreur de service. Veuillez réessayer plus tard.';
        }
        
        const { phone, amount } = req.body;
        if (phone && amount) {
            for (const [paymentId, payment] of payments.entries()) {
                if (payment.phone === phone && payment.amount === amount && payment.status === 'pending') {
                    payment.status = 'failed';
                    payment.error = errorMessage;
                    payments.set(paymentId, payment);
                    break;
                }
            }
        }
        
        res.status(500).json({ error: errorMessage });
    }
});

// Confirm payment (check status)
app.post('/api/payment/confirm', async (req, res) => {
    try {
        const { paymentId, ptn } = req.body;

        console.log('Confirm payment request:', { paymentId, ptn });

        let payment = null;
        
        if (paymentId) {
            payment = payments.get(paymentId);
            console.log('Found payment by paymentId:', paymentId, payment ? 'FOUND' : 'NOT FOUND');
        } else if (ptn) {
            for (const [id, p] of payments.entries()) {
                if (p.ptn === ptn) {
                    payment = p;
                    console.log('Found payment by ptn:', ptn);
                    break;
                }
            }
        }

        if (!payment) {
            // Payment not found in memory - check database for existing payment
            console.log('Payment not found in memory, checking database...');
            try {
                const lookupField = paymentId ? `id=eq.${paymentId}` : `payment_reference=eq.${ptn}`;
                const dbResponse = await fetch(
                    `${SUPABASE_URL}/rest/v1/payments?${lookupField}&order=created_at.desc&limit=1`,
                    {
                        headers: {
                            'apikey': SUPABASE_KEY,
                            'Authorization': `Bearer ${SUPABASE_KEY}`
                        }
                    }
                );
                
                const dbPayments = await dbResponse.json();
                if (dbPayments && dbPayments.length > 0) {
                    const dbPayment = dbPayments[0];
                    console.log('Found payment in database:', dbPayment.id);
                    
                    // If payment is already completed in database, return success
                    if (dbPayment.status === 'completed') {
                        // Also update user premium status if not already done
                        if (dbPayment.user_id) {
                            await updateUserPremiumStatus(dbPayment.user_id, true);
                        }
                        return res.json({
                            success: true,
                            status: 'completed',
                            message: 'Payment already confirmed',
                            fromDatabase: true
                        });
                    }
                    
                    // Payment exists but not completed - return pending status
                    return res.json({
                        success: true,
                        status: dbPayment.status || 'pending',
                        message: 'Payment record found but not yet completed',
                        fromDatabase: true
                    });
                }
            } catch (dbError) {
                console.error('Error checking database for payment:', dbError);
            }
            
            return res.status(404).json({ 
                error: 'Payment not found. If you already paid, please contact support.',
                code: 'PAYMENT_NOT_FOUND',
                suggestion: 'Please try logging out and back in to refresh your account status.'
            });
        }

        if (payment.ptn) {
            try {
                const paymentInfo = await getPaymentInfo(payment.ptn);
                console.log('Maviance payment info:', JSON.stringify(paymentInfo));

                const responseData = Array.isArray(paymentInfo.responseData) 
                    ? paymentInfo.responseData[0] 
                    : paymentInfo.responseData;

                // Check multiple possible status fields
                const status = responseData?.status || responseData?.statuses || responseData?.statusText;
                const statusText = responseData?.status_text || responseData?.statusMessage || responseData?.message;
                const errorCode = responseData?.errorCode || responseData?.error_code;
                
                console.log(`Payment status check: status='${status}', statusText='${statusText}', errorCode='${errorCode}'`);

                // Expanded success status checks
                const isSuccess = status === 'SUCCESS' || 
                                 status === 'success' || 
                                 status === 'completed' || 
                                 status === 'COMPLETED' ||
                                 status === 'Approved' ||
                                 status === 'approved' ||
                                 status === 'ACCEPTED' ||
                                 status === 'accepted';

                // Expanded failure status checks
                const isFailed = status === 'FAILED' || 
                               status === 'failed' || 
                               status === 'ERRORED' || 
                               status === 'ERROR' ||
                               status === 'error' ||
                               status === 'REJECTED' ||
                               status === 'rejected' ||
                               status === 'CANCELLED' ||
                               status === 'cancelled' ||
                               status === 'EXPIRED' ||
                               status === 'expired' ||
                               !!errorCode;

                if (isSuccess) {
                    payment.status = 'completed';
                    payment.completedAt = new Date().toISOString();
                    payment.apiResponse = paymentInfo.responseData;
                    payments.set(payment.id, payment);

                    console.log(`Payment completed! UserId: ${payment.userId}`);

                    if (payment.userId) {
                        const updateResult = await updateUserPremiumStatus(payment.userId, true);
                        console.log('Premium update result:', updateResult);
                        
                        // Save payment to database
                        const saveResult = await savePaymentToDatabase(payment);
                        console.log('Payment save result:', saveResult);
                    }

                    return res.json({
                        success: true,
                        status: 'completed',
                        payment,
                        message: 'Payment confirmed successfully!'
                    });
                } else if (isFailed) {
                    payment.status = 'failed';
                    // Convert errorCode to number if it's a string
                    const errorCodeNum = typeof errorCode === 'string' ? parseInt(errorCode, 10) : errorCode;
                    payment.error = statusText || getErrorMessage(errorCodeNum) || getErrorMessage(errorCode) || 'Payment failed';
                    payment.errorCode = errorCode;
                    payment.apiResponse = paymentInfo.responseData;
                    payments.set(payment.id, payment);

                    return res.json({
                        success: false,
                        status: 'failed',
                        message: payment.error
                    });
                } else {
                    // Status is pending - check how long we've been waiting
                    const pendingDuration = Date.now() - new Date(payment.createdAt).getTime();
                    const maxPendingMs = 3 * 60 * 1000; // 3 minutes max for pending
                    
                    console.log(`Payment pending for ${Math.round(pendingDuration/1000)}s`);
                    
                    if (pendingDuration > maxPendingMs) {
                        // Too long in pending - mark as failed
                        payment.status = 'failed';
                        payment.error = 'Paiement Orange Money non confirmé. Le popup USSD n\'a peut-être pas été reçu. Veuillez réessayer avec MTN ou contacter le support.';
                        payment.apiResponse = paymentInfo.responseData;
                        payments.set(payment.id, payment);
                        
                        return res.json({
                            success: false,
                            status: 'failed',
                            message: payment.error
                        });
                    }
                    
                    return res.json({
                        success: true,
                        status: payment.status || 'pending',
                        message: 'En attente de confirmation sur votre téléphone. Si le popup n\'arrive pas, le paiement Orange peut avoir un problème.',
                        debug: { mavianceStatus: status, pendingDuration: Math.round(pendingDuration/1000) }
                    });
                }
            } catch (apiError) {
                console.error('Error checking payment status:', apiError);
            }
        }

        res.json({
            success: true,
            status: payment.status,
            message: payment.status === 'pending' ? 'Payment is still pending. Please confirm on your phone.' : null
        });

    } catch (error) {
        console.error('Payment confirmation error:', error);
        res.status(500).json({ error: 'Payment confirmation failed' });
    }
});

// Payment webhook callback
app.post('/api/payment/webhook', async (req, res) => {
    try {
        const callbackData = req.body;
        console.log('Maviance webhook received:', callbackData);

        const { ptn, status, reference } = callbackData;

        let payment = null;
        
        if (ptn) {
            for (const [id, p] of payments.entries()) {
                if (p.ptn === ptn) {
                    payment = p;
                    break;
                }
            }
        }

        if (!payment && reference) {
            payment = payments.get(reference);
        }

        if (!payment) {
            console.log('Payment not found for webhook:', ptn || reference);
            return res.json({ status: 'received' });
        }

        if (status === 'SUCCESS' || status === 'success' || status === 'completed') {
            payment.status = 'completed';
            payment.completedAt = new Date().toISOString();

            if (payment.userId) {
                await updateUserPremiumStatus(payment.userId, true);
                // Save payment to database
                await savePaymentToDatabase(payment);
            }
        } else if (status === 'FAILED' || status === 'failed') {
            payment.status = 'failed';
            payment.error = callbackData.status_text || 'Payment failed';
        }

        payment.webhookData = callbackData;
        payments.set(payment.id, payment);

        console.log('Payment updated from webhook:', payment);
        res.json({ status: 'ok' });

    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

// Get payment status
app.get('/api/payment/status/:paymentId', async (req, res) => {
    const { paymentId } = req.params;
    const payment = payments.get(paymentId);

    if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.status === 'pending' && payment.ptn) {
        try {
            const paymentInfo = await getPaymentInfo(payment.ptn);
            
            const responseData = Array.isArray(paymentInfo.responseData) 
                ? paymentInfo.responseData[0] 
                : paymentInfo.responseData;

            const status = responseData?.status;
            const errorCode = responseData?.errorCode;
            
            if (status === 'SUCCESS' || status === 'success') {
                payment.status = 'completed';
                payment.completedAt = new Date().toISOString();
                
                if (payment.userId) {
                    await updateUserPremiumStatus(payment.userId, true);
                    // Save payment to database
                    await savePaymentToDatabase(payment);
                }
            } else if (status === 'FAILED' || status === 'failed' || status === 'ERRORED' || errorCode) {
                payment.status = 'failed';
                payment.error = getErrorMessage(errorCode) || 'Payment failed';
            }
            
            payments.set(paymentId, payment);
        } catch (error) {
            console.error('Error checking payment status:', error);
        }
    }

    res.json(payment);
});

// Cancel payment endpoint
app.post('/api/payment/cancel', async (req, res) => {
    try {
        const { paymentId } = req.body;
        
        console.log('Cancel payment request:', { paymentId });
        
        if (!paymentId) {
            return res.status(400).json({ error: 'paymentId is required' });
        }
        
        const payment = payments.get(paymentId);
        
        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }
        
        // Mark payment as cancelled
        payment.status = 'cancelled';
        payment.cancelledAt = new Date().toISOString();
        payments.set(paymentId, payment);
        
        console.log('Payment cancelled:', paymentId);
        
        res.json({ success: true, message: 'Payment cancelled' });
    } catch (error) {
        console.error('Error cancelling payment:', error);
        res.status(500).json({ error: 'Failed to cancel payment' });
    }
});

// Debug endpoint: List all payments (for admin troubleshooting)
app.get('/api/debug/payments', (req, res) => {
    const allPayments = Array.from(payments.entries()).map(([id, p]) => ({
        id,
        reference: p.reference,
        phone: p.phone ? p.phone.substring(0, 4) + '****' : null,
        amount: p.amount,
        status: p.status,
        userId: p.userId,
        ptn: p.ptn,
        createdAt: p.createdAt,
        completedAt: p.completedAt
    }));
    res.json({ count: allPayments.length, payments: allPayments });
});

// Debug endpoint: Manually update user premium (for admin use)
app.post('/api/debug/update-premium', async (req, res) => {
    const { userId, isPremium } = req.body;
    
    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }
    
    console.log(`DEBUG: Manual premium update for user ${userId} to ${isPremium}`);
    const result = await updateUserPremiumStatus(userId, isPremium);
    res.json(result);
});

// Serve React app for all other routes (SPA support)
app.get('*', (req, res) => {
    const indexPath = path.join(staticPath, 'index.html');
    // Check if index.html exists before sending
    if (require('fs').existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        // If dist folder doesn't exist, send a helpful message
        res.status(503).json({ 
            error: 'Frontend not built yet',
            message: 'Please run "npm run build" in the root directory to build the frontend',
            staticPath: staticPath
        });
    }
});

// Helper functions

async function updateUserPremiumStatus(userId, isPremium) {
    console.log(`Updating user ${userId} premium status to ${isPremium}`);

    if (!SUPABASE_KEY) {
        console.error('CRITICAL: Supabase key not configured!');
        return { success: false, error: 'Supabase key not configured' };
    }

    if (!userId) {
        console.error('CRITICAL: No userId provided for premium update');
        return { success: false, error: 'No userId provided' };
    }

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                is_premium: isPremium,
                last_payment_date: isPremium ? new Date().toISOString() : null,
                updated_at: new Date().toISOString()
            })
        });

        const responseText = await response.text();
        
        if (response.ok) {
            console.log(`User ${userId} premium status updated successfully`);
            return { success: true };
        } else {
            console.error(`Failed to update user ${userId} premium status:`, response.status, responseText);
            return { success: false, error: `HTTP ${response.status}: ${responseText}` };
        }
    } catch (error) {
        console.error('Error updating user premium status:', error);
        return { success: false, error: error.message };
    }
}

// Save payment to Supabase payments table
async function savePaymentToDatabase(payment) {
    console.log(`Saving payment to database: ${payment.id}`);
    
    if (!SUPABASE_KEY) {
        console.error('CRITICAL: Supabase key not configured!');
        return { success: false, error: 'Supabase key not configured' };
    }

    try {
        const paymentData = {
            user_id: payment.userId,
            amount: payment.amount,
            original_amount: payment.originalAmount || payment.amount,
            payment_method: payment.method,
            phone_number: payment.phone,
            status: payment.status,
            payment_reference: payment.ptn || payment.reference,
            created_at: payment.createdAt || new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        console.log('Payment data to save:', JSON.stringify(paymentData));

        const response = await fetch(`${SUPABASE_URL}/rest/v1/payments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(paymentData)
        });

        const responseText = await response.text();
        
        if (response.ok) {
            console.log(`Payment ${payment.id} saved to database successfully`);
            return { success: true, data: JSON.parse(responseText) };
        } else {
            console.error(`Failed to save payment:`, response.status, responseText);
            return { success: false, error: `HTTP ${response.status}: ${responseText}` };
        }
    } catch (error) {
        console.error('Error saving payment to database:', error);
        return { success: false, error: error.message };
    }
}

// Start server - try to bind to all interfaces
// Add error handling wrapper
process.on('uncaughtException', (err) => {
    console.error('[Server] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
});

let server;
try {
    server = app.listen(PORT, HOST, () => {
        // Initialize Redis cache (non-blocking)
        initRedis().catch(err => {
            console.log('[Cache] Redis initialization error:', err.message);
        });
        
        console.log(`Le Continent server running on ${HOST}:${PORT}`);
        console.log(`Health check: http://localhost:${PORT}/api/health`);
        console.log(`Serving frontend from: ${staticPath || 'not found'}`);
        console.log('Maviance integration enabled');
        console.log('Supported methods: MTN Cameroon, Orange Cameroon');
    });
} catch (err) {
    console.error('[Server] Failed to start:', err);
}

// Error handling for server
server.on('error', (err) => {
    console.error('[Server] Error starting:', err.message);
    if (err.code === 'EADDRINUSE') {
        console.error(`[Server] Port ${PORT} is already in use. Try a different port.`);
    }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('Shutting down gracefully...');
    await closeRedis();
    process.exit(0);
});

module.exports = app;
