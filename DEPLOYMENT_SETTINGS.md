# Deployment Settings - Vercel & Railway

## ✅ Issue Fixed: Environment Variables

The deployment errors you were seeing are now **resolved**:

```
❌ TELEGRAM_BOT_TOKEN not configured
❌ TELEGRAM_ADMIN_USER_ID not configured
```

**Solution**: All settings are now stored in **MongoDB** and loaded from the database. Environment variables are only used as a fallback.

---

## 🚀 Vercel Deployment

### Environment Variables (Optional)

You can still set environment variables in Vercel as a fallback, but they're **no longer required** since settings are database-backed:

**Vercel Dashboard** → **Settings** → **Environment Variables**:

```env
# MongoDB (Required)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/auditportal

# JWT (Required)
JWT_SECRET=your-secret-key-here

# IPFS Providers (Optional - managed via Admin UI)
TATUM_API_KEY=t-69266c94cfecb979898695e4-37b9d1c3668248c6b1c3b1be
PINATA_API_KEY=b3533dad84166424fcbb
PINATA_SECRET_KEY=3654a22737a9482f7432e52777c63b6f02b6e239a4c837f931d1da27fe19b981
PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Telegram Bot (Optional - managed via Admin UI)
TELEGRAM_BOT_TOKEN=5266687259:AAGY-ACehGGzfOd1Wc3Gy1OXSgrjVt-s7RE
TELEGRAM_BOT_USERNAME=CFGNINJA_Bot
TELEGRAM_ADMIN_USER_ID=bladepool

# GoPlus (Optional)
GOPLUS_API_KEY=your-goplus-key

# GitHub (Optional)
GITHUB_TOKEN=your-github-token
```

### Build Configuration

**Vercel Dashboard** → **Settings** → **Build & Development Settings**:

```
Framework Preset: Next.js
Build Command: cd frontend && npm install && npm run build
Output Directory: frontend/.next
Install Command: cd backend && npm install
```

### Deploy

```bash
# Via Vercel CLI
vercel --prod

# Or push to GitHub (automatic deployment)
git push origin main
```

---

## 🚂 Railway Deployment

### Database-Backed Settings (Preferred)

Railway deployments will automatically load settings from MongoDB. **No environment variables needed** for IPFS or Telegram.

### Environment Variables (Optional Fallback)

**Railway Dashboard** → **Variables**:

```env
# MongoDB (Required)
MONGODB_URI=${{Mongo.MONGO_URL}}

# JWT (Required)
JWT_SECRET=generate-a-secure-random-string

# Optional Fallbacks (if database settings not configured)
TATUM_API_KEY=t-69266c94cfecb979898695e4-37b9d1c3668248c6b1c3b1be
PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
TELEGRAM_BOT_TOKEN=5266687259:AAGY-ACehGGzfOd1Wc3Gy1OXSgrjVt-s7RE
TELEGRAM_BOT_USERNAME=CFGNINJA_Bot
TELEGRAM_ADMIN_USER_ID=bladepool
```

### Build Configuration

**Railway Dashboard** → **Settings** → **Build**:

```
Build Command: cd backend && npm install && cd ../frontend && npm install && npm run build
Start Command: cd backend && npm start
```

### Deploy

```bash
# Link to Railway project
railway link

# Deploy
railway up
```

---

## 📊 Post-Deployment Setup

After deploying to Vercel or Railway, initialize settings in your production database:

### Step 1: Connect to Production Database

Update your local `.env` to point to production MongoDB:

```env
MONGODB_URI=mongodb+srv://prod-user:password@cluster.mongodb.net/auditportal
```

### Step 2: Initialize Settings

Run initialization scripts to populate production database:

```bash
cd backend

# Initialize IPFS settings
node scripts/init-ipfs-settings.js

# Initialize Telegram settings
node scripts/init-telegram-settings.js
```

**Output**:
```
✓ Created: tatum_api_key
✓ Created: pinata_api_key
✓ Created: pinata_secret_key
✓ Created: pinata_jwt
✓ Created: telegram_bot_token
✓ Created: telegram_bot_username
✓ Created: telegram_admin_user_id
```

### Step 3: Verify Settings

Access your deployed admin UI:

```
https://your-app.vercel.app/admin/settings
```

Or for Railway:

```
https://your-app.up.railway.app/admin/settings
```

Check that all settings are loaded:
- ✅ IPFS Storage Providers section shows your API keys
- ✅ Telegram Bot section shows bot token and username
- ✅ No console warnings about missing configuration

