import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Load both root .env and atlas-credentials.env
dotenv.config();
dotenv.config({ path: 'atlas-credentials.env' });

let mongod = null;
let rawClient = null;

export function getAtlasUri() {
  let uri = process.env.MONGODB_URI;

  if (!uri && process.env.MONGODB_USERNAME && process.env.MONGODB_PASSWORD) {
    uri = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster-microcare.gepmhm7.mongodb.net`;
  }

  if (!uri) {
    return 'mongodb://127.0.0.1:27017/cyber_defender';
  }

  try {
    const isSrv = uri.startsWith('mongodb+srv://');
    const dummy = uri.replace('mongodb+srv://', 'http://').replace('mongodb://', 'http://');
    const url = new URL(dummy);
    const search = url.search || '?retryWrites=true&w=majority&appName=Cluster-microcare';
    const auth = url.username ? `${encodeURIComponent(decodeURIComponent(url.username))}:${encodeURIComponent(decodeURIComponent(url.password))}@` : '';
    return `${isSrv ? 'mongodb+srv://' : 'mongodb://'}${auth}${url.host}/cyber_defender${search}`;
  } catch (e) {
    return uri;
  }
}

export async function connectDB() {
  const uri = getAtlasUri();
  const isAtlas = uri.includes('mongodb.net') || uri.includes('mongodb+srv');

  try {
    console.log(`[MongoDB Atlas] Initializing connection to cloud cluster...`);
    await mongoose.connect(uri, {
      dbName: 'cyber_defender',
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`[MongoDB Atlas] You successfully connected to MongoDB Cloud!`);
    console.log(`[MongoDB Atlas] Database: "${mongoose.connection.name}" | Host: "${mongoose.connection.host}"`);
    return;
  } catch (err) {
    console.error(`[MongoDB Atlas] Cloud connection error: ${err.message}`);
    if (isAtlas) {
      console.warn(`[MongoDB] Cloud unreachable or network restricted. Activating local backup instance...`);
    }
  }

  try {
    mongod = await MongoMemoryServer.create({
      instance: {
        dbName: 'cyber_defender'
      }
    });
    const memoryUri = mongod.getUri();
    await mongoose.connect(memoryUri);
    console.log(`[MongoDB] Connected to local fallback instance at: ${memoryUri}`);
  } catch (memErr) {
    console.error('[MongoDB] Failed to initialize fallback database:', memErr);
    throw memErr;
  }
}

export async function disconnectDB() {
  try {
    await mongoose.disconnect();
    if (rawClient) {
      await rawClient.close();
    }
    if (mongod) {
      await mongod.stop();
    }
    console.log('[MongoDB] Disconnected successfully.');
  } catch (err) {
    console.error('[MongoDB] Error disconnecting database:', err);
  }
}

export { mongoose };
