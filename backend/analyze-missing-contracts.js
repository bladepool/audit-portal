/**
 * Analyze which projects are missing contracts
 * and where we might find them
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');

async function analyzeNoContractProjects() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db('auditportal');
    
    // Get all projects without contracts
    const noContractProjects = await db.collection('projects').find({
      published: true,
      $or: [
        { 'contract_info.contract_address': { $exists: false } },
        { 'contract_info.contract_address': null },
        { 'contract_info.contract_address': '' }
      ]
    }).toArray();
    
    console.log(`=== Projects Missing Contract Addresses ===`);
    console.log(`Total: ${noContractProjects.length}\n`);
    
    // Group by platform
    const byPlatform = {};
    noContractProjects.forEach(p => {
      const platform = p.platform || 'Unknown';
      if (!byPlatform[platform]) byPlatform[platform] = [];
      byPlatform[platform].push(p);
    });
    
    console.log('=== By Platform ===\n');
    Object.entries(byPlatform)
      .sort((a, b) => b[1].length - a[1].length)
      .forEach(([platform, projects]) => {
        console.log(`${platform}: ${projects.length} projects`);
      });
    
    console.log('\n=== Sample Projects (First 30) ===\n');
    noContractProjects.slice(0, 30).forEach(p => {
      console.log(`- ${p.name || 'Unnamed'}`);
      console.log(`  Platform: ${p.platform || 'Unknown'}`);
      console.log(`  Slug: ${p.slug}`);
      console.log(`  Website: ${p.socials?.website || 'N/A'}`);
      console.log('');
    });
    
    // Check if they have audit pages
    const withWebsite = noContractProjects.filter(p => 
      p.socials?.website && p.socials.website.includes('audit.cfg.ninja')
    );
    
    console.log(`\n=== Audit Pages ===`);
    console.log(`Projects with audit.cfg.ninja pages: ${withWebsite.length}/${noContractProjects.length}`);
    console.log(`Could potentially scrape from web: ${withWebsite.length}\n`);
    
    // Save full list
    const report = {
      timestamp: new Date().toISOString(),
      total_missing: noContractProjects.length,
      by_platform: Object.fromEntries(
        Object.entries(byPlatform).map(([k, v]) => [k, v.length])
      ),
      projects: noContractProjects.map(p => ({
        name: p.name,
        symbol: p.symbol,
        slug: p.slug,
        platform: p.platform,
        website: p.socials?.website,
        created: p.createdAt
      }))
    };
    
    fs.writeFileSync('missing-contracts-analysis.json', JSON.stringify(report, null, 2));
    console.log('✓ Saved full report to missing-contracts-analysis.json\n');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

analyzeNoContractProjects();
