# Le Continent - Backend & Frontend Architecture

## 🏗️ System Overview

### Architecture Stack
```
Frontend (React + Vite)
    ↓
Error Boundaries & Error Handling
    ↓
Zustand State Management + React Query
    ↓
API Client Layer (Centralized)
    ↓
Backend (Node.js/Express)
    ↓
Supabase (Database + Auth)
```

---

## 📦 Backend Architecture

### API Endpoints Structure

#### **Referrals API** (`/api/referrals`)
```
GET  /validate/:code         - Validate referral code
POST /create                 - Create referral record
GET  /list/:userId          - Get user's referrals
GET  /stats/:userId         - Get referral statistics
```

#### **Content API** (`/api/content`)
```
GET  /:table                - Get content with caching
GET  /:table/count          - Get content count
POST /search                - Search across tables
GET  /cache/clear           - Clear cache (admin)
GET  /cache/stats           - Cache statistics (admin)
```

#### **Profiles API** (`/api/profiles`)
```
GET  /:userId               - Get user profile
PATCH /:userId              - Update user profile
```

#### **Payments API** (`/api/payment`)
```
POST /initiate              - Initiate payment
POST /confirm               - Confirm payment
GET  /status/:paymentId     - Get payment status
```

### Backend Features

#### 1. **Referral System**
- ✅ Case-insensitive code validation (CONTINENT-XXXXXX)
- ✅ Auto-linking users with referrer_id
- ✅ Commission tracking (500 FCFA per referral)
- ✅ Real-time referral updates via Supabase subscriptions

#### 2. **Content Management**
- ✅ In-memory caching with 5-minute TTL
- ✅ Automatic cache invalidation
- ✅ Supports: lexique, alphabet, proverbes, histoires, mets
- ✅ Optimized queries with limits for free users (1000 items)

#### 3. **Error Handling**
- ✅ Comprehensive logging on all endpoints
- ✅ Proper HTTP status codes
- ✅ User-friendly error messages (French)
- ✅ Retry logic for failed operations

#### 4. **Performance**
- ✅ In-memory content cache
- ✅ Separate configuration for static vs. real-time data
- ✅ Exponential backoff for retries
- ✅ Request deduplication

---

## 🎨 Frontend Architecture

### State Management

#### 1. **Zustand Stores**

**AuthStore** (`src/store/authStore.ts`)
- User authentication state
- Session management
- Profile data
- Auth listeners for component updates

**ContentStore** (`src/store/contentStore.ts`)
- Village content caching
- Loading states per table
- Error messages per table
- Content getters/setters

**AppStore** (`src/store/appStore.ts`)
- UI state (sidebar, mobile)
- Global error handling
- Shared app-level state

### Data Fetching

#### **useVillageContent** (Supabase direct)
- Used for pagination and real-time content
- Handles premium vs. free user limits
- Fake "locked count" display for free users

#### **useContent** (API layer)
- Backend-backed content fetching
- Automatic store synchronization
- Content search functionality
- Configurable caching (5-10 minutes)

#### **useReferrals** (Supabase real-time)
- Fetches user's referrals
- Real-time updates via Supabase subscriptions
- Optimized polling (every 60 seconds)

### API Client Layer

#### **`src/lib/api-client.ts`**
- Centralized HTTP client
- Built-in error handling
- Automatic retries with exponential backoff
- Request timeout (10 seconds)
- Organized by domain:
  - `referralApi` - referral operations
  - `contentApi` - content management
  - `profileApi` - user profiles
  - `paymentApi` - payment handling

### React Query Configuration

#### **`src/lib/query-config.ts`**

**Default Configuration**
```typescript
- staleTime: 5 minutes
- gcTime: 30 minutes (was cacheTime in v4)
- Retry: 2 attempts with exponential backoff
- Refetch on focus: true
- Refetch on reconnect: true
```

**Specialized Configs**
```typescript
realtime:   staleTime: 0, refetchInterval: 30s (referrals, profiles)
content:    staleTime: 10m, gcTime: 30m (articles, lessons)
static:     staleTime: 1h, gcTime: 24h (villages, categories)
```

### Error Handling

#### **ErrorBoundary Component**
```
Catches React rendering errors
Shows user-friendly error UI
Provides retry mechanism
Logs errors for debugging
```

#### **Error Recovery Strategy**
1. Component-level error handling (try/catch)
2. API client automatic retries
3. Error boundary as safety net
4. Global error store for notifications

---

## 🔄 Data Flow Examples

### Example 1: User Creates Account with Referral Code

