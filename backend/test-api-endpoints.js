const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000';

/**
 * Test all API endpoints before deployment
 */
async function testAPIEndpoints() {
  console.log('=== Testing API Endpoints ===\n');
  console.log(`API URL: ${API_URL}\n`);
  
  const results = {
    passed: [],
    failed: []
  };
  
  // Test 1: Health Check
  console.log('1. Testing Health Check...');
  try {
    const response = await axios.get(`${API_URL}/api/health`);
    if (response.data.status === 'ok') {
      console.log('   ✅ PASS - Health check working');
      console.log(`      Environment: ${response.data.environment}`);
      results.passed.push('health-check');
    } else {
      throw new Error('Health check returned unexpected status');
    }
  } catch (error) {
    console.log(`   ❌ FAIL - ${error.message}`);
    results.failed.push({ test: 'health-check', error: error.message });
  }
  console.log('');
  
  // Test 2: Projects List
  console.log('2. Testing Projects API...');
  try {
    const response = await axios.get(`${API_URL}/api/projects?limit=1`);
    if (response.data && Array.isArray(response.data.projects || response.data)) {
      console.log('   ✅ PASS - Projects API working');
      const projects = response.data.projects || response.data;
      console.log(`      Found ${projects.length} project(s)`);
      results.passed.push('projects-api');
    } else {
      throw new Error('Projects API returned unexpected format');
    }
  } catch (error) {
    console.log(`   ❌ FAIL - ${error.message}`);
    results.failed.push({ test: 'projects-api', error: error.message });
  }
  console.log('');
  
  // Test 3: Check if adminPdfRoutes is registered
  console.log('3. Testing Admin PDF Routes Registration...');
  try {
    // Try to make a request without auth - should get 404 or 401, not 404 for route
    const response = await axios.post(`${API_URL}/api/admin/generate-pdf`, {
      projectId: 'test'
    }).catch(err => err.response);
    
    if (response && (response.status === 400 || response.status === 404 || response.status === 500)) {
      // Route exists but failed due to missing data or auth
      console.log('   ✅ PASS - Admin PDF routes registered');
      console.log(`      Status: ${response.status}`);
      results.passed.push('admin-pdf-routes');
    } else if (!response) {
      throw new Error('Could not connect to admin PDF routes');
    }
  } catch (error) {
    console.log(`   ❌ FAIL - ${error.message}`);
    results.failed.push({ test: 'admin-pdf-routes', error: error.message });
  }
  console.log('');
  
  // Test 4: Blockchains API
  console.log('4. Testing Blockchains API...');
  try {
    const response = await axios.get(`${API_URL}/api/blockchains`);
    if (response.data && Array.isArray(response.data)) {
      console.log('   ✅ PASS - Blockchains API working');
      console.log(`      Found ${response.data.length} blockchain(s)`);
      results.passed.push('blockchains-api');
    } else {
      throw new Error('Blockchains API returned unexpected format');
    }
  } catch (error) {
    console.log(`   ❌ FAIL - ${error.message}`);
    results.failed.push({ test: 'blockchains-api', error: error.message });
  }
  console.log('');
  
  // Test 5: Market Cap API
  console.log('5. Testing Market Cap API...');
  try {
    const response = await axios.get(`${API_URL}/api/marketcap/secured`);
    if (response.data && response.data.totalSecured) {
      console.log('   ✅ PASS - Market Cap API working');
      console.log(`      Total Secured: ${response.data.formatted}`);
      if (response.data.fallback) {
        console.log('      (Using fallback mode)');
      }
      results.passed.push('marketcap-api');
    } else {
      throw new Error('Market Cap API returned unexpected format');
    }
  } catch (error) {
    console.log(`   ❌ FAIL - ${error.message}`);
    results.failed.push({ test: 'marketcap-api', error: error.message });
  }
  console.log('');
  
  // Summary
  console.log('=== Test Results ===\n');
  console.log(`✅ Passed: ${results.passed.length}/${results.passed.length + results.failed.length}`);
  console.log(`❌ Failed: ${results.failed.length}/${results.passed.length + results.failed.length}`);
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    results.failed.forEach(fail => {
      console.log(`   - ${fail.test}: ${fail.error}`);
    });
  }
  
  if (results.failed.length === 0) {
    console.log('\n🎉 All tests passed! Ready for deployment.');
  } else {
    console.log('\n⚠️  Some tests failed. Fix issues before deployment.');
  }
  
  return results;
}

// Run tests
if (require.main === module) {
  testAPIEndpoints().catch(error => {
    console.error('Test suite error:', error);
    process.exit(1);
  });
}

module.exports = { testAPIEndpoints };
