import { createId, store } from './store.js';

const BREED_BASELINES = {
  'Murrah Buffalo': { fat: 7.2, snf: 9.2 },
  'Sahiwal Cow': { fat: 4.3, snf: 8.7 },
  'Gir Cow': { fat: 4.5, snf: 8.8 },
  'HF Cross': { fat: 4.0, snf: 8.6 },
  'Tharparkar': { fat: 4.8, snf: 8.9 },
  'Rathi Cow': { fat: 4.6, snf: 8.8 }
};

const num = value => Number.isFinite(Number(value)) ? Number(value) : null;
const mean = values => values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
const stddev = values => {
  if (values.length < 2) return 0;
  const average = mean(values);
  return Math.sqrt(mean(values.map(value => (value - average) ** 2)));
};
const text = value => String(value || '').trim();

function addEvidence(evidence, code, label, points, details) {
  evidence.push({ code, label, points, details });
}

/**
 * Explainable scoring deliberately returns a provisional score. Purity is
 * capped to a small modifier and is never sufficient to create an anomaly.
 */
export function scoreObservation(observation) {
  const fat = num(observation.fatPercent);
  const snf = num(observation.snfPercent);
  const evidence = [];
  const breedBaseline = BREED_BASELINES[observation.breed] || { fat: 4.5, snf: 8.7 };

  if (fat === null || snf === null) {
    addEvidence(evidence, 'MISSING_COMPONENTS', 'Missing fat/SNF reading', 20, 'Both fatPercent and snfPercent are required to establish a reliable reading.');
  } else {
    const fatSnfRatio = fat / Math.max(snf, 0.1);
    if (fat < 2.5 || fat > 9.5 || snf < 7.5 || snf > 10.5) {
      addEvidence(evidence, 'COMPONENT_RANGE', 'Fat/SNF outside biological range', 25, `Observed fat ${fat.toFixed(2)}% and SNF ${snf.toFixed(2)}%.`);
    }
    if (fatSnfRatio > 0.95 || fatSnfRatio < 0.25 || Math.abs((fat + snf) - 13.8) > 3.5) {
      addEvidence(evidence, 'SUSPICIOUS_CONSISTENCY', 'Fat/SNF consistency check failed', 24, `Fat/SNF relationship (${fatSnfRatio.toFixed(2)}) is unusual for a single milk reading.`);
    }
    const breedFatDeviation = Math.abs(fat - breedBaseline.fat);
    const breedSnfDeviation = Math.abs(snf - breedBaseline.snf);
    if (breedFatDeviation > 1.35 || breedSnfDeviation > 0.85) {
      addEvidence(evidence, 'BREED_DEVIATION', 'Deviation from breed baseline', 18, `${observation.breed || 'unknown breed'} baseline is ${breedBaseline.fat.toFixed(1)}% fat / ${breedBaseline.snf.toFixed(1)}% SNF.`);
    }
  }

  const peerObservations = store.riskObservations.filter(item => (
    item.observationId !== observation.observationId &&
    ((observation.nodeId && item.nodeId === observation.nodeId) ||
      (observation.village && item.village === observation.village) ||
      (observation.breed && item.breed === observation.breed))
  ));
  const peerFat = peerObservations.map(item => num(item.fatPercent)).filter(value => value !== null);
  const peerSnf = peerObservations.map(item => num(item.snfPercent)).filter(value => value !== null);
  if (fat !== null && peerFat.length >= 2 && Math.abs(fat - mean(peerFat)) > Math.max(0.8, 2 * stddev(peerFat))) {
    addEvidence(evidence, 'PEER_FAT_DEVIATION', 'Deviation from peer collection history', 16, `Fat differs from ${peerFat.length} comparable peer readings (${mean(peerFat).toFixed(2)}% mean).`);
  }
  if (snf !== null && peerSnf.length >= 2 && Math.abs(snf - mean(peerSnf)) > Math.max(0.6, 2 * stddev(peerSnf))) {
    addEvidence(evidence, 'PEER_SNF_DEVIATION', 'Deviation from peer collection history', 16, `SNF differs from ${peerSnf.length} comparable peer readings (${mean(peerSnf).toFixed(2)}% mean).`);
  }

  if (observation.lactationStage && ['DRY', 'EARLY'].includes(String(observation.lactationStage).toUpperCase()) && fat !== null && fat < breedBaseline.fat - 1) {
    addEvidence(evidence, 'LACTATION_DEVIATION', 'Lactation-stage deviation', 12, `${observation.lactationStage} lactation normally has higher fat than the observed reading.`);
  }

  const purity = num(observation.purityScore);
  const purityModifier = purity !== null && purity < 80 ? Math.min(5, Math.round((80 - purity) / 4)) : 0;
  if (purityModifier) {
    addEvidence(evidence, 'PURITY_SUPPORTING_SIGNAL', 'Low purity score (supporting signal only)', purityModifier, `Purity ${purity}/100 adds a capped supporting modifier; it is not proof of an anomaly.`);
  }

  const componentPoints = evidence
    .filter(item => item.code !== 'PURITY_SUPPORTING_SIGNAL')
    .reduce((total, item) => total + item.points, 0);
  return {
    evidence,
    componentPoints,
    purityModifier,
    provisionalPoints: Math.min(100, componentPoints + purityModifier),
    riskScore: Math.min(100, componentPoints + purityModifier)
  };
}

