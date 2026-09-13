import crypto from 'crypto';

export const store = {
  milkLogs: [],
  grievances: [],
  ndlmRegistrations: [],
  batches: [
    { batchId: 'BATCH-20260831-TN401', tankerRegistration: 'HR-07-GA-5541', volumeDeltaPercent: 6.8, batchStatus: 'IN_TRANSIT', anomalyScore: 92 }
  ]
};

export function createId(prefix) {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
}

export function createReceiptHash(payload) {
  return `sha256:${crypto.createHash('sha256').update(JSON.stringify(payload) + Date.now()).digest('hex')}`;
}