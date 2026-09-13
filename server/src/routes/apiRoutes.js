import express from 'express';
import jwt from 'jsonwebtoken';
import { createId, createReceiptHash, store } from '../store.js';
import { aggregateRisk, ingestRiskObservation, reviewRiskAnomaly, seedRiskDemo } from '../riskSystem.js';

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

function emitCollectionUpdate(io, eventName, request) {
  io.emit(eventName, request);
  if (request?.farmerId) io.to(`farmer:${request.farmerId}`).emit(eventName, request);
}

function emitRisk(io, eventName, payload) {
  io.emit(eventName, payload);
  if (payload?.farmerId) io.to(`farmer:${payload.farmerId}`).emit(eventName, payload);
  if (payload?.district) io.to(`room:${String(payload.district).toLowerCase()}`).emit(eventName, payload);
}

const ACTIVE_ASSIGNMENT_STATUSES = new Set(['ASSIGNED', 'ACCEPTED', 'EN_ROUTE', 'IN_PROGRESS']);
const ASSIGNMENT_STATUSES = new Set([...ACTIVE_ASSIGNMENT_STATUSES, 'COMPLETED', 'CANCELLED', 'DECLINED']);

function refreshOfficerWorkload(officerId) {
  const officer = store.officers.find(item => item.officerId === officerId);
  if (!officer) return null;
  officer.workload = store.assignments.filter(item => item.officerId === officerId && ACTIVE_ASSIGNMENT_STATUSES.has(item.status)).length;
  if (officer.status !== 'OFF_DUTY' && officer.availability !== 'OFFLINE') {
    officer.availability = officer.workload >= officer.workloadCapacity ? 'BUSY' : 'AVAILABLE';
  }
  return officer;
}

function assignmentJurisdiction(assignment) {
  const officer = store.officers.find(item => item.officerId === assignment.officerId);
  return assignment.jurisdiction || officer?.jurisdiction || null;
}

