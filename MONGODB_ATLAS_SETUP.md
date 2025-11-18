# 🗄️ MongoDB Atlas Quick Setup (5 Minutes)

MongoDB Atlas is a free cloud database - perfect for development and testing!

## Step-by-Step Setup

### 1. Create Account (2 minutes)
1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Sign up with email or Google
3. Verify your email

### 2. Create Free Cluster (3 minutes)
1. Click **"Build a Database"** (green button)
2. Choose **"M0 FREE"** tier
3. Select a cloud provider (AWS recommended)
4. Choose region closest to you
5. Click **"Create"** button
6. Wait 3-5 minutes for cluster creation

### 3. Create Database User
1. Click **"Security"** → **"Database Access"**
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Username: `auditadmin`
5. Password: Click **"Autogenerate Secure Password"** and **COPY IT**
6. User Privileges: **"Atlas admin"**
7. Click **"Add User"**

### 4. Allow Network Access
1. Click **"Security"** → **"Network Access"**
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (for development)
4. Click **"Confirm"**

### 5. Get Connection String
1. Click **"Database"** in left sidebar
2. Click **"Connect"** button on your cluster
3. Choose **"Connect your application"**
4. Driver: **Node.js**
5. Version: **4.1 or later**
6. **Copy the connection string**

It looks like:
```
mongodb+srv://auditadmin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

### 6. Update Your Project

1. Open `g:\auditportal\backend\.env` in text editor
2. Replace the MONGODB_URI line with your connection string
3. **IMPORTANT:** Replace `<password>` with the password you copied

Example:
```env
PORT=5000
MONGODB_URI=mongodb+srv://auditadmin:YourActualPassword123@cluster0.xxxxx.mongodb.net/audit-portal?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Note:** Add `/audit-portal` before the `?` to specify the database name.

### 7. Test Connection

```powershell
cd g:\auditportal\backend
node seed.js
```

You should see:
```
✅ Connected to MongoDB
✅ Admin user created successfully
📧 Email: admin@cfg.ninja
🔑 Password: admin123
```

## ✅ You're Done!

Your database is now in the cloud and ready to use!

## 🔧 Troubleshooting

### "MongoServerError: bad auth"
- Check that you replaced `<password>` with actual password
- Password cannot contain special characters like `@` or `:`
- Generate a new password if needed

### "Connection timeout"
- Check Network Access settings
- Make sure "Allow Access from Anywhere" is enabled
- Wait a few minutes and try again

### "Cannot find database"
- Make sure you added `/audit-portal` to the connection string
- It should end with: `.../audit-portal?retryWrites=true...`

## 💡 Tips

- **Free tier limits:** 512MB storage (plenty for development)
- **Keep your password safe:** Don't commit .env files to git
- **Monitor usage:** Check Atlas dashboard for storage/connection stats
- **Backup:** Atlas automatically backs up free clusters

## 🎯 Next Steps

After MongoDB is connected:

1. ✅ MongoDB Atlas setup (you just did this!)
2. Update Node.js to v18+ (if needed)
3. Run `node seed.js` to create admin user
4. Run `npm run dev` to start the app
5. Visit http://localhost:3000

---

**Estimated setup time: 5-10 minutes | No credit card required!**
