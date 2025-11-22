const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const AUDITS_FOLDER = 'E:\\Desktop\\Old Desktop November 2023\\audits\\PDFscript\\CFGNinjaScripts\\Custom Contract\\Audits_Temporal';

async function importContractsFromJSON() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db('auditportal');
    const collection = db.collection('projects');
    
    // Get all JSON files
    const files = fs.readdirSync(AUDITS_FOLDER).filter(f => f.endsWith('.json'));
    console.log(`Found ${files.length} JSON audit files\n`);
    
    let updated = 0;
    let notFound = 0;
    let errors = 0;
    let alreadyHas = 0;
    
    for (const file of files) {
      try {
        const filePath = path.join(AUDITS_FOLDER, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        // Extract project name and contract address from JSON
        const projectName = data.name || data.project_name || data.project?.name;
        const contractAddress = data.contract_address || 
                              data.audit_results?.contract_address ||
                              data.address ||
                              data.contract_info?.address ||
                              data.contract?.address;
        
        if (!projectName) {
          console.log(`⚠ ${file}: No project name found`);
          errors++;
          continue;
        }
        
        if (!contractAddress || contractAddress.length === 0) {
          continue; // Skip files without contract addresses
        }
        
        // Find project in database by name or slug
        const project = await collection.findOne({
          $or: [
            { name: projectName },
            { project_name: projectName },
            { slug: projectName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }
          ]
        });
        
        if (!project) {
          notFound++;
          continue;
        }
        
        // Check if project already has a contract address
        const existingAddress = project.contract_address ||
                               project.audit_results?.contract_address ||
                               project.address ||
                               project.contract_info?.address;
        
        if (existingAddress && existingAddress.length > 0) {
          alreadyHas++;
          continue;
        }
        
        // Update with contract address
        await collection.updateOne(
          { _id: project._id },
          { 
            $set: { 
              contract_address: contractAddress,
              contract_updated_at: new Date(),
              contract_updated_by: 'json_import'
            } 
          }
        );
        
        console.log(`✓ ${projectName}: ${contractAddress}`);
        updated++;
        
      } catch (error) {
        console.log(`✗ ${file}: ${error.message}`);
        errors++;
      }
    }
    
    console.log('\n=== Summary ===');
    console.log(`✓ Updated: ${updated}`);
    console.log(`○ Already has contract: ${alreadyHas}`);
    console.log(`✗ Project not found in DB: ${notFound}`);
    console.log(`⚠ Errors: ${errors}`);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

importContractsFromJSON();
