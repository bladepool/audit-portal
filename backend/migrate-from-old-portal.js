/**
 * Migration script to extract data from old audit.cfg.ninja portal
 * and populate missing fields in the new database
 */

const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/audit-portal');

// Project model
const Project = mongoose.model('Project');

// Old portal URL
const OLD_PORTAL_URL = 'https://audit.cfg.ninja';

/**
 * Scrape data from old portal project page
 */
async function scrapeOldPortalData(slug) {
  try {
    const url = `${OLD_PORTAL_URL}/${slug}`;
    console.log(`\n📡 Fetching: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const data = {};

    // Extract description
    const descriptionEl = $('.project-description, .description, [class*="description"]');
    if (descriptionEl.length) {
      data.description = descriptionEl.text().trim();
    }

    // Extract social media links
    const socialLinks = {};
    $('a[href*="twitter.com"], a[href*="t.me"], a[href*="discord"], a[href*="github"]').each((i, el) => {
      const href = $(el).attr('href');
      if (href) {
        if (href.includes('twitter.com') || href.includes('x.com')) {
          socialLinks.twitter = href;
        } else if (href.includes('t.me')) {
          socialLinks.telegram = href;
        } else if (href.includes('discord')) {
          socialLinks.discord = href;
        } else if (href.includes('github')) {
          socialLinks.github = href;
        }
      }
    });
    
    if (Object.keys(socialLinks).length > 0) {
      data.socialLinks = socialLinks;
    }

    // Extract findings
    const findings = [];
    $('.finding, [class*="finding"]').each((i, el) => {
      const finding = {};
      
      const titleEl = $(el).find('.finding-title, h3, h4').first();
      if (titleEl.length) {
        finding.title = titleEl.text().trim();
      }
      
      const severityEl = $(el).find('.severity, [class*="severity"]');
      if (severityEl.length) {
        finding.severity = severityEl.text().trim();
      }
      
      const descEl = $(el).find('.finding-description, p').first();
      if (descEl.length) {
        finding.description = descEl.text().trim();
      }
      
      if (finding.title) {
        findings.push(finding);
      }
    });
    
    if (findings.length > 0) {
      data.findings = findings;
    }

    // Extract any metadata
    const metaDescription = $('meta[name="description"]').attr('content');
    if (metaDescription && !data.description) {
      data.description = metaDescription;
    }

    console.log(`✅ Scraped data from ${slug}:`, {
      hasDescription: !!data.description,
      socialLinksCount: Object.keys(socialLinks).length,
      findingsCount: findings.length,
    });

    return data;
  } catch (error) {
    console.error(`❌ Error scraping ${slug}:`, error.message);
    return null;
  }
}

/**
 * Check if project needs data migration
 */
function needsMigration(project) {
  const missingDescription = !project.description || project.description.length < 50;
  const missingSocials = !project.socials || Object.keys(project.socials).length === 0;
  const missingFindings = !project.cfg_findings || project.cfg_findings.length === 0;
  
  return missingDescription || missingSocials || missingFindings;
}

/**
 * Update project with scraped data
 */
async function updateProject(project, scrapedData) {
  if (!scrapedData) return false;
  
  let updated = false;
  
  // Update description if missing or too short
  if (scrapedData.description && (!project.description || project.description.length < 50)) {
    project.description = scrapedData.description;
    updated = true;
    console.log(`  ✓ Updated description`);
  }
  
  // Update social links if missing
  if (scrapedData.socialLinks && Object.keys(scrapedData.socialLinks).length > 0) {
    if (!project.socials) {
      project.socials = {};
    }
    
    Object.keys(scrapedData.socialLinks).forEach(key => {
      if (!project.socials[key]) {
        project.socials[key] = scrapedData.socialLinks[key];
        updated = true;
        console.log(`  ✓ Added ${key} link`);
      }
    });
  }
  
  // Update findings if missing
  if (scrapedData.findings && scrapedData.findings.length > 0) {
    if (!project.cfg_findings || project.cfg_findings.length === 0) {
      project.cfg_findings = scrapedData.findings.map((f, index) => ({
        id: `CFG${String(index + 1).padStart(2, '0')}`,
        title: f.title || '',
        severity: f.severity || 'Medium',
        status: 'Pass',
        category: 'Security',
        description: f.description || '',
        location: '',
        recommendation: '',
        alleviation: '',
        action: '',
        score: 0,
      }));
      updated = true;
      console.log(`  ✓ Added ${scrapedData.findings.length} findings`);
    }
  }
  
  if (updated) {
    await project.save();
    console.log(`  💾 Saved updates to database`);
  }
  
  return updated;
}

/**
 * Main migration function
 */
async function migrateAllProjects() {
  console.log('🚀 Starting migration from old portal...\n');
  
  try {
    // Get all projects
    const projects = await Project.find({});
    console.log(`📊 Found ${projects.length} projects in database\n`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const project of projects) {
      const slug = project.slug;
      
      // Check if migration is needed
      if (!needsMigration(project)) {
        console.log(`⏭️  Skipping ${slug} - already has complete data`);
        skippedCount++;
        continue;
      }
      
      console.log(`\n🔄 Migrating: ${project.name} (${slug})`);
      
      // Scrape old portal
      const scrapedData = await scrapeOldPortalData(slug);
      
      if (scrapedData) {
        const updated = await updateProject(project, scrapedData);
        if (updated) {
          migratedCount++;
        } else {
          skippedCount++;
        }
      } else {
        errorCount++;
      }
      
      // Rate limiting - wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📈 Migration Summary:');
    console.log(`  ✅ Migrated: ${migratedCount}`);
    console.log(`  ⏭️  Skipped: ${skippedCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

/**
 * Migrate a single project by slug
 */
async function migrateSingleProject(slug) {
  console.log(`🚀 Migrating single project: ${slug}\n`);
  
  try {
    const project = await Project.findOne({ slug });
    
    if (!project) {
      console.error(`❌ Project not found: ${slug}`);
      return;
    }
    
    console.log(`📦 Found: ${project.name}`);
    
    const scrapedData = await scrapeOldPortalData(slug);
    
    if (scrapedData) {
      await updateProject(project, scrapedData);
      console.log(`\n✅ Migration complete for ${slug}`);
    } else {
      console.log(`\n❌ Failed to scrape data for ${slug}`);
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run migration
const args = process.argv.slice(2);
if (args.length > 0) {
  // Migrate specific project
  const slug = args[0];
  migrateSingleProject(slug);
} else {
  // Migrate all projects
  migrateAllProjects();
}