function associationFor(observation) {
  if (!observation.tankerRegistration && !observation.chillingCenterId) return null;
  const existing = store.chillingAssociations.find(item => (
    item.tankerRegistration === observation.tankerRegistration &&
    item.chillingCenterId === observation.chillingCenterId
  ));
  if (existing) {
    existing.observationCount += 1;
    existing.lastSeenAt = observation.observedAt;
    return existing;
  }
  const association = {
    associationId: createId('ASSOC'),
    tankerRegistration: observation.tankerRegistration || null,
    chillingCenterId: observation.chillingCenterId || null,
    village: observation.village || null,
    district: observation.district || null,
    firstSeenAt: observation.observedAt,
    lastSeenAt: observation.observedAt,
    observationCount: 1
  };
  store.chillingAssociations.unshift(association);
  return association;
}

function recommendationFor(anomaly) {
  if (anomaly.provisionalPoints < 50) return null;
  const existing = store.raidRecommendations.find(item => item.anomalyId === anomaly.anomalyId);
  if (existing) return existing;
  const recommendation = {
    recommendationId: createId('RAID'),
    anomalyId: anomaly.anomalyId,
    targetType: anomaly.animalId ? 'ANIMAL' : anomaly.farmerId ? 'FARMER' : anomaly.farmId ? 'FARM' : 'NODE',
    targetId: anomaly.animalId || anomaly.farmerId || anomaly.farmId || anomaly.nodeId,
    status: 'PENDING_OFFICER_APPROVAL',
    reason: anomaly.evidence.map(item => item.label).join('; '),
    evidence: anomaly.evidence,
    createdAt: anomaly.detectedAt
  };
  store.raidRecommendations.unshift(recommendation);
  return recommendation;
}

