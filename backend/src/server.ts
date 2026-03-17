import dotenv from 'dotenv';
import path from 'path';
// Load .env from root folder regardless of where the process runs from
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import { initializeDatabase } from './db/connection';
import { initializeRedis } from './cache/redis';
import { setupSocketHandlers } from './socket/handlers';
import { setIO } from './socket/io';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  }
});

setIO(io);

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

app.use('/api', routes);
app.use(errorHandler);

async function startServer() {
  try {
    await initializeDatabase();
    await initializeRedis();
    setupSocketHandlers(io);

    const PORT = process.env.PORT || 3001;
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 WebSocket server ready`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
