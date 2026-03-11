// Payment Webhook for Le Continent
// This handles payment callbacks from Paydunya (MTN, Orange, Card)

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fetch = require('node-fetch');

// Configuration
const PORT = process.env.PORT || 3000;
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dltkfjkodqpzmpuctnju.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// Paydunya API Configuration (Test Mode)
const PAYDUNYA_API_URL = 'https://api.paydunya.com/api/v1';
const PAYDUNYA_MASTER_KEY = 'GeB6V2bJ-JW4W-OEyd-CPjd-R2ILujaR6o3p';
const PAYDUNYA_PUBLIC_KEY = 'test_public_BZKur8w9jJk1WgSbaRXzCsxXIzO';
const PAYDUNYA_PRIVATE_KEY = 'test_private_WqWtzfd3fzzDkvm3i02A3Lnfxsb';
const PAYDUNYA_TOKEN = 'ZtrFAire89uLpd9zlVfr';

// Your callback URLs
const CALLBACK_URL = process.env.CALLBACK_URL || 'https://lecontinent.cm/api/payment/webhook';
const SUCCESS_URL = process.env.SUCCESS_URL || 'https://lecontinent.cm/payment/success.html';
const CANCEL_URL = process.env.CANCEL_URL || 'https://lecontinent.cm/payment/cancel.html';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Payment storage (in production, use a database)
const payments = new Map();

// Paydunya API Helper
async function paydunyaRequest(endpoint, method = 'POST', body = null) {
    const url = `${PAYDUNYA_API_URL}${endpoint}`;
    const headers = {
        'Authorization': `Basic ${Buffer.from(`${PAYDUNYA_PRIVATE_KEY}:${PAYDUNYA_TOKEN}`).toString('base64')}`,
        'Content-Type': 'application/json'
    };

    const options = {
        method,
        headers
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    return response.json();
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initiate payment with Paydunya
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

        // Create Paydunya invoice
        const invoiceData = {
            invoice: {
                title: 'Le Continent Premium',
                description: 'Abonnement Premium - Le Continent',
                total_amount: amount,
                currency: 'XAF'
            },
            custom_data: {
                paymentId,
                userId,
                phone,
                method
            },
            actions: {
                callback_url: CALLBACK_URL,
                return_url: SUCCESS_URL,
                cancel_url: CANCEL_URL
            },
            customer: {
                name: userName || 'Client Le Continent',
                email: userEmail || 'client@lecontinent.cm',
                phone: phone
            }
        };

        console.log('Creating Paydunya invoice:', invoiceData);

        const paydunyaResponse = await paydunyaRequest('/checkout/invoice/create', 'POST', invoiceData);

        console.log('Paydunya response:', paydunyaResponse);

        if (paydunyaResponse.response_code === '00') {
            payment.paydunyaToken = paydunyaResponse.token;
            payment.paydunyaInvoice = paydunyaResponse.invoice_token;
            payments.set(paymentId, payment);

            res.json({
                success: true,
                paymentId,
                reference,
                token: paydunyaResponse.token,
                checkoutUrl: paydunyaResponse.response_text,
                status: 'pending'
            });
        } else {
            payment.status = 'failed';
            payment.error = paydunyaResponse.response_text || 'Paydunya payment initiation failed';
            payments.set(paymentId, payment);

            res.status(500).json({
                error: paydunyaResponse.response_text || 'Payment initiation failed'
            });
        }

    } catch (error) {
        console.error('Payment initiation error:', error);
        res.status(500).json({ error: 'Payment initiation failed' });
    }
});

// Confirm Paydunya payment (direct API check)
app.post('/api/payment/confirm', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Missing token' });
        }

        const confirmData = {
            token: token
        };

        const response = await paydunyaRequest('/checkout/invoice/confirm', 'POST', confirmData);

        console.log('Paydunya confirm response:', response);

        // Find payment by token
        let payment = null;
        for (const [id, p] of payments.entries()) {
            if (p.paydunyaToken === token) {
                payment = p;
                break;
            }
        }

        if (response.response_code === '00' && response.status === 'completed') {
            if (payment) {
                payment.status = 'completed';
                payment.completedAt = new Date().toISOString();
                payment.paydunyaResponse = response;
                payments.set(payment.id, payment);

                // Update user premium status
                if (payment.userId) {
                    await updateUserPremiumStatus(payment.userId, true);
                }
            }

            res.json({
                success: true,
                status: 'completed',
                payment
            });
        } else {
            if (payment) {
                payment.status = 'failed';
                payment.error = response.status || 'Payment not completed';
                payments.set(payment.id, payment);
            }

            res.json({
                success: false,
                status: response.status || 'pending',
                message: response.status_message || 'Payment not completed'
            });
        }

    } catch (error) {
        console.error('Payment confirmation error:', error);
        res.status(500).json({ error: 'Payment confirmation failed' });
    }
});

// Payment webhook callback (called by Paydunya)
app.post('/api/payment/webhook', async (req, res) => {
    try {
        const callbackData = req.body;

        console.log('Paydunya webhook received:', callbackData);

        const { token, status, custom_data } = callbackData;

        if (!token) {
            return res.status(400).json({ error: 'Missing token' });
        }

        // Find payment by token
        let payment = null;
        if (custom_data && custom_data.paymentId) {
            payment = payments.get(custom_data.paymentId);
        }

        if (!payment) {
            // Try to find by token
            for (const [id, p] of payments.entries()) {
                if (p.paydunyaToken === token) {
                    payment = p;
                    break;
                }
            }
        }

        if (!payment) {
            console.log('Payment not found for token:', token);
            return res.json({ status: 'received' });
        }

        // Update payment status based on Paydunya response
        if (status === 'completed' || status === 'approved') {
            payment.status = 'completed';
            payment.completedAt = new Date().toISOString();

            // Update user premium status in database
            if (payment.userId) {
                await updateUserPremiumStatus(payment.userId, true);
            }
        } else if (status === 'failed' || status === 'cancelled') {
            payment.status = 'failed';
            payment.error = callbackData.status_message || 'Payment failed';
        }

        payments.set(payment.id, payment);

        console.log('Payment updated:', payment);

        res.json({ status: 'ok' });

    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

// Get payment status
app.get('/api/payment/status/:paymentId', (req, res) => {
    const { paymentId } = req.params;
    const payment = payments.get(paymentId);

    if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(payment);
});

// Helper functions

async function updateUserPremiumStatus(userId, isPremium) {
    // Update user premium status in Supabase
    console.log(`Updating user ${userId} premium status to ${isPremium}`);

    if (!SUPABASE_KEY) {
        console.log('Supabase key not configured, skipping user update');
        return;
    }

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            },
            body: JSON.stringify({
                is_premium: isPremium,
                premium_since: isPremium ? new Date().toISOString() : null
            })
        });

        if (response.ok) {
            console.log(`User ${userId} premium status updated successfully`);
        } else {
            console.error(`Failed to update user ${userId} premium status:`, await response.text());
        }
    } catch (error) {
        console.error('Error updating user premium status:', error);
    }
}

// Start server
app.listen(PORT, () => {
    console.log(`Payment server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log('Paydunya integration enabled (Test Mode)');
    console.log('Supported methods: MTN Cameroon, Orange Cameroon, Card');
});

module.exports = app;
