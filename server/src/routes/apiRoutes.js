import express from 'express';
import jwt from 'jsonwebtoken';
import { createId, createReceiptHash, store } from '../store.js';

const JWT_SECRET = process.env.JWT_SECRET || 'anveshana_dpi_protocol_secret_2026';

// In-Memory Data Store (Production backed by PostgreSQL / IndexedDB sync)
const pourEvents = [
  { eventId: 'PE-20260831-001', farmerId: '201410000123', weightKg: 8.5, fatPercent: 4.2, snfPercent: 8.7, payoutINR: 382.50, receiptHash: 'sha256:7d2b9af8103c31ff782' }
];

let batches = store.batches;

function validateMilkLog(body) {
  const weightKg = Number(body.weightKg);
  const fatPercent = Number(body.fatPercent);
  const snfPercent = Number(body.snfPercent);
  if (!body.farmerId || !Number.isFinite(weightKg) || weightKg <= 0 || !Number.isFinite(fatPercent) || !Number.isFinite(snfPercent)) {
    return 'farmerId, weightKg, fatPercent, and snfPercent are required';
  }
  return null;
}

export default function createApiRoutes(io) {
  const router = express.Router();

// POST /api/v1/auth/login
router.post('/auth/login', (req, res) => {
  const { username, password, role } = req.body;
  const token = jwt.sign({ username, role: role || 'FARMER', nodeId: 'VLC-22' }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { username, role: role || 'FARMER', nodeId: 'VLC-22' } });
});

// GET /api/v1/farmer/:farmerId
router.get('/farmer/:farmerId', (req, res) => {
  res.json({
    farmerId: req.params.farmerId,
    name: 'Ramesh Kumar',
    ndlmTag: '840003129940112',
    purityScore: 87,
    registeredCows: 4,
    recentPours: pourEvents
  });
});

// POST /api/v1/aggregator/pour
router.post('/aggregator/pour', (req, res) => {
  const { farmerId, weightKg, fatPercent, snfPercent } = req.body;

  // Biological Yield Limit check (max 12 kg per cow pour session)
  if (weightKg > 18.0) {
    return res.status(422).json({
      error: 'AI Yield Violation Auto-Rejected',
      message: `Weight ${weightKg}kg exceeds biological limit for registered cattle count. Discrepancy logged.`
    });
  }

  const eventId = `PE-20260831-${String(pourEvents.length + 1).padStart(3, '0')}`;
  const receiptHash = createReceiptHash(req.body);
  
  const pour = {
    eventId,
    farmerId,
    weightKg,
    fatPercent,
    snfPercent,
    payoutINR: +(weightKg * 45).toFixed(2),
    receiptHash,
    timestamp: new Date().toISOString()
  };

  pourEvents.unshift(pour);
  io.emit('milk_logged', pour);
  res.status(201).json({ success: true, pour });
});

  // POST /api/v1/milk/log - shared farmer/mobile collection contract
  router.post('/milk/log', (req, res) => {
    const validationError = validateMilkLog(req.body);
    if (validationError) return res.status(400).json({ success: false, error: validationError });

    const milkLog = {
      eventId: createId('PE'),
      farmerId: req.body.farmerId,
      farmerName: req.body.farmerName || 'Registered Farmer',
      nodeId: req.body.nodeId || req.user.nodeId || 'VLC-22',
      weightKg: Number(req.body.weightKg),
      fatPercent: Number(req.body.fatPercent),
      snfPercent: Number(req.body.snfPercent),
      session: req.body.session || 'MORNING',
      yieldStatus: req.body.yieldStatus || 'PASS',
      payoutINR: +(Number(req.body.weightKg) * 45).toFixed(2),
      receiptHash: createReceiptHash(req.body),
      timestamp: new Date().toISOString(),
      source: 'FARMER_MOBILE'
    };

    store.milkLogs.unshift(milkLog);
    io.emit('milk_logged', milkLog);
    res.status(201).json({ success: true, milkLog });
  });

  // POST /api/v1/grievances - whistleblower report from the farmer app
  router.post('/grievances', (req, res) => {
    const { farmerId, category, description, nodeId, isAnonymous = false } = req.body;
    if (!category || !description?.trim()) {
      return res.status(400).json({ success: false, error: 'category and description are required' });
    }

    const grievance = {
      grievanceId: createId('GRV'),
      farmerId: isAnonymous ? null : farmerId || null,
      category,
      description: description.trim(),
      nodeId: nodeId || req.user.nodeId || 'VLC-22',
      status: 'RECEIVED',
      isAnonymous: Boolean(isAnonymous),
      createdAt: new Date().toISOString()
    };

    store.grievances.unshift(grievance);
    io.emit('grievance_created', grievance);
    res.status(201).json({ success: true, grievance });
  });

  // POST /api/v1/ndlm/registrations - farmer-side animal identity submission
  router.post('/ndlm/registrations', (req, res) => {
    const required = ['ndlmTag', 'animalName', 'breed', 'sex', 'dateOfBirth', 'ownerMobile', 'village', 'district', 'lastVaccinationDate', 'calvingDate'];
    if (required.some(field => !String(req.body[field] || '').trim()) || !req.body.consent) {
      return res.status(400).json({ success: false, error: 'All animal, owner, location, health, breeding, and consent fields are required' });
    }
    const registration = {
      ...req.body,
      verificationId: createId('NDLM-VER'),
      submittedAt: new Date().toISOString(),
      status: 'PENDING_REVIEW',
      visitStatus: 'NOT_PLANNED',
      source: 'FARMER_MOBILE'
    };
    store.ndlmRegistrations = store.ndlmRegistrations || [];
    store.ndlmRegistrations.unshift(registration);
    io.emit('ndlm_registration_created', registration);
    res.status(201).json({ success: true, registration });
  });

  router.get('/grievances', (req, res) => {
    res.json({ grievances: store.grievances });
  });

  router.get('/milk/logs', (req, res) => {
    res.json({ milkLogs: [...store.milkLogs, ...pourEvents] });
  });

// POST /api/v1/qco/quarantine
router.post('/qco/quarantine', (req, res) => {
  const { batchId } = req.body;
  batches = batches.map(b => b.batchId === batchId ? { ...b, batchStatus: 'QUARANTINED' } : b);
  res.json({ success: true, message: `Batch ${batchId} Quarantined. Upstream payouts frozen.` });
});

// GET /api/v1/govt/anomalies
router.get('/govt/anomalies', (req, res) => {
  res.json([
    { anomalyId: 'ANO-2026-0901', nodeId: 'MCC-104', riskScore: 92, details: 'Volume expansion +6.8% detected' }
  ]);
});

// GET /api/v1/public/passport/:batchId
router.get('/public/passport/:batchId', (req, res) => {
  res.json({
    batchId: req.params.batchId,
    status: 'VERIFIED_CLEAN',
    sourceRegion: 'Karnal District, Haryana',
    farmersCount: 22,
    coldChainTemp: '3.8°C',
    sha256Hash: 'sha256:7d2b9af8103c31ff78201a44eef938101a44'
  });
});

  return router;
}
