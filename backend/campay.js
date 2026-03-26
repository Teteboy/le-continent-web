// CamPay Payment Integration for Le Continent
// CommonJS version for Node.js backend
// Docs: https://demo.campay.net (demo) / https://www.campay.net (live)

// Configuration - loaded from environment variables
// In demo mode, use demo.campay.net; in live mode, use www.campay.net
const CAMPAY_BASE_URL = process.env.CAMPAY_BASE_URL || 'https://www.campay.net';
const CAMPAY_USERNAME = process.env.CAMPAY_USERNAME || '';
const CAMPAY_PASSWORD = process.env.CAMPAY_PASSWORD || '';
const CAMPAY_PERMANENT_TOKEN = process.env.CAMPAY_PERMANENT_TOKEN || '';
const CAMPAY_WEBHOOK_KEY = process.env.CAMPAY_WEBHOOK_KEY || '';

// Token cache
let cachedToken = null;
let tokenExpiresAt = 0;

// Timeout helper — aborts fetch after `ms` milliseconds
function fetchWithTimeout(url, options, ms = 15000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    return fetch(url, { ...options, signal: controller.signal })
        .finally(() => clearTimeout(timer));
}

/**
 * Get an access token from CamPay.
 * Uses the permanent token if available, otherwise fetches a new one.
 * Caches the token to avoid unnecessary API calls.
 */
async function getToken() {
    // If we have a permanent token, use it directly
    if (CAMPAY_PERMANENT_TOKEN) {
        return CAMPAY_PERMANENT_TOKEN;
    }

    // Check if cached token is still valid (with 60s buffer)
    if (cachedToken && Date.now() < tokenExpiresAt - 60000) {
        return cachedToken;
    }

    if (!CAMPAY_USERNAME || !CAMPAY_PASSWORD) {
        throw new Error('CamPay credentials not configured. Set CAMPAY_USERNAME and CAMPAY_PASSWORD.');
    }

    console.log('[CamPay] Fetching new access token...');

    const response = await fetchWithTimeout(`${CAMPAY_BASE_URL}/api/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: CAMPAY_USERNAME,
            password: CAMPAY_PASSWORD
        })
    }, 10000);

    if (!response.ok) {
        const errorText = await response.text();
        console.error('[CamPay] Token error:', response.status, errorText);
        throw new Error(`CamPay authentication failed: ${response.status}`);
    }

    const data = await response.json();
    cachedToken = data.token;
    // CamPay tokens typically last ~1 hour; cache for 50 minutes
    tokenExpiresAt = Date.now() + 50 * 60 * 1000;

    console.log('[CamPay] Token obtained successfully');
    return cachedToken;
}

/**
 * Initiate a Mobile Money payment (collect).
 * @param {Object} params
 * @param {string} params.amount - Amount in XAF (e.g. "500")
 * @param {string} params.phone - Phone number in format 2376XXXXXXXX
 * @param {string} params.description - Payment description
 * @param {string} [params.externalRef] - Optional external reference
 * @param {string} [params.webhookUrl] - Optional webhook URL for status callbacks
 * @returns {Object} CamPay collect response with reference for status tracking
 */
async function collectPayment({ amount, phone, description, externalRef, webhookUrl }) {
    const token = await getToken();

    console.log(`[CamPay] Initiating collect: ${amount} XAF to ${phone}`);

    const body = {
        amount: String(amount),
        currency: 'XAF',
        from: phone,
        description: description || 'Le Continent Premium',
        external_reference: externalRef || undefined,
        webhook_url: webhookUrl || undefined
    };

    const response = await fetchWithTimeout(`${CAMPAY_BASE_URL}/api/collect/`, {
        method: 'POST',
        headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    }, 20000);

    const responseData = await response.json();

    if (!response.ok) {
        console.error('[CamPay] Collect error:', response.status, responseData);
        throw new Error(responseData.message || responseData.detail || `CamPay collect failed: ${response.status}`);
    }

    console.log('[CamPay] Collect response:', responseData);
    return responseData;
}

/**
 * Check the status of a transaction by its reference.
 * @param {string} reference - The CamPay transaction reference
 * @returns {Object} Transaction status data
 */
async function getTransactionStatus(reference) {
    const token = await getToken();

    console.log(`[CamPay] Checking transaction status: ${reference}`);

    const response = await fetchWithTimeout(`${CAMPAY_BASE_URL}/api/transaction/${reference}/`, {
        method: 'GET',
        headers: {
            'Authorization': `Token ${token}`
        }
    }, 10000);

    const responseData = await response.json();

    if (!response.ok) {
        console.error('[CamPay] Status check error:', response.status, responseData);
        throw new Error(responseData.message || responseData.detail || `Status check failed: ${response.status}`);
    }

    console.log('[CamPay] Transaction status:', responseData);
    return responseData;
}

/**
 * Validate a CamPay webhook signature.
 * @param {Object} body - The webhook request body
 * @param {string} signature - The signature from the webhook header
 * @returns {boolean} Whether the signature is valid
 */
function validateWebhookSignature(body, signature) {
    if (!CAMPAY_WEBHOOK_KEY) {
        console.warn('[CamPay] Webhook key not configured, skipping signature validation');
        return true;
    }
    // CamPay sends a webhook key that should match the configured key
    return signature === CAMPAY_WEBHOOK_KEY;
}

/**
 * Get a user-friendly error message in French for CamPay errors.
 */
function getErrorMessage(errorMsg) {
    const msg = (errorMsg || '').toLowerCase();
    if (msg.includes('insufficient') || msg.includes('solde')) {
        return 'Solde insuffisant. Veuillez recharger votre compte et réessayer.';
    }
    if (msg.includes('invalid') || msg.includes('invalide')) {
        return 'Numéro de téléphone invalide. Veuillez vérifier et réessayer.';
    }
    if (msg.includes('timeout') || msg.includes('expired')) {
        return 'Le paiement a expiré. Veuillez réessayer.';
    }
    if (msg.includes('reject') || msg.includes('refused') || msg.includes('refus')) {
        return 'Le paiement a été refusé. Veuillez vérifier votre compte et réessayer.';
    }
    if (msg.includes('cancel') || msg.includes('annul')) {
        return 'Le paiement a été annulé.';
    }
    return 'Le paiement a échoué. Veuillez réessayer.';
}

module.exports = {
    getToken,
    collectPayment,
    getTransactionStatus,
    validateWebhookSignature,
    getErrorMessage,
    CAMPAY_BASE_URL,
};

