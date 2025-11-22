/**
 * Compare MongoDB data structure with offline PDF requirements
 * Identifies gaps in data migration
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');

async function analyzeDataStructure() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('auditportal');
    
    // Get a sample project with good data
    const project = await db.collection('projects').findOne({ 
      slug: 'pecunity',
      published: true 
    });
    
    if (!project) {
      console.log('Sample project not found');
      return;
    }
    
    console.log('=== MongoDB Project Data Structure ===\n');
    
    // Map out what we have
    const structure = {
      basic: {
        name: project.name || null,
        symbol: project.symbol || null,
        description: project.description || null,
        platform: project.platform || null,
        audit_date: project.audit_date || null
      },
      contract: {
        address: project.contract_info?.contract_address || null,
        compiler: project.contract_info?.compiler_version || null,
        decimals: project.token_info?.decimals || null,
        total_supply: project.token_info?.total_supply || null
      },
      security: {
        security_score: project.security_score || null,
        honeypot: project.security_checks?.honeypot || null,
        buy_tax: project.security_checks?.buy_tax || null,
        sell_tax: project.security_checks?.sell_tax || null,
        transfer_pause: project.security_checks?.transfer_pausable || null,
        can_edit_tax: project.security_checks?.can_edit_tax || null,
        anti_whale: project.security_checks?.anti_whale || null,
        blacklist: project.security_checks?.has_blacklist || null,
        whitelist: project.security_checks?.has_whitelist || null
      },
      swc_findings: project.swc_findings ? Object.keys(project.swc_findings).length : 0,
      cfg_findings: project.cfg_findings ? Object.keys(project.cfg_findings).length : 0,
      socials: {
        website: project.socials?.website || null,
        twitter: project.socials?.twitter || null,
        telegram: project.socials?.telegram || null,
        discord: project.socials?.discord || null
      },
      distribution: project.distribution ? Object.keys(project.distribution).length : 0
    };
    
    console.log('✓ Basic Info:', JSON.stringify(structure.basic, null, 2));
    console.log('\n✓ Contract Info:', JSON.stringify(structure.contract, null, 2));
    console.log('\n✓ Security Checks:', JSON.stringify(structure.security, null, 2));
    console.log(`\n✓ SWC Findings: ${structure.swc_findings} items`);
    console.log(`✓ CFG Findings: ${structure.cfg_findings} items`);
    console.log('\n✓ Socials:', JSON.stringify(structure.socials, null, 2));
    console.log(`\n✓ Distribution: ${structure.distribution} holders`);
    
    // Check what's in CFG findings
    if (project.cfg_findings) {
      console.log('\n=== CFG Findings Detail ===');
      Object.entries(project.cfg_findings).slice(0, 3).forEach(([key, value]) => {
        console.log(`\n${key}:`);
        console.log(`  Status: ${value.status || 'N/A'}`);
        console.log(`  Severity: ${value.severity || 'N/A'}`);
        console.log(`  Location: ${value.location || 'N/A'}`);
        console.log(`  Title: ${value.title || 'N/A'}`);
      });
    }
    
    // Check SWC findings structure
    if (project.swc_findings) {
      console.log('\n=== SWC Findings Detail ===');
      const swcKeys = Object.keys(project.swc_findings).slice(0, 3);
      swcKeys.forEach(key => {
        const finding = project.swc_findings[key];
        console.log(`\n${key}:`);
        console.log(`  Status: ${finding.status || 'N/A'}`);
        console.log(`  Location: ${finding.location || 'N/A'}`);
      });
    }
    
    // Compare with offline PDF requirements
    console.log('\n\n=== Offline PDF Requirements (from pdf.js) ===\n');
    console.log('Required Fields:');
    console.log('  ✓ name, symbol, decimals, supply');
    console.log('  ✓ compiler, address, Platform');
    console.log('  ✓ BuyTax, SaleTax, HoneyPot');
    console.log('  ✓ CoolDown, TransferPause, EditTax');
    console.log('  ✓ AntiWhale, Blacklist, Whitelist');
    console.log('  ✓ SecurityScore, AuditorScore');
    console.log('  ✓ SWC100-SWC136 (37 checks)');
    console.log('  ✓ CFG01-CFG26 (26 custom findings)');
    console.log('  ? Distribution data');
    console.log('  ? Call graphs');
    console.log('  ? URI metadata (Solana)');
    
    console.log('\n=== Data Completeness Assessment ===\n');
    
    const completeness = {
      basic_info: structure.basic.name && structure.basic.symbol ? '✓ Complete' : '⚠ Missing',
      contract_info: structure.contract.address ? '✓ Complete' : '⚠ Missing',
      security_checks: structure.security.security_score ? '✓ Complete' : '⚠ Missing',
      swc_findings: structure.swc_findings > 0 ? `✓ ${structure.swc_findings} items` : '⚠ None',
      cfg_findings: structure.cfg_findings > 0 ? `✓ ${structure.cfg_findings} items` : '⚠ None',
      distribution: structure.distribution > 0 ? `✓ ${structure.distribution} holders` : '⚠ None'
    };
    
    Object.entries(completeness).forEach(([key, status]) => {
      console.log(`${key.padEnd(20)} ${status}`);
    });
    
    // Save full project structure for review
    fs.writeFileSync('sample-project-structure.json', JSON.stringify(project, null, 2));
    console.log('\n✓ Saved full project structure to sample-project-structure.json');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

analyzeDataStructure();
