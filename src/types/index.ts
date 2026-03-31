export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  is_premium: boolean;
  avatar_url: string | null;
  tribe: string | null;
  created_at: string;
  updated_at: string;
  last_payment_date: string | null;
  payment_reference: string | null;
  promo_code: string | null;
  // Referral system
  referred_by: string | null;
  referral_earnings: number;
  referral_count: number;
  balance: number;
  // Admin
  is_admin?: boolean;
  // Password reset (internal fields)
  reset_code?: string | null;
  reset_code_expires?: string | null;
}

export interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'fixed' | 'percentage';
  discount_value: number;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  original_amount: number;
  promo_code_id: string | null;
  promo_code: string | null;
  payment_method: 'mtn' | 'orange' | null;
  phone_number: string | null;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_reference: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminStats {
  totalUsers: number;
  premiumUsers: number;
  freeUsers: number;
  totalReferrals: number;
  activePromoCodes: number;
  estimatedRevenue: number;
}

export interface Culture {
  id: string;
  name: string;
  region: string;
  population: string;
  language: string;
  shortDescription: string;
  features: string[];
  color: string;
  icon: string;
  image: string;
}

export interface Invention {
  id: string;
  title: string;
  description: string;
  year: string;
  category: string;
  icon: string;
}

export interface TraditionalJob {
  id: string;
  name: string;
  description: string;
  region: string;
}

export interface PremiumContent {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  items: string[];
  freeItems: string[]; // First 3 items available for free
}

export interface ReferralRecord {
  id: string;
  referrer_id: string;
  referred_id: string;
  referred_name: string;
  referred_phone: string;
  amount_paid: number;
  referral_earnings: number;
  created_at: string;
}
