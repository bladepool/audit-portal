const https = require('https');

const apiKey = 'zM5ndrJoKeYs8donGFD6hc130l4fBANM4sLBxYDsl6WslH3M';

const testData = {
  "name": "Pecunity",
  "description": "Controlled ERC20 Token with Launch & Transfer Management",
  "reportFileCid": "",
  "issues": [
    {
      "name": "Test Issue",
      "description": "Test description",
      "status": "not_fixed",
      "severity": "low"
    }
  ],
  "contracts": [
    {
      "type": "on_chain",
      "chain": "bnbchain",
      "evmAddress": "0x413c2834f02003752d6Cc0Bcd1cE85Af04D62fBE"
    }
  ],
  "project": {
    "slug": "pecunity-test",
    "name": "Pecunity",
    "description": "Test audit",
    "links": {
      "website": "https://pecunity.io",
      "twitter": "https://x.com/pecunity_app",
      "telegram": "t.me/pecunity"
    },
    "tags": ["finance", "security"]
  }
};

const endpoints = [
  '/audits',
  '/api/audits',
  '/v1/audits',
  '/api/v1/audits',
  '/audit',
  '/api/audit'
];

async function tryEndpoint(path) {
  return new Promise((resolve) => {
    const data = JSON.stringify(testData);
    
    const options = {
      hostname: 'api.trustblock.run',
      port: 443,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'x-api-key': apiKey
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        resolve({
          path: path,
          status: res.statusCode,
          response: responseData
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        path: path,
        status: 'ERROR',
        response: error.message
      });
    });

    req.write(data);
    req.end();
  });
}

async function testAllEndpoints() {
  console.log('Testing TrustBlock API endpoints...\n');
  
  for (const endpoint of endpoints) {
    console.log(`Testing: ${endpoint}`);
    const result = await tryEndpoint(endpoint);
    console.log(`  Status: ${result.status}`);
    console.log(`  Response: ${result.response.substring(0, 200)}`);
    console.log('');
    
    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

testAllEndpoints();
