// Payment Webhook for Le Continent
// This handles payment callbacks from Maviance (MTN, Orange)

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

// Import Maviance payment services (local CommonJS version)
const { 
    makePayment, 
    getPaymentInfo, 
    getPaymentItemId, 
    getErrorMessage 
} = require('./maviance');

// Configuration
const PORT = process.env.PORT || 3000;
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dltkfjkodqpzmpuctnju.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsdGtmamtvZHFwem1wdWN0bmp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE2ODMyMSwiZXhwIjoyMDc5NzQ0MzIxfQ.Vz6yapqHN7NlI83izQiFGIf2L_8vegNMpl99r_yQxDw';

// Your callback URLs
const CALLBACK_URL = process.env.CALLBACK_URL || 'https://api.lecontinent.cm/api/payment/webhook';
const SUCCESS_URL = process.env.SUCCESS_URL || 'https://lecontinent.cm/payment/success.html';
const CANCEL_URL = process.env.CANCEL_URL || 'https://lecontinent.cm/payment/cancel.html';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// In-memory payment cache (primary lookup, backed by DB)
const payments = new Map();

// Save a pending payment to Supabase immediately on initiation
async function savePendingPaymentToDB(payment) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/payments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                user_id: payment.userId || null,
                amount: payment.amount,
                original_amount: payment.amount,
                payment_method: payment.method,
                phone_number: payment.phone,
                status: 'pending',
                payment_reference: payment.reference,
                created_at: payment.createdAt,
                updated_at: payment.createdAt
            })
        });
        if (response.ok) {
            const rows = await response.json();
            const row = Array.isArray(rows) ? rows[0] : rows;
            console.log(`Pending payment saved to DB with id: ${row?.id}`);
            return row;
        }
        console.error('Failed to save pending payment to DB:', await response.text());
    } catch (err) {
        console.error('Error saving pending payment to DB:', err);
    }
    return null;
}

