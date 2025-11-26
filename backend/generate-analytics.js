require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./src/models/Project');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/auditportal')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

async function generateAnalytics() {
  try {
    console.log('\n📊 Portal Analytics Dashboard\n');
    console.log('='.repeat(70));
    
    // Overall Stats
    const totalProjects = await Project.countDocuments();
    const publishedProjects = await Project.countDocuments({ published: true });
    const unpublishedProjects = await Project.countDocuments({ published: false });
    
    console.log('\n📈 OVERALL STATISTICS');
    console.log('-'.repeat(70));
    console.log(`Total Projects:      ${totalProjects.toLocaleString()}`);
    console.log(`Published:           ${publishedProjects.toLocaleString()} (${(publishedProjects/totalProjects*100).toFixed(1)}%)`);
    console.log(`Unpublished:         ${unpublishedProjects.toLocaleString()} (${(unpublishedProjects/totalProjects*100).toFixed(1)}%)`);
    
    // Platform Distribution
    console.log('\n🌐 PLATFORM DISTRIBUTION (Top 10)');
    console.log('-'.repeat(70));
    const platformStats = await Project.aggregate([
      { $match: { published: true } },
      { $group: { _id: '$platform', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    platformStats.forEach((stat, i) => {
      const platform = stat._id || 'Unknown';
      const count = stat.count;
      const pct = (count/publishedProjects*100).toFixed(1);
      console.log(`${(i+1).toString().padStart(2)}. ${platform.padEnd(25)} ${count.toString().padStart(5)} (${pct}%)`);
    });
    
    // Audit Score Distribution
    console.log('\n⭐ AUDIT SCORE DISTRIBUTION');
    console.log('-'.repeat(70));
    const scoreRanges = [
      { name: 'Excellent (90-100)', min: 90, max: 100 },
      { name: 'Very Good (80-89)', min: 80, max: 89 },
      { name: 'Good (70-79)', min: 70, max: 79 },
      { name: 'Average (60-69)', min: 60, max: 69 },
      { name: 'Below Average (50-59)', min: 50, max: 59 },
      { name: 'Poor (<50)', min: 0, max: 49 },
    ];
    
    for (const range of scoreRanges) {
      const count = await Project.countDocuments({
        published: true,
        audit_score: { $gte: range.min, $lte: range.max }
      });
      const pct = (count/publishedProjects*100).toFixed(1);
      console.log(`${range.name.padEnd(30)} ${count.toString().padStart(5)} (${pct}%)`);
    }
    
    // Data Completeness
    console.log('\n📝 DATA COMPLETENESS');
    console.log('-'.repeat(70));
    
    const withLogo = await Project.countDocuments({ published: true, logo: { $exists: true, $ne: '' } });
    const withDescription = await Project.countDocuments({ published: true, description: { $exists: true, $ne: '' } });
    const withWebsite = await Project.countDocuments({ published: true, 'socials.website': { $exists: true, $ne: '' } });
    const withTwitter = await Project.countDocuments({ published: true, 'socials.twitter': { $exists: true, $ne: '' } });
    const withTelegram = await Project.countDocuments({ published: true, 'socials.telegram': { $exists: true, $ne: '' } });
    const withContract = await Project.countDocuments({ published: true, 'contract_info.contract_address': { $exists: true, $ne: '' } });
    const withAuditDate = await Project.countDocuments({ published: true, 'timeline.audit_release': { $exists: true, $ne: null } });
    const withPDF = await Project.countDocuments({ published: true, pdf: { $exists: true, $ne: '' } });
    
    console.log(`Logo:                ${withLogo.toString().padStart(5)} / ${publishedProjects} (${(withLogo/publishedProjects*100).toFixed(1)}%)`);
    console.log(`Description:         ${withDescription.toString().padStart(5)} / ${publishedProjects} (${(withDescription/publishedProjects*100).toFixed(1)}%)`);
    console.log(`Website:             ${withWebsite.toString().padStart(5)} / ${publishedProjects} (${(withWebsite/publishedProjects*100).toFixed(1)}%)`);
    console.log(`Twitter:             ${withTwitter.toString().padStart(5)} / ${publishedProjects} (${(withTwitter/publishedProjects*100).toFixed(1)}%)`);
    console.log(`Telegram:            ${withTelegram.toString().padStart(5)} / ${publishedProjects} (${(withTelegram/publishedProjects*100).toFixed(1)}%)`);
    console.log(`Contract Address:    ${withContract.toString().padStart(5)} / ${publishedProjects} (${(withContract/publishedProjects*100).toFixed(1)}%)`);
    console.log(`Audit Date:          ${withAuditDate.toString().padStart(5)} / ${publishedProjects} (${(withAuditDate/publishedProjects*100).toFixed(1)}%)`);
    console.log(`PDF Link:            ${withPDF.toString().padStart(5)} / ${publishedProjects} (${(withPDF/publishedProjects*100).toFixed(1)}%)`);
    
    // Issues Statistics
    console.log('\n🔍 SECURITY ISSUES');
    console.log('-'.repeat(70));
    
    const issuesStats = await Project.aggregate([
      { $match: { published: true } },
      {
        $group: {
          _id: null,
          totalIssues: { $sum: '$total_issues' },
          criticalFound: { $sum: '$critical.found' },
          criticalResolved: { $sum: '$critical.resolved' },
          majorFound: { $sum: '$major.found' },
          majorResolved: { $sum: '$major.resolved' },
          mediumFound: { $sum: '$medium.found' },
          mediumResolved: { $sum: '$medium.resolved' },
          minorFound: { $sum: '$minor.found' },
          minorResolved: { $sum: '$minor.resolved' },
          infoFound: { $sum: '$informational.found' },
          infoResolved: { $sum: '$informational.resolved' },
        }
      }
    ]);
    
    if (issuesStats.length > 0) {
      const stats = issuesStats[0];
      console.log(`Total Issues Found:  ${stats.totalIssues.toLocaleString()}`);
      console.log(`\nCritical:            ${stats.criticalFound.toLocaleString().padStart(6)} found, ${stats.criticalResolved.toLocaleString().padStart(6)} resolved (${(stats.criticalResolved/stats.criticalFound*100).toFixed(1)}%)`);
      console.log(`Major:               ${stats.majorFound.toLocaleString().padStart(6)} found, ${stats.majorResolved.toLocaleString().padStart(6)} resolved (${(stats.majorResolved/stats.majorFound*100).toFixed(1)}%)`);
      console.log(`Medium:              ${stats.mediumFound.toLocaleString().padStart(6)} found, ${stats.mediumResolved.toLocaleString().padStart(6)} resolved (${(stats.mediumResolved/stats.mediumFound*100).toFixed(1)}%)`);
      console.log(`Minor:               ${stats.minorFound.toLocaleString().padStart(6)} found, ${stats.minorResolved.toLocaleString().padStart(6)} resolved (${(stats.minorResolved/stats.minorFound*100).toFixed(1)}%)`);
      console.log(`Informational:       ${stats.infoFound.toLocaleString().padStart(6)} found, ${stats.infoResolved.toLocaleString().padStart(6)} resolved (${(stats.infoResolved/stats.infoFound*100).toFixed(1)}%)`);
      
      const totalResolved = stats.criticalResolved + stats.majorResolved + stats.mediumResolved + stats.minorResolved + stats.infoResolved;
      const totalFound = stats.criticalFound + stats.majorFound + stats.mediumFound + stats.minorFound + stats.infoFound;
      console.log(`\nOverall Resolution:  ${totalResolved.toLocaleString()} / ${totalFound.toLocaleString()} (${(totalResolved/totalFound*100).toFixed(1)}%)`);
    }
    
    // Top Projects by Votes
    console.log('\n🏆 TOP 10 PROJECTS (by votes)');
    console.log('-'.repeat(70));
    
    const topProjects = await Project.find({ published: true })
      .select('name symbol total_votes audit_score')
      .sort({ total_votes: -1 })
      .limit(10);
    
    topProjects.forEach((project, i) => {
      console.log(`${(i+1).toString().padStart(2)}. ${project.name.padEnd(30)} ${project.symbol.padEnd(10)} Votes: ${project.total_votes.toString().padStart(4)} Score: ${project.audit_score}`);
    });
    
    // Recent Activity
    console.log('\n🕒 RECENT ACTIVITY (Last 10 updates)');
    console.log('-'.repeat(70));
    
    const recentUpdates = await Project.find({ published: true })
      .select('name symbol updatedAt')
      .sort({ updatedAt: -1 })
      .limit(10);
    
    recentUpdates.forEach((project, i) => {
      const date = new Date(project.updatedAt).toLocaleDateString();
      console.log(`${(i+1).toString().padStart(2)}. ${project.name.padEnd(30)} ${project.symbol.padEnd(10)} ${date}`);
    });
    
    // Database Size
    console.log('\n💾 DATABASE SIZE');
    console.log('-'.repeat(70));
    
    const dbStats = await mongoose.connection.db.stats();
    const sizeMB = (dbStats.dataSize / 1024 / 1024).toFixed(2);
    const storageMB = (dbStats.storageSize / 1024 / 1024).toFixed(2);
    const indexMB = (dbStats.indexSize / 1024 / 1024).toFixed(2);
    
    console.log(`Data Size:           ${sizeMB} MB`);
    console.log(`Storage Size:        ${storageMB} MB`);
    console.log(`Index Size:          ${indexMB} MB`);
    console.log(`Collections:         ${dbStats.collections}`);
    console.log(`Indexes:             ${dbStats.indexes}`);
    console.log(`Documents:           ${dbStats.objects.toLocaleString()}`);
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ Analytics generation complete!\n');
    
  } catch (error) {
    console.error('Error generating analytics:', error);
  } finally {
    await mongoose.connection.close();
  }
}

generateAnalytics();
