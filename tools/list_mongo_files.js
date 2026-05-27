const { MongoClient } = require('mongodb');
const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
(async () => {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    const admin = client.db().admin();
    const dbs = await admin.listDatabases();
    for (const dbInfo of dbs.databases) {
      const dbName = dbInfo.name;
      const db = client.db(dbName);
      const collections = await db.listCollections().toArray();
      const hasFiles = collections.some(c => c.name === 'files' || c.name === 'filemetadata' || c.name.toLowerCase().includes('file'));
      if (hasFiles) {
        console.log('Database:', dbName);
        const col = db.collection('files');
        const one = await col.findOne({ publicId: { $exists: true, $ne: null } });
        if (one) {
          console.log('Sample document with publicId from', dbName, '.files ->');
          console.log(JSON.stringify(one, null, 2));
          break;
        }

        const fallback = await col.findOne();
        if (fallback) {
          console.log('Fallback sample document from', dbName, '.files ->');
          console.log(JSON.stringify(fallback, null, 2));
        } else {
          console.log('No documents in', dbName, '.files');
        }
      }
    }
    await client.close();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
