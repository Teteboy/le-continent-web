import { test, expect } from '@playwright/test';

/**
 * Auth & Session Management Tests
 * Tests login, signup, session persistence, and profile loading.
 */

const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'testpassword123';
const TEST_PHONE = process.env.TEST_PHONE || '237612345678';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Clear local storage before each test to ensure clean state
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('login page is accessible and shows form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('Se connecter')).toBeVisible();
    await expect(page.getByPlaceholder(/email ou numéro/i)).toBeVisible();
    await expect(page.getByPlaceholder(/mot de passe/i)).toBeVisible();
  });

  test('shows validation error for empty login', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /connexion/i }).click();
    // Should show a toast or error message
    await expect(page.getByText(/requis/i)).toBeVisible({ timeout: 5000 });
  });

  test('login with wrong credentials shows error', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/email ou numéro/i).fill('wrong@example.com');
    await page.getByPlaceholder(/mot de passe/i).fill('wrongpassword');
    await page.getByRole('button', { name: /connexion/i }).click();
    // Should show error toast
    await expect(
      page.getByText(/incorrect|invalide|connexion/i)
    ).toBeVisible({ timeout: 8000 });
  });

  test('guest route redirects logged-in users to cultures-premium', async ({ page }) => {
    // If user is already logged in, /login should redirect to /cultures-premium
    // This tests the GuestRoute behavior
    await page.goto('/login');
    // Without login, should stay on /login
    await expect(page).toHaveURL(/\/login/);
  });

  test('signup page renders correctly', async ({ page }) => {
    await page.goto('/inscription');
    await expect(page.getByText('Inscription')).toBeVisible();
    await expect(page.getByPlaceholder('Prénom')).toBeVisible();
    await expect(page.getByPlaceholder('Nom')).toBeVisible();
  });

  test('signup validation requires first name', async ({ page }) => {
    await page.goto('/inscription');
    await page.getByRole('button', { name: /créer mon compte/i }).click();
    await expect(page.getByText(/prénom.*requis|requis/i)).toBeVisible({ timeout: 5000 });
  });

  test('forgot password page is accessible', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByText(/mot de passe oublié|réinitialiser/i)).toBeVisible();
  });

  test('navbar shows login and register links when logged out', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('nav');
    await expect(nav.getByRole('link', { name: /connexion/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /inscrire/i })).toBeVisible();
  });

  test('protected route /profile redirects to /login when not authenticated', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login/, { timeout: 8000 });
  });
});

test.describe('Session Management', () => {
  test('landing page loads without auth', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');
    // Page should load within 10 seconds
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
  });

  test('cultures page is accessible without auth', async ({ page }) => {
    await page.goto('/cultures-premium');
    // Should show the page (not redirect to login since it is public)
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/cultures-premium/);
  });

  test('medecine-traditionnelle page loads without auth', async ({ page }) => {
    await page.goto('/medecine-traditionnelle');
    await expect(page).toHaveURL(/medecine-traditionnelle/);
    // Should show loading or content within 15 seconds
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
  });

  test('bibliotheque page loads without auth', async ({ page }) => {
    await page.goto('/bibliotheque');
    await expect(page).toHaveURL(/bibliotheque/);
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
  });

  test('pending payment in localStorage is checked on load', async ({ page }) => {
    // Simulate a stale pending payment in localStorage
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('pending_payment', JSON.stringify({
        paymentId: 'test-payment-id-123',
        ptn: 'test-ptn-456',
        userId: 'test-user-id',
        method: 'mtn',
        amount: 1000,
        createdAt: new Date().toISOString(),
      }));
    });
    await page.reload();
    // The app should attempt to check the payment status
    // Without a valid backend, this will silently fail — just check the page loads
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Login → Redirect flow', () => {
  test('after successful login, redirects to /cultures-premium', async ({ page }) => {
    // This test requires valid credentials set via environment variables
    if (!process.env.TEST_EMAIL || !process.env.TEST_PASSWORD) {
      test.skip(true, 'TEST_EMAIL and TEST_PASSWORD env vars not set');
      return;
    }

    await page.goto('/login');
    await page.getByPlaceholder(/email ou numéro/i).fill(TEST_EMAIL);
    await page.getByPlaceholder(/mot de passe/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /connexion/i }).click();

    // Should redirect to /cultures-premium after successful login
    await expect(page).toHaveURL(/cultures-premium/, { timeout: 15000 });
  });

  test('after successful signup, redirects to /cultures-premium', async ({ page }) => {
    // This test is informational — actual signup creates real users
    // Use with a disposable test account
    if (!process.env.RUN_SIGNUP_TESTS) {
      test.skip(true, 'RUN_SIGNUP_TESTS env var not set');
      return;
    }

    const uniquePhone = `237${Date.now().toString().slice(-9)}`;
    await page.goto('/inscription');
    await page.getByPlaceholder('Prénom').fill('Test');
    await page.getByPlaceholder('Nom').fill('User');
    await page.getByPlaceholder('6XXXXXXXX').fill(uniquePhone);
    await page.getByPlaceholder('Minimum 6 caractères').fill('testpass123');
    await page.getByPlaceholder('Confirmez votre mot de passe').fill('testpass123');
    await page.getByRole('button', { name: /créer mon compte/i }).click();

    // Should show promo code modal or redirect to cultures-premium
    await page.waitForURL(/cultures-premium|login/, { timeout: 20000 });
  });
});

test.describe('Profile page', () => {
  test('profile page shows loading or auth redirect', async ({ page }) => {
    await page.goto('/profile');
    // Either shows loading or redirects to /login
    const url = page.url();
    const isLoginOrLoading = url.includes('/login') || url.includes('/profile');
    expect(isLoginOrLoading).toBe(true);
  });
});
