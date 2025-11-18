require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./src/models/Project');
const https = require('https');

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (res) => {
      let data = '';
      
      if (res.statusCode === 301 || res.statusCode === 302) {
        return httpsGet(res.headers.location).then(resolve).catch(reject);
      }
      
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function extractPdfUrl(html) {
  // Look for PDF URLs in the HTML
  // Pattern 1: Direct GitHub links
  const githubMatch = html.match(/https:\/\/github\.com\/CFG-NINJA\/audits\/blob\/[^"'\s]+\.pdf/i);
  if (githubMatch) {
    return githubMatch[0];
  }
  
  // Pattern 2: Direct PDF links
  const pdfMatch = html.match(/https?:\/\/[^"'\s]+\.pdf/i);
  if (pdfMatch) {
    return pdfMatch[0];
  }
  
  return null;
}

async function scrapePdfUrls() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get all projects without PDF
    const projects = await Project.find({
      $or: [
        { auditPdfUrl: { $exists: false } },
        { auditPdfUrl: '' }
      ]
    }).select('name slug auditPdfUrl'); // Process all
    
    console.log(`Found ${projects.length} projects without PDF URLs\n`);
    console.log('Scraping audit.cfg.ninja for PDF URLs...\n');

    let found = 0;
    let notFound = 0;
    let errors = 0;

    for (const project of projects) {
      try {
        const url = `https://audit.cfg.ninja/${project.slug}`;
        console.log(`Checking ${project.name} (${project.slug})...`);
        
        const html = await httpsGet(url);
        const pdfUrl = extractPdfUrl(html);
        
        if (pdfUrl) {
          project.auditPdfUrl = pdfUrl;
          await project.save();
          found++;
          console.log(`  ✓ Found PDF: ${pdfUrl}`);
        } else {
          notFound++;
          console.log(`  ⚠ No PDF found`);
        }
        
        // Delay to avoid overwhelming server
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        errors++;
        console.error(`  ✗ Error: ${error.message}`);
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('Summary:');
    console.log(`  Processed: ${projects.length}`);
    console.log(`  Found PDF: ${found}`);
    console.log(`  Not found: ${notFound}`);
    console.log(`  Errors: ${errors}`);
    console.log(`${'='.repeat(60)}\n`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

scrapePdfUrls();
