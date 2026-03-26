# Le Continent - Quick Setup Guide

## ⚡ Quick Start (5 minutes)

### 1. **Backend Dependency Installation**

```bash
# Go to backend directory
cd backend

# Install dependencies  
npm install

# Return to root
cd ..
```

**Dependencies added:**
- `express@^4.18.2` - Web server
- `cors@^2.8.5` - Cross-origin requests
- Already has crypto-js, node-fetch

### 2. **Start the Servers**

**Terminal 1 - Backend**
```bash
cd backend
npm start
# Listens on http://localhost:3000
```

**Terminal 2 - Frontend** 
```bash
npm run dev
# Listens on http://localhost:5173
```

### 3. **Test the System**

**Health Check**
```bash
curl http://localhost:3000/api/health
# Should return: { "status": "ok", "timestamp": "..." }
```

**Test Referral API**
```bash
# Validate a code
curl http://localhost:3000/api/referrals/validate/CONTINENT-LHFFJQ

# Create referral
curl -X POST http://localhost:3000/api/referrals/create \
  -H "Content-Type: application/json" \
  -d '{
    "referrerId": "550e8400-e29b-41d4-a716-446655440000",
    "referredId": "650e8400-e29b-41d4-a716-446655440001",
    "referredName": "John Doe",
    "referredPhone": "+237612345678"
  }'
```

---

## 📋 What Was Added

### Backend Files

```
backend/
├── routes/
│   ├── referrals.js         ← NEW: Referral validation & management
│   ├── content.js           ← NEW: Content caching & search
│   └── profiles.js          ← NEW: Profile management
├── server.js                ← UPDATED: Now includes new routes
└── package.json             ← No changes needed
```

**Total: 3 new route files, ~400 lines of code**

### Frontend Files

```
src/
├── components/
│   └── ErrorBoundary.tsx          ← NEW: Error handling
├── hooks/
│   └── useContentApi.ts           ← NEW: Content fetching hook
├── lib/
│   ├── api-client.ts              ← NEW: Centralized API client
│   └── query-config.ts            ← NEW: React Query optimization
├── store/
│   ├── contentStore.ts            ← NEW: Content state
│   ├── appStore.ts                ← NEW: App state
│   └── authStore.ts               ← UNCHANGED
├── App.tsx                        ← UPDATED: Uses ErrorBoundary & new config
└── services/
    └── (existing referral/dataSync files - optimized)
```

**Total: 6 new files, ~600 lines of code**

---

## ✅ System Ready!

You now have:

✅ **Professional Backend API** - Referrals, Content, Profiles, Payments
✅ **Optimized Frontend** - Error boundaries, advanced caching, real-time sync
✅ **State Management** - Zustand stores for auth, content, app state
✅ **Error Handling** - React ErrorBoundary + API retry logic
✅ **Performance** - In-memory caching, React Query optimization, lazy loading
✅ **Real-time Features** - Supabase subscriptions for instant updates
✅ **Referral System** - Complete CONTINENT-XXXXXX code validation & linking

---

Generated: 2026-03-14
Version: 1.0.0
