/**
 * Generates a unique promo code for new users
 * Format: CONTINENT-XXXXXX (random alphanumeric)
 */
export function generatePromoCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'CONTINENT-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
