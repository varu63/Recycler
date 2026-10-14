import mongoose from 'mongoose';
import { appConfig } from './env.js';
import { logger } from '../utils/logger.js';

export async function connectDb(): Promise<void> {
  try {
    const uri = appConfig.mongo.uri;
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri);
    logger.info({ uri: redactUri(uri) }, 'MongoDB connected');
    if (process.env.NODE_ENV !== 'test') {
      await mongoose.connection.db?.command({ ping: 1 });
    }
  } catch (error) {
    logger.error({ err: error }, 'MongoDB connection failed');
    throw error;
  }
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}

function redactUri(uri: string): string {
  try {
    const u = new URL(uri);
    if (u.username) u.username = '***';
    if (u.password) u.password = '***';
    return u.toString();
  } catch {
    return uri.replace(/:.*@/, ':***@');
  }
}
