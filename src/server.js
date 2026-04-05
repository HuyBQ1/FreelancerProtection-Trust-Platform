import app from './app.js';
import env from './config/env.js';
import { connectDatabase } from './config/database.js';

async function startServer() {
  try {
    console.log(`Connecting to MongoDB: ${env.mongodbUri}`);
    await connectDatabase();

    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
}

startServer();
