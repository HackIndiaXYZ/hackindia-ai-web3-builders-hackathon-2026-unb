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
const SERVICE_VERSION = process.env.RENDER_GIT_COMMIT || process.env.npm_package_version || 'local';
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

// Searchable request diagnostics for Render logs. Never log request bodies or
// authorization headers because they may contain personal data or tokens.
app.use((req, res, next) => {
  const requestId = `REQ-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const startedAt = Date.now();
  res.setHeader('X-Request-Id', requestId);
  console.log(`[ANVESHANA][REQ] id=${requestId} method=${req.method} path=${req.path}`);
  res.on('finish', () => {
    const level = res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'OK';
    console.log(`[ANVESHANA][${level}] id=${requestId} method=${req.method} path=${req.path} status=${res.statusCode} durationMs=${Date.now() - startedAt}`);
  });
  next();
});

// Mount REST API Routes
app.use('/api/v1', authenticateToken, createApiRoutes(io));

app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    ready: true,
    protocol: 'Anveshana Open Dairy Intelligence Protocol v1.0',
    serviceVersion: SERVICE_VERSION,
    timestamp: new Date(),
    diagnostics: {
      corsOrigins: allowedOrigins.length,
      socketTransport: 'socket.io',
      message: 'ANVESHANA_READY: REST and Socket.IO services are accepting traffic'
    }
  });
});

// Keep unexpected API failures visible and correlated with the request log.
app.use((error, req, res, next) => {
  const requestId = res.getHeader('X-Request-Id') || 'unknown';
  console.error(`[ANVESHANA][UNHANDLED_ERROR] id=${requestId} method=${req.method} path=${req.path} message=${error?.message || 'Unknown error'}`);
  if (res.headersSent) return next(error);
  res.status(500).json({ success: false, error: 'Internal server error', requestId });
});

// Socket.io Real-Time Telemetry Broadcasting Channel
io.on('connection', (socket) => {
  console.log(`[ANVESHANA][SOCKET][CONNECTED] socketId=${socket.id} transport=${socket.conn.transport.name}`);

  socket.on('join_jurisdiction', (jurisdiction) => {
    socket.join(`room:${jurisdiction.toLowerCase()}`);
    console.log(`[ANVESHANA][SOCKET][ROOM] socketId=${socket.id} room=jurisdiction:${jurisdiction.toLowerCase()}`);
  });

  socket.on('join_farmer', (farmerId) => {
    if (farmerId) {
      socket.join(`farmer:${String(farmerId)}`);
      console.log(`[ANVESHANA][SOCKET][ROOM] socketId=${socket.id} room=farmer:${String(farmerId)}`);
    } else {
      console.warn(`[ANVESHANA][SOCKET][WARN] socketId=${socket.id} missingFarmerId=true`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[ANVESHANA][SOCKET][DISCONNECTED] socketId=${socket.id}`);
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
  console.log(`[ANVESHANA][READY] port=${PORT} version=${SERVICE_VERSION} corsOrigins=${allowedOrigins.length} status=UP`);
  console.log(`=======================================================`);
});
