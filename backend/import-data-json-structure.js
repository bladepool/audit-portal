/**
 * Import data.json structure to MongoDB projects
 * Maps offline data.json fields to MongoDB schema
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

async function importDataJsonStructure() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('auditportal');
    
    // Read the data.json from Custom Contract folder
    const dataJsonPath = 'E:\\Desktop\\Old Desktop November 2023\\audits\\PDFscript\\CFGNinjaScripts\\Custom Contract\\data.json';
    const dataJson = JSON.parse(fs.readFileSync(dataJsonPath, 'utf8'));
    
    console.log('=== Data.json Structure Analysis ===\n');
    console.log(`Project: ${dataJson.name} (${dataJson.symbol})`);
    console.log(`Contract: ${dataJson.address}`);
    console.log(`Platform: ${dataJson.Platform}`);
    console.log('');
    
    // Map data.json structure to MongoDB
    const mappedData = {
      // Basic info
      name: dataJson.name,
      symbol: dataJson.symbol,
      description: dataJson.description,
      platform: dataJson.Platform,
      audit_date: dataJson.audit_release,
      
      // Contract info
      contract_info: {
        contract_address: dataJson.address,
        compiler_version: dataJson.compiler,
        optimization: dataJson.optimization,
        license: dataJson.LicenseType,
        contract_name: dataJson.ContractName,
        language: dataJson.Language,
        codebase_url: dataJson.Codebase,
        block_number: dataJson.blockNumber,
        date_created: dataJson.DateCreated
      },
      
      // Token info
      token_info: {
        decimals: parseInt(dataJson.decimals),
        total_supply: dataJson.supply,
        base_token: dataJson.baseToken,
        owner_address: dataJson.ownerAddress,
        has_owner: dataJson.owner === 'Yes'
      },
      
      // Security checks
      security_checks: {
        buy_tax: dataJson.BuyTax,
        sell_tax: dataJson.SaleTax,
        honeypot: dataJson.HoneyPot,
        cooldown: dataJson.CoolDown,
        transfer_pausable: dataJson.TransferPause,
        can_edit_tax: dataJson.EditTax,
        anti_whale: dataJson.AntiWhale,
        blacklist: dataJson.Blacklist,
        whitelist: dataJson.Whitelist,
        mint_check: dataJson.MintCheck,
        proxy_check: dataJson.ProxyCheck,
        can_take_ownership: dataJson.CanTakeOwnership,
        hidden_owner: dataJson.HiddenOwner,
        self_destruct: dataJson.SelfDestruct,
        external_call: dataJson.ExternalCall,
        enable_trade: dataJson.EnableTradeCheck,
        pause_trade: dataJson.PauseTradeCheck,
        max_tx_check: dataJson.MaxTxCheck
      },
      
      // Scores
      security_score: parseInt(dataJson.SecurityScore),
      auditor_score: parseInt(dataJson.AuditorScore),
      audit_status: dataJson.AuditStatus,
      confidence_level: dataJson.ConfidenceLevel,
      
      // Socials
      socials: {
        website: dataJson.Url,
        telegram: dataJson.Telegram,
        twitter: dataJson.Twitter,
        github: dataJson.GitHub,
        email: dataJson.email,
        coingecko: dataJson.CG,
        coinmarketcap: dataJson.CMC,
        reddit: dataJson.Reddit,
        facebook: dataJson.Facebook,
        instagram: dataJson.Instagram,
        other: dataJson.otherSocial
      },
      
      // SWC Findings (all Pass for Pecunity)
      swc_findings: {},
      
      // CFG Findings
      cfg_findings: {},
      
      // Distribution
      distribution: {
        burn: { amount: dataJson.DistributionAmount1, description: dataJson.DistributionDescription1 },
        liquidity: { amount: dataJson.DistributionAmount2, description: dataJson.DistributionDescription2 },
        presale: { amount: dataJson.DistributionAmount3, description: dataJson.DistributionDescription3 },
        staking: { amount: dataJson.DistributionAmount4, description: dataJson.DistributionDescription4 },
        team: { amount: dataJson.DistributionAmount5, description: dataJson.DistributionDescription5 },
        reserves: { amount: dataJson.DistributionAmount6, description: dataJson.DistributionDescription6 }
      },
      
      // Files
      files: [
        { name: dataJson.FileName, sha1: dataJson.FileNameSHA1 },
        { name: dataJson.FileName1, sha1: dataJson.File1Sha1 },
        { name: dataJson.FileName2, sha1: dataJson.File2Sha1 },
        { name: dataJson.FileName3, sha1: dataJson.File3Sha1 },
        { name: dataJson.FileName4, sha1: dataJson.File4Sha1 },
        { name: dataJson.FileName5, sha1: dataJson.File5Sha1 }
      ].filter(f => f.name),
      
      // KYC
      kyc: {
        available: dataJson.isKYC === 'Yes',
        url: dataJson.KYCURL,
        score: parseInt(dataJson.KYCScore)
      },
      
      // Metadata
      audit_edition: dataJson.auditEdition,
      audit_tool_version: dataJson.auditToolVersion,
      holders: parseInt(dataJson.Holders || '0')
    };
    
    // Add SWC findings
    for (let i = 100; i <= 136; i++) {
      const swcKey = `SWC${i}`;
      if (dataJson[swcKey]) {
        mappedData.swc_findings[swcKey] = {
          status: dataJson[swcKey],
          location: dataJson[`${swcKey}Location`]
        };
      }
    }
    
    // Add CFG findings
    for (let i = 1; i <= 26; i++) {
      const cfgKey = `CFG${i.toString().padStart(2, '0')}`;
      if (dataJson[cfgKey] && dataJson[cfgKey] !== 'Pass') {
        mappedData.cfg_findings[cfgKey] = {
          status: dataJson[`${cfgKey}Status`],
          severity: dataJson[`${cfgKey}Severity`],
          title: dataJson[`${cfgKey}Title`],
          description: dataJson[`${cfgKey}Description`],
          location: dataJson[`${cfgKey}Location`],
          recommendation: dataJson[`${cfgKey}Recommendation`],
          category: dataJson[`${cfgKey}Category`],
          custom_title: dataJson[`${cfgKey}CustomTitle`],
          custom_description: dataJson[`${cfgKey}CustomDescription`],
          custom_remediation: dataJson[`${cfgKey}CustomRemediation`]
        };
      }
    }
    
    console.log('=== Mapped Structure ===\n');
    console.log(`Security Checks: ${Object.keys(mappedData.security_checks).length} fields`);
    console.log(`SWC Findings: ${Object.keys(mappedData.swc_findings).length} items`);
    console.log(`CFG Findings: ${Object.keys(mappedData.cfg_findings).length} items`);
    console.log(`Distribution: ${Object.keys(mappedData.distribution).length} allocations`);
    console.log(`Files: ${mappedData.files.length} files`);
    console.log('');
    
    // Find Pecunity project in database
    const pecunity = await db.collection('projects').findOne({ slug: 'pecunity' });
    
    if (pecunity) {
      console.log('✓ Found Pecunity in database');
      console.log('  Current CFG findings:', Object.keys(pecunity.cfg_findings || {}).length);
      console.log('  Data.json CFG findings:', Object.keys(mappedData.cfg_findings).length);
      console.log('');
      
      // Update Pecunity with enhanced data
      await db.collection('projects').updateOne(
        { slug: 'pecunity' },
        { $set: mappedData }
      );
      
      console.log('✓ Updated Pecunity with data.json structure');
    } else {
      console.log('⚠ Pecunity not found in database');
    }
    
    // Save mapping for reference
    fs.writeFileSync('data-json-mapping.json', JSON.stringify(mappedData, null, 2));
    console.log('✓ Saved mapping to data-json-mapping.json');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

importDataJsonStructure();