```
SignupPage.tsx
    ↓
User enters: CONTINENT-LHFFJQ
    ↓
findReferrerByCode(code)
    ↓
Backend: GET /api/referrals/validate/CONTINENT-LHFFJQ
    ↓
Validates code (case-insensitive)
Returns referrer ID
    ↓
createReferralRecord(referrerId, newUserId)
    ↓
Backend: POST /api/referrals/create
    ↓
Supabase inserts referral record
    ↓
Real-time subscription triggers
    ↓
useReferrals query invalidates
    ↓
Referrer's ProfilePage shows new filleul instantly
```

### Example 2: Loading Content with Caching

```
LexiquePage.tsx
    ↓
useContent('lexique', { villageId, isPremium })
    ↓
React Query checks: is data fresh?
    ↓
If YES: Return cached data immediately
If NO: Fetch from backend
    ↓
Backend: GET /api/content/lexique?villageId=...
    ↓
Check in-memory cache (5-minute TTL)
    ↓
If cached: Return instantly
If not: Query Supabase
    ↓
Cache result in memory
    ↓
Store items in ContentStore (Zustand)
    ↓
Component renders
    ↓
User can see content immediately
```

### Example 3: Real-Time Referral Updates

```
User A opens Profile → Parrainages tab
Supabase subscription: 
  channel('public:referrals').on('INSERT', ...)
    ↓
User B signs up with User A's code
    ↓
Backend creates referral record
    ↓
Supabase broadcasts change to subscribed clients
    ↓
dataSync.ts receives event
    ↓
Invalidates useReferrals query
    ↓
useReferrals refetches from API
    ↓
Backend returns updated list
    ↓
ContentStore updates
    ↓
ProfilePage re-renders
    ↓
User A sees new referral instantly ✨
```

---

## 🚀 Performance Optimizations

### 1. **Caching Strategy**

| Layer | TTL | Purpose |
|-------|-----|---------|
| Backend In-Memory | 5 min | Quick repeated requests |
| React Query Cache | 5-30 min | Client-side freshness |
| Zustand Store | Lifetime | Component state sync |
| Supabase Real-time | Instant | Live data changes |

### 2. **Lazy Loading**

```typescript
// All pages use React.lazy()
const LexiquePage = lazy(() => import('@/pages/village/LexiquePage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));

// Wrapped in Suspense with LoadingScreen
<Suspense fallback={<LoadingScreen />}>
  <Routes>...</Routes>
</Suspense>
```

### 3. **Prefetching**

```typescript
// Prefetch content when user hovers over village
usePrefetchContent('lexique', villageId);

// Data loads in background
// User sees instant results when clicking
```

### 4. **Request Deduplication**

```typescript
// Multiple components requesting same data
// React Query automatically deduplicates
useReferrals(userId) // Same queryKey
useReferrals(userId) // Returns cached result
```

---

## 🛡️ Error Handling Strategy

### Levels of Error Handling

1. **API Client Layer** (`api-client.ts`)
   - Timeout detection
   - Automatic retries
   - Error transformation

2. **Hook Layer** (`useReferrals`, `useContent`)
   - Error state management
   - User-facing messages
   - Store synchronization

3. **Component Layer**
   - Try/catch for user interactions
   - Loading states
   - Error UI display

4. **Global Layer**
   - ErrorBoundary catches rendering errors
   - App-level error store
   - Toast notifications

### Example: Error Recovery

```typescript
// User attempts to create referral
try {
  const result = await referralApi.create(payload);
  
  if (result.error) {
    // API returned error (HTTP 200 with error field)
    toast.error(result.error);
    return;
  }
  
  // Success
  queryClient.invalidateQueries({ 
    queryKey: ['referrals', referrerId] 
  });
  toast.success('Referral created!');
  
} catch (error) {
  // Network error or parsing error
  // Automatic retries already attempted
  toast.error('Network error. Please try again.');
  console.error(error);
}
```

---

## 📊 Monitoring & Debugging

### Backend Logging Format

```
[ComponentName] Operation: details
[ReferralAPI] Looking up code: CONTINENT-ABC123
[ReferralAPI] Found referrer: 550e8400-e29b-41d4-a716-446655440000
[ReferralAPI] ✅ Creating referral: { referrerId, referredId }
[ReferralAPI] ❌ Insert error: duplicate key value
```

### Frontend Logging Format

```
[useReferrals] Fetching referrals for user: 550e8400...
[useReferrals] Found referrals: 5
[useContent] Cache hit: content:lexique:550e8400
[useContent] Fetching from database: lexique
[ErrorBoundary] Caught error: Cannot read property...
```

### Admin Endpoints (for debugging)

```
GET  /api/debug/payments          - List all payments
POST /api/debug/update-premium    - Manual premium update
GET  /api/content/cache/clear     - Clear content cache
GET  /api/content/cache/stats     - Cache statistics
```

