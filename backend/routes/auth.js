/**
 * Authentication Routes for Password Reset
 * Handles phone-based password reset via SMS
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://dltkfjkodqpzmpuctnju.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsdGtmamtvZHFwem1wdWN0bmp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE2ODMyMSwiZXhwIjoyMDc5NzQ0MzIxfQ.Vz6yapqHN7NlI83izQiFGIf2L_8vegNMpl99r_yQxDw';
const supabase = createClient(supabaseUrl, supabaseKey);

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

/**
 * POST /api/auth/forgot-password
 * Request password reset via SMS
 * Body: { phone: "6XXXXXXXX" }
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ error: 'Numéro de téléphone requis' });
    }

    const formattedPhone = formatPhoneNumber(phone);

    // Find user by phone
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, phone, first_name')
      .or(`phone.eq.${formattedPhone},phone.like.%${formattedPhone.slice(-9)}`)
      .single();

    if (profileError || !profile) {
      // Don't reveal if user exists or not
      return res.json({ message: 'Si un compte existe, un code sera envoyé par SMS' });
    }

    // Generate reset code
    const resetCode = generateResetCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Save reset code to profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        reset_code: resetCode,
        reset_code_expires: expiresAt.toISOString()
      })
      .eq('id', profile.id);

    if (updateError) {
      console.error('Error saving reset code:', updateError);
      return res.status(500).json({ error: 'Erreur lors de la génération du code' });
    }

    // TODO: Send SMS with reset code using Maviance or SMS service
    // For now, we'll return the code in development mode
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    console.log(`[Password Reset] Code for ${formattedPhone}: ${resetCode}`);
    
    // In production, integrate with SMS service here
    // For now, return success message
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

/**
 * POST /api/auth/verify-reset-code
 * Verify the reset code
 * Body: { phone: "6XXXXXXXX", code: "123456" }
 */
router.post('/verify-reset-code', async (req, res) => {
  try {
    const { phone, code } = req.body;
    
    if (!phone || !code) {
      return res.status(400).json({ error: 'Téléphone et code requis' });
    }

    const formattedPhone = formatPhoneNumber(phone);

    // Find user by phone and code
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, phone, reset_code, reset_code_expires')
      .or(`phone.eq.${formattedPhone},phone.like.%${formattedPhone.slice(-9)}`)
      .single();

    if (profileError || !profile) {
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

/**
 * POST /api/auth/reset-password
 * Reset password with new password
 * Body: { userId: "user-uuid", code: "123456", newPassword: "newpassword" }
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { userId, code, newPassword } = req.body;
    
    if (!userId || !code || !newPassword) {
      return res.status(400).json({ error: 'Tous les champs requis' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    // Find user and verify code
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, reset_code, reset_code_expires')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
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

    // Update password in Supabase Auth
    const { error: authError } = await supabase.auth.admin.updateUser(userId, {
      password: newPassword
    });

    if (authError) {
      console.error('Auth update error:', authError);
      return res.status(500).json({ error: 'Erreur lors de la mise à jour du mot de passe' });
    }

    // Clear reset code
    await supabase
      .from('profiles')
      .update({
        reset_code: null,
        reset_code_expires: null
      })
      .eq('id', userId);

    res.json({ message: 'Mot de passe mis à jour avec succès' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