export function ingestRiskObservation(payload = {}, { emit } = {}) {
  const observation = {
    observationId: payload.observationId || createId('OBS'),
    farmerId: text(payload.farmerId) || null,
    farmerName: text(payload.farmerName) || null,
    animalId: text(payload.animalId) || null,
    animalName: text(payload.animalName) || null,
    farmId: text(payload.farmId) || text(payload.farmerId) || null,
    village: text(payload.village) || null,
    district: text(payload.district) || null,
    state: text(payload.state) || null,
    nodeId: text(payload.nodeId) || null,
    breed: text(payload.breed) || null,
    lactationStage: text(payload.lactationStage) || null,
    purityScore: num(payload.purityScore),
    fatPercent: num(payload.fatPercent),
    snfPercent: num(payload.snfPercent),
    weightKg: num(payload.weightKg),
    tankerRegistration: text(payload.tankerRegistration) || null,
    chillingCenterId: text(payload.chillingCenterId) || null,
    observedAt: payload.observedAt || new Date().toISOString(),
    source: text(payload.source) || 'MILK_LOG'
  };
  const scored = scoreObservation(observation);
  observation.explainability = scored;
  store.riskObservations.unshift(observation);

  // One observation creates one provisional anomaly. It has no permanent
  // points until an officer confirms it.
  const anomaly = {
    anomalyId: createId('RISK'),
    observationId: observation.observationId,
    farmerId: observation.farmerId,
    animalId: observation.animalId,
    farmId: observation.farmId,
    village: observation.village,
    district: observation.district,
    state: observation.state,
    nodeId: observation.nodeId,
    tankerRegistration: observation.tankerRegistration,
    chillingCenterId: observation.chillingCenterId,
    type: scored.evidence.map(item => item.code).join(',') || 'NO_SIGNAL',
    riskScore: scored.riskScore,
    provisionalPoints: scored.provisionalPoints,
    permanentPoints: 0,
    evidence: scored.evidence,
    status: scored.provisionalPoints >= 20 ? 'PROVISIONAL' : 'OBSERVED',
    detectedAt: observation.observedAt,
    review: null
  };
  store.riskAnomalies.unshift(anomaly);
  const association = associationFor(observation);
  const recommendation = recommendationFor(anomaly);
  if (emit) {
    emit('risk_observation_created', observation);
    emit('risk_anomaly_provisional', anomaly);
    if (association) emit('risk_association_updated', association);
    if (recommendation) emit('raid_recommendation_created', recommendation);
    emit('risk_aggregate_updated', { generatedAt: new Date().toISOString() });
  }
  return { observation, anomaly, association, recommendation };
}

export function reviewRiskAnomaly(anomaly, { decision, reason, officerId, officerRole } = {}, { emit } = {}) {
  const normalized = String(decision || '').toUpperCase();
  if (!['CONFIRM', 'CLEAR', 'DISMISS'].includes(normalized)) {
    const error = new Error('decision must be CONFIRM, CLEAR, or DISMISS');
    error.statusCode = 400;
    throw error;
  }
  if (!text(reason)) {
    const error = new Error('A review reason is required');
    error.statusCode = 400;
    throw error;
  }
  anomaly.status = normalized === 'CONFIRM' ? 'CONFIRMED' : normalized === 'CLEAR' ? 'CLEARED_VALID' : 'DISMISSED';
  anomaly.permanentPoints = normalized === 'CONFIRM' ? anomaly.provisionalPoints : 0;
  anomaly.review = {
    decision: normalized,
    reason: text(reason),
    officerId: text(officerId) || 'DEMO-OFFICER',
    officerRole: text(officerRole) || 'GOVT_AUDITOR',
    reviewedAt: new Date().toISOString()
  };
  store.riskReviews.unshift({ anomalyId: anomaly.anomalyId, ...anomaly.review });
  if (emit) {
    emit('risk_anomaly_reviewed', anomaly);
    emit('risk_aggregate_updated', { generatedAt: new Date().toISOString() });
  }
  return anomaly;
}

export function aggregateRisk({ level = 'district', state, district, village, farmId, farmerId, animalId } = {}) {
  const normalizedLevel = String(level).toLowerCase();
  const keyFor = item => normalizedLevel === 'animal' ? item.animalId : normalizedLevel === 'farmer' ? item.farmerId : normalizedLevel === 'farm' ? item.farmId : normalizedLevel === 'village' ? item.village : normalizedLevel === 'state' ? item.state : item.district;
  const inScope = item => (!state || item.state === state) && (!district || item.district === district) && (!village || item.village === village) && (!farmId || item.farmId === farmId) && (!farmerId || item.farmerId === farmerId) && (!animalId || item.animalId === animalId);
  const grouped = new Map();
  store.riskAnomalies.filter(inScope).forEach(item => {
    const key = keyFor(item) || 'UNMAPPED';
    const row = grouped.get(key) || { key, level: normalizedLevel, observationCount: 0, provisionalPoints: 0, permanentPoints: 0, confirmedCount: 0, provisionalCount: 0, clearedCount: 0, dismissedCount: 0, evidence: [], associations: [] };
    row.observationCount += 1;
    row.provisionalPoints += item.provisionalPoints || 0;
    row.permanentPoints += item.permanentPoints || 0;
    if (item.status === 'CONFIRMED') row.confirmedCount += 1;
    if (item.status === 'PROVISIONAL' || item.status === 'OBSERVED') row.provisionalCount += 1;
    if (item.status === 'CLEARED_VALID') row.clearedCount += 1;
    if (item.status === 'DISMISSED') row.dismissedCount += 1;
    row.evidence.push(...(item.evidence || []).map(signal => signal.label));
    if (item.tankerRegistration || item.chillingCenterId) row.associations.push({ tankerRegistration: item.tankerRegistration, chillingCenterId: item.chillingCenterId });
    grouped.set(key, row);
  });
  return [...grouped.values()].map(row => ({ ...row, evidence: [...new Set(row.evidence)].slice(0, 8), associations: row.associations.slice(0, 8), permanentRiskScore: Math.min(100, row.permanentPoints), provisionalRiskScore: Math.min(100, row.provisionalPoints) })).sort((a, b) => b.permanentPoints - a.permanentPoints || b.provisionalPoints - a.provisionalPoints);
}

