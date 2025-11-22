/**
 * Comprehensive Contract Address Import
 * Imports contract addresses from Custom Contract folder JSON files
 * Handles multiple data sources and field formats
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Custom Contract folder path
const CUSTOM_CONTRACT_PATH = 'E:\\Desktop\\Old Desktop November 2023\\audits\\PDFscript\\CFGNinjaScripts\\Custom Contract';

async function importContracts() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db('auditportal');
    const collection = db.collection('projects');
    
    let updated = 0;
    let skipped = 0;
    let notFound = 0;
    const updates = [];
    
    console.log('=== Importing Contract Addresses ===\n');
    
    // Source 1: data.json (main data file)
    console.log('📂 Processing data.json...\n');
    const dataJsonPath = path.join(CUSTOM_CONTRACT_PATH, 'data.json');
    
    if (fs.existsSync(dataJsonPath)) {
      try {
        const dataJson = JSON.parse(fs.readFileSync(dataJsonPath, 'utf8'));
        
        // data.json is an array of projects
        if (Array.isArray(dataJson)) {
          for (const project of dataJson) {
            const result = await processProject(collection, project, 'data.json');
            if (result.updated) {
              updated++;
              updates.push(result);
            } else if (result.notFound) {
              notFound++;
            } else {
              skipped++;
            }
          }
        }
      } catch (error) {
        console.error(`  ✗ Error reading data.json: ${error.message}`);
      }
    } else {
      console.log('  ⚠ data.json not found\n');
    }
    
    // Source 2: Audits_Temporal folder (individual audit JSON files)
    console.log('\n📂 Processing Audits_Temporal/*.json...\n');
    const temporalPath = path.join(CUSTOM_CONTRACT_PATH, 'Audits_Temporal');
    
    if (fs.existsSync(temporalPath)) {
      const files = fs.readdirSync(temporalPath).filter(f => f.endsWith('.json'));
      console.log(`  Found ${files.length} JSON files\n`);
      
      for (const file of files) {
        try {
          const filePath = path.join(temporalPath, file);
          const auditData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          
          const result = await processProject(collection, auditData, file);
          if (result.updated) {
            updated++;
            updates.push(result);
          } else if (result.notFound) {
            notFound++;
          } else {
            skipped++;
          }
        } catch (error) {
          console.error(`  ✗ Error processing ${file}: ${error.message}`);
        }
      }
    } else {
      console.log('  ⚠ Audits_Temporal folder not found\n');
    }
    
    // Summary
    console.log('\n\n=== Import Complete ===\n');
    console.log(`✓ Updated: ${updated} projects`);
    console.log(`⊘ Skipped (already has contract): ${skipped} projects`);
    console.log(`✗ Not found in database: ${notFound} projects`);
    console.log(`Total processed: ${updated + skipped + notFound}\n`);
    
    if (updates.length > 0) {
      console.log('=== Updated Projects ===\n');
      updates.forEach(u => {
        console.log(`✓ ${u.name}`);
        console.log(`  Platform: ${u.platform}`);
        console.log(`  Contract: ${u.contract}`);
        console.log(`  Source: ${u.source}`);
        console.log('');
      });
      
      // Save report
      fs.writeFileSync(
        'contract-import-report.json',
        JSON.stringify({ 
          timestamp: new Date().toISOString(),
          updated, 
          skipped, 
          notFound,
          updates 
        }, null, 2)
      );
      console.log('✓ Saved report to contract-import-report.json\n');
    }
    
    // Show updated stats
    const withContracts = await collection.countDocuments({
      published: true,
      'contract_info.contract_address': { $exists: true, $ne: null, $ne: '' }
    });
    
    const totalPublished = await collection.countDocuments({ published: true });
    
    console.log('=== Database Status ===');
    console.log(`Projects with contracts: ${withContracts}/${totalPublished} (${Math.round(withContracts/totalPublished*100)}%)`);
    console.log(`Projects without contracts: ${totalPublished - withContracts}\n`);
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await client.close();
  }
}

/**
 * Process a single project and update database if needed
 */
async function processProject(collection, projectData, source) {
  // Extract contract address from various possible field locations
  const contractAddress = 
    projectData.address ||
    projectData.contract_address ||
    projectData.contractAddress ||
    projectData.contract?.address ||
    projectData.info?.address ||
    projectData.tokenInfo?.address ||
    '';
  
  if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
    return { skipped: true };
  }
  
  // Extract project name from various possible fields
  const projectName = 
    projectData.name ||
    projectData.projectName ||
    projectData.project_name ||
    projectData.token?.name ||
    projectData.tokenInfo?.name ||
    '';
  
  if (!projectName) {
    return { skipped: true };
  }
  
  // Try to find project in database by name (case-insensitive)
  const dbProject = await collection.findOne({
    name: { $regex: new RegExp(`^${escapeRegex(projectName)}$`, 'i') },
    published: true
  });
  
  if (!dbProject) {
    // Try by symbol if name not found
    const symbol = projectData.symbol || projectData.token?.symbol || '';
    if (symbol) {
      const bySymbol = await collection.findOne({
        symbol: { $regex: new RegExp(`^${escapeRegex(symbol)}$`, 'i') },
        published: true
      });
      
      if (bySymbol && (!bySymbol.contract_info?.contract_address || bySymbol.contract_info.contract_address === '')) {
        await updateProject(collection, bySymbol, contractAddress, projectData);
        return {
          updated: true,
          name: bySymbol.name,
          platform: bySymbol.platform,
          contract: contractAddress,
          source: source
        };
      }
    }
    
    console.log(`  ⚠ Not found in DB: ${projectName} (${source})`);
    return { notFound: true };
  }
  
  // Check if project already has a contract address
  if (dbProject.contract_info?.contract_address && dbProject.contract_info.contract_address !== '') {
    return { skipped: true };
  }
  
  // Update the project
  await updateProject(collection, dbProject, contractAddress, projectData);
  
  console.log(`  ✓ Updated: ${dbProject.name} → ${contractAddress}`);
  
  return {
    updated: true,
    name: dbProject.name,
    platform: dbProject.platform,
    contract: contractAddress,
    source: source
  };
}

/**
 * Update project with contract address and additional info
 */
async function updateProject(collection, dbProject, contractAddress, sourceData) {
  const updateData = {
    'contract_info.contract_address': contractAddress
  };
  
  // Add contract language if available
  if (sourceData.compiler || sourceData.contract?.language) {
    updateData['contract_info.contract_language'] = sourceData.compiler || sourceData.contract.language;
  }
  
  // Add verification status if available
  if (sourceData.verified !== undefined) {
    updateData['contract_info.contract_verified'] = sourceData.verified;
  }
  
  // Add decimals if missing and available
  if (!dbProject.decimals && sourceData.decimals) {
    updateData.decimals = parseInt(sourceData.decimals);
  }
  
  // Add supply if missing and available
  if (!dbProject.supply && (sourceData.supply || sourceData.totalSupply)) {
    updateData.supply = sourceData.supply || sourceData.totalSupply;
  }
  
  await collection.updateOne(
    { _id: dbProject._id },
    { $set: updateData }
  );
}

/**
 * Escape special regex characters
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Run if called directly
if (require.main === module) {
  importContracts().catch(console.error);
}

module.exports = importContracts;
