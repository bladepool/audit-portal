const https = require('https');
const cheerio = require('cheerio');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Simple HTTPS GET request
function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

/**
 * Scrape data from a single project page on audit.cfg.ninja
 */
async function scrapeProjectPage(slug) {
  try {
    const url = `https://audit.cfg.ninja/${slug}`;
    console.log(`Scraping: ${url}`);
    
    const html = await httpGet(url);
    const $ = cheerio.load(html);
    const data = {};
    
    // Extract Manual Code Review Risk Results
    const overview = {};
    $('.risk-item, .audit-check-item').each((i, el) => {
      const label = $(el).find('.label, .check-label').text().trim();
      const status = $(el).find('.status, .check-status').text().trim();
      const value = $(el).find('.value').text().trim();
      
      // Map to our database fields
      if (label.includes('Can Mint')) overview.mint = status.toLowerCase() === 'fail';
      if (label.includes('Edit Taxes') || label.includes('Max Tax')) overview.max_tax = status.toLowerCase() === 'fail';
      if (label.includes('Max Transaction')) overview.max_transaction = status.toLowerCase() === 'fail';
      if (label.includes('Max Wallet')) overview.max_wallet = status.toLowerCase() === 'fail';
      if (label.includes('Enable Trade')) overview.enable_trading = status.toLowerCase() === 'fail';
      if (label.includes('Modify Tax')) overview.modify_tax = status.toLowerCase() === 'fail';
      if (label.includes('Honeypot')) overview.honeypot = status.toLowerCase() === 'fail';
      if (label.includes('Trading Cooldown')) overview.trading_cooldown = status.toLowerCase() === 'fail';
      if (label.includes('Transfer Pausable')) overview.pause_transfer = status.toLowerCase() === 'fail';
      if (label.includes('Pause Trade')) overview.pause_trade = status.toLowerCase() === 'fail';
      if (label.includes('Anti Bot')) overview.anti_bot = status.toLowerCase() === 'fail';
      if (label.includes('Antiwhale') || label.includes('Anti Whale')) overview.anit_whale = status.toLowerCase() === 'fail';
      if (label.includes('Proxy')) overview.proxy_check = status.toLowerCase() === 'fail';
      if (label.includes('Blacklist')) overview.blacklist = status.toLowerCase() === 'fail';
      if (label.includes('Hidden Ownership')) overview.hidden_owner = status.toLowerCase() === 'fail';
      if (label.includes('Selfdestruct')) overview.self_destruct = status.toLowerCase() === 'fail';
      if (label.includes('Whitelisted')) overview.whitelist = status.toLowerCase() === 'fail';
      if (label.includes('External Call')) overview.external_call = status.toLowerCase() === 'fail';
      if (label.includes('Buy Tax')) overview.buy_tax = parseFloat(value) || 0;
      if (label.includes('Sell Tax')) overview.sell_tax = parseFloat(value) || 0;
    });
    
    if (Object.keys(overview).length > 0) {
      data.overview = overview;
    }
    
    // Extract Findings by Severity
    const findings = {
      critical: { found: 0, pending: 0, resolved: 0 },
      major: { found: 0, pending: 0, resolved: 0 },
      medium: { found: 0, pending: 0, resolved: 0 },
      minor: { found: 0, pending: 0, resolved: 0 },
      informational: { found: 0, pending: 0, resolved: 0 }
    };
    
    $('.severity-item, .finding-severity').each((i, el) => {
      const severityText = $(el).find('.severity-label, .severity-name').text().trim().toLowerCase();
      const count = parseInt($(el).find('.severity-count, .count').text().trim()) || 0;
      const status = $(el).find('.status').text().trim().toLowerCase();
      
      if (severityText.includes('critical')) {
        if (status.includes('resolved')) findings.critical.resolved = count;
        else if (status.includes('pending')) findings.critical.pending = count;
        else findings.critical.found = count;
      } else if (severityText.includes('high') || severityText.includes('major')) {
        if (status.includes('resolved')) findings.major.resolved = count;
        else if (status.includes('pending')) findings.major.pending = count;
        else findings.major.found = count;
      } else if (severityText.includes('medium')) {
        if (status.includes('resolved')) findings.medium.resolved = count;
        else if (status.includes('pending')) findings.medium.pending = count;
        else findings.medium.found = count;
      } else if (severityText.includes('low') || severityText.includes('minor')) {
        if (status.includes('resolved')) findings.minor.resolved = count;
        else if (status.includes('pending')) findings.minor.pending = count;
        else findings.minor.found = count;
      } else if (severityText.includes('info') || severityText.includes('observation')) {
        if (status.includes('resolved')) findings.informational.resolved = count;
        else if (status.includes('pending')) findings.informational.pending = count;
        else findings.informational.found = count;
      }
    });
    
    // Parse findings from embedded JSON data (most reliable - found in HTML)
    // Data is embedded as escaped JSON in the Next.js page
    const pageText = $('body').text();
    const jsonMatch = pageText.match(/\\"critical\\":\{.*?\\"found\\":(\d+),\\"pending\\":(\d+),\\"resolved\\":(\d+)\}/);
    const majorMatch = pageText.match(/\\"major\\":\{.*?\\"found\\":(\d+),\\"pending\\":(\d+),\\"resolved\\":(\d+)\}/);
    const mediumMatch = pageText.match(/\\"medium\\":\{.*?\\"found\\":(\d+),\\"pending\\":(\d+),\\"resolved\\":(\d+)\}/);
    const minorMatch = pageText.match(/\\"minor\\":\{.*?\\"found\\":(\d+),\\"pending\\":(\d+),\\"resolved\\":(\d+)\}/);
    const infoMatch = pageText.match(/\\"informational\\":\{.*?\\"found\\":(\d+),\\"pending\\":(\d+),\\"resolved\\":(\d+)\}/);
    
    if (jsonMatch) {
      findings.critical = { found: parseInt(jsonMatch[1]), pending: parseInt(jsonMatch[2]), resolved: parseInt(jsonMatch[3]) };
    }
    if (majorMatch) {
      findings.major = { found: parseInt(majorMatch[1]), pending: parseInt(majorMatch[2]), resolved: parseInt(majorMatch[3]) };
    }
    if (mediumMatch) {
      findings.medium = { found: parseInt(mediumMatch[1]), pending: parseInt(mediumMatch[2]), resolved: parseInt(mediumMatch[3]) };
    }
    if (minorMatch) {
      findings.minor = { found: parseInt(minorMatch[1]), pending: parseInt(minorMatch[2]), resolved: parseInt(minorMatch[3]) };
    }
    if (infoMatch) {
      findings.informational = { found: parseInt(infoMatch[1]), pending: parseInt(infoMatch[2]), resolved: parseInt(infoMatch[3]) };
    }
    
    data.critical = findings.critical;
    data.major = findings.major;
    data.medium = findings.medium;
    data.minor = findings.minor;
    data.informational = findings.informational;
    
    // Extract votes (secure/insecure)
    const votesMatch = pageText.match(/(\d+)\s*votes?/i);
    if (votesMatch) {
      data.total_votes = parseInt(votesMatch[1]) || 0;
    }
    
    const secureMatch = pageText.match(/Secure[:\s]*(\d+)/i);
    const insecureMatch = pageText.match(/Insecure[:\s]*(\d+)/i);
    if (secureMatch) data.secure_votes = parseInt(secureMatch[1]) || 0;
    if (insecureMatch) data.insecure_votes = parseInt(insecureMatch[1]) || 0;
    
    // Extract Platform/Network information
    // Look for patterns like "Platform: BSC", "Network: Ethereum", etc.
    const platformLabels = $('.label, .info-label, .detail-label, span').filter((i, el) => {
      const text = $(el).text().trim().toLowerCase();
      return text === 'platform' || text === 'network' || text === 'blockchain' || text === 'chain';
    });
    
    if (platformLabels.length > 0) {
      const platformValue = platformLabels.first().next().text().trim() || 
                           platformLabels.first().parent().find('.value, .info-value, .detail-value').text().trim();
      if (platformValue) {
        data.platform = platformValue;
      }
    }
    
    // Alternative: search in page text for common platform patterns
    if (!data.platform) {
      const platformPatterns = [
        /(?:Platform|Network|Chain|Blockchain)[:\s]+([A-Za-z0-9\s]+?)(?:\n|<|$)/i,
        /(?:Built on|Deployed on)[:\s]+([A-Za-z0-9\s]+?)(?:\n|<|$)/i
      ];
      
      for (const pattern of platformPatterns) {
        const match = pageText.match(pattern);
        if (match && match[1]) {
          data.platform = match[1].trim();
          break;
        }
      }
    }
    
    // Fallback: look in the page metadata or specific sections
    if (!data.platform) {
      const analysisSection = $('.token-analysis, .project-info, .contract-info');
      if (analysisSection.length > 0) {
        const analysisText = analysisSection.text();
        const platformMatch = analysisText.match(/(?:Platform|Network)[:\s]+([A-Za-z0-9\s]+?)(?:\n|,|;|$)/i);
        if (platformMatch) {
          data.platform = platformMatch[1].trim();
        }
      }
    }
    
    return data;
  } catch (error) {
    console.error(`Error scraping ${slug}:`, error.message);
    return null;
  }
}

