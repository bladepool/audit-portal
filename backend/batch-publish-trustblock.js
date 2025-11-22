/**
 * Batch publish all unpublished projects to TrustBlock
 * Usage: node batch-publish-trustblock.js [--limit N]
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const { TrustBlockAPI } = require('./src/services/trustBlockService');

const BATCH_SIZE = 10; // Process 10 at a time
const DELAY_BETWEEN_BATCHES = 5000; // 5 seconds between batches
const DELAY_BETWEEN_REQUESTS = 2000; // 2 seconds between individual requests

async function batchPublish() {
  const client = new MongoClient(process.env.MONGODB_URI);
  const trustBlock = new TrustBlockAPI(process.env.TRUSTBLOCK_API_KEY);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db('auditportal');
    
    // Get command line arguments
    const args = process.argv.slice(2);
    const limitIndex = args.indexOf('--limit');
    const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1]) : null;
    
    // Find projects that need publishing
    const query = {
      published: true,
      $or: [
        { trustblock_url: { $exists: false } },
        { trustblock_url: null },
        { trustblock_url: '' }
      ]
    };
    
    const totalCount = await db.collection('projects').countDocuments(query);
    const projectsToPublish = limit ? Math.min(limit, totalCount) : totalCount;
    
    console.log(`=== Batch Publishing to TrustBlock ===`);
    console.log(`Total projects needing publishing: ${totalCount}`);
    console.log(`Will publish: ${projectsToPublish}`);
    console.log(`Batch size: ${BATCH_SIZE}`);
    console.log(`Delay between requests: ${DELAY_BETWEEN_REQUESTS}ms`);
    console.log(`Delay between batches: ${DELAY_BETWEEN_BATCHES}ms\n`);
    
    const projects = await db.collection('projects')
      .find(query)
      .limit(projectsToPublish)
      .toArray();
    
    let successCount = 0;
    let failCount = 0;
    const errors = [];
    
    // Process in batches
    for (let i = 0; i < projects.length; i += BATCH_SIZE) {
      const batch = projects.slice(i, Math.min(i + BATCH_SIZE, projects.length));
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(projects.length / BATCH_SIZE);
      
      console.log(`\n=== Batch ${batchNum}/${totalBatches} (${batch.length} projects) ===\n`);
      
      for (const project of batch) {
        try {
          console.log(`[${successCount + failCount + 1}/${projects.length}] Publishing: ${project.name}...`);
          
          // Format data
          const formattedData = trustBlock.formatProjectForTrustBlock(project);
          
          // Publish to TrustBlock
          const result = await trustBlock.publishReport(formattedData);
          
          console.log(`  ✓ Success! Audit ID: ${result.id}`);
          
          // Update database
          await db.collection('projects').updateOne(
            { _id: project._id },
            {
              $set: {
                trustblock_id: result.id,
                trustblock_url: `https://app.trustblock.run/audit/${result.id}`,
                trustblock_published_at: new Date(),
                'socials.trustblock': `https://app.trustblock.run/audit/${result.id}`
              }
            }
          );
          
          successCount++;
          
          // Delay between requests
          if (batch.indexOf(project) < batch.length - 1 || i + BATCH_SIZE < projects.length) {
            await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
          }
          
        } catch (error) {
          // Check if it's a duplicate error (409)
          if (error.message.includes('409') || error.message.includes('AuditReportDuplicate')) {
            console.log(`  ⚠ Already exists on TrustBlock (skipping)`);
            successCount++;
          }
          // Check if no contract address
          else if (error.message.includes('No contract address available')) {
            console.log(`  ⚠ No contract address (skipping)`);
            // Don't count as success or failure, just skip
          }
          // Check if contract address is used by another project
          else if (error.message.includes('StoredProjectWithOtherProjectsContract')) {
            console.log(`  ⚠ Contract address already used by another project (skipping)`);
            // Count as skipped, not failure
          } else {
            console.error(`  ✗ Failed: ${error.message}`);
            failCount++;
            errors.push({
              project: project.name,
              slug: project.slug,
              error: error.message
            });
          }
        }
      }
      
      // Delay between batches
      if (i + BATCH_SIZE < projects.length) {
        console.log(`\n⏳ Waiting ${DELAY_BETWEEN_BATCHES / 1000}s before next batch...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }
    
    // Summary
    console.log('\n\n=== Publishing Complete ===');
    console.log(`✓ Successful: ${successCount}`);
    console.log(`✗ Failed: ${failCount}`);
    console.log(`Total: ${successCount + failCount}`);
    
    if (errors.length > 0) {
      console.log('\n=== Errors ===');
      errors.forEach(err => {
        console.log(`- ${err.project} (${err.slug}): ${err.error}`);
      });
    }
    
    // Final status
    const finalCount = await db.collection('projects').countDocuments({
      published: true,
      trustblock_url: { $exists: true, $ne: null, $ne: '' }
    });
    const totalPublished = await db.collection('projects').countDocuments({ published: true });
    
    console.log(`\n=== Final Status ===`);
    console.log(`Projects on TrustBlock: ${finalCount}/${totalPublished} (${Math.round(finalCount/totalPublished*100)}%)`);
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await client.close();
  }
}

// Run if called directly
if (require.main === module) {
  batchPublish().catch(console.error);
}

module.exports = batchPublish;
