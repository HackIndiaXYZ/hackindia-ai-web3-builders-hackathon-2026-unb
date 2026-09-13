import crypto from 'crypto';

export const store = {
  milkLogs: [],
  grievances: [],
  ndlmRegistrations: [],
  collectionRequests: [],
  // Prototype risk ledger. Observations are append-only; a risk point is not
  // permanent until an officer records a CONFIRM decision.
  riskObservations: [],
  riskAnomalies: [],
  riskReviews: [],
  raidRecommendations: [],
  batches: [
    { batchId: 'BATCH-20260831-TN401', tankerRegistration: 'HR-07-GA-5541', volumeDeltaPercent: 6.8, batchStatus: 'IN_TRANSIT', anomalyScore: 92 }
  ],
  chillingAssociations: [
    { associationId: 'ASSOC-DEMO-01', tankerRegistration: 'HR-07-GA-5541', chillingCenterId: 'MCC-KTL-01', village: 'Siwan', district: 'Kaithal', firstSeenAt: '2026-08-31T07:15:00Z', observationCount: 3 }
  ]
};

export function createId(prefix) {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
}

export function createReceiptHash(payload) {
  return `sha256:${crypto.createHash('sha256').update(JSON.stringify(payload) + Date.now()).digest('hex')}`;
}