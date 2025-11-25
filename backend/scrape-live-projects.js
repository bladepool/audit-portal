/**
 * Scrape all 367 projects from live audit.cfg.ninja portal
 * and import them into the new database
 */

const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/auditportal';
const OLD_PORTAL_URL = 'https://audit.cfg.ninja';

// Import Project model
const Project = require('./src/models/Project');

// Stats
const stats = {
  scraped: 0,
  imported: 0,
  updated: 0,
  skipped: 0,
  errors: 0
};

/**
 * Get all project slugs from the main page
 */
async function getAllProjectSlugs() {
  try {
    console.log('🔍 Fetching all project slugs from', OLD_PORTAL_URL);
    
    const response = await axios.get(OLD_PORTAL_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);
    const slugs = [];

    // Look for project links - adjust selectors based on actual site structure
    $('a[href^="/"]').each((i, el) => {
      const href = $(el).attr('href');
      if (href && href !== '/' && !href.includes('#') && !href.includes('?')) {
        const slug = href.replace(/^\//, '').replace(/\/$/, '');
        // Filter out non-project pages
        if (slug && !slug.includes('/') && slug !== 'about' && slug !== 'contact') {
          if (!slugs.includes(slug)) {
            slugs.push(slug);
          }
        }
      }
    });

    console.log(`✅ Found ${slugs.length} project slugs\n`);
    return slugs;
  } catch (error) {
    console.error('❌ Error fetching project list:', error.message);
    return [];
  }
}

/**
 * Scrape full project data from individual project page
 */
async function scrapeProjectData(slug) {
  try {
    const url = `${OLD_PORTAL_URL}/${slug}`;
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const data = {
      slug,
      name: '',
      symbol: '',
      description: '',
      socials: {},
      contract_info: {},
      overview: {},
    };

    // Extract project name
    const nameEl = $('h1, .project-name, .title').first();
    if (nameEl.length) {
      data.name = nameEl.text().trim();
    }

    // Extract from meta tags
    const metaTitle = $('meta[property="og:title"]').attr('content') || $('title').text();
    if (metaTitle && !data.name) {
      data.name = metaTitle.split('|')[0].trim();
    }

    // Extract symbol (usually in parentheses or as data attribute)
    const symbolMatch = data.name.match(/\(([A-Z0-9$]+)\)/);
    if (symbolMatch) {
      data.symbol = symbolMatch[1];
      data.name = data.name.replace(/\s*\([^)]+\)/, '').trim();
    }

    // Extract description
    const descEl = $('.description, .project-description, [class*="description"]').first();
    if (descEl.length) {
      data.description = descEl.text().trim();
    }
    
    const metaDesc = $('meta[name="description"]').attr('content');
    if (metaDesc && !data.description) {
      data.description = metaDesc;
    }

    // Extract contract address
    const addressEl = $('[class*="address"], [class*="contract"]').first();
    if (addressEl.length) {
      const addressText = addressEl.text();
      const addressMatch = addressText.match(/0x[a-fA-F0-9]{40}/);
      if (addressMatch) {
        data.contract_info.contract_address = addressMatch[0];
        data.address = addressMatch[0];
      }
    }

    // Extract social links
    $('a[href]').each((i, el) => {
      const href = $(el).attr('href');
      if (href) {
        if (href.includes('twitter.com') || href.includes('x.com')) {
          data.socials.twitter = href;
        } else if (href.includes('t.me')) {
          data.socials.telegram = href;
        } else if (href.includes('github.com')) {
          data.socials.github = href;
        } else if (href.includes('discord')) {
          data.socials.discord = href;
        } else if (href.match(/^https?:\/\/[^/]+\/?$/) && !href.includes('audit.cfg.ninja')) {
          // Likely the project website
          if (!data.socials.website) {
            data.socials.website = href;
          }
        }
      }
    });

    // Extract platform (BSC, ETH, etc.)
    const platformEl = $('[class*="platform"], [class*="chain"]').first();
    if (platformEl.length) {
      data.platform = platformEl.text().trim();
    }

    // Look for tax information
    const taxEl = $('[class*="tax"]');
    if (taxEl.length) {
      const taxText = taxEl.text();
      const buyMatch = taxText.match(/buy[:\s]*(\d+)%?/i);
      const sellMatch = taxText.match(/sell[:\s]*(\d+)%?/i);
      if (buyMatch) data.overview.buy_tax = parseFloat(buyMatch[1]);
      if (sellMatch) data.overview.sell_tax = parseFloat(sellMatch[1]);
    }

    // Extract PDF link
    const pdfLink = $('a[href$=".pdf"]').attr('href');
    if (pdfLink) {
      data.audit_pdf = pdfLink.startsWith('http') ? pdfLink : `${OLD_PORTAL_URL}${pdfLink}`;
    }

    return data;
  } catch (error) {
    console.error(`❌ Error scraping ${slug}:`, error.message);
    return null;
  }
}