export function seedRiskDemo({ emit } = {}) {
  if (store.riskObservations.length) return { seeded: false, count: store.riskAnomalies.length };
  const demoFarmers = [
    ['201410000128', 'Balwant Yadav', 'NDLM-840003129940117', 'Murrah Buffalo', 'Siwan', 'Kaithal', 'VLC-KTL-02', 'HR-07-GA-5541', 'MCC-KTL-01'],
    ['201410000123', 'Ramesh Kumar', 'NDLM-840003129940112', 'Murrah Buffalo', 'Nissing', 'Karnal', 'VLC-KNL-01', 'HR-08-B-9912', 'MCC-KNL-01'],
    ['201410000130', 'Dharambir Saini', 'NDLM-840003129940119', 'Murrah Buffalo', 'Adampur', 'Hisar', 'VLC-HSR-01', 'HR-09-C-1122', 'MCC-HSR-01'],
    ['201410000133', 'Mahesh Tyagi', 'NDLM-840003129940122', 'HF Cross', 'Gohana', 'Sonepat', 'VLC-SNP-01', 'HR-10-AA-4412', 'MCC-SNP-01'],
    ['201410000136', 'Omkar Bishnoi', 'NDLM-840003129940125', 'Tharparkar', 'Sirsa', 'Sirsa', 'VLC-SRS-01', 'HR-11-BC-7720', 'MCC-SRS-01'],
    ['201410000140', 'Rajpal Siwach', 'NDLM-840003129940129', 'Gir Cow', 'Fatehabad', 'Fatehabad', 'VLC-FTB-01', 'HR-12-DE-3301', 'MCC-FTB-01']
  ];
  const demo = Array.from({ length: 96 }, (_, index) => {
    const farmer = demoFarmers[index % demoFarmers.length];
    const flagged = index % 19 === 0 || index % 31 === 0;
    const normalFat = farmer[3] === 'Murrah Buffalo' ? 6.4 : 4.5;
    return {
      farmerId: farmer[0],
      farmerName: farmer[1],
      animalId: farmer[2],
      breed: farmer[3],
      village: farmer[4],
      district: farmer[5],
      state: 'Haryana',
      nodeId: farmer[6],
      purityScore: flagged ? 72 + (index % 7) : 86 + (index % 12),
      fatPercent: +(flagged ? normalFat - 2.1 : normalFat + ((index % 5) - 2) * 0.18).toFixed(1),
      snfPercent: +(flagged ? 7.1 : 8.7 + ((index % 4) - 1) * 0.12).toFixed(1),
      weightKg: +(flagged ? 18.5 + (index % 4) : 6.5 + (index % 9) * 0.8).toFixed(1),
      tankerRegistration: farmer[7],
      chillingCenterId: farmer[8],
      source: 'DEMO_SEED',
      observedAt: new Date(Date.UTC(2026, 8, 13, 4 + (index % 8), index % 60)).toISOString()
    };
  });
  const results = demo.map(item => ingestRiskObservation(item, { emit }));
  return { seeded: true, count: results.length, anomalies: results.map(item => item.anomaly) };
}
