require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Project = require('./src/models/Project');

// Logo output directory
const LOGO_DIR = path.join(__dirname, '..', 'frontend', 'public', 'logos');

// Ensure logo directory exists
if (!fs.existsSync(LOGO_DIR)) {
  fs.mkdirSync(LOGO_DIR, { recursive: true });
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/auditportal')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Color palettes for gradients
const COLOR_SCHEMES = [
  { start: '#6366f1', end: '#8b5cf6', name: 'Purple' },      // Indigo to Purple
  { start: '#3b82f6', end: '#06b6d4', name: 'Blue' },        // Blue to Cyan
  { start: '#10b981', end: '#34d399', name: 'Green' },       // Emerald to Green
  { start: '#f59e0b', end: '#f97316', name: 'Orange' },      // Amber to Orange
  { start: '#ef4444', end: '#f43f5e', name: 'Red' },         // Red to Rose
  { start: '#8b5cf6', end: '#ec4899', name: 'Pink' },        // Violet to Pink
  { start: '#06b6d4', end: '#10b981', name: 'Teal' },        // Cyan to Emerald
  { start: '#f43f5e', end: '#fb923c', name: 'Coral' },       // Rose to Orange
  { start: '#6366f1', end: '#06b6d4', name: 'Sky' },         // Indigo to Cyan
  { start: '#ec4899', end: '#f59e0b', name: 'Sunset' }       // Pink to Amber
];

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

function getColorScheme(projectName) {
  const hash = hashString(projectName);
  return COLOR_SCHEMES[hash % COLOR_SCHEMES.length];
}

function getInitials(name) {
  if (!name) return '?';
  
  // Remove special characters and extra spaces
  const cleaned = name.replace(/[^a-zA-Z0-9\s]/g, ' ').trim();
  const words = cleaned.split(/\s+/);
  
  if (words.length === 1) {
    // Single word - take first 2 characters
    return words[0].substring(0, 2).toUpperCase();
  } else {
    // Multiple words - take first character of first 2 words
    return (words[0][0] + words[1][0]).toUpperCase();
  }
}

function generateSVGLogo(projectName, symbol) {
  const colors = getColorScheme(projectName);
  const initials = getInitials(projectName);
  const displayText = symbol && symbol.length <= 4 ? symbol.toUpperCase() : initials;
  
  // Calculate font size based on text length
  const fontSize = displayText.length === 1 ? 120 : 
                   displayText.length === 2 ? 100 : 
                   displayText.length === 3 ? 80 : 60;
  
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.start};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colors.end};stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background circle with gradient -->
  <circle cx="128" cy="128" r="120" fill="url(#grad)"/>
  
  <!-- Text -->
  <text 
    x="128" 
    y="128" 
    font-family="Arial, sans-serif" 
    font-size="${fontSize}" 
    font-weight="bold" 
    fill="white" 
    text-anchor="middle" 
    dominant-baseline="central"
  >${displayText}</text>
</svg>`;
  
  return svg;
}

function generateSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function generatePlaceholderLogos() {
  try {
    console.log('\n🎨 Starting Placeholder Logo Generation...\n');
    
    // Find projects without logos
    const projects = await Project.find({
      published: true,
      $or: [
        { logo: { $exists: false } },
        { logo: null },
        { logo: '' }
      ]
    });
    
    console.log(`Found ${projects.length} projects without logos\n`);
    
    let stats = {
      totalProcessed: 0,
      logosGenerated: 0,
      errors: 0
    };
    
    for (const project of projects) {
      stats.totalProcessed++;
      
      try {
        const slug = generateSlug(project.name);
        const filename = `${slug}-placeholder.svg`;
        const filepath = path.join(LOGO_DIR, filename);
        
        // Generate SVG logo
        const svg = generateSVGLogo(project.name, project.symbol);
        fs.writeFileSync(filepath, svg);
        
        // Update project with logo path
        await Project.findByIdAndUpdate(project._id, {
          $set: { logo: `/logos/${filename}` }
        });
        
        const colors = getColorScheme(project.name);
        console.log(`✅ [${stats.totalProcessed}/${projects.length}] Generated: ${project.name} (${colors.name} gradient)`);
        stats.logosGenerated++;
        
      } catch (err) {
        console.error(`❌ Error generating logo for ${project.name}:`, err.message);
        stats.errors++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📈 Generation Summary:');
    console.log('='.repeat(60));
    console.log(`Total projects processed: ${stats.totalProcessed}`);
    console.log(`Logos generated: ${stats.logosGenerated}`);
    console.log(`Errors: ${stats.errors}`);
    console.log('='.repeat(60));
    
    // Calculate final coverage
    const totalPublished = await Project.countDocuments({ published: true });
    const withLogos = await Project.countDocuments({ 
      published: true,
      logo: { $exists: true, $ne: null, $ne: '' }
    });
    
    console.log(`\n📊 Final Logo Coverage: ${withLogos}/${totalPublished} (${((withLogos/totalPublished)*100).toFixed(1)}%)`);
    
  } catch (error) {
    console.error('Error generating placeholder logos:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Generation complete');
  }
}

generatePlaceholderLogos();
