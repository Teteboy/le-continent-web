/**
 * Generates a unique promo code for new users
 * Format: CONTINENT-XXXXXX (uppercase alphanumeric)
 * Ensures consistent formatting for reliable matching
 */
export function generatePromoCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'CONTINENT-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Always return uppercase for consistency
  return result.toUpperCase();
}
