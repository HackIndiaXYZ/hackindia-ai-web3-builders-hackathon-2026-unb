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
  // Prototype officer directory and dispatch ledger. These records are
  // intentionally process-local until the production workforce service lands.
  officers: [
    {
      officerId: 'FSSAI-HR-007',
      name: 'Anita Mundhe',
      role: 'FSSAI',
      title: 'State Food Safety Officer',
      jurisdiction: 'FSSAI-HR',
      state: 'Haryana',
      districts: ['Kaithal', 'Karnal', 'Panipat'],
      availability: 'AVAILABLE',
      status: 'ON_DUTY',
      workload: 1,
      workloadCapacity: 4,
      phone: '+91 98710 44007',
      lastSeenAt: '2026-09-13T09:22:00Z'
    },
    {
      officerId: 'FSSAI-DL-014',
      name: 'Vikram Bedi',
      role: 'FSSAI',
      title: 'Food Safety Officer',
      jurisdiction: 'FSSAI-DL',
      state: 'Delhi NCR',
      districts: ['East Delhi', 'Central Delhi'],
      availability: 'AVAILABLE',
      status: 'ON_DUTY',
      workload: 0,
      workloadCapacity: 3,
      phone: '+91 98710 44014',
      lastSeenAt: '2026-09-13T09:18:00Z'
    },
    {
      officerId: 'FSSAI-UP-022',
      name: 'Nidhi Srivastava',
      role: 'FSSAI',
      title: 'District Food Safety Officer',
      jurisdiction: 'FSSAI-UP',
      state: 'Uttar Pradesh',
      districts: ['Mathura', 'Agra'],
      availability: 'BUSY',
      status: 'ON_DUTY',
      workload: 2,
      workloadCapacity: 3,
      phone: '+91 98710 44022',
      lastSeenAt: '2026-09-13T09:12:00Z'
    },
    {
      officerId: 'QCO-MCC104-001',
      name: 'Harish Chandra',
      role: 'QC',
      title: 'Quality Control Inspector',
      jurisdiction: 'FSSAI-HR',
      state: 'Haryana',
      districts: ['Kaithal', 'Hisar'],
      availability: 'AVAILABLE',
      status: 'ON_DUTY',
      workload: 1,
      workloadCapacity: 3,
      phone: '+91 98710 44101',
      lastSeenAt: '2026-09-13T09:25:00Z'
    },
    {
      officerId: 'QCO-PLANT-02',
      name: 'Meena Rathi',
      role: 'QC',
      title: 'Plant Quality Manager',
      jurisdiction: 'FSSAI-HR',
      state: 'Haryana',
      districts: ['Sonepat', 'Karnal'],
      availability: 'BUSY',
      status: 'ON_DUTY',
      workload: 2,
      workloadCapacity: 4,
      phone: '+91 98710 44102',
      lastSeenAt: '2026-09-13T09:08:00Z'
    },
    {
      officerId: 'AGG-VLC-22',
      name: 'Rakesh Yadav',
      role: 'AGGREGATOR',
      title: 'Collection Centre Supervisor',
      jurisdiction: 'FSSAI-HR',
      state: 'Haryana',
      districts: ['Karnal', 'Kaithal'],
      availability: 'AVAILABLE',
      status: 'ON_DUTY',
      workload: 0,
      workloadCapacity: 2,
      phone: '+91 98710 44222',
      lastSeenAt: '2026-09-13T09:20:00Z'
    },
    {
      officerId: 'AGG-MCC-08',
      name: 'Pooja Solanki',
      role: 'AGGREGATOR',
      title: 'Milk Collection Coordinator',
      jurisdiction: 'FSSAI-GJ',
      state: 'Gujarat',
      districts: ['Anand', 'Mehsana'],
      availability: 'AVAILABLE',
      status: 'ON_DUTY',
      workload: 0,
      workloadCapacity: 2,
      phone: '+91 98710 44208',
      lastSeenAt: '2026-09-13T09:16:00Z'
    },
    {
      officerId: 'FSSAI-MH-031',
      name: 'Sanjay Kulkarni',
      role: 'FSSAI',
      title: 'Regional Compliance Officer',
      jurisdiction: 'FSSAI-MH',
      state: 'Maharashtra',
      districts: ['Pune', 'Nashik'],
      availability: 'OFFLINE',
      status: 'OFF_DUTY',
      workload: 0,
      workloadCapacity: 4,
      phone: '+91 98710 44031',
      lastSeenAt: '2026-09-12T18:40:00Z'
    }
  ],
  assignments: [
    {
      assignmentId: 'ASGN-DEMO-001',
      officerId: 'FSSAI-HR-007',
      officerName: 'Anita Mundhe',
      officerRole: 'FSSAI',
      officerTitle: 'State Food Safety Officer',
      jurisdiction: 'FSSAI-HR',
      district: 'Kaithal',
      recommendationId: null,
      targetType: 'INSPECTION',
      targetId: 'MCC-104',
      status: 'IN_PROGRESS',
      assignedBy: 'STATE-COMMAND',
      assignedAt: '2026-09-13T07:30:00Z',
      updatedAt: '2026-09-13T08:05:00Z',
      note: 'Verify volume expansion alert at Kaithal collection node'
    },
    {
      assignmentId: 'ASGN-DEMO-002',
      officerId: 'QCO-MCC104-001',
      officerName: 'Harish Chandra',
      officerRole: 'QC',
      officerTitle: 'Quality Control Inspector',
      jurisdiction: 'FSSAI-HR',
      district: 'Kaithal',
      recommendationId: null,
      targetType: 'INSPECTION',
      targetId: 'VLC-77',
      status: 'ACCEPTED',
      assignedBy: 'STATE-COMMAND',
      assignedAt: '2026-09-13T08:10:00Z',
      updatedAt: '2026-09-13T08:18:00Z',
      note: 'Collect confirmatory fat/SNF sample'
    }
  ],
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