---

## 🔐 Security Considerations

### 1. **Referral Code Validation**
- ✅ Case-insensitive comparison (CONTINENT-LHFFJQ = continent-lhffjq)
- ✅ No injection attacks (codes are UUID-based)
- ✅ Rate limiting recommended (not yet implemented)

### 2. **API Security**
- ✅ CORS configured for approved domains
- ✅ Supabase API key restricted to service role
- ✅ No sensitive data in query strings
- ✅ All operations use HTTPS

### 3. **Data Privacy**
- ✅ Phone numbers partially masked in debug endpoints
- ✅ User IDs used instead of emails in logs
- ✅ Payment details never logged

### Future Improvements
- [ ] Rate limiting on API endpoints
- [ ] Request signing with timestamps
- [ ] Audit logging for sensitive operations
- [ ] IP whitelisting for admin endpoints

---

## 🧪 Testing Referrals Locally

### Prerequisites
```bash
npm install  # Install dependencies
npm run dev  # Start dev server on localhost:5173
# Backend should run on localhost:3000
```

### Test Flow

**1. Create Two Test Accounts**

Account A (Referrer)
```
Email: test-referrer@example.com
Password: test123456
Phone: +237 6XX XXX XXX
```

Account B (Referred)
```
Email: test-referred@example.com
Password: test123456
Phone: +237 6YY YYY YYY
```

**2. Generate Promo Code (Account A)**
```
Profile → Mes Informations → Generate Promo Code
Copy: CONTINENT-XXXXXX
```

**3. Create New Account (Account B)**
```
Signup page → Enter referral code
Wait for account creation
Check console logs
```

**4. Verify in ProfilePage**
```
Account A → Profile → Parrainages
Should see Account B listed
No reload needed (real-time sync)
```

**5. Console Logs Expected**

Signup:
```
[ReferralService] Looking up code: CONTINENT-XXXXXX
[ReferralService] Found referrer: [id]
[SignupPage] Referral record created successfully
```

Profile (real-time):
```
[useReferrals] Fetching referrals for user: [id]
[useReferrals] Found referrals: 1
[DataSync] Referral change detected: INSERT
```

---

## 📚 File Organization

```
src/
├── components/
│   ├── ErrorBoundary.tsx          ← Catch all errors
│   └── ...
├── hooks/
│   ├── useAuth.ts                 ← Authentication
│   ├── useReferrals.ts            ← Real-time referrals
│   ├── useVillageContent.ts       ← Content (Supabase)
│   ├── useContentApi.ts           ← Content (API)
│   └── ...
├── lib/
│   ├── api-client.ts              ← Centralized API
│   ├── query-config.ts            ← React Query config
│   ├── supabase.ts                ← Supabase client
│   └── ...
├── pages/
│   └── ... (70+ pages)
├── services/
│   ├── dataSync.ts                ← Real-time subscriptions
│   ├── referralService.ts         ← Referral operations
│   └── ...
├── store/
│   ├── authStore.ts               ← Auth state
│   ├── contentStore.ts            ← Content cache
│   ├── appStore.ts                ← App state
│   └── ...
└── App.tsx                         ← Root with ErrorBoundary

backend/
├── routes/
│   ├── referrals.js               ← Referral endpoints
│   ├── content.js                 ← Content endpoints
│   ├── profiles.js                ← Profile endpoints
│   └── ...
├── server.js                      ← Express app
├── package.json
└── ...
```

---

## 🎯 Next Steps (Future Enhancements)

### Short-term (1-2 weeks)
- [ ] Add rate limiting (redis)
- [ ] Implement request signing
- [ ] Add more comprehensive error logging
- [ ] Add analytics tracking

### Medium-term (1-2 months)
- [ ] Implement advanced caching (Redis)
- [ ] Add database query optimization
- [ ] Create admin dashboard for monitoring
- [ ] Implement email notifications for referrals

### Long-term (3+ months)
- [ ] Consider migrating to Next.js for SSR
- [ ] Implement websocket for real-time features
- [ ] Add mobile app
- [ ] Implement analytics

---

## 📞 Support & Troubleshooting

### Common Issues

**Referral code not found**
- Check code is uppercase
- Verify user profile has generated code
- Check Supabase `profiles.promo_code` column

**Referrals not showing in real-time**
- Check browser console for [DataSync] logs
- Verify Supabase realtime subscriptions are enabled
- Check network tab for WebSocket connection

**Content loading slowly**
- Check `/api/content/cache/stats` for cache hits
- Monitor API response times
- Check Supabase query performance

---

Generated: 2026-03-14
Version: 1.0.0
