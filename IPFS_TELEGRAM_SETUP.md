# IPFS Logo Upload & Telegram Audit Request Setup Guide

## Overview
This guide helps you set up:
1. **IPFS Logo Upload** - Upload project and advertisement logos to decentralized storage
2. **Telegram Bot Integration** - Allow users to request audits via Telegram

---

## 🔧 Installation

### 1. Install Dependencies

```bash
cd g:\auditportal\backend
npm install sharp form-data
```

### 2. Environment Configuration

Copy the example environment file and configure it:

```bash
copy .env.example .env
```

Then edit `.env` with your API keys (see sections below).

---

## 📦 IPFS Storage Setup

Choose **ONE or MORE** providers below. The system will automatically fallback to the next provider if one fails.

### Option 1: Tatum (Recommended - Easiest)

**Free Tier:** 50MB/month  
**Docs:** https://docs.tatum.io/docs/nft-how-to-store-metadata-ipfs-and-limits

**Setup Steps:**
1. Create account at https://dashboard.tatum.io/
2. Go to API Keys section
3. Create a new API key
4. Copy the API key
5. Add to `.env`:
   ```env
   TATUM_API_KEY=your_api_key_here
   ```

### Option 2: Pinata (Best for More Storage)

**Free Tier:** 1GB storage, unlimited bandwidth  
**Docs:** https://docs.pinata.cloud/

**Setup Steps:**
1. Create account at https://app.pinata.cloud/
2. Go to API Keys → New Key
3. Enable "pinFileToIPFS" permission
4. Copy API Key and Secret Key
5. Add to `.env`:
   ```env
   PINATA_API_KEY=your_api_key_here
   PINATA_SECRET_KEY=your_secret_key_here
   ```

### Option 3: Web3.Storage (Best for Unlimited Storage)

**Free Tier:** Unlimited storage  
**Docs:** https://web3.storage/docs/

**Setup Steps:**
1. Create account at https://web3.storage/
2. Go to Account → Create API Token
3. Copy the token
4. Add to `.env`:
   ```env
   WEB3_STORAGE_TOKEN=your_token_here
   ```

### Option 4: NFT.Storage (Alternative)

**Free Tier:** Unlimited for NFT metadata  
**Docs:** https://nft.storage/docs/

**Setup Steps:**
1. Create account at https://nft.storage/
2. Go to API Keys → New API Key
3. Copy the API key
4. Add to `.env`:
   ```env
   NFT_STORAGE_TOKEN=your_token_here
   ```

---

## 🤖 Telegram Bot Setup

### Step 1: Create Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Send `/newbot` command
3. Follow instructions:
   - Choose a name: `CFG Ninja Audit Bot`
   - Choose a username: `cfgninja_audit_bot` (must end with 'bot')
4. Copy the **Bot Token** (looks like: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)
5. Send `/setdescription` to add a description
6. Send `/setabouttext` to add about text

### Step 2: Get Your User ID

1. Search for **@userinfobot** on Telegram
2. Start the bot
3. It will show your User ID (e.g., `123456789`)
4. This is your admin ID

### Step 3: Configure Environment

Add to `.env`:
```env
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_BOT_USERNAME=cfgninja_audit_bot
TELEGRAM_ADMIN_USER_ID=123456789
```

### Step 4: Set Webhook (Production Only)

For production, set up a webhook:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://yourdomain.com/api/audit-request/webhook"}'
```

---

## 🚀 Testing

### Test IPFS Upload

```bash
# Test bot info
curl http://localhost:3001/api/audit-request/bot-info

# Test upload (with an image file)
curl -X POST http://localhost:3001/api/upload/logo/project/<project_id> \
  -F "logo=@path/to/image.png"