// Load a payment from DB by reference (our LC+timestamp ref) or by PTN
async function loadPaymentFromDB(reference, ptn) {
    try {
        const param = reference ? `payment_reference=eq.${encodeURIComponent(reference)}` : `payment_reference=eq.${encodeURIComponent(ptn)}`;
        const response = await fetch(`${SUPABASE_URL}/rest/v1/payments?${param}&limit=1`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        if (response.ok) {
            const rows = await response.json();
            return rows[0] || null;
        }
    } catch (err) {
        console.error('Error loading payment from DB:', err);
    }
    return null;
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

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

        // Persist to DB immediately so the record survives server restarts
        savePendingPaymentToDB(payment).catch(err => console.error('DB persist error:', err));

        console.log(`Initiating Maviance payment: ${method} - ${amount} XAF to ${phone}`);

        // Validate phone number for the payment method
        const payItemId = getPaymentItemId(phone);
        if (!payItemId) {
            payment.status = 'failed';
            payment.error = 'Invalid phone number for selected operator';
            payments.set(paymentId, payment);
            return res.status(400).json({ error: 'Invalid phone number for selected operator. Please check the number format.' });
        }

        console.log(`Using PayItem ID: ${payItemId}`);

        // Make payment via Maviance
        const ptn = await makePayment({
            amount: amount,
            serviceNumber: phone,
            customerEmailaddress: userEmail || 'client@lecontinent.cm',
            customerName: userName || 'Client Le Continent',
            customerAddress: 'Cameroon'
        });

        console.log(`Maviance PTN: ${ptn}`);

        payment.ptn = ptn;
        payment.status = 'pending'; // Awaiting customer confirmation
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
        
        // Handle specific error codes from Maviance
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
        
        // Update payment status if we have a paymentId
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

        let payment = null;
        
        if (paymentId) {
            payment = payments.get(paymentId);
        }
        if (!payment && ptn) {
            // Find by PTN in memory
            for (const [, p] of payments.entries()) {
                if (p.ptn === ptn) {
                    payment = p;
                    break;
                }
            }
        }

        // Fallback: load from DB (handles server restart — in-memory Map was cleared)
        if (!payment) {
            const dbRow = await loadPaymentFromDB(paymentId, ptn);
            if (dbRow) {
                // Reconstruct in-memory payment from DB row
                payment = {
                    id: paymentId || dbRow.payment_reference,
                    reference: dbRow.payment_reference,
                    phone: dbRow.phone_number,
                    amount: dbRow.amount,
                    method: dbRow.payment_method,
                    userId: dbRow.user_id,
                    status: dbRow.status,
                    ptn: ptn || null,
                    createdAt: dbRow.created_at,
                };
                payments.set(payment.id, payment);
            }
        }

        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        // Check with Maviance API if we have PTN
        if (payment.ptn) {
            try {
                const paymentInfo = await getPaymentInfo(payment.ptn);
                console.log('Maviance payment info:', paymentInfo);

                // Handle array response from Maviance
                const responseData = Array.isArray(paymentInfo.responseData) 
                    ? paymentInfo.responseData[0] 
                    : paymentInfo.responseData;

                const status = responseData?.status || responseData?.statuses;
                const statusText = responseData?.status_text || responseData?.statusMessage;
                const errorCode = responseData?.errorCode;
                
                console.log(`Payment status: ${status} - ${statusText}, ErrorCode: ${errorCode}`);

                if (status === 'SUCCESS' || status === 'success' || status === 'completed') {
                    payment.status = 'completed';
                    payment.completedAt = new Date().toISOString();
                    payment.apiResponse = paymentInfo.responseData;
                    payments.set(payment.id, payment);

                    // Update user premium status in database
                    if (payment.userId) {
                        await updateUserPremiumStatus(payment.userId, true);
                        // Save payment to database
                        await savePaymentToDatabase(payment);
                    }

                    return res.json({
                        success: true,
                        status: 'completed',
                        payment
                    });
                } else if (status === 'FAILED' || status === 'failed' || status === 'ERRORED' || errorCode) {
                    payment.status = 'failed';
                    payment.error = statusText || getErrorMessage(errorCode) || 'Payment failed';
                    payment.errorCode = errorCode;
                    payment.apiResponse = paymentInfo.responseData;
                    payments.set(payment.id, payment);

                    return res.json({
                        success: false,
                        status: 'failed',
                        message: payment.error
                    });
                }
            } catch (apiError) {
                console.error('Error checking payment status:', apiError);
            }
        }

        // Return current status if not completed yet
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

// Payment webhook callback (called by Maviance)
app.post('/api/payment/webhook', async (req, res) => {
    try {
        const callbackData = req.body;

        console.log('Maviance webhook received:', callbackData);

        const { ptn, status, reference } = callbackData;

        // Find payment by PTN or reference
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

        // Update payment status based on webhook data
        if (status === 'SUCCESS' || status === 'success' || status === 'completed') {
            payment.status = 'completed';
            payment.completedAt = new Date().toISOString();

            // Update user premium status in database
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

    // If payment is pending and we have PTN, check status with Maviance
    if (payment.status === 'pending' && payment.ptn) {
        try {
            const paymentInfo = await getPaymentInfo(payment.ptn);
            
            // Handle array response from Maviance
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

// Helper functions

async function updateUserPremiumStatus(userId, isPremium) {
    // Update user premium status in Supabase
    console.log(`Updating user ${userId} premium status to ${isPremium}`);

    if (!SUPABASE_KEY) {
        console.log('Supabase key not configured, skipping user update');
        return;
    }

    const now = new Date().toISOString();

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
                premium_since: isPremium ? now : null,
                last_payment_date: isPremium ? now : null,
            })
        });

        if (response.ok) {
            console.log(`User ${userId} premium status updated successfully`);
            // Process referral commission if applicable
            if (isPremium) {
                await processReferralCommission(userId);
            }
        } else {
            console.error(`Failed to update user ${userId} premium status:`, await response.text());
        }
    } catch (error) {
        console.error('Error updating user premium status:', error);
    }
}

/**
 * Check if the newly paying user was referred by someone.
 * If yes, add 500 FCFA commission to the referrer's earnings.
 */
async function processReferralCommission(newPremiumUserId) {
    const COMMISSION_AMOUNT = 500; // FCFA per successful referral

    try {
        // Fetch the new premium user's profile to check referred_by
        const profileRes = await fetch(
            `${SUPABASE_URL}/rest/v1/profiles?id=eq.${newPremiumUserId}&select=referred_by&limit=1`,
            {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            }
        );

        if (!profileRes.ok) return;
        const profiles = await profileRes.json();
        const referrerId = profiles[0]?.referred_by;

        if (!referrerId) {
            console.log(`User ${newPremiumUserId} has no referrer. Skipping commission.`);
            return;
        }

        console.log(`User ${newPremiumUserId} was referred by ${referrerId}. Processing ${COMMISSION_AMOUNT} FCFA commission.`);

        // Fetch current referrer earnings to increment
        const referrerRes = await fetch(
            `${SUPABASE_URL}/rest/v1/profiles?id=eq.${referrerId}&select=referral_earnings,referral_count&limit=1`,
            {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            }
        );

        if (!referrerRes.ok) return;
        const referrers = await referrerRes.json();
        const referrer = referrers[0];
        if (!referrer) return;

        const newEarnings = (referrer.referral_earnings || 0) + COMMISSION_AMOUNT;
        const newCount = (referrer.referral_count || 0) + 1;

        // Update referrer's earnings and count
        const updateRes = await fetch(
            `${SUPABASE_URL}/rest/v1/profiles?id=eq.${referrerId}`,
            {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                },
                body: JSON.stringify({
                    referral_earnings: newEarnings,
                    referral_count: newCount,
                })
            }
        );

        if (updateRes.ok) {
            console.log(`Referrer ${referrerId} credited ${COMMISSION_AMOUNT} FCFA. Total earnings: ${newEarnings} FCFA`);
        } else {
            console.error(`Failed to update referrer earnings:`, await updateRes.text());
        }

        // Log the referral commission in the referrals table
        await fetch(`${SUPABASE_URL}/rest/v1/referrals`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                referrer_id: referrerId,
                referred_id: newPremiumUserId,
                commission_amount: COMMISSION_AMOUNT,
                status: 'paid',
                paid_at: new Date().toISOString(),
            })
        });

    } catch (err) {
        console.error('Error processing referral commission:', err);
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
            original_amount: payment.amount,
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

// Start server
app.listen(PORT, () => {
    console.log(`Payment server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log('Maviance integration enabled');
    console.log('Supported methods: MTN Cameroon, Orange Cameroon');
});

module.exports = app;
