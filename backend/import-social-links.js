require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Project = require('./src/models/Project');

const AUDITS_TEMPORAL_PATH = 'E:\\Desktop\\Old Desktop November 2023\\audits\\PDFscript\\CFGNinjaScripts\\Custom Contract\\Audits_Temporal';

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/auditportal')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

function normalizeForComparison(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

async function importSocialLinks() {
  try {
    console.log('\n📊 Starting Social Links Import...\n');
    
    const jsonFiles = fs.readdirSync(AUDITS_TEMPORAL_PATH)
      .filter(f => f.endsWith('.json'));
    
    console.log(`Found ${jsonFiles.length} JSON files\n`);
    
    let stats = {
      totalProcessed: 0,
      websitesAdded: 0,
      twitterAdded: 0,
      telegramAdded: 0,
      contractsAdded: 0,
      matched: 0,
      notMatched: 0
    };
    
    for (const file of jsonFiles) {
      const filePath = path.join(AUDITS_TEMPORAL_PATH, file);
      
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        stats.totalProcessed++;
        
        if (!data.project || !data.project.name) {
          continue;
        }
        
        const projectName = data.project.name;
        const normalizedName = normalizeForComparison(projectName);
        
        // Try to find matching project
        const projects = await Project.find({
          $or: [
            { name: { $regex: new RegExp(projectName, 'i') } },
            { slug: { $regex: new RegExp(normalizedName, 'i') } }
          ]
        });
        
        let matchedProject = null;
        
        // Try exact match first
        for (const proj of projects) {
          if (normalizeForComparison(proj.name) === normalizedName) {
            matchedProject = proj;
            break;
          }
        }
        
        // Try partial match
        if (!matchedProject && projects.length > 0) {
          matchedProject = projects[0];
        }
        
        if (!matchedProject) {
          console.log(`⚠️  No match found for: ${projectName}`);
          stats.notMatched++;
          continue;
        }
        
        stats.matched++;
        
        let updated = false;
        const updates = {};
        
        // Update social links
        if (data.project.links) {
          if (data.project.links.website && !matchedProject.socials?.website) {
            updates['socials.website'] = data.project.links.website;
            stats.websitesAdded++;
            updated = true;
          }
          
          if (data.project.links.twitter && !matchedProject.socials?.twitter) {
            updates['socials.twitter'] = data.project.links.twitter;
            stats.twitterAdded++;
            updated = true;
          }
          
          const telegramLink = data.project.links.Telegram || data.project.links.telegram;
          if (telegramLink && !matchedProject.socials?.telegram) {
            updates['socials.telegram'] = telegramLink;
            stats.telegramAdded++;
            updated = true;
          }
        }
        
        // Update contract address
        if (data.contracts && data.contracts.length > 0) {
          const contract = data.contracts[0];
          if (contract.evmAddress && contract.evmAddress.startsWith('0x') && !matchedProject.contract_info?.contract_address) {
            updates['contract_info.contract_address'] = contract.evmAddress;
            stats.contractsAdded++;
            updated = true;
          }
        }
        
        if (updated) {
          await Project.findByIdAndUpdate(matchedProject._id, { $set: updates });
          console.log(`✅ Updated ${matchedProject.name} - ${Object.keys(updates).join(', ')}`);
        }
        
      } catch (err) {
        console.error(`Error processing ${file}:`, err.message);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📈 Import Summary:');
    console.log('='.repeat(60));
    console.log(`Total JSON files processed: ${stats.totalProcessed}`);
    console.log(`Projects matched: ${stats.matched}`);
    console.log(`Projects not matched: ${stats.notMatched}`);
    console.log(`\nData Added:`);
    console.log(`  Websites: ${stats.websitesAdded}`);
    console.log(`  Twitter: ${stats.twitterAdded}`);
    console.log(`  Telegram: ${stats.telegramAdded}`);
    console.log(`  Contract Addresses: ${stats.contractsAdded}`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('Error importing social links:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Import complete');
  }
}

importSocialLinks();
