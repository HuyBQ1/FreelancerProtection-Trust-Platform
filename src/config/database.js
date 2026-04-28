import mongoose from 'mongoose';
import env from './env.js';
<<<<<<< HEAD
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

export async function connectDatabase() {
  try {
    let uri = env.mongodbUri;
    
    // Tự động dùng Memory Server nếu là localhost
    if (uri.includes('127.0.0.1') || uri.includes('localhost')) {
      console.log('Khởi tạo MongoDB Memory Server cho môi trường dev...');
      mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
    }

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('Lỗi kết nối MongoDB:', error.message);
    // Removed process.exit(1) to prevent backend crash on timeout, keeping mock endpoints alive
  }
=======

export async function connectDatabase() {
  await mongoose.connect(env.mongodbUri, {
    serverSelectionTimeoutMS: 5000,
  });
  console.log('MongoDB connected');
>>>>>>> origin/review
}
