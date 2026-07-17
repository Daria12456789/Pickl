import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import apiRouter from './routes.js';
import { setupWebSockets } from './socket.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = http.createServer(app);

// Parser
app.use(express.json({ limit: '10mb' })); // Support base64 upload attachments
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount API routes
app.use('/api', apiRouter);

// Serve static elements in production
const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));

// Fallback HTML page for React Router (PWA)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendDistPath, 'index.html'), (err) => {
    if (err) {
      // In development, if dist doesn't exist, we send a default info
      res.status(200).send("Noptieră Server is running. Frontend dev server should be run independently via npm run dev.");
    }
  });
});

// Setup socket interface
setupWebSockets(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[SERVER] Noptieră backend listening at http://localhost:${PORT}`);
});
