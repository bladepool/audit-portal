const https = require('https');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
require('dotenv').config();

// Polyfill for ReadableStream in Node 16
if (typeof ReadableStream === 'undefined') {
  global.ReadableStream = require('stream/web').ReadableStream;
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/audit-portal');

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

const Project = require('./src/models/Project');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Scrape data from a single project page on audits.cfg.ninja
 */
async function scrapeProjectPage(slug) {
  try {
    const url = `https://audits.cfg.ninja/project/${slug}`;
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
    
    // Also try parsing from text content
    const pageText = $('body').text();
    const criticalMatch = pageText.match(/Critical[:\s]*(\d+)/i);
    const highMatch = pageText.match(/High[:\s]*(\d+)/i);
    const mediumMatch = pageText.match(/Medium[:\s]*(\d+)/i);
    const lowMatch = pageText.match(/Low[:\s]*(\d+)/i);
    
    if (criticalMatch && findings.critical.found === 0) findings.critical.found = parseInt(criticalMatch[1]);
    if (highMatch && findings.major.found === 0) findings.major.found = parseInt(highMatch[1]);
    if (mediumMatch && findings.medium.found === 0) findings.medium.found = parseInt(mediumMatch[1]);
    if (lowMatch && findings.minor.found === 0) findings.minor.found = parseInt(lowMatch[1]);
    
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
    
    return data;
  } catch (error) {
    console.error(`Error scraping ${slug}:`, error.message);
    return null;
  }
}

/**
 * Update project in database with scraped data
 */
async function updateProject(slug, scrapedData) {
  try {
    const project = await Project.findOne({ slug });
    if (!project) {
      console.log(`Project not found: ${slug}`);
      return false;
    }
    
    // Update only if we have data
    if (scrapedData.overview) {
      project.overview = { ...project.overview?.toObject(), ...scrapedData.overview };
    }
    
    if (scrapedData.critical) project.critical = scrapedData.critical;
    if (scrapedData.major) project.major = scrapedData.major;
    if (scrapedData.medium) project.medium = scrapedData.medium;
    if (scrapedData.minor) project.minor = scrapedData.minor;
    if (scrapedData.informational) project.informational = scrapedData.informational;
    
    if (scrapedData.total_votes !== undefined) project.total_votes = scrapedData.total_votes;
    if (scrapedData.secure_votes !== undefined) project.secure_votes = scrapedData.secure_votes;
    if (scrapedData.insecure_votes !== undefined) project.insecure_votes = scrapedData.insecure_votes;
    
    await project.save();
    console.log(`✓ Updated ${project.name}`);
    return true;
  } catch (error) {
    console.error(`Error updating ${slug}:`, error.message);
    return false;
  }
}

/**
 * Main function to scrape all published projects
 */
async function scrapeAllProjects() {
  try {
    console.log('Fetching all published projects...');
    const projects = await Project.find({ published: true }).select('slug name');
    
    console.log(`Found ${projects.length} published projects`);
    console.log('Starting scrape...\n');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      console.log(`[${i + 1}/${projects.length}] ${project.name}`);
      
      const scrapedData = await scrapeProjectPage(project.slug);
      
      if (scrapedData && Object.keys(scrapedData).length > 0) {
        const updated = await updateProject(project.slug, scrapedData);
        if (updated) {
          successCount++;
        } else {
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
    mongoose.connection.close();
  }
}

// Run if called directly
if (require.main === module) {
  scrapeAllProjects();
}

module.exports = { scrapeProjectPage, updateProject, scrapeAllProjects };
