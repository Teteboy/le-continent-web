# Complete Deployment Guide - Le Continent Web

## System Overview

The system has 3 main components:
1. **Frontend** - React/Vite app (lecontinent.cm)
2. **Backend** - Node.js API (api.lecontinent.cm)
3. **Database** - Supabase (already configured)

---

## Step 1: Build the Frontend

```bash
cd c:/Users/admin/Desktop/le-continent-web
npm run build
```

This creates a `dist` folder with static files.

---

## Step 2: Deploy Frontend to Hostinger

### Option A: Using Hostinger File Manager

1. **Build the frontend:**
   ```bash
   npm run build
   ```

2. **Upload to Hostinger:**
   - Go to Hostinger → File Manager → public_html
   - Delete existing files
   - Upload all contents from the `dist` folder
   - Make sure `.htaccess` is included for SPA routing

3. **Configure domain:**
   - Go to Hostinger → Domains → Point your domain to public_html
   - SSL certificate will be auto-generated

---

## Step 3: Deploy Backend to Hostinger

### Option A: Using Hostinger Node.js App

1. **Create Node.js app in Hostinger:**
   - Go to Hostinger → Node.js
   - Create new app
   - Select your project folder (or create new)
   - Set root directory to: `/backend`
   - Set startup file: `server.js`
   - Set Node version: 18 or 20

2. **Set Environment Variables:**
   In Hostinger Node.js settings, add these variables:
   ```
   SUPABASE_URL=https://dltkfjkodqpzmpuctnju.supabase.co
   SUPABASE_KEY=your_supabase_anon_key
   APP_URL=https://lecontinent.cm
   NODE_ENV=production
   PORT=3000
   ```

3. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

4. **Start the server:**
   - The app should start automatically
   - Access at: https://api.lecontinent.cm

### Option B: Using Git (Recommended)

1. **Push code to GitHub:**
   ```bash
   git add .
   git commit -m "Deploy"
   git push origin main
   ```

2. **Connect Git to Hostinger:**
   - Go to Hostinger → Git → Connect Repository
   - Select your GitHub repo
   - Set branch: main
   - Set directory: /backend

---

## Step 4: Configure Domain

### Frontend (lecontinent.cm)
- Already pointing to public_html
- SSL auto-enabled

### Backend (api.lecontinent.cm)
- Create subdomain in Hostinger: api.lecontinent.cm
- Point to backend folder
- Enable SSL

---

## Step 5: Verify Deployment

### Test Frontend:
- Visit: https://lecontinent.cm
- Check if homepage loads

### Test Backend:
- Visit: https://api.lecontinent.cm/api/health
- Should return: `{"status":"ok"}`

### Test Payment Endpoint:
- Visit: https://api.lecontinent.cm/api/debug/payments
- Should show: `{"count":0,"payments":[]}`

---

## Step 6: Supabase Setup (Already Done)

The following tables should exist in Supabase:

1. **profiles** - User profiles
2. **villages** - Village/cultural content
3. **promo_codes** - Promo codes
4. **payments** - Payment records (created via SQL)
5. **referrals** - Referral tracking

If payments table doesn't exist, run this in Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  original_amount INTEGER NOT NULL DEFAULT 1000,
  promo_code_id UUID REFERENCES promo_codes(id) ON DELETE SET NULL,
  promo_code TEXT,
  payment_method TEXT CHECK (payment_method IN ('mtn', 'orange')),
  phone_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin full access on payments" ON payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = TRUE
    )
  );
```

---

## Troubleshooting

### Backend Not Starting
- Check Node.js version (use 18 or 20)
- Verify environment variables
- Check error logs in Hostinger

### Payments Not Working
- Check SUPABASE_KEY is correct
- Verify Maviance credentials
- Check debug endpoint: /api/debug/payments

### CORS Errors
- Add your domain to CORS in server.js
- Rebuild and redeploy

---

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| SUPABASE_URL | Supabase project URL | https://xxx.supabase.co |
| SUPABASE_KEY | Supabase anon key | eyJhbGci... |
| APP_URL | Main website URL | https://lecontinent.cm |
| NODE_ENV | Environment | production |
| PORT | Server port | 3000 |

---

## Quick Deploy Commands

```bash
# Build frontend
npm run build

# Install backend deps
cd backend
npm install

# Test locally
node server.js
```
