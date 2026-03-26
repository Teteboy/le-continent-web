# Le Continent - Hostinger Deployment Guide

This guide covers deploying both frontend and backend to Hostinger.

## Prerequisites

1. **Hostinger Account** with:
   - Web Hosting plan (Premium or above recommended)
   - Node.js enabled in hPanel
   - Domain pointed to Hostinger

2. **Supabase Account** - You'll need your:
   - SUPABASE_URL
   - SUPABASE_ANON_KEY (public)
   - SUPABASE_KEY (service role - keep secret!)

---

## Step 1: Build the Frontend

Before deploying, build the frontend:

```bash
# Install dependencies (if not already done)
npm install

# Build the frontend
npm run build
```

This creates a `dist/` folder with static files.

---

## Step 2: Configure Environment Variables

Create a `.env` file in the `backend/` folder:

```env
# Backend Server
PORT=3000

# Your domain (replace with your actual domain)
APP_URL=https://yourdomain.com

# Supabase Configuration (get these from your Supabase dashboard)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key-here

# Payment Callbacks (auto-configured based on APP_URL)
# CALLBACK_URL=https://yourdomain.com/api/payment/webhook
# SUCCESS_URL=https://yourdomain.com/payment/success.html
# CANCEL_URL=https://yourdomain.com/payment/cancel.html
```

---

## Step 3: Upload Files to Hostinger

### Option A: Using File Manager (Recommended)

1. **Log into hPanel** → Files → File Manager

2. **Navigate to** `public_html` folder

3. **Upload the following:**

   ```
   public_html/
   ├── dist/                    (frontend build - from npm run build)
   │   ├── assets/
   │   ├── index.html
   │   ├── admin.html
   │   └── ...
   ├── payment/
   │   ├── success.html
   │   └── cancel.html
   ├── .htaccess               (from public folder)
   └── _redirects              (from public folder)
   ```

4. **Create backend folder** in `public_html`:
   ```
   public_html/
   └── backend/
       ├── server.js
       ├── maviance.js
       ├── package.json
       ├── package-lock.json
       └── Procfile
   ```

### Option B: Using FTP/SFTP

Upload the same structure via FTP client (FileZilla, etc.)

---

## Step 4: Configure Node.js in Hostinger

1. **In hPanel**, go to **Advanced** → **Node.js**

2. **Enable Node.js** and select version **18.x** or **20.x**

3. **Set the application root** to:
   ```
   public_html/backend
   ```

4. **Set the application start file** to:
   ```
   server.js
   ```

5. **Install npm dependencies:**
   Click "Run npm install" in the Node.js section

---

## Step 5: Configure Environment Variables in Hostinger

In the Node.js section of hPanel:

1. Click **"Add Environment Variable"**

2. Add these variables:
   - `PORT` = `3000`
   - `APP_URL` = `https://yourdomain.com` (use your actual domain)
   - `SUPABASE_URL` = your Supabase URL
   - `SUPABASE_KEY` = your service role key

3. **Save and Restart** the application

---

## Step 6: Configure Domain SSL/HTTPS

1. **In hPanel**, go to **Websites** → **SSL/HTTPS**

2. **Enable Free SSL** for your domain (Let's Encrypt)

3. Ensure your domain's A record points to Hostinger's nameservers

---

## Step 7: Test Your Deployment

Visit your domain:
- Main site: `https://yourdomain.com`
- Admin panel: `https://yourdomain.com/admin.html`

Test the API:
```bash
curl https://yourdomain.com/api/health
```

Expected response:
```json
{"status":"ok","timestamp":"2024-..."}
```

---

## Important Configuration Notes

### 1. Supabase Configuration

Make sure your Supabase project allows requests from your domain:

1. Go to Supabase Dashboard → **Settings** → **API**
2. Under **CORS**, add your domain:
   ```
   https://yourdomain.com
   ```

### 2. Maviance Payment Callbacks

Update your Maviance/Paycamp dashboard with:
- **Callback URL**: `https://yourdomain.com/api/payment/webhook`
- **Success URL**: `https://yourdomain.com/payment/success.html`
- **Cancel URL**: `https://yourdomain.com/payment/cancel.html`

### 3. CORS Configuration

The server.js is already configured with CORS enabled. If you need to restrict domains:

```javascript
app.use(cors({
  origin: ['https://yourdomain.com', 'https://www.yourdomain.com']
}));
```

---

## Troubleshooting

### "Cannot find module" errors
- Run `npm install` in the backend folder via Hostinger's Node.js section

### 502 Bad Gateway
- Check that Node.js is running in hPanel
- Verify PORT is set to 3000

### Payment not working
- Verify SUPABASE_KEY has service role permissions
- Check Supabase CORS settings

### Static files not loading
- Ensure `dist/` folder is in `public_html/`
- Check that `.htaccess` is in `public_html/`

---

## Project Structure After Deployment

```
public_html/
├── dist/                      # Frontend build
│   ├── assets/
│   ├── index.html
│   └── admin.html
├── payment/
│   ├── success.html
│   └── cancel.html
├── backend/                   # Backend server
│   ├── server.js
│   ├── maviance.js
│   ├── package.json
│   └── node_modules/
├── .htaccess
├── _redirects
└── index.html                 # Should redirect to /dist
```

---

## Security Notes

1. **Never expose** your SUPABASE_SERVICE_ROLE_KEY in frontend code
2. **Keep backend folder** outside of publicly accessible directories if possible
3. **Enable SSL** for all traffic
4. **Regularly update** dependencies for security patches
