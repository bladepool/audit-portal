require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Project = require('./src/models/Project');

// Try to load pdf-parse, fallback to manual extraction needed message
let pdfParse;
try {
  pdfParse = require('pdf-parse');
} catch (err) {
  console.log('⚠️  pdf-parse not installed. Install with: npm install pdf-parse');
  process.exit(1);
}

const AUDITS_TEMPORAL_PATH = 'E:\\Desktop\\Old Desktop November 2023\\audits\\PDFscript\\CFGNinjaScripts\\Custom Contract\\Audits_Temporal';

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/auditportal')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Social media patterns
const PATTERNS = {
  website: /(?:website|site|web):\s*(https?:\/\/[^\s\)]+)/gi,
  websiteUrl: /https?:\/\/(?:www\.)?[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}/gi,
  twitter: /(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/gi,
  telegram: /(?:t\.me|telegram\.me)\/([a-zA-Z0-9_]+)/gi,
  github: /github\.com\/([a-zA-Z0-9_-]+)/gi,
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi
};

function normalizeForComparison(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function extractSocialLinks(text) {
  const links = {
    website: null,
    twitter: null,
    telegram: null,
    github: null
  };

  // Extract Twitter
  const twitterMatches = [...text.matchAll(PATTERNS.twitter)];
  if (twitterMatches.length > 0) {
    const username = twitterMatches[0][1];
    links.twitter = `https://x.com/${username}`;
  }

  // Extract Telegram
  const telegramMatches = [...text.matchAll(PATTERNS.telegram)];
  if (telegramMatches.length > 0) {
    const channel = telegramMatches[0][1];
    links.telegram = `https://t.me/${channel}`;
  }

  // Extract Github
  const githubMatches = [...text.matchAll(PATTERNS.github)];
  if (githubMatches.length > 0) {
    const username = githubMatches[0][1];
    // Filter out common repo names
    if (!['CFG-NINJA', 'audits', 'ethereum', 'bitcoin'].includes(username)) {
      links.github = `https://github.com/${username}`;
    }
  }

  // Extract Website - look for explicit "Website:" mentions first
  const websiteMentions = [...text.matchAll(PATTERNS.website)];
  if (websiteMentions.length > 0) {
    links.website = websiteMentions[0][1].trim();
  } else {
    // Fallback to finding any URLs
    const urls = [...text.matchAll(PATTERNS.websiteUrl)];
    for (const urlMatch of urls) {
      const url = urlMatch[0];
      // Skip social media URLs
      if (!url.includes('twitter.com') && 
          !url.includes('x.com') && 
          !url.includes('t.me') && 
          !url.includes('telegram.me') && 
          !url.includes('github.com') &&
          !url.includes('cfg.ninja')) {
        links.website = url;
        break;
      }
    }
  }

  return links;
}

async function extractFromPDF(pdfPath) {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (err) {
    console.error(`Error parsing PDF ${pdfPath}:`, err.message);
    return null;
  }
}

async function extractSocialsFromPDFs() {
  try {
    console.log('\n📊 Starting PDF Social Links Extraction...\n');
    
    const pdfFiles = fs.readdirSync(AUDITS_TEMPORAL_PATH)
      .filter(f => f.endsWith('.pdf'));
    
    console.log(`Found ${pdfFiles.length} PDF files\n`);
    
    let stats = {
      totalProcessed: 0,
      websitesAdded: 0,
      twitterAdded: 0,
      telegramAdded: 0,
      githubAdded: 0,
      matched: 0,
      notMatched: 0,
      errors: 0
    };
    
    for (const file of pdfFiles.slice(0, 50)) { // Process first 50 as test
      stats.totalProcessed++;
      
      console.log(`Processing ${stats.totalProcessed}/${Math.min(50, pdfFiles.length)}: ${file}`);
      
      try {
        // Extract project name from filename
        // Format: YYYYMMDD_CFGNINJA_ProjectName_SYMBOL_Audit.pdf
        const parts = file.replace('.pdf', '').split('_');
        if (parts.length < 3) continue;
        
        const projectName = parts.slice(2, -2).join(' ');
        const normalizedName = normalizeForComparison(projectName);
        
        // Find matching project
        const projects = await Project.find({
          $or: [
            { name: { $regex: new RegExp(projectName, 'i') } },
            { slug: { $regex: new RegExp(normalizedName, 'i') } }
          ]
        });
        
        let matchedProject = null;
        
        for (const proj of projects) {
          if (normalizeForComparison(proj.name) === normalizedName) {
            matchedProject = proj;
            break;
          }
        }
        
        if (!matchedProject && projects.length > 0) {
          matchedProject = projects[0];
        }
        
        if (!matchedProject) {
          console.log(`⚠️  No match found for: ${projectName}`);
          stats.notMatched++;
          continue;
        }
        
        stats.matched++;
        
        // Extract text from PDF
        const pdfPath = path.join(AUDITS_TEMPORAL_PATH, file);
        const text = await extractFromPDF(pdfPath);
        
        if (!text) {
          stats.errors++;
          continue;
        }
        
        // Extract social links
        const links = extractSocialLinks(text);
        
        let updated = false;
        const updates = {};
        
        if (links.website && !matchedProject.socials?.website) {
          updates['socials.website'] = links.website;
          stats.websitesAdded++;
          updated = true;
        }
        
        if (links.twitter && !matchedProject.socials?.twitter) {
          updates['socials.twitter'] = links.twitter;
          stats.twitterAdded++;
          updated = true;
        }
        
        if (links.telegram && !matchedProject.socials?.telegram) {
          updates['socials.telegram'] = links.telegram;
          stats.telegramAdded++;
          updated = true;
        }
        
        if (links.github && !matchedProject.socials?.github) {
          updates['socials.github'] = links.github;
          stats.githubAdded++;
          updated = true;
        }
        
        if (updated) {
          await Project.findByIdAndUpdate(matchedProject._id, { $set: updates });
          console.log(`✅ Updated ${matchedProject.name} - ${Object.keys(updates).join(', ')}`);
        } else {
          console.log(`⏭️  ${matchedProject.name} - already has social links`);
        }
        
      } catch (err) {
        console.error(`Error processing ${file}:`, err.message);
        stats.errors++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📈 Extraction Summary:');
    console.log('='.repeat(60));
    console.log(`Total PDFs processed: ${stats.totalProcessed}`);
    console.log(`Projects matched: ${stats.matched}`);
    console.log(`Projects not matched: ${stats.notMatched}`);
    console.log(`Errors: ${stats.errors}`);
    console.log(`\nData Added:`);
    console.log(`  Websites: ${stats.websitesAdded}`);
    console.log(`  Twitter: ${stats.twitterAdded}`);
    console.log(`  Telegram: ${stats.telegramAdded}`);
    console.log(`  Github: ${stats.githubAdded}`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('Error extracting from PDFs:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Extraction complete');
  }
}

extractSocialsFromPDFs();
