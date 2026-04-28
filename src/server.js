<<<<<<< HEAD
import http from 'http';
import app from './app.js';
import env from './config/env.js';
import { connectDatabase } from './config/database.js';
import { initSocketServer } from './socket.js';
=======
import app from './app.js';
import env from './config/env.js';
import { connectDatabase } from './config/database.js';
>>>>>>> origin/review

async function startServer() {
  try {
    console.log(`Connecting to MongoDB: ${env.mongodbUri}`);
    await connectDatabase();

<<<<<<< HEAD
    const server = http.createServer(app);
    initSocketServer(server);

    server.listen(env.port, () => {
=======
    app.listen(env.port, () => {
>>>>>>> origin/review
      console.log(`Server running on port ${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
}

startServer();
