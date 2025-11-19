# Vercel Environment Variables Configuration

## Required Environment Variables in Vercel Dashboard

Go to your Vercel project → Settings → Environment Variables and add:

### Production Environment:
```
BACKEND_API_URL=https://audit-portal-production.up.railway.app
NEXT_PUBLIC_API_URL=/api
```

### Preview/Development (Optional):
```
BACKEND_API_URL=https://audit-portal-production.up.railway.app
NEXT_PUBLIC_API_URL=/api
```

## Important Notes:
- **BACKEND_API_URL**: Your Railway backend URL (without `/api` suffix)
- **NEXT_PUBLIC_API_URL**: Keep as `/api` to use Next.js API route proxies
- After adding/updating variables, redeploy your Vercel app

## How to Update:
1. Go to https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Add the variables above
5. Click "Redeploy" on your latest deployment

## Testing:
After deployment, the vote system should work correctly with your Railway backend.