function emitAssignment(io, eventName, assignment) {
  io.emit(eventName, assignment);
  const jurisdiction = assignmentJurisdiction(assignment);
  if (jurisdiction) io.to(`room:${String(jurisdiction).toLowerCase()}`).emit(eventName, assignment);
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
  ingestRiskObservation({
    ...pour,
    farmId: req.body.farmId,
    animalId: req.body.animalId,
    breed: req.body.breed,
    lactationStage: req.body.lactationStage,
    purityScore: req.body.purityScore,
    village: req.body.village,
    district: req.body.district,
    state: req.body.state,
    tankerRegistration: req.body.tankerRegistration,
    chillingCenterId: req.body.chillingCenterId
  }, { emit: emitRisk.bind(null, io) });
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
    ingestRiskObservation({
      ...milkLog,
      animalId: req.body.animalId,
      farmId: req.body.farmId,
      breed: req.body.breed,
      lactationStage: req.body.lactationStage,
      purityScore: req.body.purityScore,
      village: req.body.village,
      district: req.body.district,
      state: req.body.state,
      tankerRegistration: req.body.tankerRegistration,
      chillingCenterId: req.body.chillingCenterId
    }, { emit: emitRisk.bind(null, io) });
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

  // Cross-device collection workflow. This is intentionally in-memory for the prototype.
  router.get('/sync', (req, res) => {
    res.json({
      milkLogs: [...store.milkLogs, ...pourEvents],
      collectionRequests: store.collectionRequests || [],
      ndlmRegistrations: store.ndlmRegistrations || []
    });
  });

  router.get('/collection-requests', (req, res) => {
    const requests = (store.collectionRequests || []).filter(request => (
      !req.query.farmerId || request.farmerId === req.query.farmerId
    ));
    res.json({ collectionRequests: requests });
  });

  router.get('/collection-requests/:requestId', (req, res) => {
    const request = (store.collectionRequests || []).find(item => item.requestId === req.params.requestId);
    if (!request) return res.status(404).json({ success: false, error: 'Collection request not found' });
    res.json({ collectionRequest: request });
  });

  router.post('/collection-requests', (req, res) => {
    const { farmerId, farmerName, nodeId, district, state, requestedSession, requestedAmountKg } = req.body;
    const amount = Number(requestedAmountKg);
    if (!farmerId || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ success: false, error: 'farmerId and a positive requestedAmountKg are required' });
    }
    const request = {
      requestId: createId('COL'),
      farmerId,
      farmerName: farmerName || 'Registered Farmer',
      nodeId: nodeId || req.user.nodeId || 'VLC-22',
      district: district || 'Karnal',
      state: state || 'Haryana',
      requestedSession: requestedSession || 'MORNING',
      requestedAmountKg: amount,
      status: 'REQUESTED',
      farmerApproval: 'PENDING',
      aggregatorMeasurements: null,
      createdAt: new Date().toISOString(),
      createdBy: req.user.role || 'AGGREGATOR'
    };
    store.collectionRequests.unshift(request);
    emitCollectionUpdate(io, 'collection_request_created', request);
    res.status(201).json({ success: true, collectionRequest: request });
  });

  router.patch('/collection-requests/:requestId/approval', (req, res) => {
    const approval = String(req.body.approval || '').toUpperCase();
    if (!['APPROVED', 'DECLINED'].includes(approval)) {
      return res.status(400).json({ success: false, error: 'approval must be APPROVED or DECLINED' });
    }
    const request = (store.collectionRequests || []).find(item => item.requestId === req.params.requestId);
    if (!request) return res.status(404).json({ success: false, error: 'Collection request not found' });
    request.farmerApproval = approval;
    request.status = approval === 'APPROVED' ? 'APPROVED_BY_FARMER' : 'DECLINED_BY_FARMER';
    request.approvedAt = new Date().toISOString();
    request.approvedBy = req.body.approvedBy || req.user.role || 'FARMER';
    emitCollectionUpdate(io, 'collection_request_updated', request);
    emitCollectionUpdate(io, 'collection_request_approved', request);
    res.json({ success: true, collectionRequest: request });
  });

  router.patch('/collection-requests/:requestId/measurements', (req, res) => {
    const request = (store.collectionRequests || []).find(item => item.requestId === req.params.requestId);
    if (!request) return res.status(404).json({ success: false, error: 'Collection request not found' });
    if (request.farmerApproval !== 'APPROVED') {
      return res.status(409).json({ success: false, error: 'Farmer approval is required before recording measurements' });
    }
    const weightKg = Number(req.body.weightKg);
    const fatPercent = Number(req.body.fatPercent);
    const snfPercent = Number(req.body.snfPercent);
    if (![weightKg, fatPercent, snfPercent].every(Number.isFinite) || weightKg <= 0) {
      return res.status(400).json({ success: false, error: 'weightKg, fatPercent, and snfPercent are required' });
    }
    request.aggregatorMeasurements = {
      ...req.body,
      weightKg,
      fatPercent,
      snfPercent,
      measuredWeightKg: weightKg,
      recordedAt: new Date().toISOString()
    };
    request.status = 'MEASUREMENTS_RECORDED';
    request.measuredAt = request.aggregatorMeasurements.recordedAt;
    emitCollectionUpdate(io, 'collection_request_updated', request);
    emitCollectionUpdate(io, 'collection_measurements_recorded', request);
    res.json({ success: true, collectionRequest: request });
  });

  router.patch('/collection-requests/:requestId/transfer', (req, res) => {
    const request = (store.collectionRequests || []).find(item => item.requestId === req.params.requestId);
    if (!request) return res.status(404).json({ success: false, error: 'Collection request not found' });
    if (request.status !== 'MEASUREMENTS_RECORDED') {
      return res.status(409).json({ success: false, error: 'Measurements must be recorded before transfer' });
    }
    request.transfer = {
      ...req.body,
      transferId: createId('CHILL'),
      destinationType: 'CHILLING_CENTER',
      transferredAt: new Date().toISOString()
    };
    request.status = 'TRANSFERRED_TO_CHILLING_CENTER';
    emitCollectionUpdate(io, 'collection_request_updated', request);
    emitCollectionUpdate(io, 'collection_transferred', request);
    res.json({ success: true, collectionRequest: request });
  });

  router.get('/ndlm/registrations', (req, res) => {
    res.json({ registrations: store.ndlmRegistrations || [] });
  });

  router.get('/ndlm/registrations/:verificationId', (req, res) => {
    const registration = (store.ndlmRegistrations || []).find(item => item.verificationId === req.params.verificationId);
    if (!registration) return res.status(404).json({ success: false, error: 'NDLM registration not found' });
    res.json({ registration });
  });

  // Explainable risk administration. This remains an in-memory prototype, but
  // the resource shapes are intentionally suitable for a persistent ledger.
  router.get('/admin/risk/anomalies', (req, res) => {
    const anomalies = (store.riskAnomalies || []).filter(item => (
      (!req.query.status || item.status === req.query.status) &&
      (!req.query.district || item.district === req.query.district) &&
      (!req.query.village || item.village === req.query.village) &&
      (!req.query.farmerId || item.farmerId === req.query.farmerId) &&
      (!req.query.animalId || item.animalId === req.query.animalId)
    ));
    res.json({ anomalies, total: anomalies.length, permanentPoints: anomalies.reduce((sum, item) => sum + (item.permanentPoints || 0), 0) });
  });

  router.get('/admin/risk/observations', (req, res) => {
    const observations = (store.riskObservations || []).filter(item => (
      (!req.query.district || item.district === req.query.district) &&
      (!req.query.farmerId || item.farmerId === req.query.farmerId) &&
      (!req.query.animalId || item.animalId === req.query.animalId)
    ));
    res.json({ observations, total: observations.length });
  });

  router.post('/admin/risk/observations', (req, res) => {
    const result = ingestRiskObservation(req.body, { emit: emitRisk.bind(null, io) });
    res.status(201).json({ success: true, ...result });
  });

  router.patch('/admin/risk/anomalies/:anomalyId/review', (req, res) => {
    const anomaly = (store.riskAnomalies || []).find(item => item.anomalyId === req.params.anomalyId);
    if (!anomaly) return res.status(404).json({ success: false, error: 'Risk anomaly not found' });
    try {
      const reviewed = reviewRiskAnomaly(anomaly, {
        decision: req.body.decision,
        reason: req.body.reason,
        officerId: req.body.officerId || req.user.username || req.user.nodeId,
        officerRole: req.user.role
      }, { emit: emitRisk.bind(null, io) });
      res.json({ success: true, anomaly: reviewed });
    } catch (error) {
      res.status(error.statusCode || 400).json({ success: false, error: error.message });
    }
  });

  router.get('/admin/risk/aggregates', (req, res) => {
    const level = req.query.level || 'district';
    res.json({ level, aggregates: aggregateRisk({ ...req.query, level }), generatedAt: new Date().toISOString() });
  });

  router.get('/admin/risk/associations', (req, res) => {
    const associations = (store.chillingAssociations || []).filter(item => (
      (!req.query.tankerRegistration || item.tankerRegistration === req.query.tankerRegistration) &&
      (!req.query.chillingCenterId || item.chillingCenterId === req.query.chillingCenterId) &&
      (!req.query.district || item.district === req.query.district)
    ));
    res.json({ associations });
  });

  router.get('/admin/risk/raid-recommendations', (req, res) => {
    res.json({ recommendations: store.raidRecommendations || [] });
  });

  // Officer directory and dispatch ledger are intentionally in-memory for the
  // prototype. A recommendation can have one active assignment at a time.
  router.get('/admin/officers', (req, res) => {
    (store.officers || []).forEach(officer => refreshOfficerWorkload(officer.officerId));
    const officers = (store.officers || []).filter(officer => (
      (!req.query.jurisdiction || officer.jurisdiction === req.query.jurisdiction) &&
      (!req.query.role || officer.role === String(req.query.role).toUpperCase()) &&
      (!req.query.availability || officer.availability === String(req.query.availability).toUpperCase())
    )).map(officer => ({ ...officer }));
    res.json({ officers, total: officers.length });
  });

  router.get('/admin/assignments', (req, res) => {
    const assignments = (store.assignments || []).filter(assignment => (
      (!req.query.officerId || assignment.officerId === req.query.officerId) &&
      (!req.query.status || assignment.status === String(req.query.status).toUpperCase()) &&
      (!req.query.recommendationId || assignment.recommendationId === req.query.recommendationId)
    ));
    res.json({ assignments, total: assignments.length });
  });

  router.post('/admin/assignments', (req, res) => {
    const officerId = String(req.body.officerId || '').trim();
    const recommendationId = String(req.body.raidRecommendationId || req.body.recommendationId || '').trim() || null;
    const target = req.body.target || {};
    const targetType = String(req.body.targetType || target.type || (recommendationId ? 'RAID_RECOMMENDATION' : '')).trim().toUpperCase();
    const targetId = String(req.body.targetId || target.id || recommendationId || '').trim();
    if (!officerId || !targetType || !targetId) {
      return res.status(400).json({ success: false, error: 'officerId and a recommendationId or inspection targetType/targetId are required' });
    }

    const officer = store.officers.find(item => item.officerId === officerId);
    if (!officer) return res.status(404).json({ success: false, error: 'Officer not found' });
    if (recommendationId && !store.raidRecommendations.some(item => item.recommendationId === recommendationId)) {
      return res.status(404).json({ success: false, error: 'Raid recommendation not found' });
    }

    const existing = (store.assignments || []).find(item => (
      (recommendationId && item.recommendationId === recommendationId && ACTIVE_ASSIGNMENT_STATUSES.has(item.status)) ||
      (!recommendationId && item.targetType === targetType && item.targetId === targetId && ACTIVE_ASSIGNMENT_STATUSES.has(item.status))
    ));
    const oldOfficerId = existing?.officerId;
    if (officer.status === 'OFF_DUTY' || officer.availability === 'OFFLINE') {
      return res.status(409).json({ success: false, error: `${officer.name} is offline and cannot receive an assignment` });
    }
    if (!existing && officer.workload >= officer.workloadCapacity) {
      return res.status(409).json({ success: false, error: `${officer.name} is at workload capacity` });
    }

    const now = new Date().toISOString();
    const assignment = existing || {
      assignmentId: createId('ASGN'),
      assignedAt: now,
      status: 'ASSIGNED'
    };
    Object.assign(assignment, {
      officerId,
      officerName: officer.name,
      officerRole: officer.role,
      officerTitle: officer.title,
      jurisdiction: officer.jurisdiction,
      district: req.body.district || target.district || null,
      recommendationId,
      targetType,
      targetId,
      note: String(req.body.note || '').trim() || null,
      assignedBy: req.body.assignedBy || req.user.username || req.user.nodeId || 'GOVT_AUDITOR',
      updatedAt: now
    });
    if (!existing) store.assignments.unshift(assignment);
    refreshOfficerWorkload(oldOfficerId);
    refreshOfficerWorkload(officerId);

    if (recommendationId) {
      const recommendation = store.raidRecommendations.find(item => item.recommendationId === recommendationId);
      Object.assign(recommendation, {
        assignmentId: assignment.assignmentId,
        assignedOfficerId: officerId,
        assignmentStatus: assignment.status,
        assignedAt: now
      });
      emitRisk(io, 'raid_recommendation_updated', recommendation);
    }
    emitAssignment(io, existing ? 'assignment_updated' : 'assignment_created', assignment);
    res.status(existing ? 200 : 201).json({ success: true, assignment, reassigned: Boolean(existing) });
  });

  router.patch('/admin/assignments/:assignmentId', (req, res) => {
    const assignment = (store.assignments || []).find(item => item.assignmentId === req.params.assignmentId);
    if (!assignment) return res.status(404).json({ success: false, error: 'Assignment not found' });
    const previousOfficerId = assignment.officerId;
    const nextOfficerId = req.body.officerId ? String(req.body.officerId).trim() : assignment.officerId;
    const nextOfficer = store.officers.find(item => item.officerId === nextOfficerId);
    if (!nextOfficer) return res.status(404).json({ success: false, error: 'Officer not found' });
    if (nextOfficerId !== previousOfficerId && (nextOfficer.status === 'OFF_DUTY' || nextOfficer.availability === 'OFFLINE')) {
      return res.status(409).json({ success: false, error: `${nextOfficer.name} is offline and cannot receive an assignment` });
    }
    if (nextOfficerId !== previousOfficerId && nextOfficer.workload >= nextOfficer.workloadCapacity) {
      return res.status(409).json({ success: false, error: `${nextOfficer.name} is at workload capacity` });
    }
    const status = req.body.status ? String(req.body.status).toUpperCase() : assignment.status;
    if (!ASSIGNMENT_STATUSES.has(status)) {
      return res.status(400).json({ success: false, error: `status must be one of ${[...ASSIGNMENT_STATUSES].join(', ')}` });
    }
    Object.assign(assignment, {
      officerId: nextOfficerId,
      officerName: nextOfficer.name,
      officerRole: nextOfficer.role,
      officerTitle: nextOfficer.title,
      status,
      note: req.body.note === undefined ? assignment.note : String(req.body.note || '').trim() || null,
      updatedAt: new Date().toISOString()
    });
    refreshOfficerWorkload(previousOfficerId);
    refreshOfficerWorkload(nextOfficerId);
    if (assignment.recommendationId) {
      const recommendation = store.raidRecommendations.find(item => item.recommendationId === assignment.recommendationId);
      if (recommendation) {
        recommendation.assignedOfficerId = nextOfficerId;
        recommendation.assignmentStatus = status;
        recommendation.updatedAt = assignment.updatedAt;
        emitRisk(io, 'raid_recommendation_updated', recommendation);
      }
    }
    emitAssignment(io, 'assignment_updated', assignment);
    res.json({ success: true, assignment });
  });

  router.patch('/admin/risk/raid-recommendations/:recommendationId/approval', (req, res) => {
    const recommendation = (store.raidRecommendations || []).find(item => item.recommendationId === req.params.recommendationId);
    if (!recommendation) return res.status(404).json({ success: false, error: 'Raid recommendation not found' });
    const approval = String(req.body.approval || '').toUpperCase();
    if (!['APPROVED', 'DECLINED'].includes(approval)) return res.status(400).json({ success: false, error: 'approval must be APPROVED or DECLINED' });
    if (approval === 'DECLINED' && !String(req.body.reason || '').trim()) return res.status(400).json({ success: false, error: 'A reason is required when declining a raid' });
    recommendation.status = approval === 'APPROVED' ? 'APPROVED' : 'DECLINED';
    recommendation.officerApproval = { approval, reason: String(req.body.reason || '').trim(), officerId: req.body.officerId || req.user.username || req.user.nodeId, officerRole: req.user.role, reviewedAt: new Date().toISOString() };
    emitRisk(io, 'raid_recommendation_updated', recommendation);
    res.json({ success: true, recommendation });
  });

  router.post('/admin/risk/demo/seed', (req, res) => {
    res.json({ success: true, ...seedRiskDemo({ emit: emitRisk.bind(null, io) }) });
  });

  router.patch('/ndlm/registrations/:verificationId', (req, res) => {
    const registration = (store.ndlmRegistrations || []).find(item => item.verificationId === req.params.verificationId);
    if (!registration) return res.status(404).json({ success: false, error: 'NDLM registration not found' });
    Object.assign(registration, req.body, {
      updatedAt: new Date().toISOString(),
      reviewedBy: req.body.reviewedBy || req.user.role || 'FSSAI'
    });
    io.emit('ndlm_registration_updated', registration);
    io.emit('ndlm_registration_reviewed', registration);
    res.json({ success: true, registration });
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
