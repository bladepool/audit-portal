const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkFindings() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/audit-portal');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db();
    const projectsCollection = db.collection('projects');
    
    const projects = await projectsCollection.find({ published: true }).toArray();
    
    console.log(`Total published projects: ${projects.length}\n`);
    
    let totalCritical = 0;
    let totalHigh = 0;
    let totalMedium = 0;
    let totalLow = 0;
    let totalInfo = 0;
    
    let projectsWithIssues = 0;
    let projectsWithExtremeValues = [];
    
    projects.forEach(project => {
      const critical = project.critical?.found || 0;
      const high = project.major?.found || 0;
      const medium = project.medium?.found || 0;
      const low = project.minor?.found || 0;
      const info = project.informational?.found || 0;
      
      totalCritical += critical;
      totalHigh += high;
      totalMedium += medium;
      totalLow += low;
      totalInfo += info;
      
      if (critical + high + medium + low + info > 0) {
        projectsWithIssues++;
      }
      
      // Flag projects with suspiciously high informational counts
      if (info > 1000) {
        projectsWithExtremeValues.push({
          name: project.name,
          slug: project.slug,
          critical,
          high,
          medium,
          low,
          informational: info
        });
      }
    });
    
    const total = totalCritical + totalHigh + totalMedium + totalLow + totalInfo;
    
    console.log('=== FINDINGS SUMMARY ===');
    console.log(`Critical: ${totalCritical} (${((totalCritical / total) * 100).toFixed(1)}%)`);
    console.log(`High: ${totalHigh} (${((totalHigh / total) * 100).toFixed(1)}%)`);
    console.log(`Medium: ${totalMedium} (${((totalMedium / total) * 100).toFixed(1)}%)`);
    console.log(`Low: ${totalLow} (${((totalLow / total) * 100).toFixed(1)}%)`);
    console.log(`Informational: ${totalInfo} (${((totalInfo / total) * 100).toFixed(1)}%)`);
    console.log(`\nTotal: ${total}`);
    console.log(`Projects with issues: ${projectsWithIssues}`);
    
    if (projectsWithExtremeValues.length > 0) {
      console.log(`\n=== PROJECTS WITH EXTREME INFORMATIONAL COUNTS (>1000) ===`);
      console.log(`Found ${projectsWithExtremeValues.length} projects:\n`);
      
      projectsWithExtremeValues.forEach(p => {
        console.log(`${p.name} (${p.slug})`);
        console.log(`  Critical: ${p.critical}, High: ${p.high}, Medium: ${p.medium}, Low: ${p.low}, Info: ${p.informational}`);
      });
      
      console.log('\n=== RECOMMENDATIONS ===');
      console.log('These projects likely have incorrect data scraped.');
      console.log('You may want to:');
      console.log('1. Check the audit.cfg.ninja pages manually');
      console.log('2. Reset these findings to 0');
      console.log('3. Re-scrape with improved logic');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkFindings();