/**
 * Main function to scrape all published projects
 */
async function scrapeAllProjects() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/audit-portal');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const projectsCollection = db.collection('projects');
    
    console.log('Fetching all published projects...');
    const projects = await projectsCollection.find({ published: true }).project({ slug: 1, name: 1 }).toArray();
    
    console.log(`Found ${projects.length} published projects`);
    console.log('Starting scrape...\n');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      console.log(`[${i + 1}/${projects.length}] ${project.name}`);
      
      const scrapedData = await scrapeProjectPage(project.slug);
      
      if (scrapedData && Object.keys(scrapedData).length > 0) {
        try {
          // Build update object
          const updateData = {};
          if (scrapedData.overview) updateData.overview = scrapedData.overview;
          if (scrapedData.critical) updateData.critical = scrapedData.critical;
          if (scrapedData.major) updateData.major = scrapedData.major;
          if (scrapedData.medium) updateData.medium = scrapedData.medium;
          if (scrapedData.minor) updateData.minor = scrapedData.minor;
          if (scrapedData.informational) updateData.informational = scrapedData.informational;
          if (scrapedData.total_votes !== undefined) updateData.total_votes = scrapedData.total_votes;
          if (scrapedData.secure_votes !== undefined) updateData.secure_votes = scrapedData.secure_votes;
          if (scrapedData.insecure_votes !== undefined) updateData.insecure_votes = scrapedData.insecure_votes;
          if (scrapedData.platform) updateData.platform = scrapedData.platform;
          
          await projectsCollection.updateOne(
            { _id: project._id },
            { $set: updateData }
          );
          
          console.log(`  ✓ Updated`);
          successCount++;
        } catch (error) {
          console.log(`  ✗ Error updating: ${error.message}`);
          errorCount++;
        }
      } else {
        console.log(`  ⚠ No data scraped`);
        errorCount++;
      }
      
      // Rate limiting - wait 2 seconds between requests
      if (i < projects.length - 1) {
        await delay(2000);
      }
    }
    
    console.log('\n=== Scraping Complete ===');
    console.log(`Success: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Total: ${projects.length}`);
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await client.close();
  }
}

// Run if called directly
if (require.main === module) {
  scrapeAllProjects().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { scrapeProjectPage, scrapeAllProjects };
