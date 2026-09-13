import express from 'express';
import http from 'http';
import 'dotenv/config';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import createApiRoutes from './routes/apiRoutes.js';
import { authenticateToken } from './middleware/authMiddleware.js';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const configuredOrigins = (process.env.CORS_ORIGINS || '').split(',').map(origin => origin.trim()).filter(Boolean);
const allowedOrigins = [...new Set([
  ...configuredOrigins,
  'https://hackindia-ai-web3-builders-hackatho-ivory.vercel.app'
])];
const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins.length ? allowedOrigins : true,
    methods: ['GET', 'POST', 'PATCH'],
    credentials: false
  }
});

app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : true,
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Role', 'X-Node-Id']
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[ANVESHANA API] ${req.method} ${req.url}`);
  next();
});

// Mount REST API Routes
app.use('/api/v1', authenticateToken, createApiRoutes(io));

app.get('/health', (req, res) => {
  res.json({ status: 'UP', protocol: 'Anveshana Open Dairy Intelligence Protocol v1.0', timestamp: new Date() });
});

// Socket.io Real-Time Telemetry Broadcasting Channel
io.on('connection', (socket) => {
  console.log(`[SOCKET.IO] Telemetry client connected: ${socket.id}`);

  socket.on('join_jurisdiction', (jurisdiction) => {
    socket.join(`room:${jurisdiction.toLowerCase()}`);
    console.log(`[SOCKET.IO] Client ${socket.id} joined jurisdiction channel room:${jurisdiction.toLowerCase()}`);
  });

  socket.on('join_farmer', (farmerId) => {
    if (farmerId) socket.join(`farmer:${String(farmerId)}`);
  });

  socket.on('disconnect', () => {
    console.log(`[SOCKET.IO] Telemetry client disconnected: ${socket.id}`);
  });
});

// Simulate 10-second real-time telemetry stream ping
setInterval(() => {
  io.emit('telemetry_tick', {
    timestamp: new Date().toISOString(),
    nodeId: 'MCC-104',
    liveFlowRateLPM: +(120 + Math.random() * 15).toFixed(1),
    inlineDensityKgL: +(1.032 + Math.random() * 0.002).toFixed(4)
  });
}, 10000);

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`[WARNING] Port ${PORT} is already in use by a running Anveshana Server instance!`);
    console.warn(`The backend server is ALREADY ACTIVE and serving API requests on port ${PORT}.`);
    process.exit(0);
  } else {
    console.error('[ERROR] Server error:', err);
  }
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` ANVESHANA OPEN DAIRY INTELLIGENCE PROTOCOL SERVER `);
  console.log(` Express API Server listening on port: ${PORT}`);
  console.log(` WebSocket Telemetry Channel running via Socket.io`);
  console.log(`=======================================================`);
});
