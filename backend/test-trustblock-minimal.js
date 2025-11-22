const { MongoClient } = require('mongodb');
const { TrustBlockAPI } = require('./src/services/trustBlockService');
require('dotenv').config();

async function testWithMinimalData() {
  const client = new MongoClient(process.env.MONGODB_URI);
  const apiKey = process.env.TRUSTBLOCK_API_KEY || 'zM5ndrJoKeYs8donGFD6hc130l4fBANM4sLBxYDsl6WslH3M';
  const api = new TrustBlockAPI(apiKey);
  
  try {
    await client.connect();
    const db = client.db('auditportal');
    
    const project = await db.collection('projects').findOne({ slug: 'pecunity' });
    
    if (!project) {
      console.log('Project not found');
      return;
    }
    
    console.log('Testing with minimal valid data structure...\n');
    
    // Based on validation errors, let's try the simplest possible valid request
    const minimalData = {
      name: "Pecunity Security Audit",
      description: "Smart contract security audit conducted by CFG Ninja",
      conductedAt: Date.parse(project.audit_release_date || project.createdAt) || Date.now() - 86400000,
      reportType: "web",
      reportUrl: `https://audit.cfg.ninja/${project.slug}`,
      
      project: {
        name: "Pecunity",
        email: "contact@cfg.ninja",
        chains: ["ethereum"], // Try with ethereum first to find valid format
        tags: [],
        links: {
          website: "https://pecunity.io",
          twitter: "https://x.com/pecunity_app",
          telegram: "https://t.me/pecunity",
          github: "https://github.com/Pecunity/pecunity-protocol",
          discord: "https://discord.gg/pecunity",
          youtube: "https://youtube.com/pecunity",
          linkedIn: "https://linkedin.com/company/pecunity"
        }
      },
      
      contracts: [{
        type: "onChain",
        chain: "ethereum",
        address: project.contract_address || "0x413c2834f02003752d6Cc0Bcd1cE85Af04D62fBE"
      }],
      
      issues: [{
        name: "Critical Issue Example",
        description: "Example critical finding",
        status: "fixed", // Try different status values
        severity: "critical" // Try explicit severity
      }]
    };
    
    console.log('Data:', JSON.stringify(minimalData, null, 2));
    console.log('\nPublishing...\n');
    
    try {
      const result = await api.publishReport(minimalData);
      console.log('✅ SUCCESS!');
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.log('❌ Error:', error.message);
      
      // Try to extract specific field errors
      try {
        const errorJson = JSON.parse(error.message.split('API Error 400: ')[1] || '{}');
        if (errorJson.diagnoses) {
          console.log('\nValidation Errors:');
          errorJson.diagnoses.forEach(d => {
            console.log(`  - ${d.name}: ${d.message}`);
          });
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
    
  } finally {
    await client.close();
  }
}

testWithMinimalData();
