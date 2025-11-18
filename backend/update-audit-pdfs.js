require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./src/models/Project');
const fs = require('fs');

// Normalize string for comparison
function normalizeForComparison(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove all non-alphanumeric chars
    .trim();
}

// Generate slug from name
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

async function updateAuditPdfs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Load GitHub audits
    const audits = JSON.parse(fs.readFileSync('github-audits.json', 'utf8'));
    console.log(`Loaded ${audits.length} audit PDFs from GitHub\n`);

    // Get all projects
    const projects = await Project.find({}).select('name slug auditPdfUrl');
    console.log(`Found ${projects.length} projects in database\n`);

    // Create a map of normalized names to projects
    const projectMap = new Map();
    projects.forEach(project => {
      const normalized = normalizeForComparison(project.name);
      projectMap.set(normalized, project);
    });

    let matched = 0;
    let updated = 0;
    let skipped = 0;
    let unmatched = [];

    console.log('Matching audits to projects...\n');

    for (const audit of audits) {
      const normalizedAuditName = normalizeForComparison(audit.projectName);
      const project = projectMap.get(normalizedAuditName);

      if (project) {
        matched++;
        
        // Generate GitHub permalink
        // Format: https://github.com/CFG-NINJA/audits/blob/{sha}/{filename}
        const permalink = `https://github.com/CFG-NINJA/audits/blob/${audit.sha}/${encodeURIComponent(audit.name)}`;
        
        // Update project
        project.auditPdfUrl = permalink;
        await project.save();
        updated++;
        
        console.log(`✓ Matched: ${audit.projectName} -> ${project.name}`);
        console.log(`  URL: ${permalink}`);
      } else {
        skipped++;
        unmatched.push(audit);
        console.log(`⚠ No match: ${audit.projectName}`);
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('Summary:');
    console.log(`  Total audits: ${audits.length}`);
    console.log(`  Matched: ${matched}`);
    console.log(`  Updated: ${updated}`);
    console.log(`  Unmatched: ${skipped}`);
    console.log(`${'='.repeat(60)}\n`);

    // Save unmatched audits for review
    if (unmatched.length > 0) {
      fs.writeFileSync(
        'unmatched-audits.json',
        JSON.stringify(unmatched, null, 2)
      );
      console.log(`Saved ${unmatched.length} unmatched audits to unmatched-audits.json`);
      console.log('\nFirst 20 unmatched audits:');
      unmatched.slice(0, 20).forEach(audit => {
        console.log(`  - ${audit.projectName}`);
      });
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

updateAuditPdfs();