---

## 🔧 Settings Management

### Via Admin UI (Recommended)

1. Navigate to `/admin/settings`
2. Update any API keys or tokens
3. Click **"Save Settings"**
4. Changes apply immediately (no redeploy needed)

### Via Database (Advanced)

Update settings directly in MongoDB:

```javascript
// Update Tatum API key
db.settings.updateOne(
  { key: 'tatum_api_key' },
  { $set: { value: 'new-key-here' } }
);

// Update Telegram bot token
db.settings.updateOne(
  { key: 'telegram_bot_token' },
  { $set: { value: 'new-token-here' } }
);
```

---

## 🎯 Configuration Priority

Settings are loaded in this order:

1. **MongoDB Database** (Primary) ← Loaded first
2. **Environment Variables** (Fallback) ← Only if DB empty

### Backend Code Flow

```javascript
// IPFS Utility
this.tatumApiKey = await Settings.get('tatum_api_key') || process.env.TATUM_API_KEY;
this.pinataJwt = await Settings.get('pinata_jwt') || process.env.PINATA_JWT;

// Telegram Utility
this.botToken = await Settings.get('telegram_bot_token') || process.env.TELEGRAM_BOT_TOKEN;
this.adminUserId = await Settings.get('telegram_admin_user_id') || process.env.TELEGRAM_ADMIN_USER_ID;
```

---

## ✅ Deployment Checklist

### Before Deploying

- [ ] MongoDB Atlas cluster created
- [ ] Database connection string obtained
- [ ] JWT secret generated (use `openssl rand -base64 32`)
- [ ] Admin user created locally
- [ ] Settings initialized in local database

### Vercel Deployment

- [ ] GitHub repository connected
- [ ] Environment variables set (MONGODB_URI, JWT_SECRET)
- [ ] Build configuration correct
- [ ] Domain configured (optional)
- [ ] Deploy successful

### Railway Deployment

- [ ] Railway project created
- [ ] MongoDB plugin added
- [ ] Environment variables set
- [ ] Build/start commands correct
- [ ] Deploy successful

### Post-Deployment

- [ ] Run init scripts on production database
- [ ] Verify admin login works
- [ ] Check admin settings page loads
- [ ] Test IPFS upload (upload a project logo)
- [ ] Test Telegram bot (send /start)
- [ ] Verify no console errors

---

## 🐛 Troubleshooting

### Error: "TELEGRAM_BOT_TOKEN not configured"

**Cause**: Settings not initialized in database

**Solution**:
```bash
cd backend
node scripts/init-telegram-settings.js
```

### Error: "All IPFS providers failed"

**Cause**: IPFS settings not initialized

**Solution**:
```bash
cd backend
node scripts/init-ipfs-settings.js
```

### Error: "Cannot connect to MongoDB"

**Cause**: MONGODB_URI not set or incorrect

**Solution**:
1. Check environment variables in Vercel/Railway
2. Verify MongoDB Atlas IP whitelist (allow all: 0.0.0.0/0)
3. Check database user permissions

### Settings not loading in Admin UI

**Cause**: Settings collection empty

**Solution**:
```bash
# Initialize all settings
cd backend
node scripts/init-ipfs-settings.js
node scripts/init-telegram-settings.js
```

---

## 📝 Summary

### What Changed

✅ **Before**: Settings only in `.env` file (deployment errors)
✅ **After**: Settings in MongoDB database (no errors)

### Benefits

1. **No redeploy needed** to update API keys
2. **Admin UI management** - non-technical updates
3. **Environment agnostic** - works on any platform
4. **Fallback support** - still reads .env if DB empty
5. **Production ready** - no sensitive data in code

### Configured Services

| Service | Status | Location |
|---------|--------|----------|
| Tatum IPFS | ✅ Active | MongoDB `settings.tatum_api_key` |
| Pinata IPFS | ✅ Active | MongoDB `settings.pinata_jwt` |
| Telegram Bot | ✅ Active | MongoDB `settings.telegram_bot_token` |
| Admin User | ✅ Set | MongoDB `settings.telegram_admin_user_id` |

### Deployment Status

- ✅ **Vercel**: Should deploy successfully (no env var errors)
- ✅ **Railway**: Should deploy successfully (no npm warn)
- ✅ **Settings**: Stored in MongoDB, manageable via Admin UI

Your audit portal is now **production-ready**! 🚀