```

### Test Telegram Bot

1. **Start your backend:**
   ```bash
   cd g:\auditportal\backend
   npm start
   ```

2. **Find your bot on Telegram:**
   - Search for `@cfgninja_audit_bot` (or your bot username)
   - Send `/start` command
   - You should receive a welcome message

3. **Test audit request:**
   ```bash
   curl -X POST http://localhost:3001/api/audit-request \
     -H "Content-Type: application/json" \
     -d '{
       "projectName": "Test Project",
       "symbol": "TEST",
       "blockchain": "Ethereum",
       "website": "https://test.com",
       "description": "This is a test audit request"
     }'
   ```

4. Check your Telegram - you should receive a message!

---

## 📝 API Documentation

### Upload Logo to Project

**Endpoint:** `POST /api/upload/logo/project/:id`

**Headers:**
- `Content-Type: multipart/form-data`

**Body:**
- `logo`: Image file (max 10MB)

**Response:**
```json
{
  "success": true,
  "message": "Logo uploaded successfully",
  "project": {
    "id": "...",
    "name": "Project Name",
    "logo": "https://ipfs.io/ipfs/Qm...",
    "ipfsHash": "Qm...",
    "provider": "tatum",
    "gatewayUrl": "https://gateway.pinata.cloud/ipfs/Qm..."
  }
}
```

### Upload Logo to Advertisement

**Endpoint:** `POST /api/upload/logo/advertisement/:id`

**Headers:**
- `Content-Type: multipart/form-data`

**Body:**
- `logo`: Image file (max 10MB)

**Response:** Same format as project upload

### Submit Audit Request

**Endpoint:** `POST /api/audit-request`

**Headers:**
- `Content-Type: application/json`

**Body:**
```json
{
  "projectName": "My Project",
  "symbol": "MYP",
  "contractAddress": "0x...",
  "blockchain": "Ethereum",
  "website": "https://myproject.com",
  "telegram": "https://t.me/myproject",
  "twitter": "https://twitter.com/myproject",
  "email": "contact@myproject.com",
  "description": "Project description",
  "userTelegramId": "123456789"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Audit request submitted successfully",
  "data": {
    "projectName": "My Project",
    "submittedAt": "2025-11-25T..."
  }
}
```

### Get Telegram Link

**Endpoint:** `GET /api/audit-request/telegram-link?projectName=Test&blockchain=Ethereum`

**Response:**
```json
{
  "success": true,
  "telegramLink": "https://t.me/your_bot?start=...",
  "payload": { ... }
}
```

---

## 🎨 Frontend Integration

### Logo Upload Component Example

```typescript
// Upload logo function
async function uploadLogo(projectId: string, file: File) {
  const formData = new FormData();
  formData.append('logo', file);

  const response = await fetch(`/api/upload/logo/project/${projectId}`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  return data;
}

// Usage in component
const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    const result = await uploadLogo(projectId, file);
    console.log('Uploaded to:', result.project.logo);
    // Update UI with new logo URL
  } catch (error) {
    console.error('Upload failed:', error);
  }
};

return (
  <input 
    type="file" 
    accept="image/*" 
    onChange={handleLogoUpload}
  />
);
```

### Audit Request Button Example

```typescript
// Request audit via Telegram
async function requestAudit(data: AuditRequestData) {
  const response = await fetch('/api/audit-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  return await response.json();
}

// Usage in component
const handleRequestAudit = async () => {
  try {
    const result = await requestAudit({
      projectName: 'My Project',
      blockchain: 'Ethereum',
      website: 'https://myproject.com',
      description: 'Please audit our smart contract',
    });

    alert('Audit request submitted! We will contact you on Telegram.');
  } catch (error) {
    console.error('Request failed:', error);
  }
};

// Or generate Telegram link
const getTelegramLink = async () => {
  const params = new URLSearchParams({
    projectName: 'My Project',
    blockchain: 'Ethereum',
  });

  const response = await fetch(`/api/audit-request/telegram-link?${params}`);
  const data = await response.json();
  
  // Open Telegram
  window.open(data.telegramLink, '_blank');
};
```

---

## 🔒 Security Notes

1. **Never commit `.env` file** - Add to `.gitignore`
2. **Rotate API keys** periodically
3. **Use webhook** for production (not polling)
4. **Validate file uploads** - Already handled by multer middleware
5. **Rate limit** requests in production

---

## 🐛 Troubleshooting

### IPFS Upload Fails

**Problem:** All providers fail  
**Solution:**
1. Check API keys are correct in `.env`
2. Check internet connection
3. Check provider status pages
4. Enable at least 2 providers for redundancy

### Telegram Bot Not Responding

**Problem:** Bot doesn't reply to messages  
**Solution:**
1. Verify `TELEGRAM_BOT_TOKEN` is correct
2. Make sure backend is running
3. Check bot is not banned/restricted
4. Send `/start` command first

### Image Too Large

**Problem:** Upload fails with "File too large"  
**Solution:**
- Images are automatically resized to 512x512 (projects) or 800x400 (ads)
- Max file size is 10MB
- Use JPG/PNG format

---

## 📊 Provider Comparison

| Provider | Free Storage | Bandwidth | Speed | Reliability |
|----------|-------------|-----------|-------|-------------|
| **Tatum** | 50MB/month | Limited | Fast | ⭐⭐⭐⭐ |
| **Pinata** | 1GB | Unlimited | Fast | ⭐⭐⭐⭐⭐ |
| **Web3.Storage** | Unlimited | Good | Medium | ⭐⭐⭐⭐ |
| **NFT.Storage** | Unlimited | Good | Medium | ⭐⭐⭐⭐ |

**Recommendation:** Set up **Tatum** (quick start) + **Pinata** (backup) for best reliability.

---

## 🎯 Next Steps

1. ✅ Install dependencies
2. ✅ Configure environment variables
3. ✅ Set up at least ONE IPFS provider
4. ✅ Create Telegram bot
5. ⬜ Add upload UI to admin pages
6. ⬜ Add "Request Audit" button to frontend
7. ⬜ Test everything!

---

## 📞 Support

- **Tatum Support:** https://discord.gg/tatum
- **Pinata Support:** https://discord.gg/pinata
- **Telegram Bot Issues:** https://core.telegram.org/bots/faq

---

**Created:** November 25, 2025  
**Status:** Ready to use ✅
