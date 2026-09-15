const mongoose = require('mongoose');

let mongoMemoryServer = null;

const connectDB = async () => {
  // If already connected, reuse existing Mongoose connection (crucial for Vercel serverless)
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusone';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Database] Connected to MongoDB at ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    // If in production/serverless with explicit MONGODB_URI, log and throw
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      console.error('[Database Error] Production MongoDB connection failed:', err.message);
      throw err;
    }

    console.warn(`[Database] Standard MongoDB connection failed: ${err.message}`);
    console.log('[Database] Starting in-memory fallback database (mongodb-memory-server)...');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      if (!mongoMemoryServer) {
        mongoMemoryServer = await MongoMemoryServer.create();
      }
      const inMemoryUri = mongoMemoryServer.getUri();

      const conn = await mongoose.connect(inMemoryUri);
      console.log(`[Database] Connected to In-Memory MongoDB successfully!`);
      return conn;
    } catch (memErr) {
      console.error('[Database] Failed to initialize in-memory database:', memErr.message);
      throw memErr;
    }
  }
};

const closeDB = async () => {
  await mongoose.connection.close();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
};

module.exports = { connectDB, closeDB };
