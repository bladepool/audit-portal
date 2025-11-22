/**
 * Deployment Monitoring Script
 * Fetches and displays errors from Railway and Vercel
 */

const https = require('https');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Configuration
const RAILWAY_PROJECT_ID = '4c19191a-6ce6-438e-9050-c0ff5f5d0697';
const RAILWAY_ENVIRONMENT_ID = '364d4b92-26a2-405a-af83-ff2a0f034d73';
const RAILWAY_SERVICE_ID = 'aa5a22f8-0f93-45d7-a77d-0c843bf6cde3';
const VERCEL_URL = 'https://audit-portal-gamma.vercel.app';
const RAILWAY_URL = 'https://audit-portal-production.up.railway.app';

console.log('🔍 Deployment Monitoring Tool\n');
console.log('=' .repeat(80));

/**
 * Test Railway Backend Health
 */
async function testRailwayHealth() {
  console.log('\n📡 Testing Railway Backend...');
  console.log('URL:', RAILWAY_URL);
  
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    https.get(`${RAILWAY_URL}/api/health`, (res) => {
      const duration = Date.now() - startTime;
      let data = '';
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Railway Backend: ONLINE');
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Response Time: ${duration}ms`);
          try {
            const json = JSON.parse(data);
            console.log(`   Environment: ${json.environment || 'unknown'}`);
            console.log(`   Timestamp: ${json.timestamp || 'unknown'}`);
          } catch (e) {
            console.log('   Response:', data);
          }
          resolve({ status: 'online', code: res.statusCode, data });
        } else {
          console.log('⚠️  Railway Backend: RESPONDING BUT UNHEALTHY');
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Response: ${data}`);
          resolve({ status: 'unhealthy', code: res.statusCode, data });
        }
      });
    }).on('error', (err) => {
      console.log('❌ Railway Backend: OFFLINE');
      console.log(`   Error: ${err.message}`);
      console.log(`   Code: ${err.code}`);
      resolve({ status: 'offline', error: err.message, code: err.code });
    });
  });
}

/**
 * Test Railway API Endpoints
 */
async function testRailwayEndpoints() {
  console.log('\n🔌 Testing Railway API Endpoints...');
  
  const endpoints = [
    '/api/projects?limit=1',
    '/api/marketcap/secured',
    '/api/blockchains'
  ];
  
  for (const endpoint of endpoints) {
    await new Promise((resolve) => {
      https.get(`${RAILWAY_URL}${endpoint}`, (res) => {
        if (res.statusCode === 200) {
          console.log(`✅ ${endpoint} - OK`);
        } else {
          console.log(`⚠️  ${endpoint} - Status ${res.statusCode}`);
        }
        res.on('data', () => {});
        res.on('end', resolve);
      }).on('error', (err) => {
        console.log(`❌ ${endpoint} - ${err.message}`);
        resolve();
      });
    });
  }
}

/**
 * Test Vercel Frontend
 */
