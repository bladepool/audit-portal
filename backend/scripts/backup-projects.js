const { MongoClient } = require('mongodb');
const fs = require('fs');
const zlib = require('zlib');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI not set in environment');
  process.exit(1);
}

async function backup() {
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    await client.connect();
    const db = client.db();
    console.log('Connected to', db.databaseName);

    const col = db.collection('projects');
    const cursor = col.find({});

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outDir = './backups';
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
    const outPath = `${outDir}/projects-backup-${timestamp}.json.gz`;

    const gzip = zlib.createGzip();
    const outStream = fs.createWriteStream(outPath);
    gzip.pipe(outStream);

    // Stream documents as JSON array
    gzip.write('[');
    let first = true;
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      const json = JSON.stringify(doc);
      if (!first) gzip.write(',\n');
      gzip.write(json);
      first = false;
    }
    gzip.write(']');
    gzip.end();

    await new Promise((res, rej) => outStream.on('close', res).on('error', rej));
    console.log('Backup written to', outPath);
  } catch (err) {
    console.error('Backup failed:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

backup();
