const https = require('https');

const BACKEND_URL = 'https://audit-portal-production.up.railway.app';

let attempts = 0;
const maxAttempts = 20; // 20 attempts = ~3 minutes

function checkBackend() {
  return new Promise((resolve) => {
    attempts++;
    console.log(`\n[Attempt ${attempts}/${maxAttempts}] Checking backend status...`);
    
    https.get(`${BACKEND_URL}/api/health`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Backend is LIVE!');
          console.log('Response:', JSON.parse(data));
          resolve(true);
        } else if (res.statusCode === 502) {
          console.log(`⏳ Still deploying... (502 error)`);
          resolve(false);
        } else {
          console.log(`⚠️  Unexpected status: ${res.statusCode}`);
          console.log('Response:', data);
          resolve(false);
        }
      });
    }).on('error', (err) => {
      console.log('❌ Connection error:', err.message);
      resolve(false);
    });
  });
}

async function monitorDeployment() {
  console.log('🔍 Monitoring Railway Deployment Status');
  console.log('Backend URL:', BACKEND_URL);
  console.log('Checking every 10 seconds...\n');
  
  while (attempts < maxAttempts) {
    const isLive = await checkBackend();
    
    if (isLive) {
      console.log('\n🎉 Deployment successful!');
      console.log('\n📋 Next steps:');
      console.log('   1. Run: node test-production.js');
      console.log('   2. Visit: https://audit-portal-gamma.vercel.app/admin');
      console.log('   3. Test PDF generation feature');
      process.exit(0);
    }
    
    if (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    }
  }
  
  console.log('\n⚠️  Deployment taking longer than expected');
  console.log('Please check Railway dashboard: https://railway.app/dashboard');
  console.log('Look for build/deploy logs for errors');
}

monitorDeployment();
