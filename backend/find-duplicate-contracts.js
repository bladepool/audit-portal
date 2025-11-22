const { MongoClient } = require('mongodb');
require('dotenv').config();

async function findDuplicateContracts() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db('auditportal');
    const collection = db.collection('projects');
    
    // Find all projects with contract addresses
    const projects = await collection.find({
      published: true,
      'contract_info.contract_address': { $exists: true, $ne: null, $ne: '' }
    }).toArray();
    
    console.log(`Total projects with contract addresses: ${projects.length}\n`);
    
    // Group by contract address
    const contractMap = {};
    
    projects.forEach(project => {
      const address = project.contract_info?.contract_address;
      if (!contractMap[address]) {
        contractMap[address] = [];
      }
      contractMap[address].push({
        name: project.name || project.project_name,
        slug: project.slug,
        platform: project.platform || project.blockchain_platform,
        created: project.createdAt,
        trustblock_url: project.trustblock_url
      });
    });
    
    // Find duplicates
    const duplicates = Object.entries(contractMap)
      .filter(([address, projects]) => projects.length > 1)
      .sort((a, b) => b[1].length - a[1].length);
    
    console.log(`=== Duplicate Contract Addresses ===\n`);
    console.log(`Found ${duplicates.length} contract addresses used by multiple projects\n`);
    
    duplicates.forEach(([address, projects], index) => {
      console.log(`${index + 1}. Contract: ${address}`);
      console.log(`   Used by ${projects.length} projects:`);
      projects.forEach(p => {
        const tbStatus = p.trustblock_url ? '✓ ON TB' : '✗ NOT ON TB';
        console.log(`   - ${p.name} (${p.platform}) [${p.slug}] ${tbStatus}`);
      });
      console.log('');
    });
    
    // Statistics
    const totalDuplicateProjects = duplicates.reduce((sum, [, projects]) => sum + projects.length, 0);
    const uniqueContracts = Object.keys(contractMap).length;
    
    console.log('=== Statistics ===');
    console.log(`Total unique contracts: ${uniqueContracts}`);
    console.log(`Contracts with duplicates: ${duplicates.length}`);
    console.log(`Projects affected by duplicates: ${totalDuplicateProjects}`);
    console.log(`Projects with unique contracts: ${projects.length - totalDuplicateProjects + duplicates.length}\n`);
    
    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      total_projects_with_contracts: projects.length,
      unique_contracts: uniqueContracts,
      duplicate_contracts: duplicates.length,
      duplicate_projects: totalDuplicateProjects,
      publishable_unique: projects.length - totalDuplicateProjects + duplicates.length,
      duplicates: duplicates.map(([address, projects]) => ({
        contract_address: address,
        count: projects.length,
        projects: projects
      }))
    };
    
    const fs = require('fs');
    fs.writeFileSync('duplicate-contracts-report.json', JSON.stringify(report, null, 2));
    console.log('✓ Saved detailed report to duplicate-contracts-report.json\n');
    
    // Recommendations
    console.log('=== Recommendations ===\n');
    console.log('For each duplicate set:');
    console.log('1. Verify which project is the original/primary');
    console.log('2. Check blockchain explorer for actual contract addresses');
    console.log('3. Update incorrect addresses in database');
    console.log('4. Or mark as "fork" if they genuinely share contracts\n');
    
    console.log('To publish successfully:');
    console.log(`- Only ${duplicates.length} primary projects from duplicate sets can be published`);
    console.log(`- Total publishable: ~${projects.length - totalDuplicateProjects + duplicates.length} projects\n`);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

findDuplicateContracts();