/**
 * Generate slug from name
 */
function generateSlug(name, symbol) {
  if (!name) return `project-${Date.now()}`;
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Map scraped data to Project schema
 */
function mapToProjectSchema(data) {
  return {
    name: data.name || 'Unknown Project',
    symbol: data.symbol || 'UNK',
    decimals: 18,
    supply: '0',
    description: data.description || `Audit for ${data.name || 'project'}`,
    slug: data.slug || generateSlug(data.name, data.symbol),
    audit_pdf: data.audit_pdf || '',
    
    socials: {
      telegram: data.socials.telegram || '',
      twitter: data.socials.twitter || '',
      website: data.socials.website || '',
      github: data.socials.github || '',
    },
    
    contract_info: {
      contract_name: data.name || '',
      contract_address: data.contract_info.contract_address || data.address || '',
      contract_verified: true,
    },
    
    address: data.contract_info.contract_address || data.address || '',
    platform: data.platform || 'Binance Smart Chain',
    
    overview: {
      buy_tax: data.overview.buy_tax || 0,
      sell_tax: data.overview.sell_tax || 0,
    },
    
    status: 'PUBLISHED',
  };
}

/**
 * Import project into database
 */
async function importProject(projectData) {
  try {
    // Check if project already exists
    const existing = await Project.findOne({
      $or: [
        { slug: projectData.slug },
        { address: projectData.address },
        { 'contract_info.contract_address': projectData.contract_info.contract_address }
      ].filter(q => q.address || q.slug || q['contract_info.contract_address'])
    });

    if (existing) {
      console.log(`  ⏭️  Already exists: ${projectData.name}`);
      stats.skipped++;
      return false;
    }

    // Create new project
    const project = new Project(projectData);
    await project.save();
    
    console.log(`  ✅ Imported: ${projectData.name} (${projectData.slug})`);
    stats.imported++;
    return true;
  } catch (error) {
    console.error(`  ❌ Error importing ${projectData.name}:`, error.message);
    stats.errors++;
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all project slugs from the live site
    const slugs = await getAllProjectSlugs();
    
    if (slugs.length === 0) {
      console.log('⚠️  No project slugs found. The site structure may have changed.');
      console.log('📝 Please check the site manually and update the selectors.');
      return;
    }

    console.log(`🚀 Starting import of ${slugs.length} projects...\n`);

    // Process each project
    for (let i = 0; i < slugs.length; i++) {
      const slug = slugs[i];
      console.log(`[${i + 1}/${slugs.length}] Processing: ${slug}`);

      // Scrape project data
      const projectData = await scrapeProjectData(slug);
      
      if (projectData && projectData.name) {
        stats.scraped++;
        
        // Map to schema
        const mappedData = mapToProjectSchema(projectData);
        
        // Import to database
        await importProject(mappedData);
      } else {
        console.log(`  ⚠️  No data found for ${slug}`);
        stats.errors++;
      }

      // Rate limiting - wait 2 seconds between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Import Summary:');
    console.log(`  🔍 Slugs found: ${slugs.length}`);
    console.log(`  📄 Successfully scraped: ${stats.scraped}`);
    console.log(`  ✅ Imported: ${stats.imported}`);
    console.log(`  ⏭️  Skipped (duplicates): ${stats.skipped}`);
    console.log(`  ❌ Errors: ${stats.errors}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('💥 Fatal error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

// Run the script
main();
