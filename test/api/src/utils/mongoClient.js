import mongoose from 'mongoose';
import logger from './logger.js';

const uri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DB || 'sgrd_masale';

if (!uri) {
  throw new Error('MONGODB_URI is required. Add it to api/.env before starting the API.');
}

mongoose.set('strictQuery', true);
let connectionPromise;
let connectionLogged = false;

export async function getDb() {
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(uri, {
      dbName: databaseName,
      serverSelectionTimeoutMS: 10_000,
    });
  }
  try {
    await connectionPromise;
    if (mongoose.connection.readyState !== 1) throw new Error('MongoDB connection is not ready');
    if (!connectionLogged) {
      logger.info(`Connected to MongoDB database "${databaseName}"`);
      connectionLogged = true;
    }
    return mongoose.connection;
  } catch (error) {
    connectionPromise = undefined;
    throw error;
  }
}

export async function closeMongo() {
  await mongoose.disconnect();
  connectionPromise = undefined;
  connectionLogged = false;
}

export default getDb;
