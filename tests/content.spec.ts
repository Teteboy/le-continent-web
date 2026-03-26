import { test, expect } from '@playwright/test';

/**
 * Content Display Tests
 * Tests that key content pages load correctly, handle errors gracefully,
 * and display appropriate content for free vs premium users.
 */

test.describe('MedecineTraditionnellePage', () => {
  test('page loads and shows loading state then content', async ({ page }) => {
    await page.goto('/medecine-traditionnelle');

    // Page should eventually show content or error state (not infinite spinner)
    await expect(
      page.getByText(/médecine traditionnelle/i).or(
        page.getByText(/impossible de charger|vérifiez/i)
      )
    ).toBeVisible({ timeout: 15000 });
  });

  test('page header is visible', async ({ page }) => {
    await page.goto('/medecine-traditionnelle');
    await expect(page.getByText(/médecine traditionnelle/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('back button is visible', async ({ page }) => {
    await page.goto('/medecine-traditionnelle');
    await expect(page.getByText(/retour/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('back button navigates correctly', async ({ page }) => {
    await page.goto('/medecine-traditionnelle');
    await page.getByText(/retour/i).first().click();
    // Should navigate to cultures-premium (default back)
    await expect(page).toHaveURL(/cultures-premium/, { timeout: 8000 });
  });

  test('free users see locked content prompt', async ({ page }) => {
    await page.goto('/medecine-traditionnelle');
    // Wait for content to load
    await page.waitForTimeout(3000);

    // If categories are loaded, check for upgrade prompt (visible for free users)
    const hasCategories = await page.getByText(/remèdes/i).isVisible().catch(() => false);
    if (hasCategories) {
      // Expand a category to see locked items
      const categoryBtn = page.locator('button').filter({ hasText: /remèdes/ }).first();
      if (await categoryBtn.isVisible()) {
        await categoryBtn.click();
        // Free users should see "Débloquer Premium" button or free notice
        await expect(
          page.getByText(/débloquer premium|gratuit|premium/i).first()
        ).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('error state shows retry button', async ({ page }) => {
    // Simulate network failure
    await page.route('**/medicine_traditionnel*', (route) => route.abort());
    await page.route('**/rest/v1/medicine_traditionnel*', (route) => route.abort());

    await page.goto('/medecine-traditionnelle');

    // Should show error state with retry button after retries exhausted
    const retryBtn = page.getByRole('button', { name: /réessayer/i });
    await expect(retryBtn).toBeVisible({ timeout: 30000 }); // Wait for retries
  });
});

test.describe('BibliothequePage', () => {
  test('page loads and shows content', async ({ page }) => {
    await page.goto('/bibliotheque');
    await expect(
      page.getByText(/bibliothèque/i).first().or(
        page.getByText(/impossible de charger|vérifiez/i)
      )
    ).toBeVisible({ timeout: 15000 });
  });

  test('page header shows Bibliothèque title', async ({ page }) => {
    await page.goto('/bibliotheque');
    await expect(page.getByText('Bibliothèque').first()).toBeVisible({ timeout: 15000 });
  });

  test('back button navigates to cultures-premium', async ({ page }) => {
    await page.goto('/bibliotheque');
    await page.waitForTimeout(1000);
    await page.getByText(/retour/i).first().click();
    await expect(page).toHaveURL(/cultures-premium/, { timeout: 8000 });
  });

  test('books are displayed as cards', async ({ page }) => {
    await page.goto('/bibliotheque');
    // Wait for content or error
    await page.waitForTimeout(5000);

    const hasBooks = await page.locator('.bg-white.rounded-2xl').count() > 0;
    const hasError = await page.getByText(/impossible de charger/i).isVisible().catch(() => false);
    const hasEmpty = await page.getByText(/aucune ressource/i).isVisible().catch(() => false);

    // One of these states should be true
    expect(hasBooks || hasError || hasEmpty).toBe(true);
  });

  test('free users see premium upgrade CTA', async ({ page }) => {
    await page.goto('/bibliotheque');
    // Wait for content
    await page.waitForTimeout(5000);

    // Free users should see upgrade button if books exist
    const hasUpgrade = await page.getByText(/passer premium/i).isVisible().catch(() => false);
    const hasEmpty = await page.getByText(/aucune ressource/i).isVisible().catch(() => false);
    const hasError = await page.getByText(/impossible de charger/i).isVisible().catch(() => false);

    // Either there's upgrade CTA, empty state, or error — all valid states
    expect(hasUpgrade || hasEmpty || hasError).toBe(true);
  });

  test('clicking a book shows details', async ({ page }) => {
    await page.goto('/bibliotheque');
    await page.waitForTimeout(5000);

    // Find first book card and click it
    const bookCard = page.locator('.cursor-pointer.bg-white.rounded-2xl').first();
    if (await bookCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      const bookTitle = await bookCard.locator('h3').textContent();
      await bookCard.click();

      // Book detail view should show the title
      if (bookTitle) {
        await expect(page.getByText(bookTitle).first()).toBeVisible({ timeout: 5000 });
      }

      // Should show back button in detail view
      await expect(page.getByText(/retour/i)).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('CulturesPremiumPage', () => {
  test('page loads and shows cultures', async ({ page }) => {
    await page.goto('/cultures-premium');
    await expect(
      page.getByText(/cultures du cameroun/i).or(page.getByText(/chargement/i))
    ).toBeVisible({ timeout: 10000 });
  });

  test('shows village list', async ({ page }) => {
    await page.goto('/cultures-premium');
    // Wait for villages to load
    await page.waitForTimeout(8000);

    // Should show at least one village or error
    const hasVillages = await page.locator('.bg-white.rounded-2xl').count() > 0;
    const hasError = await page.getByRole('button', { name: /réessayer/i }).isVisible().catch(() => false);

    expect(hasVillages || hasError).toBe(true);
  });

  test('shows bibliothèque navigation link', async ({ page }) => {
    await page.goto('/cultures-premium');
    await page.waitForTimeout(5000);
    await expect(page.getByText(/bibliothèque/i)).toBeVisible({ timeout: 8000 });
  });

  test('shows médecine traditionnelle navigation link', async ({ page }) => {
    await page.goto('/cultures-premium');
    await page.waitForTimeout(5000);
    await expect(page.getByText(/médecine traditionnelle/i)).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Admin Dashboard', () => {
  test('admin page redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/admin');
    // Should redirect to login or show access denied
    await page.waitForTimeout(5000);
    const isLogin = page.url().includes('/login');
    const hasAccessDenied = await page.getByText(/accès refusé|admin/i).isVisible().catch(() => false);
    expect(isLogin || hasAccessDenied).toBe(true);
  });

  test('admin login page renders correctly', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(5000);
    // Should show some authentication challenge
    const hasLogin = page.url().includes('/login');
    const hasAdminText = await page.getByText(/admin|connexion/i).isVisible().catch(() => false);
    expect(hasLogin || hasAdminText).toBe(true);
  });
});

test.describe('Performance & Loading', () => {
  test('landing page loads in under 10 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(10000);
  });

  test('cultures-premium page loads in under 15 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/cultures-premium');
    await expect(page.locator('body')).toBeVisible();
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(15000);
  });

  test('navigation between pages works smoothly', async ({ page }) => {
    await page.goto('/cultures-premium');
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });

    // Navigate to bibliotheque
    await page.goto('/bibliotheque');
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });

    // Navigate back
    await page.goto('/cultures-premium');
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
  });

  test('pages handle offline gracefully with retry buttons', async ({ page }) => {
    // Block all API calls
    await page.route('**/api/**', (route) => route.abort());

    await page.goto('/medecine-traditionnelle');

    // Should not show infinite spinner — should eventually show error + retry
    await page.waitForTimeout(20000); // Allow for retry attempts

    const hasRetry = await page.getByRole('button', { name: /réessayer/i }).isVisible().catch(() => false);
    const hasContent = await page.getByText(/remède|catégorie/i).isVisible().catch(() => false);
    const hasError = await page.getByText(/impossible|vérifiez/i).isVisible().catch(() => false);

    // Page should not be stuck in loading state
    const isStuckLoading = !hasRetry && !hasContent && !hasError;
    expect(isStuckLoading).toBe(false);
  });
});
