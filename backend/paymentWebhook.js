// Payment Webhook for Le Continent
// This handles payment callbacks from MTN and Orange Mobile Money

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

// Configuration
const PORT = process.env.PORT || 3000;
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dltkfjkodqpzmpuctnju.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// MTN MoMo API Configuration
const MTN_API_URL = process.env.MTN_API_URL || 'https://api.mtn.com';
const MTN_SUBSCRIPTION_KEY = process.env.MTN_SUBSCRIPTION_KEY;
const MTN_CALLBACK_HOST = process.env.MTN_CALLBACK_HOST || 'lecontinent.cm';

// Orange Money API Configuration
const ORANGE_API_URL = process.env.ORANGE_API_URL || 'https://api.orange.com';
const ORANGE_CLIENT_ID = process.env.ORANGE_CLIENT_ID;
const ORANGE_CLIENT_SECRET = process.env.ORANGE_CLIENT_SECRET;

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Payment storage (in production, use a database)
const payments = new Map();

// API Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initiate payment
app.post('/api/payment/initiate', async (req, res) => {
    try {
        const { phone, amount, method, userId } = req.body;
        
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
        
        // In production, call MTN or Orange API here
        if (method === 'mtn') {
            // MTN Mobile Money integration
            const mtnResponse = await initiateMTNPayment(phone, amount, reference);
            payment.mtnTransactionId = mtnResponse.transactionId;
        } else if (method === 'orange') {
            // Orange Money integration
            const orangeResponse = await initiateOrangePayment(phone, amount, reference);
            payment.orangeTransactionId = orangeResponse.transactionId;
        }
        
        res.json({
            success: true,
            paymentId,
            reference,
            status: 'pending'
        });
        
    } catch (error) {
        console.error('Payment initiation error:', error);
        res.status(500).json({ error: 'Payment initiation failed' });
    }
});

// Payment webhook callback (called by MTN/Orange)
app.post('/api/payment/webhook', async (req, res) => {
    try {
        const callbackData = req.body;
        
        console.log('Payment callback received:', callbackData);
        
        // Verify the payment
        const transactionId = callbackData.transactionId || callbackData.tx_id;
        const status = callbackData.status || callbackData.statusCode;
        
        if (!transactionId) {
            return res.status(400).json({ error: 'Missing transaction ID' });
        }
        
        // Find payment by transaction ID
        let payment = null;
        for (const [id, p] of payments.entries()) {
            if (p.mtnTransactionId === transactionId || p.orangeTransactionId === transactionId) {
                payment = p;
                break;
            }
        }
        
        if (!payment) {
            console.log('Payment not found for transaction:', transactionId);
            return res.json({ status: 'received' });
        }
        
        // Update payment status
        if (status === 'SUCCESS' || status === '0') {
            payment.status = 'completed';
            payment.completedAt = new Date().toISOString();
            
            // Update user premium status in database
            if (payment.userId) {
                await updateUserPremiumStatus(payment.userId, true);
            }
        } else {
            payment.status = 'failed';
            payment.error = callbackData.error || 'Payment failed';
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

async function initiateMTNPayment(phone, amount, reference) {
    // MTN Mobile Money API call
    // This is a placeholder - implement actual MTN API integration
    
    console.log(`Initiating MTN payment: ${phone}, ${amount} XAF, ref: ${reference}`);
    
    // In production, make actual API call to MTN
    // const response = await fetch(`${MTN_API_URL}/collection/v1_0/requesttopay`, {
    //     method: 'POST',
    //     headers: {
    //         'Authorization': `Bearer ${await getMTNToken()}`,
    //         'X-Callback-Url': `https://${MTN_CALLBACK_HOST}/api/payment/webhook`,
    //         'Content-Type': 'application/json'
    //     },
    //     body: JSON.stringify({
    //         amount: amount.toString(),
    //         currency: 'XAF',
    //         externalId: reference,
    //         payer: {
    //             partyIdType: 'MSISDN',
    //             partyId: phone.replace('+237', '')
    //         },
    //         payerMessage: 'Paiement Le Continent Premium',
    //         payeeNote: 'Merci pour votre paiement'
    //     })
    // });
    
    return {
        transactionId: `MTN${Date.now()}`,
        status: 'pending'
    };
}

async function initiateOrangePayment(phone, amount, reference) {
    // Orange Money API call
    // This is a placeholder - implement actual Orange API integration
    
    console.log(`Initiating Orange payment: ${phone}, ${amount} XAF, ref: ${reference}`);
    
    // In production, make actual API call to Orange
    // const response = await fetch(`${ORANGE_API_URL}/orange-money-webpayment-sandbox/v1/webpayment`, {
    //     method: 'POST',
    //     headers: {
    //         'Authorization': `Bearer ${await getOrangeToken()}`,
    //         'Content-Type': 'application/json'
    //     },
    //     body: JSON.stringify({
    //         amount: amount,
    //         currency': 'XAF',
    //         orderId: reference,
    //         returnUrl: `https://${MTN_CALLBACK_HOST}/api/payment/webhook`,
    //         cancelUrl: `https://${MTN_CALLBACK_HOST}/payment/cancel.html`,
    //         notifUrl: `https://${MTN_CALLBACK_HOST}/api/payment/webhook`
    //     })
    // });
    
    return {
        transactionId: `ORANGE${Date.now()}`,
        status: 'pending'
    };
}

async function getMTNToken() {
    // Get MTN OAuth token
    // Implement actual token retrieval
    return 'mtn_token';
}

async function getOrangeToken() {
    // Get Orange OAuth token
    // Implement actual token retrieval
    return 'orange_token';
}

async function updateUserPremiumStatus(userId, isPremium) {
    // Update user premium status in Supabase
    console.log(`Updating user ${userId} premium status to ${isPremium}`);
    
    // In production, update Supabase:
    // const { error } = await supabase
    //     .from('profiles')
    //     .update({ is_premium: isPremium, premium_since: isPremium ? new Date().toISOString() : null })
    //     .eq('id', userId);
}

// Start server
app.listen(PORT, () => {
    console.log(`Payment server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