async function testVercelFrontend() {
  console.log('\n🌐 Testing Vercel Frontend...');
  console.log('URL:', VERCEL_URL);
  
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    https.get(VERCEL_URL, (res) => {
      const duration = Date.now() - startTime;
      
      if (res.statusCode === 200) {
        console.log('✅ Vercel Frontend: ONLINE');
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   Response Time: ${duration}ms`);
      } else {
        console.log('⚠️  Vercel Frontend: UNHEALTHY');
        console.log(`   Status: ${res.statusCode}`);
      }
      
      res.on('data', () => {});
      res.on('end', () => resolve({ status: res.statusCode === 200 ? 'online' : 'unhealthy', code: res.statusCode }));
    }).on('error', (err) => {
      console.log('❌ Vercel Frontend: OFFLINE');
      console.log(`   Error: ${err.message}`);
      resolve({ status: 'offline', error: err.message });
    });
  });
}

/**
 * Check Railway Deployment Status via CLI
 */
async function checkRailwayDeployment() {
  console.log('\n🚂 Checking Railway Deployment Status...');
  
  try {
    // Try to get Railway CLI status
    const { stdout, stderr } = await execPromise('railway status 2>&1');
    
    if (stdout.includes('Not logged in') || stderr.includes('Not logged in')) {
      console.log('⚠️  Railway CLI not authenticated');
      console.log('   Run: railway login');
      return null;
    }
    
    if (stdout.includes('Error') || stderr.includes('Error')) {
      console.log('⚠️  Railway CLI error:', stderr || stdout);
      return null;
    }
    
    console.log('Railway CLI Status:');
    console.log(stdout);
    return stdout;
    
  } catch (error) {
    if (error.message.includes('railway: not found') || error.message.includes('is not recognized')) {
      console.log('ℹ️  Railway CLI not installed');
      console.log('   Install: npm install -g @railway/cli');
    } else {
      console.log('⚠️  Could not check Railway CLI:', error.message);
    }
    return null;
  }
}

/**
 * Get Recent Git Commits
 */
async function getRecentCommits() {
  console.log('\n📝 Recent Commits (Last 5)...');
  
  try {
    const { stdout } = await execPromise('git log --oneline -5');
    console.log(stdout.trim());
  } catch (error) {
    console.log('⚠️  Could not fetch git commits:', error.message);
  }
}

/**
 * Check Environment Configuration
 */
async function checkEnvironment() {
  console.log('\n⚙️  Environment Configuration...');
  
  // Try to load .env if dotenv is available
  try {
    require('dotenv').config();
  } catch (e) {
    // dotenv not available, skip
  }
  
  const checks = {
    'MONGODB_URI': process.env.MONGODB_URI ? '✅ Set' : '❌ Missing',
    'FRONTEND_URL': process.env.FRONTEND_URL || 'Not set (using default)',
    'PORT': process.env.PORT || '5000 (default)',
    'NODE_ENV': process.env.NODE_ENV || 'Not set'
  };
  
  for (const [key, value] of Object.entries(checks)) {
    if (key === 'MONGODB_URI' && process.env.MONGODB_URI) {
      const masked = process.env.MONGODB_URI.replace(/:[^@]+@/, ':****@');
      console.log(`   ${key}: ${masked}`);
    } else {
      console.log(`   ${key}: ${value}`);
    }
  }
}

/**
 * CORS Test
 */
async function testCORS() {
  console.log('\n🔒 Testing CORS Configuration...');
  
  // Simulate a CORS request from Vercel
  const options = {
    hostname: new URL(RAILWAY_URL).hostname,
    path: '/api/health',
    method: 'GET',
    headers: {
      'Origin': VERCEL_URL,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }
  };
  
  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      const corsHeader = res.headers['access-control-allow-origin'];
      
      if (corsHeader) {
        if (corsHeader === VERCEL_URL || corsHeader === '*') {
          console.log('✅ CORS: Properly configured');
          console.log(`   Access-Control-Allow-Origin: ${corsHeader}`);
        } else {
          console.log('⚠️  CORS: Configured but not for Vercel');
          console.log(`   Access-Control-Allow-Origin: ${corsHeader}`);
          console.log(`   Expected: ${VERCEL_URL}`);
        }
      } else {
        console.log('❌ CORS: No Access-Control-Allow-Origin header');
        console.log('   This will cause frontend to fail!');
      }
      
      res.on('data', () => {});
      res.on('end', resolve);
    });
    
    req.on('error', (err) => {
      console.log('❌ CORS Test Failed:', err.message);
      resolve();
    });
    
    req.end();
  });
}

/**
 * Summary and Recommendations
 */
function printSummary(results) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY\n');
  
  const issues = [];
  const warnings = [];
  
  if (results.railway?.status !== 'online') {
    issues.push('Railway backend is not responding');
  }
  
  if (results.vercel?.status !== 'online') {
    issues.push('Vercel frontend is not accessible');
  }
  
  if (issues.length === 0) {
    console.log('✅ All systems operational!');
  } else {
    console.log('❌ Issues Detected:');
    issues.forEach(issue => console.log(`   • ${issue}`));
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach(warning => console.log(`   • ${warning}`));
  }
  
  console.log('\n💡 Recommendations:');
  
  if (results.railway?.status === 'offline') {
    console.log('   1. Check Railway dashboard logs');
    console.log('   2. Verify MONGODB_URI is set in Railway environment variables');
    console.log('   3. Check if latest deployment succeeded');
    console.log('   4. Review Railway deployment logs for module errors');
  }
  
  console.log('\n🔗 Quick Links:');
  console.log(`   Railway Dashboard: https://railway.app/project/${RAILWAY_PROJECT_ID}`);
  console.log(`   Vercel Dashboard: https://vercel.com/dashboard`);
  console.log(`   Frontend: ${VERCEL_URL}`);
  console.log(`   Backend: ${RAILWAY_URL}/api/health`);
}

/**
 * Main execution
 */
async function main() {
  const results = {};
  
  // Run all checks
  await checkEnvironment();
  await getRecentCommits();
  results.railway = await testRailwayHealth();
  
  if (results.railway.status === 'online') {
    await testRailwayEndpoints();
    await testCORS();
  }
  
  results.vercel = await testVercelFrontend();
  await checkRailwayDeployment();
  
  // Print summary
  printSummary(results);
  
  console.log('\n' + '='.repeat(80));
  console.log('✨ Monitoring complete!');
}

// Run the monitoring
main().catch(console.error);
