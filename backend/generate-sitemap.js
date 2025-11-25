require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Project = require('./src/models/Project');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/auditportal')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const SITEMAP_PATH = path.join(__dirname, '..', 'frontend', 'public', 'sitemap.xml');
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://audit.cfg.ninja';

function formatDate(date) {
  if (!date) return new Date().toISOString().split('T')[0];
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

async function generateSitemap() {
  try {
    console.log('\n🗺️  Generating Sitemap for SEO...\n');
    
    // Get all published projects
    const projects = await Project.find({ published: true })
      .select('slug updatedAt')
      .sort({ updatedAt: -1 });
    
    console.log(`Found ${projects.length} published projects\n`);
    
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
`;
    
    // Add homepage
    sitemap += `  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${formatDate()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
`;
    
    // Add static pages
    const staticPages = [
      { path: '/about', priority: '0.8', changefreq: 'monthly' },
      { path: '/contact', priority: '0.7', changefreq: 'monthly' }
    ];
    
    staticPages.forEach(page => {
      sitemap += `  <url>
    <loc>${BASE_URL}${page.path}</loc>
    <lastmod>${formatDate()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    });
    
    // Add project pages
    let projectCount = 0;
    projects.forEach(project => {
      sitemap += `  <url>
    <loc>${BASE_URL}/${project.slug}</loc>
    <lastmod>${formatDate(project.updatedAt)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
`;
      projectCount++;
    });
    
    sitemap += `</urlset>`;
    
    // Write sitemap to file
    fs.writeFileSync(SITEMAP_PATH, sitemap);
    
    const stats = fs.statSync(SITEMAP_PATH);
    const sizeKB = (stats.size / 1024).toFixed(2);
    
    console.log('='.repeat(60));
    console.log('📈 Sitemap Generation Summary:');
    console.log('='.repeat(60));
    console.log(`Homepage: 1`);
    console.log(`Static pages: ${staticPages.length}`);
    console.log(`Project pages: ${projectCount}`);
    console.log(`Total URLs: ${1 + staticPages.length + projectCount}`);
    console.log(`\nFile: ${SITEMAP_PATH}`);
    console.log(`Size: ${sizeKB} KB`);
    console.log('='.repeat(60));
    
    // Generate robots.txt
    const robotsPath = path.join(__dirname, '..', 'frontend', 'public', 'robots.txt');
    const robotsTxt = `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/

Sitemap: ${BASE_URL}/sitemap.xml
`;
    
    fs.writeFileSync(robotsPath, robotsTxt);
    console.log(`\n✅ Created robots.txt: ${robotsPath}`);
    
    console.log('\n✅ Sitemap generation complete!');
    console.log(`\n📍 Submit to search engines:`);
    console.log(`   Google: https://search.google.com/search-console`);
    console.log(`   Bing: https://www.bing.com/webmasters`);
    
  } catch (error) {
    console.error('Error generating sitemap:', error);
  } finally {
    await mongoose.connection.close();
  }
}

generateSitemap();
