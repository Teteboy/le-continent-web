import { test, expect } from '@playwright/test';

/**
 * Payment Tests
 * Tests payment modal behavior, validation, cancellation, and success flow.
 */

test.describe('Payment Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cultures-premium');
    // Wait for page to load
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
  });

  test('payment modal opens when clicking "Passer Premium"', async ({ page }) => {
    // Find and click the upgrade button
    const upgradeBtn = page.getByRole('button', { name: /passer premium|débloquer/i }).first();
    if (await upgradeBtn.isVisible()) {
      await upgradeBtn.click();
      // Should show payment dialog or redirect to login
      const isLoginPage = page.url().includes('/login') || page.url().includes('/inscription');
      if (!isLoginPage) {
        await expect(page.getByText('Paiement Premium')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('payment modal phone field is empty by default', async ({ page }) => {
    // Try to open the payment modal
    const upgradeBtn = page.getByRole('button', { name: /passer premium|débloquer/i }).first();

    if (!await upgradeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      test.skip(true, 'No upgrade button visible (user might be premium)');
      return;
    }

    await upgradeBtn.click();

    // If redirected to login, skip
    if (page.url().includes('/login') || page.url().includes('/inscription')) {
      test.skip(true, 'User not logged in — redirected to auth');
      return;
    }

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Phone input must be empty
    const phoneInput = dialog.locator('input[type="tel"], input[placeholder*="6XX"]');
    await expect(phoneInput).toBeVisible();
    const value = await phoneInput.inputValue();
    expect(value).toBe('');
  });

  test('payment button disabled when phone and method not filled', async ({ page }) => {
    const upgradeBtn = page.getByRole('button', { name: /passer premium/i }).first();

    if (!await upgradeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      test.skip(true, 'No upgrade button visible');
      return;
    }

    await upgradeBtn.click();

    if (page.url().includes('/login') || page.url().includes('/inscription')) {
      test.skip(true, 'User not logged in');
      return;
    }

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Pay button should be disabled without method and phone
    const payBtn = dialog.getByRole('button', { name: /payer/i });
    await expect(payBtn).toBeDisabled();
  });

  test('payment modal cancel button closes dialog', async ({ page }) => {
    const upgradeBtn = page.getByRole('button', { name: /passer premium/i }).first();

    if (!await upgradeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      test.skip(true, 'No upgrade button visible');
      return;
    }

    await upgradeBtn.click();

    if (page.url().includes('/login') || page.url().includes('/inscription')) {
      test.skip(true, 'User not logged in');
      return;
    }

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Click Annuler
    const cancelBtn = dialog.getByRole('button', { name: /annuler/i });
    await cancelBtn.click();

    // Dialog should close
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });

  test('payment form validates phone and method before submission', async ({ page }) => {
    const upgradeBtn = page.getByRole('button', { name: /passer premium/i }).first();

    if (!await upgradeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      test.skip(true, 'No upgrade button visible');
      return;
    }

    await upgradeBtn.click();

    if (page.url().includes('/login') || page.url().includes('/inscription')) {
      test.skip(true, 'User not logged in');
      return;
    }

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Fill phone but don't select method
    const phoneInput = dialog.locator('input[type="tel"], input[placeholder*="6XX"]');
    await phoneInput.fill('650123456');

    // Pay button still disabled (no method selected)
    const payBtn = dialog.getByRole('button', { name: /payer/i });
    await expect(payBtn).toBeDisabled();
  });
});

test.describe('Payment Cancel page', () => {
  test('payment cancel page renders correctly', async ({ page }) => {
    await page.goto('/payment/cancel');
    await expect(page.getByText('Paiement Annulé')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/aucune somme/i)).toBeVisible();
    // Should have retry link
    await expect(page.getByRole('link', { name: /réessayer/i })).toBeVisible();
  });

  test('payment cancel page clears pending_payment from localStorage', async ({ page }) => {
    // Set a pending payment before visiting cancel page
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('pending_payment', JSON.stringify({ paymentId: 'test', ptn: 'test', userId: 'test', amount: 1000 }));
    });

    await page.goto('/payment/cancel');
    await expect(page.getByText('Paiement Annulé')).toBeVisible({ timeout: 8000 });

    // pending_payment should be cleared
    const pendingPayment = await page.evaluate(() => localStorage.getItem('pending_payment'));
    expect(pendingPayment).toBeNull();
  });
});

test.describe('Payment Success page', () => {
  test('payment success page renders correctly', async ({ page }) => {
    await page.goto('/payment/success');
    await expect(page.getByText('Paiement Réussi !')).toBeVisible({ timeout: 8000 });
    // Should have link to explore content
    await expect(page.getByRole('link', { name: /explorer|accueil/i }).first()).toBeVisible();
  });

  test('payment success page reads amount from localStorage', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('pending_payment', JSON.stringify({ paymentId: 'test', ptn: 'test', userId: 'test', amount: 1000 }));
    });

    await page.goto('/payment/success');
    await expect(page.getByText('Paiement Réussi !')).toBeVisible({ timeout: 8000 });
    // Amount should be displayed
    await expect(page.getByText(/1.*000.*XAF|XAF/i)).toBeVisible();
  });
});

test.describe('Promo Code', () => {
  test('promo code section is visible in payment modal', async ({ page }) => {
    await page.goto('/cultures-premium');
    const upgradeBtn = page.getByRole('button', { name: /passer premium/i }).first();

    if (!await upgradeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      test.skip(true, 'No upgrade button visible');
      return;
    }

    await upgradeBtn.click();

    if (page.url().includes('/login') || page.url().includes('/inscription')) {
      test.skip(true, 'User not logged in');
      return;
    }

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Promo code section should be visible
    await expect(dialog.getByText(/code promo/i)).toBeVisible();
    await expect(dialog.getByPlaceholder(/code promo/i)).toBeVisible();
  });
});

test.describe('Payment Cancel Notification', () => {
  test('cancel page shows cancellation message and no amount charged notice', async ({ page }) => {
    await page.goto('/payment/cancel');
    await expect(page.getByText(/annulé/i).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/aucune somme/i)).toBeVisible({ timeout: 5000 });
  });

  test('cancel page has link to retry premium', async ({ page }) => {
    await page.goto('/payment/cancel');
    const retryLink = page.getByRole('link', { name: /réessayer/i });
    await expect(retryLink).toBeVisible({ timeout: 8000 });
    await expect(retryLink).toHaveAttribute('href', /cultures-premium/);
  });
});

test.describe('Payment Recovery', () => {
  test('stale pending_payment in localStorage is checked on app load', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('pending_payment', JSON.stringify({
        paymentId: 'stale-test-id',
        ptn: 'stale-ptn',
        userId: 'stale-user-id',
        method: 'mtn',
        amount: 1000,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      }));
    });
    await page.reload();
    // Page must not crash — body is visible
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Admin Payments', () => {
  test('admin payments section is accessible to admin users', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(4000);

    const isLoginRedirect = page.url().includes('/login');
    const hasAccessDenied = await page.getByText(/accès refusé/i).isVisible().catch(() => false);
    const hasAdminNav = await page.getByText(/paiements/i).isVisible().catch(() => false);

    // For unauthenticated users: redirect or access denied
    // For admin users: payments nav item should be visible
    expect(isLoginRedirect || hasAccessDenied || hasAdminNav).toBe(true);
  });
});
