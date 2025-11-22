/**
 * Fix data quality issues identified in publishing
 * 1. Fix "XL" project name (too short for TrustBlock)
 * 2. Fix "Elon Wif Trump" platform/contract mismatch
 * 3. Resolve 3 internal duplicate contracts
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

async function fixDataQualityIssues() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db('auditportal');
    const collection = db.collection('projects');
    
    console.log('=== Fixing Data Quality Issues ===\n');
    
    // Issue 1: Fix "XL" project name (TrustBlock requires 3+ characters)
    console.log('1. Fixing "XL" project name...');
    const xlProject = await collection.findOne({ name: 'XL', published: true });
    
    if (xlProject) {
      await collection.updateOne(
        { _id: xlProject._id },
        { $set: { name: 'XL Token' } }
      );
      console.log(`   ✓ Renamed "XL" → "XL Token"\n`);
    } else {
      console.log('   ⚠ "XL" project not found\n');
    }
    
    // Issue 2: Fix "Elon Wif Trump" - has BSC/ETH contract but marked as Solana
    console.log('2. Fixing "Elon Wif Trump" platform mismatch...');
    const elonProject = await collection.findOne({ 
      name: 'Elon Wif Trump', 
      published: true 
    });
    
    if (elonProject) {
      const contract = elonProject.contract_info?.contract_address;
      console.log(`   Current platform: ${elonProject.platform}`);
      console.log(`   Current contract: ${contract}`);
      
      if (contract && contract.startsWith('0x')) {
        // It's an EVM address, should be BSC or Ethereum
        // Check length - if 40 hex chars after 0x, it's EVM
        await collection.updateOne(
          { _id: elonProject._id },
          { $set: { platform: 'Binance Smart Chain' } }
        );
        console.log(`   ✓ Changed platform: Solana → Binance Smart Chain\n`);
      } else {
        console.log(`   ⚠ Contract format unclear, manual review needed\n`);
      }
    } else {
      console.log('   ⚠ "Elon Wif Trump" project not found\n');
    }
    
    // Issue 3: Resolve internal duplicate contracts
    console.log('3. Resolving internal duplicate contracts...\n');
    
    // Duplicate 1: Baby Byte vs SFW (0x63B8e2109fA2E5ec8D26A19632E50560DbF310bf)
    console.log('   a) Baby Byte vs SFW...');
    const babyByte = await collection.findOne({ name: 'Baby Byte', published: true });
    const sfw = await collection.findOne({ name: 'SFW', published: true });
    
    if (babyByte && sfw) {
      // Keep the older project, clear newer one
      if (new Date(babyByte.createdAt) < new Date(sfw.createdAt)) {
        console.log(`      Keeping Baby Byte (older), clearing SFW contract`);
        await collection.updateOne(
          { _id: sfw._id },
          { $unset: { 'contract_info.contract_address': '' } }
        );
      } else {
        console.log(`      Keeping SFW (older), clearing Baby Byte contract`);
        await collection.updateOne(
          { _id: babyByte._id },
          { $unset: { 'contract_info.contract_address': '' } }
        );
      }
      console.log('      ✓ Resolved\n');
    } else {
      console.log('      ⚠ Projects not found\n');
    }
    
    // Duplicate 2: Moustache Man MM vs test2024 (0xFC7fc6b54DE8901D98827f411192B86C888DeDb8)
    console.log('   b) Moustache Man MM vs test2024...');
    const moustache = await collection.findOne({ name: 'Moustache Man MM', published: true });
    const test2024 = await collection.findOne({ name: 'test2024', published: true });
    
    if (moustache && test2024) {
      // test2024 is clearly a test project, remove its contract
      console.log(`      Keeping Moustache Man MM, clearing test2024 contract`);
      await collection.updateOne(
        { _id: test2024._id },
        { $unset: { 'contract_info.contract_address': '' } }
      );
      console.log('      ✓ Resolved\n');
    } else {
      console.log('      ⚠ Projects not found\n');
    }
    
    // Duplicate 3: Zydio AI vs Elon Wif Trump (already fixed above with platform change)
    console.log('   c) Zydio AI vs Elon Wif Trump...');
    const zydio = await collection.findOne({ name: 'Zydio AI', published: true });
    const elon2 = await collection.findOne({ name: 'Elon Wif Trump', published: true });
    
    if (zydio && elon2) {
      // Zydio AI is already on TrustBlock, keep it
      // Elon Wif Trump platform was just fixed, if they still share contract, clear Elon's
      if (zydio.contract_info?.contract_address === elon2.contract_info?.contract_address) {
        console.log(`      Keeping Zydio AI (on TrustBlock), clearing Elon Wif Trump contract`);
        await collection.updateOne(
          { _id: elon2._id },
          { $unset: { 'contract_info.contract_address': '' } }
        );
      }
      console.log('      ✓ Resolved\n');
    } else {
      console.log('      ⚠ Projects not found\n');
    }
    
    console.log('=== All Fixes Complete ===\n');
    
    // Show updated status
    const withContracts = await collection.countDocuments({
      published: true,
      'contract_info.contract_address': { $exists: true, $ne: null, $ne: '' }
    });
    
    const totalPublished = await collection.countDocuments({ published: true });
    
    console.log('=== Database Status ===');
    console.log(`Projects with contracts: ${withContracts}/${totalPublished} (${Math.round(withContracts/totalPublished*100)}%)`);
    console.log(`Projects without contracts: ${totalPublished - withContracts}\n`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

fixDataQualityIssues();
