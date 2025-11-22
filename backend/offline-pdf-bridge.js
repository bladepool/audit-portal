/**
 * Generate PDF using offline pdf.js with MongoDB data
 * Converts MongoDB project to data.json format and calls offline pdf.js
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const CUSTOM_CONTRACT_PATH = 'E:\\Desktop\\Old Desktop November 2023\\audits\\PDFscript\\CFGNinjaScripts\\Custom Contract';
const OUTPUT_PATH = 'g:\\auditportal\\backend\\generated-pdfs';

class OfflinePDFBridge {
  constructor() {
    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_PATH)) {
      fs.mkdirSync(OUTPUT_PATH, { recursive: true });
    }
  }

  /**
   * Convert MongoDB project to data.json format
   */
  projectToDataJson(project) {
    const data = {
      // Meta
      auditToolVersion: "3.4",
      auditEdition: project.audit_edition || "Standard",
      audit_release: project.audit_date || new Date().toISOString().split('T')[0],
      
      // Basic
      name: project.name,
      symbol: project.symbol || "",
      address: project.contract_info?.contract_address || "",
      decimals: String(project.token_info?.decimals || "18"),
      supply: project.token_info?.total_supply || "0",
      Platform: project.platform || "BNBCHAIN",
      compiler: project.contract_info?.compiler_version || "^0.8.0",
      ContractName: project.contract_info?.contract_name || project.name,
      Language: project.contract_info?.language || "Solidity",
      Codebase: project.contract_info?.codebase_url || "",
      blockNumber: project.contract_info?.block_number || "",
      DateCreated: project.contract_info?.date_created || "",
      baseToken: project.token_info?.base_token || "Solidity",
      owner: project.token_info?.has_owner ? "Yes" : "No",
      ownerAddress: project.token_info?.owner_address || "",
      
      // Description & Socials
      description: project.description || `Smart contract audit for ${project.name}`,
      Url: project.socials?.website || "https://audit.cfg.ninja",
      UrlCheck: project.socials?.website ? "Pass" : "Fail",
      Telegram: project.socials?.telegram || "N/A",
      TelegramCheck: project.socials?.telegram ? "Pass" : "N/A",
      Twitter: project.socials?.twitter || "N/A",
      TwitterCheck: project.socials?.twitter ? "Pass" : "N/A",
      GitHub: project.socials?.github || "N/A",
      GitHubCheck: project.socials?.github ? "Pass" : "N/A",
      
      // Type flags
      type: "Token",
      isToken: "Yes",
      isNFT: "No",
      isStaking: "No",
      TOCToken: "Yes",
      EnableSummary: "Yes",
      isGraph: "No",
      isInheritance: "No",
      isLive: "No",
      isMainNetAvailable: "No",
      isTestNetAvailable: "No",
      TestNetaddress: "N/A",
      TestNetCodeBase: "N/A",
      isFlat: "No",
      optimization: project.contract_info?.optimization || "200",
      LicenseType: project.contract_info?.license || "MIT",
      
      // Security scores
      SecurityScore: String(project.security_score || "0"),
      AuditorScore: String(project.auditor_score || project.security_score || "0"),
      AuditStatus: project.audit_status || "Pass",
      ConfidenceLevel: project.confidence_level || "High",
      
      // Security checks
      BuyTax: project.security_checks?.buy_tax || "0%",
      icon0: "symbols/low.png",
      SaleTax: project.security_checks?.sell_tax || "0%",
      icon1: "symbols/low.png",
      HoneyPot: project.security_checks?.honeypot || "Not Detected",
      icon7: "symbols/low.png",
      CoolDown: project.security_checks?.cooldown || "Not Detected",
      icon8: "symbols/low.png",
      TransferPause: project.security_checks?.transfer_pausable || "Not Detected",
      icon10: project.security_checks?.transfer_pausable === "Detected" ? "symbols/high.png" : "symbols/low.png",
      EditTax: project.security_checks?.can_edit_tax || "No",
      icon5: "symbols/low.png",
      AntiWhale: project.security_checks?.anti_whale || "Not Detected",
      icon12: "symbols/low.png",
      Blacklist: project.security_checks?.blacklist || "Not Detected",
      icon14: "symbols/low.png",
      Whitelist: project.security_checks?.whitelist || "Not Detected",
      icon16: project.security_checks?.whitelist === "Detected" ? "symbols/high.png" : "symbols/low.png",
      MintCheck: project.security_checks?.mint_check || "Pass",
      icon17: "symbols/low.png",
      ProxyCheck: project.security_checks?.proxy_check || "Not Detected",
      icon18: "symbols/low.png",
      CanTakeOwnership: project.security_checks?.can_take_ownership || "Not Detected",
      icon19: "symbols/low.png",
      HiddenOwner: project.security_checks?.hidden_owner || "Not Detected",
      icon20: "symbols/low.png",
      SelfDestruct: project.security_checks?.self_destruct || "Not Detected",
      icon22: "symbols/low.png",
      ExternalCall: project.security_checks?.external_call || "Not Detected",
      icon23: "symbols/low.png",
      Holders: String(project.holders || "0"),
      icon25: "symbols/low.png",
      
      // Files
      FileName: project.files?.[0]?.name || `${project.name}.sol`,
      FileNameSHA1: project.files?.[0]?.sha1 || "",
      FileName1: project.files?.[1]?.name || "",
      File1Sha1: project.files?.[1]?.sha1 || "",
      FileName2: project.files?.[2]?.name || "",
      File2Sha1: project.files?.[2]?.sha1 || "",
      FileName3: project.files?.[3]?.name || "",
      File3Sha1: project.files?.[3]?.sha1 || "",
      FileName4: project.files?.[4]?.name || "",
      File4Sha1: project.files?.[4]?.sha1 || "",
      FileName5: project.files?.[5]?.name || "",
      File5Sha1: project.files?.[5]?.sha1 || "",
      
      // KYC
      isKYC: project.kyc?.available ? "Yes" : "No",
      KYCURL: project.kyc?.url || "",
      KYCScore: String(project.kyc?.score || "0"),
      
      // Distribution
      TokenDistribution: "No",
      isLiquidityLock: "No",
      
      // Additional required fields
      other_contracts: [],
      contracts: [project.contract_info?.contract_address || ""],
      trustBlock: "Pass",
      SocialScore: "0",
      ownerScore: "5",
      FeeScore: "5",
      MintScore: "15",
      LiquidityLockScore: "0",
      SWCScore: "20",
      
      // Enable/disable sections
      EnableSimulation: "No",
      EnableOnlyOwner: "No",
      TokenCheck: "No",
      
      // EVM/Solana flags
      isEVMContract: project.platform !== "Solana" ? "Yes" : "No",
      isSolana: project.platform === "Solana" ? "Yes" : "No",
      
      // SWC - defaults to Pass
      EnableSWCSummary: "No",
      ...this.generateSWCFindings(project.swc_findings),
      
      // CFG - Advanced checks
      AdvanceCheck: Object.keys(project.cfg_findings || {}).length > 0 ? "Yes" : "No",
      ...this.generateCFGFindings(project.cfg_findings),
      
      // Counts
      TotalCFGCritical: String(this.countBySeverity(project.cfg_findings, 'Critical')),
      TotalCFGHigh: String(this.countBySeverity(project.cfg_findings, 'High')),
      TotalCFGMedium: String(this.countBySeverity(project.cfg_findings, 'Medium')),
      TotalCFGLow: String(this.countBySeverity(project.cfg_findings, 'Low')),
      TotalCFGInfo: String(this.countBySeverity(project.cfg_findings, 'Informational')),
      TotalCFG: String(Object.keys(project.cfg_findings || {}).length)
    };
    
    return data;
  }

  generateSWCFindings(swcFindings = {}) {
    const result = {};
    for (let i = 100; i <= 136; i++) {
      const key = `SWC${i}`;
      result[key] = swcFindings[key]?.status || "Pass";
      result[`${key}Location`] = swcFindings[key]?.location || "L: 0 C: 0";
    }
    return result;
  }

  generateCFGFindings(cfgFindings = {}) {
    const result = {};
    for (let i = 1; i <= 26; i++) {
      const key = `CFG${i.toString().padStart(2, '0')}`;
      const finding = cfgFindings[key] || {};
      
      result[key] = finding.status === "Detected" ? "Fail" : "Pass";
      result[`${key}Title`] = finding.title || "";
      result[`${key}Description`] = finding.description || "";
      result[`${key}Severity`] = finding.severity || "Low";
      result[`${key}Status`] = finding.status || "Not Detected";
      result[`${key}Location`] = finding.location || "L: 0 C: 0";
      result[`${key}Recommendation`] = finding.recommendation || "";
      result[`${key}Category`] = finding.category || "";
      result[`${key}Action`] = "";
      result[`${key}Alleviation`] = "";
      result[`${key}Score`] = "2";
    }
    return result;
  }

  countBySeverity(findings = {}, severity) {
    return Object.values(findings).filter(f => f.severity === severity).length;
  }

  /**
   * Generate PDF using offline pdf.js
   */
  async generatePDF(project) {
    try {
      console.log(`\nGenerating PDF for: ${project.name} (${project.slug})`);
      
      // Convert to data.json format
      const dataJson = this.projectToDataJson(project);
      
      // Save temporary data.json
      const tempDataPath = path.join(CUSTOM_CONTRACT_PATH, 'data_temp.json');
      const backupDataPath = path.join(CUSTOM_CONTRACT_PATH, 'data_backup.json');
      const originalDataPath = path.join(CUSTOM_CONTRACT_PATH, 'data.json');
      
      // Backup original data.json
      if (fs.existsSync(originalDataPath)) {
        fs.copyFileSync(originalDataPath, backupDataPath);
      }
      
      // Write project data
      fs.writeFileSync(originalDataPath, JSON.stringify(dataJson, null, 2));
      console.log('  ✓ Wrote data.json');
      
      // Run pdf.js
      console.log('  ⏳ Running offline pdf.js...');
      const { stdout, stderr } = await execPromise('node pdf.js', {
        cwd: CUSTOM_CONTRACT_PATH,
        timeout: 30000
      });
      
      if (stderr && !stderr.includes('Debugger')) {
        console.log('  ⚠ Warnings:', stderr);
      }
      
      // Find generated PDF
      const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const expectedPdfName = `${timestamp}_CFGNINJA_${project.name}_${project.symbol}_Audit.pdf`;
      const generatedPdfPath = path.join(CUSTOM_CONTRACT_PATH, 'Audits_Temporal', expectedPdfName);
      
      // Check if PDF was created
      if (fs.existsSync(generatedPdfPath)) {
        const stats = fs.statSync(generatedPdfPath);
        console.log(`  ✓ Generated PDF: ${(stats.size / 1024).toFixed(2)} KB`);
        
        // Copy to output directory with slug-based name
        const outputPdfPath = path.join(OUTPUT_PATH, `${project.slug}-audit-report.pdf`);
        fs.copyFileSync(generatedPdfPath, outputPdfPath);
        console.log(`  ✓ Saved to: ${outputPdfPath}`);
        
        return { success: true, path: outputPdfPath, size: stats.size };
      } else {
        // Check for any newly created PDF
        const auditsPath = path.join(CUSTOM_CONTRACT_PATH, 'Audits_Temporal');
        const files = fs.readdirSync(auditsPath).filter(f => f.endsWith('.pdf'));
        const latestPdf = files
          .map(f => ({ name: f, time: fs.statSync(path.join(auditsPath, f)).mtime }))
          .sort((a, b) => b.time - a.time)[0];
        
        if (latestPdf && (Date.now() - latestPdf.time.getTime()) < 60000) {
          const pdfPath = path.join(auditsPath, latestPdf.name);
          const outputPdfPath = path.join(OUTPUT_PATH, `${project.slug}-audit-report.pdf`);
          fs.copyFileSync(pdfPath, outputPdfPath);
          const stats = fs.statSync(outputPdfPath);
          console.log(`  ✓ Found PDF: ${(stats.size / 1024).toFixed(2)} KB`);
          return { success: true, path: outputPdfPath, size: stats.size };
        }
        
        throw new Error('PDF not generated');
      }
      
    } catch (error) {
      console.log(`  ✗ Error: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      // Restore backup
      const backupPath = path.join(CUSTOM_CONTRACT_PATH, 'data_backup.json');
      const originalPath = path.join(CUSTOM_CONTRACT_PATH, 'data.json');
      if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, originalPath);
        fs.unlinkSync(backupPath);
      }
    }
  }

  /**
   * Generate PDFs for multiple projects
   */
  async generateBatch(projects) {
    const results = [];
    
    for (const project of projects) {
      const result = await this.generatePDF(project);
      results.push({
        slug: project.slug,
        name: project.name,
        ...result
      });
      
      // Wait a bit between generations
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
  }
}

// CLI usage
async function main() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('auditportal');
    
    const bridge = new OfflinePDFBridge();
    
    // Get project slug from command line or use default
    const slug = process.argv[2] || 'pecunity';
    
    console.log('=== Offline PDF Bridge ===\n');
    console.log(`Fetching project: ${slug}`);
    
    const project = await db.collection('projects').findOne({ 
      slug: slug,
      published: true 
    });
    
    if (!project) {
      console.log(`✗ Project "${slug}" not found`);
      process.exit(1);
    }
    
    const result = await bridge.generatePDF(project);
    
    if (result.success) {
      console.log(`\n✅ PDF generated successfully!`);
      console.log(`   Path: ${result.path}`);
      console.log(`   Size: ${(result.size / 1024).toFixed(2)} KB`);
    } else {
      console.log(`\n✗ Failed to generate PDF: ${result.error}`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

if (require.main === module) {
  main();
}

module.exports = OfflinePDFBridge;
