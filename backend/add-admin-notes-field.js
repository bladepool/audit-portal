/**
 * Add admin_notes field to all projects
 * This field is for internal auditor notes that appear in PDFs but not in public API
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;

async function addAdminNotesField() {
  console.log('=== Adding admin_notes Field to All Projects ===\n');
  
  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db('auditportal');
  
  try {
    // Add admin_notes field to all projects that don't have it
    const result = await db.collection('projects').updateMany(
      { admin_notes: { $exists: false } },
      { 
        $set: { 
          admin_notes: {
            swc: "",
            tax: "",
            kyc: "",
            social: ""
          }
        }
      }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} projects with admin_notes field`);
    
    // Check total count
    const totalCount = await db.collection('projects').countDocuments({});
    const withNotesCount = await db.collection('projects').countDocuments({ admin_notes: { $exists: true } });
    
    console.log(`\nTotal projects: ${totalCount}`);
    console.log(`Projects with admin_notes: ${withNotesCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

addAdminNotesField();
