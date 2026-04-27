import app from './app.js';
import env from './config/env.js';
import { connectDatabase } from './config/database.js';

async function startServer() {
  try {
    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });

    console.log(`Connecting to MongoDB: ${env.mongodbUri}`);
    // Do not await to avoid blocking the server startup while memory server downloads
    connectDatabase().catch(err => console.error('Failed to connect to database', err));
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
}

startServer();
