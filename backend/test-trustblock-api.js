/**
 * Test TrustBlock API with format matching official documentation
 * API Docs: https://docs.trustblock.run/technical/endpoints/create-a-new-audit
 */

const { MongoClient } = require('mongodb');
const https = require('https');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const TRUSTBLOCK_API_KEY = process.env.TRUSTBLOCK_API_KEY;

async function testTrustBlockAPI() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db('auditportal');
    const project = await db.collection('projects').findOne({ slug: 'pecunity' });
    
    if (!project) {
      console.log('❌ Project not found');
      return;
    }
    
    console.log('=== Project Data ===');
    console.log(`Name: ${project.name}`);
    console.log(`Symbol: ${project.symbol}`);
    console.log(`Platform: ${project.platform}`);
    console.log(`Contract: ${project.address || project.contract_info?.contract_address}`);
    console.log(`Website: ${project.socials?.website || ''}`);
    console.log(`Twitter: ${project.socials?.twitter || ''}`);
    console.log(`Telegram: ${project.socials?.telegram || ''}`);
    console.log();
    
    // Format data according to TrustBlock API docs
    const chain = (project.platform || '').toLowerCase()
      .replace(/binance smart chain/i, 'bnbchain')
      .replace(/ethereum/i, 'ethereum')
      .replace(/solana/i, 'solana')
      .replace(/base/i, 'base')
      .replace(/polygon/i, 'polygon')
      .replace(/avalanche/i, 'avalanche')
      .replace(/arbitrum/i, 'arbitrum')
      .replace(/optimism/i, 'optimism');
    
    // Convert audit date to timestamp (use project dates or default to creation date)
    let conductedAt = Date.now();
    if (project.timeline?.audit_release) {
      const auditDate = new Date(project.timeline.audit_release);
      if (!isNaN(auditDate.getTime())) {
        conductedAt = auditDate.getTime();
      }
    } else if (project.createdAt) {
      conductedAt = new Date(project.createdAt).getTime();
    } else if (project.contract_info?.contract_created) {
      conductedAt = new Date(project.contract_info.contract_created).getTime();
    }
    
    // Format issues from cfg_findings
    const issues = [];
    if (project.cfg_findings && Array.isArray(project.cfg_findings)) {
      for (const finding of project.cfg_findings) {
        // Map severity
        let severity = (finding.severity || '').toLowerCase();
        if (severity === 'informational') severity = 'informational';
        
        // Map status
        let status = 'not_fixed'; // default
        if (finding.status === 'Fixed' || finding.status === 'Resolved') {
          status = 'fixed';
        } else if (finding.status === 'Acknowledged') {
          status = 'acknowledged';
        }
        
        issues.push({
          name: finding.title || finding.id,
          description: finding.description || '',
          status: status,
          severity: severity
        });
      }
    }
    
    // Get contract address and socials
    const contractAddress = project.address || project.contract_info?.contract_address || '';
    const website = project.socials?.website || '';
    const twitter = project.socials?.twitter || '';
    let telegram = project.socials?.telegram || '';
    
    // Fix telegram URL format
    if (telegram && !telegram.startsWith('http')) {
      telegram = `https://${telegram}`;
    }
    
    // Use web report with PDF URL from GitHub
    const reportUrl = project.audit_pdf || `https://audit.cfg.ninja/${project.slug}`;
    
    const data = {
      name: project.name,
      description: project.description || `Smart contract audit for ${project.name}`,
      conductedAt: conductedAt,
      reportUrl: reportUrl, // Use web URL instead of CID
      reportType: 'web',
      issues: issues,
      contracts: [
        {
          type: 'onChain',
          chain: chain,
          address: contractAddress
        }
      ],
      project: {
        name: project.name,
        email: 'audit@cfg.ninja', // Required by TrustBlock API
        tags: ['finance', 'security'],
        chains: [chain],
        links: {
          website: website,
          twitter: twitter,
          telegram: telegram
        }
      }
    };
    
    console.log('=== Formatted Data for TrustBlock ===');
    console.log(JSON.stringify(data, null, 2));
    console.log();
    
    // Make API request
    console.log('=== Publishing to TrustBlock ===');
    console.log(`Endpoint: POST https://api.trustblock.run/v1/audit`);
    console.log(`API Key: ${TRUSTBLOCK_API_KEY.substring(0, 10)}...`);
    console.log();
    
    const jsonData = JSON.stringify(data);
    
    const options = {
      hostname: 'api.trustblock.run',
      port: 443,
      path: '/v1/audit',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': jsonData.length,
        'Authorization': `Bearer ${TRUSTBLOCK_API_KEY}`
      }
    };
    
    const response = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: responseData
          });
        });
      });
      
      req.on('error', reject);
      req.write(jsonData);
      req.end();
    });
    
    console.log(`Response Status: ${response.statusCode}`);
    console.log(`Response Body: ${response.body}`);
    console.log();
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      console.log('✅ SUCCESS!');
      const result = JSON.parse(response.body);
      console.log(`Audit ID: ${result.id}`);
      
      // Update database
      await db.collection('projects').updateOne(
        { slug: 'pecunity' },
        {
          $set: {
            trustblock_id: result.id,
            trustblock_url: `https://app.trustblock.run/audit/${result.id}`,
            trustblock_published_at: new Date()
          }
        }
      );
      console.log('Database updated with TrustBlock info');
    } else {
      console.log(`❌ FAILED`);
      console.log(`Error: API Error ${response.statusCode}: ${response.body}`);
      
      console.log('\nPossible issues:');
      console.log('- API key may not have publish permissions');
      console.log('- Project may already exist on TrustBlock');
      console.log('- Required fields may be missing or incorrect');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
  }
}

testTrustBlockAPI();
