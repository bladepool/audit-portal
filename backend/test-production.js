const https = require('https');

const FRONTEND_URL = 'https://audit-portal-gamma.vercel.app';
const BACKEND_URL = 'https://audit-portal-production.up.railway.app'; // Update if different

console.log('🧪 Testing Production Deployment...\n');

// Test 1: Frontend Health
function testFrontend() {
  return new Promise((resolve, reject) => {
    console.log('1️⃣ Testing Frontend...');
    https.get(FRONTEND_URL, (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Frontend is live:', FRONTEND_URL);
        console.log(`   Status: ${res.statusCode}`);
        resolve();
      } else {
        console.log('⚠️  Frontend returned:', res.statusCode);
        resolve();
      }
    }).on('error', (err) => {
      console.log('❌ Frontend error:', err.message);
      reject(err);
    });
  });
}

// Test 2: Backend Health
function testBackendHealth() {
  return new Promise((resolve, reject) => {
    console.log('\n2️⃣ Testing Backend Health...');
    https.get(`${BACKEND_URL}/api/health`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Backend health check passed');
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Response:`, JSON.parse(data));
          resolve();
        } else {
          console.log('⚠️  Backend health returned:', res.statusCode);
          resolve();
        }
      });
    }).on('error', (err) => {
      console.log('❌ Backend health check failed:', err.message);
      reject(err);
    });
  });
}

// Test 3: Projects API
function testProjectsAPI() {
  return new Promise((resolve, reject) => {
    console.log('\n3️⃣ Testing Projects API...');
    https.get(`${BACKEND_URL}/api/projects?limit=5`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const projects = JSON.parse(data);
          console.log('✅ Projects API working');
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Total projects: ${projects.total || 'N/A'}`);
          console.log(`   Returned: ${projects.projects?.length || 0} projects`);
          if (projects.projects && projects.projects.length > 0) {
            console.log(`   Sample project: ${projects.projects[0].name}`);
          }
          resolve();
        } else {
          console.log('⚠️  Projects API returned:', res.statusCode);
          resolve();
        }
      });
    }).on('error', (err) => {
      console.log('❌ Projects API failed:', err.message);
      reject(err);
    });
  });
}

// Test 4: Admin PDF Route (check if route exists)
function testAdminPdfRoute() {
  return new Promise((resolve, reject) => {
    console.log('\n4️⃣ Testing Admin PDF Route...');
    
    const postData = JSON.stringify({
      projectId: 'test-id-for-route-check',
      uploadToGitHub: false
    });
    
    const options = {
      hostname: BACKEND_URL.replace('https://', '').replace('http://', ''),
      path: '/api/admin/generate-pdf',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 401 || res.statusCode === 403) {
          console.log('✅ Admin PDF route exists (requires auth)');
          console.log(`   Status: ${res.statusCode} (expected - no auth token)`);
          resolve();
        } else if (res.statusCode === 404) {
          console.log('❌ Admin PDF route NOT FOUND');
          console.log(`   Status: ${res.statusCode}`);
          resolve();
        } else {
          console.log('✅ Admin PDF route responding');
          console.log(`   Status: ${res.statusCode}`);
          try {
            console.log(`   Response:`, JSON.parse(data));
          } catch (e) {
            console.log(`   Response:`, data.substring(0, 100));
          }
          resolve();
        }
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ Admin PDF route error:', err.message);
      reject(err);
    });
    
    req.write(postData);
    req.end();
  });
}

// Test 5: Admin Page Frontend
function testAdminPage() {
  return new Promise((resolve, reject) => {
    console.log('\n5️⃣ Testing Admin Page...');
    https.get(`${FRONTEND_URL}/admin`, (res) => {
      if (res.statusCode === 200 || res.statusCode === 307) {
        console.log('✅ Admin page accessible');
        console.log(`   Status: ${res.statusCode}`);
        resolve();
      } else {
        console.log('⚠️  Admin page returned:', res.statusCode);
        resolve();
      }
    }).on('error', (err) => {
      console.log('❌ Admin page error:', err.message);
      reject(err);
    });
  });
}

// Run all tests
async function runTests() {
  try {
    await testFrontend();
    await testBackendHealth();
    await testProjectsAPI();
    await testAdminPdfRoute();
    await testAdminPage();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Production Test Summary');
    console.log('='.repeat(60));
    console.log('✅ All tests completed!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Visit:', FRONTEND_URL);
    console.log('   2. Go to /admin and login');
    console.log('   3. Edit a project and look for "Upload to GitHub" checkbox');
    console.log('   4. Test PDF generation with GitHub upload');
    console.log('\n💡 Note: If admin PDF route shows 404, the deployment may still be in progress.');
    console.log('   Wait a few minutes and run this test again.');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

runTests();
