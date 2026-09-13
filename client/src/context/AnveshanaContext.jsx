import React, { createContext, useContext, useState, useEffect } from 'react';
import { createRealtimeConnection } from '../services/realtime';
import {
  createCollectionRequest as createCollectionRequestApi,
  fetchWorkflowSync,
  recordCollectionMeasurements,
  submitNdlmRegistration,
  transferCollectionToChilling,
  updateCollectionApproval,
  updateNdlmRegistration,
  fetchRiskAnomalies,
  fetchRiskAggregates,
  fetchRaidRecommendations,
  fetchOfficers,
  fetchAssignments,
  assignOfficer as assignOfficerApi,
  updateAssignment as updateAssignmentApi,
  reviewRiskAnomaly as reviewRiskAnomalyApi,
  approveRaidRecommendation as approveRaidRecommendationApi,
  seedRiskDemo
} from '../services/api';

const AnveshanaContext = createContext(null);

const DEMO_OFFICERS = [
  { officerId: 'FSSAI-HR-007', name: 'Anita Mundhe', role: 'FSSAI', title: 'State Food Safety Officer', jurisdiction: 'FSSAI-HR', state: 'Haryana', districts: ['Kaithal', 'Karnal'], availability: 'AVAILABLE', status: 'ON_DUTY', workload: 0, workloadCapacity: 4 },
  { officerId: 'QCO-MCC104-001', name: 'Harish Chandra', role: 'QC', title: 'Quality Control Inspector', jurisdiction: 'FSSAI-HR', state: 'Haryana', districts: ['Kaithal', 'Hisar'], availability: 'AVAILABLE', status: 'ON_DUTY', workload: 0, workloadCapacity: 3 },
  { officerId: 'FSSAI-DL-014', name: 'Vikram Bedi', role: 'FSSAI', title: 'Food Safety Officer', jurisdiction: 'FSSAI-DL', state: 'Delhi NCR', districts: ['East Delhi', 'Central Delhi'], availability: 'AVAILABLE', status: 'ON_DUTY', workload: 0, workloadCapacity: 3 },
  { officerId: 'FSSAI-UP-022', name: 'Nidhi Srivastava', role: 'FSSAI', title: 'District Food Safety Officer', jurisdiction: 'FSSAI-UP', state: 'Uttar Pradesh', districts: ['Mathura', 'Agra'], availability: 'AVAILABLE', status: 'ON_DUTY', workload: 0, workloadCapacity: 3 },
  { officerId: 'AGG-VLC-22', name: 'Rakesh Yadav', role: 'AGGREGATOR', title: 'Collection Centre Supervisor', jurisdiction: 'FSSAI-HR', state: 'Haryana', districts: ['Karnal', 'Kaithal'], availability: 'AVAILABLE', status: 'ON_DUTY', workload: 0, workloadCapacity: 2 }
];

export const JURISDICTION_CONFIGS = {
  'FSSAI-DL': {
    state: 'Delhi NCR',
    code: 'FSSAI-DL',
    maxExpansionPercent: 0.8, // Strict Capital Compliance
    fatLowerBound: 3.5,
    snfLowerBound: 8.5,
  },
  'FSSAI-HR': {
    state: 'Haryana',
    code: 'FSSAI-HR',
    maxExpansionPercent: 1.0,
    fatLowerBound: 3.5,
    snfLowerBound: 8.5,
  },
  'FSSAI-UP': {
    state: 'Uttar Pradesh',
    code: 'FSSAI-UP',
    maxExpansionPercent: 1.5,
    fatLowerBound: 3.2,
    snfLowerBound: 8.2,
  },
  'FSSAI-MH': {
    state: 'Maharashtra',
    code: 'FSSAI-MH',
    maxExpansionPercent: 1.0,
    fatLowerBound: 3.5,
    snfLowerBound: 8.5,
  },
  'FSSAI-GJ': {
    state: 'Gujarat',
    code: 'FSSAI-GJ',
    maxExpansionPercent: 1.2,
    fatLowerBound: 3.5,
    snfLowerBound: 8.5,
  },
  'FSSAI-PB': {
    state: 'Punjab',
    code: 'FSSAI-PB',
    maxExpansionPercent: 1.0,
    fatLowerBound: 3.8,
    snfLowerBound: 8.8,
  }
};

export const STATE_DISTRICT_DIRECTORY = {
  'FSSAI-DL': {
    code: 'FSSAI-DL',
    state: 'Delhi NCR',
    stateHindi: 'दिल्ली एनसीआर',
    center: [28.6139, 77.2090],
    zoom: 10,
    districts: [
      { name: 'All Delhi NCT Districts', nameHindi: 'सभी दिल्ली क्षेत्र', lat: 28.6139, lng: 77.2090, zoom: 10 },
      { name: 'East Delhi (Patparganj Plant)', nameHindi: 'पूर्वी दिल्ली (पटपड़गंज)', lat: 28.6280, lng: 77.3000, zoom: 12 },
      { name: 'South Delhi (Okhla Terminal)', nameHindi: 'दक्षिणी दिल्ली (ओखला)', lat: 28.5355, lng: 77.2680, zoom: 12 },
      { name: 'West Delhi (Dwarka Distribution)', nameHindi: 'पश्चिम दिल्ली (द्वारका)', lat: 28.5921, lng: 77.0460, zoom: 12 },
      { name: 'North West Delhi (Alipur Gate)', nameHindi: 'उत्तर-पश्चिम दिल्ली (अलीपुर)', lat: 28.8105, lng: 77.1332, zoom: 12 },
      { name: 'Central Delhi (FSSAI HQ)', nameHindi: 'मध्य दिल्ली (एफएसएसएआई मुख्यालय)', lat: 28.6304, lng: 77.2177, zoom: 12 }
    ]
  },
  'FSSAI-HR': {
    code: 'FSSAI-HR',
    state: 'Haryana',
    stateHindi: 'हरियाणा',
    center: [29.2000, 76.4000],
    zoom: 8,
    districts: [
      { name: 'All Haryana Districts', nameHindi: 'सभी हरियाणा जिले',   lat: 29.2000, lng: 76.4000, zoom: 8  },
      { name: 'Karnal',        nameHindi: 'करनाल',        lat: 29.6857, lng: 76.9905, zoom: 11 },
      { name: 'Kaithal',       nameHindi: 'कैथल',         lat: 29.8015, lng: 76.3996, zoom: 11 },
      { name: 'Hisar',         nameHindi: 'हिसार',        lat: 29.1492, lng: 75.7217, zoom: 11 },
      { name: 'Sonepat',       nameHindi: 'सोनीपत',       lat: 28.9931, lng: 77.0151, zoom: 11 },
      { name: 'Ambala',        nameHindi: 'अम्बाला',      lat: 30.3782, lng: 76.7767, zoom: 11 },
      { name: 'Rohtak',        nameHindi: 'रोहतक',        lat: 28.8955, lng: 76.6066, zoom: 11 },
      { name: 'Panipat',       nameHindi: 'पानीपत',       lat: 29.3909, lng: 76.9635, zoom: 11 },
      { name: 'Kurukshetra',   nameHindi: 'कुरुक्षेत्र',  lat: 29.9695, lng: 76.8783, zoom: 11 },
      { name: 'Sirsa',         nameHindi: 'सिरसा',        lat: 29.5333, lng: 75.0167, zoom: 11 },
      { name: 'Fatehabad',     nameHindi: 'फतेहाबाद',     lat: 29.5167, lng: 75.4500, zoom: 11 },
      { name: 'Jind',          nameHindi: 'जींद',         lat: 29.3167, lng: 76.3167, zoom: 11 },
      { name: 'Bhiwani',       nameHindi: 'भिवानी',       lat: 28.7833, lng: 76.1333, zoom: 11 },
      { name: 'Mahendragarh',  nameHindi: 'महेंद्रगढ़',   lat: 28.2833, lng: 76.1500, zoom: 11 },
      { name: 'Rewari',        nameHindi: 'रेवाड़ी',      lat: 28.1979, lng: 76.6169, zoom: 11 },
      { name: 'Gurugram',      nameHindi: 'गुरुग्राम',    lat: 28.4595, lng: 77.0266, zoom: 11 },
      { name: 'Faridabad',     nameHindi: 'फरीदाबाद',     lat: 28.4089, lng: 77.3178, zoom: 11 },
      { name: 'Palwal',        nameHindi: 'पलवल',         lat: 28.1487, lng: 77.3326, zoom: 11 },
      { name: 'Nuh',           nameHindi: 'नूंह',          lat: 28.1123, lng: 77.0020, zoom: 11 },
      { name: 'Jhajjar',       nameHindi: 'झज्जर',        lat: 28.6069, lng: 76.6559, zoom: 11 },
      { name: 'Panchkula',     nameHindi: 'पंचकूला',      lat: 30.6942, lng: 76.8606, zoom: 11 },
      { name: 'Yamunanagar',   nameHindi: 'यमुनानगर',     lat: 30.1290, lng: 77.2674, zoom: 11 },
      { name: 'Charkhi Dadri', nameHindi: 'चरखी दादरी',   lat: 28.5920, lng: 76.2645, zoom: 11 }
    ]
  },
  'FSSAI-UP': {
    code: 'FSSAI-UP',
    state: 'Uttar Pradesh',
    stateHindi: 'उत्तर प्रदेश',
    center: [27.2000, 78.0000],
    zoom: 7,
    districts: [
      { name: 'All UP Districts', nameHindi: 'सभी उत्तर प्रदेश जिले', lat: 27.2000, lng: 78.0000, zoom: 7 },
      { name: 'Mathura', nameHindi: 'मथुरा', lat: 27.4924, lng: 77.6737, zoom: 11 },
      { name: 'Meerut', nameHindi: 'मेरठ', lat: 28.9845, lng: 77.7064, zoom: 11 },
      { name: 'Agra', nameHindi: 'आगरा', lat: 27.1767, lng: 78.0081, zoom: 11 },
      { name: 'Aligarh', nameHindi: 'अलीगढ़', lat: 27.8974, lng: 78.0880, zoom: 11 }
    ]
  },
  'FSSAI-MH': {
    code: 'FSSAI-MH',
    state: 'Maharashtra',
    stateHindi: 'महाराष्ट्र',
    center: [19.7515, 75.7139],
    zoom: 7,
    districts: [
      { name: 'All Maharashtra Districts', nameHindi: 'सभी महाराष्ट्र जिले', lat: 19.7515, lng: 75.7139, zoom: 7 },
      { name: 'Kolhapur', nameHindi: 'कोल्हापुर', lat: 16.7050, lng: 74.2433, zoom: 11 },
      { name: 'Pune', nameHindi: 'पुणे', lat: 18.5204, lng: 73.8567, zoom: 11 },
      { name: 'Nashik', nameHindi: 'नाशिक', lat: 20.0059, lng: 73.7898, zoom: 11 },
      { name: 'Ahmednagar', nameHindi: 'अहमदनगर', lat: 19.0948, lng: 74.7480, zoom: 11 }
    ]
  },
  'FSSAI-GJ': {
    code: 'FSSAI-GJ',
    state: 'Gujarat',
    stateHindi: 'गुजरात',
    center: [22.2587, 71.1924],
    zoom: 7,
    districts: [
      { name: 'All Gujarat Districts', nameHindi: 'सभी गुजरात जिले', lat: 22.2587, lng: 71.1924, zoom: 7 },
      { name: 'Anand (Amul HQ)', nameHindi: 'आनंद (अमुल)', lat: 22.5645, lng: 72.9289, zoom: 11 },
      { name: 'Banaskantha', nameHindi: 'बनासकांठा', lat: 24.1724, lng: 72.4346, zoom: 11 },
      { name: 'Mehsana', nameHindi: 'मेहसाणा', lat: 23.5880, lng: 72.3693, zoom: 11 }
    ]
  },
  'FSSAI-PB': {
    code: 'FSSAI-PB',
    state: 'Punjab',
    stateHindi: 'पंजाब',
    center: [31.1471, 75.3412],
    zoom: 8,
    districts: [
      { name: 'All Punjab Districts', nameHindi: 'सभी पंजाब जिले', lat: 31.1471, lng: 75.3412, zoom: 8 },
      { name: 'Ludhiana', nameHindi: 'लुधियाना', lat: 30.9010, lng: 75.8573, zoom: 11 },
      { name: 'Sangrur', nameHindi: 'संगरूर', lat: 30.2458, lng: 75.8420, zoom: 11 },
      { name: 'Moga', nameHindi: 'मोगा', lat: 30.8165, lng: 75.1717, zoom: 11 }
    ]
  }
};

const INITIAL_NODES = [
  // ─── Delhi NCR ───────────────────────────────────────────────────────────
  { nodeId: 'FACTORY-DL-01',   name: 'Mother Dairy Patparganj Central Processing Plant', type: 'PLANT',           district: 'East Delhi (Patparganj Plant)',    state: 'Delhi NCR', coordinates: { lat: 28.6280, lng: 77.3000 } },
  { nodeId: 'TERMINAL-DL-02',  name: 'Amul Okhla Dairy Terminal #2',                     type: 'TERMINAL',        district: 'South Delhi (Okhla Terminal)',     state: 'Delhi NCR', coordinates: { lat: 28.5355, lng: 77.2680 } },
  { nodeId: 'GATE-DL-03',      name: 'Alipur Highway Toll Inspection Gate (NH-44)',       type: 'INSPECTION_GATE', district: 'North West Delhi (Alipur Gate)',   state: 'Delhi NCR', coordinates: { lat: 28.8105, lng: 77.1332 } },
  { nodeId: 'HUB-DL-04',      name: 'Dwarka Cold Storage Distribution Hub',              type: 'MCC',             district: 'West Delhi (Dwarka Distribution)', state: 'Delhi NCR', coordinates: { lat: 28.5921, lng: 77.0460 } },

  // ─── Haryana: Karnal ─────────────────────────────────────────────────────
  { nodeId: 'VLC-KNL-01',     name: 'Nissing Village Liquid Collection Center',          type: 'VLC',             district: 'Karnal', state: 'Haryana', coordinates: { lat: 29.8251, lng: 76.8258 } },
  { nodeId: 'VLC-KNL-02',     name: 'Gharaunda Cooperative Milk Society',                type: 'VLC',             district: 'Karnal', state: 'Haryana', coordinates: { lat: 29.5347, lng: 76.9760 } },
  { nodeId: 'VLC-KNL-03',     name: 'Indri Village Milk Collection Point',               type: 'VLC',             district: 'Karnal', state: 'Haryana', coordinates: { lat: 29.8456, lng: 77.1698 } },
  { nodeId: 'MCC-KNL-01',     name: 'Karnal Central Milk Chilling Center (NDDB)',        type: 'MCC',             district: 'Karnal', state: 'Haryana', coordinates: { lat: 29.6857, lng: 76.9905 } },
  { nodeId: 'PLANT-KNL-01',   name: 'HAFED Karnal Dairy Processing Plant',               type: 'PLANT',           district: 'Karnal', state: 'Haryana', coordinates: { lat: 29.7100, lng: 76.9700 } },
  { nodeId: 'GATE-KNL-01',    name: 'Karnal NH-44 Interstate Milk Entry Gate',           type: 'INSPECTION_GATE', district: 'Karnal', state: 'Haryana', coordinates: { lat: 29.7400, lng: 77.0200 } },

  // ─── Haryana: Kaithal ────────────────────────────────────────────────────
  { nodeId: 'MCC-KTL-01',     name: 'Kaithal Milk Chilling Center Gate #4',              type: 'MCC',             district: 'Kaithal', state: 'Haryana', coordinates: { lat: 29.8015, lng: 76.3996 } },
  { nodeId: 'VLC-KTL-01',     name: 'Pundri VLC — Smallholder Cooperative #3',           type: 'VLC',             district: 'Kaithal', state: 'Haryana', coordinates: { lat: 29.7662, lng: 76.5620 } },
  { nodeId: 'VLC-KTL-02',     name: 'Siwan Village Milk Collection Society',             type: 'VLC',             district: 'Kaithal', state: 'Haryana', coordinates: { lat: 29.8767, lng: 76.3290 } },
  { nodeId: 'TERMINAL-KTL-01',name: 'Kaithal Bulk Milk Cooler Terminal BMC-9',           type: 'TERMINAL',        district: 'Kaithal', state: 'Haryana', coordinates: { lat: 29.7900, lng: 76.4100 } },

  // ─── Haryana: Hisar ──────────────────────────────────────────────────────
  { nodeId: 'VLC-HSR-01',     name: 'Hisar Dairy Cooperative — Adampur Block',           type: 'VLC',             district: 'Hisar', state: 'Haryana', coordinates: { lat: 29.1492, lng: 75.7217 } },
  { nodeId: 'VLC-HSR-02',     name: 'Uklana VLC — Murrah Buffalo Cluster',               type: 'VLC',             district: 'Hisar', state: 'Haryana', coordinates: { lat: 29.2200, lng: 75.9100 } },
  { nodeId: 'VLC-HSR-03',     name: 'Barwala Panchayat Milk Collection Society',         type: 'VLC',             district: 'Hisar', state: 'Haryana', coordinates: { lat: 29.3960, lng: 75.8980 } },
  { nodeId: 'MCC-HSR-01',     name: 'Hisar District MCC — Ludhana Road',                 type: 'MCC',             district: 'Hisar', state: 'Haryana', coordinates: { lat: 29.1700, lng: 75.7400 } },
  { nodeId: 'PLANT-HSR-01',   name: 'Vita Hisar Dairy Plant (HCMSC)',                    type: 'PLANT',           district: 'Hisar', state: 'Haryana', coordinates: { lat: 29.1600, lng: 75.7100 } },
  { nodeId: 'GATE-HSR-01',    name: 'Hisar Bypass NH-09 Tanker Inspection Gate',         type: 'INSPECTION_GATE', district: 'Hisar', state: 'Haryana', coordinates: { lat: 29.1000, lng: 75.6800 } },

  // ─── Haryana: Sonepat ────────────────────────────────────────────────────
  { nodeId: 'DC-SNP-01',      name: 'Sonepat Processing Plant (NH-44 Feeder)',            type: 'PLANT',           district: 'Sonepat', state: 'Haryana', coordinates: { lat: 28.9931, lng: 77.0151 } },
  { nodeId: 'VLC-SNP-01',     name: 'Gohana VLC — Jat Farmer Collective',                type: 'VLC',             district: 'Sonepat', state: 'Haryana', coordinates: { lat: 29.1430, lng: 76.7013 } },
  { nodeId: 'MCC-SNP-01',     name: 'Kundli Industrial MCC (Delhi Border)',               type: 'MCC',             district: 'Sonepat', state: 'Haryana', coordinates: { lat: 28.8600, lng: 77.1200 } },

  // ─── Haryana: Ambala ─────────────────────────────────────────────────────
  { nodeId: 'VLC-ABL-01',     name: 'Mullana Agricultural VLC — Ambala Cantt',           type: 'VLC',             district: 'Ambala', state: 'Haryana', coordinates: { lat: 30.3200, lng: 76.7500 } },
  { nodeId: 'MCC-ABL-01',     name: 'Ambala City Milk Chilling Depot (NDDB-GRID)',       type: 'MCC',             district: 'Ambala', state: 'Haryana', coordinates: { lat: 30.3782, lng: 76.7767 } },
  { nodeId: 'GATE-ABL-01',    name: 'Ambala NH-44 Checkpost — Punjab-HR Border',         type: 'INSPECTION_GATE', district: 'Ambala', state: 'Haryana', coordinates: { lat: 30.4200, lng: 76.7900 } },

  // ─── Haryana: Rohtak ─────────────────────────────────────────────────────
  { nodeId: 'VLC-RTK-01',     name: 'Maham VLC — Sahiwal Breed Cluster',                 type: 'VLC',             district: 'Rohtak', state: 'Haryana', coordinates: { lat: 28.9671, lng: 76.3085 } },
  { nodeId: 'MCC-RTK-01',     name: 'Rohtak District Milk Chilling Plant (HAFED)',       type: 'MCC',             district: 'Rohtak', state: 'Haryana', coordinates: { lat: 28.8955, lng: 76.6066 } },

  // ─── Haryana: Panipat ────────────────────────────────────────────────────
  { nodeId: 'VLC-PNP-01',     name: 'Samalkha VLC — Panipat Dairy Collective',           type: 'VLC',             district: 'Panipat', state: 'Haryana', coordinates: { lat: 29.2300, lng: 76.9400 } },
  { nodeId: 'MCC-PNP-01',     name: 'Panipat Refinery Road MCC',                         type: 'MCC',             district: 'Panipat', state: 'Haryana', coordinates: { lat: 29.3909, lng: 76.9635 } },

  // ─── Haryana: Kurukshetra ────────────────────────────────────────────────
  { nodeId: 'VLC-KKR-01',     name: 'Thanesar VLC — Kurukshetra Heritage Collective',    type: 'VLC',             district: 'Kurukshetra', state: 'Haryana', coordinates: { lat: 29.9695, lng: 76.8783 } },
  { nodeId: 'MCC-KKR-01',     name: 'Pipli MCC — NH-44 Express Dairy Corridor',          type: 'MCC',             district: 'Kurukshetra', state: 'Haryana', coordinates: { lat: 29.8900, lng: 76.8400 } },
  { nodeId: 'VLC-KKR-02',     name: 'Shahbad Markanda Milk Collection Point',            type: 'VLC',             district: 'Kurukshetra', state: 'Haryana', coordinates: { lat: 30.1700, lng: 76.9100 } },

  // ─── Haryana: Sirsa ──────────────────────────────────────────────────────
  { nodeId: 'VLC-SRS-01',     name: 'Ellenabad VLC — Desert Fringe Cattle Cluster',      type: 'VLC',             district: 'Sirsa', state: 'Haryana', coordinates: { lat: 29.4512, lng: 74.6600 } },
  { nodeId: 'MCC-SRS-01',     name: 'Sirsa District MCC — Rajasthan Corridor',           type: 'MCC',             district: 'Sirsa', state: 'Haryana', coordinates: { lat: 29.5333, lng: 75.0167 } },
  { nodeId: 'GATE-SRS-01',    name: 'Sirsa NH-709 Rajasthan Border Tanker Gate',         type: 'INSPECTION_GATE', district: 'Sirsa', state: 'Haryana', coordinates: { lat: 29.5500, lng: 74.9500 } },

  // ─── Haryana: Fatehabad ──────────────────────────────────────────────────
  { nodeId: 'VLC-FTB-01',     name: 'Fatehabad Ratia Block VLC — Gir Cow Collective',    type: 'VLC',             district: 'Fatehabad', state: 'Haryana', coordinates: { lat: 29.5200, lng: 75.5700 } },
  { nodeId: 'MCC-FTB-01',     name: 'Tohana MCC — Fatehabad District Hub',               type: 'MCC',             district: 'Fatehabad', state: 'Haryana', coordinates: { lat: 29.6833, lng: 75.9000 } },

  // ─── Haryana: Jind ───────────────────────────────────────────────────────
  { nodeId: 'VLC-JND-01',     name: 'Safidon VLC — Jat Livestock Cooperative',           type: 'VLC',             district: 'Jind', state: 'Haryana', coordinates: { lat: 29.4017, lng: 76.6678 } },
  { nodeId: 'MCC-JND-01',     name: 'Jind District Milk Pooling Terminal',               type: 'MCC',             district: 'Jind', state: 'Haryana', coordinates: { lat: 29.3167, lng: 76.3167 } },

  // ─── Haryana: Bhiwani ────────────────────────────────────────────────────
  { nodeId: 'VLC-BHW-01',     name: 'Loharu VLC — Bhiwani Border Milk Station',          type: 'VLC',             district: 'Bhiwani', state: 'Haryana', coordinates: { lat: 28.4400, lng: 75.8000 } },
  { nodeId: 'MCC-BHW-01',     name: 'Bhiwani District Chilling Center (HCMSC)',          type: 'MCC',             district: 'Bhiwani', state: 'Haryana', coordinates: { lat: 28.7833, lng: 76.1333 } },

  // ─── Haryana: Gurugram ───────────────────────────────────────────────────
  { nodeId: 'TERMINAL-GGN-01',name: 'Manesar Amul Milk Distribution Terminal',           type: 'TERMINAL',        district: 'Gurugram', state: 'Haryana', coordinates: { lat: 28.3590, lng: 76.9378 } },
  { nodeId: 'MCC-GGN-01',     name: 'Pataudi MCC — Gurugram Rural Dairy Hub',            type: 'MCC',             district: 'Gurugram', state: 'Haryana', coordinates: { lat: 28.3200, lng: 76.7800 } },

  // ─── Haryana: Yamunanagar ────────────────────────────────────────────────
  { nodeId: 'VLC-YNR-01',     name: 'Chhachhrauli VLC — Yamuna Basin Collective',        type: 'VLC',             district: 'Yamunanagar', state: 'Haryana', coordinates: { lat: 30.2400, lng: 77.3500 } },
  { nodeId: 'PLANT-YNR-01',   name: 'Yamunanagar Dairy & Food Processing Unit',          type: 'PLANT',           district: 'Yamunanagar', state: 'Haryana', coordinates: { lat: 30.1290, lng: 77.2674 } },

  // ─── Haryana: Panchkula ──────────────────────────────────────────────────
  { nodeId: 'MCC-PKL-01',     name: 'Panchkula Industrial Zone MCC — Sector 21',         type: 'MCC',             district: 'Panchkula', state: 'Haryana', coordinates: { lat: 30.6942, lng: 76.8606 } },

  // ─── Haryana: Jhajjar ────────────────────────────────────────────────────
  { nodeId: 'VLC-JJR-01',     name: 'Bahadurgarh VLC — Jhajjar Cooperative Ring',        type: 'VLC',             district: 'Jhajjar', state: 'Haryana', coordinates: { lat: 28.6938, lng: 76.9257 } },
  { nodeId: 'MCC-JJR-01',     name: 'Jhajjar HCMSC Chilling Depot (NH-148B)',            type: 'MCC',             district: 'Jhajjar', state: 'Haryana', coordinates: { lat: 28.6069, lng: 76.6559 } },
];


const INITIAL_FARMERS = [
  // Karnal
  { farmerId: '201410000123', name: 'Ramesh Kumar',       ndlmTag: '840003129940112', animalBreed: 'Murrah Buffalo', registeredCows: 4,  district: 'Karnal',      state: 'Haryana', nodeId: 'VLC-KNL-01', purityScore: 87 },
  { farmerId: '201410000124', name: 'Sunita Devi',        ndlmTag: '840003129940113', animalBreed: 'Sahiwal Cow',    registeredCows: 2,  district: 'Karnal',      state: 'Haryana', nodeId: 'VLC-KNL-02', purityScore: 92 },
  { farmerId: '201410000125', name: 'Sukhwinder Singh',   ndlmTag: '840003129940114', animalBreed: 'Gir Cow',        registeredCows: 5,  district: 'Karnal',      state: 'Haryana', nodeId: 'VLC-KNL-03', purityScore: 95 },
  { farmerId: '201410000126', name: 'Harbhajan Malik',    ndlmTag: '840003129940115', animalBreed: 'Murrah Buffalo', registeredCows: 7,  district: 'Karnal',      state: 'Haryana', nodeId: 'VLC-KNL-01', purityScore: 83 },
  // Kaithal
  { farmerId: '201410000127', name: 'Rajwinder Kaur',     ndlmTag: '840003129940116', animalBreed: 'Sahiwal Cow',    registeredCows: 3,  district: 'Kaithal',     state: 'Haryana', nodeId: 'VLC-KTL-01', purityScore: 89 },
  { farmerId: '201410000128', name: 'Balwant Yadav',      ndlmTag: '840003129940117', animalBreed: 'Murrah Buffalo', registeredCows: 6,  district: 'Kaithal',     state: 'Haryana', nodeId: 'VLC-KTL-02', purityScore: 76 },
  { farmerId: '201410000129', name: 'Kamla Devi',         ndlmTag: '840003129940118', animalBreed: 'HF Cross',       registeredCows: 4,  district: 'Kaithal',     state: 'Haryana', nodeId: 'VLC-KTL-01', purityScore: 91 },
  // Hisar
  { farmerId: '201410000130', name: 'Dharambir Saini',    ndlmTag: '840003129940119', animalBreed: 'Murrah Buffalo', registeredCows: 8,  district: 'Hisar',       state: 'Haryana', nodeId: 'VLC-HSR-01', purityScore: 81 },
  { farmerId: '201410000131', name: 'Promila Rani',       ndlmTag: '840003129940120', animalBreed: 'Gir Cow',        registeredCows: 3,  district: 'Hisar',       state: 'Haryana', nodeId: 'VLC-HSR-02', purityScore: 94 },
  { farmerId: '201410000132', name: 'Jasbir Singh Rangi', ndlmTag: '840003129940121', animalBreed: 'Sahiwal Cow',    registeredCows: 5,  district: 'Hisar',       state: 'Haryana', nodeId: 'VLC-HSR-01', purityScore: 72 },
  // Sonepat
  { farmerId: '201410000133', name: 'Mahesh Tyagi',       ndlmTag: '840003129940122', animalBreed: 'HF Cross',       registeredCows: 6,  district: 'Sonepat',     state: 'Haryana', nodeId: 'VLC-SNP-01', purityScore: 88 },
  { farmerId: '201410000134', name: 'Rekha Jatain',       ndlmTag: '840003129940123', animalBreed: 'Murrah Buffalo', registeredCows: 4,  district: 'Sonepat',     state: 'Haryana', nodeId: 'VLC-SNP-01', purityScore: 79 },
  // Ambala
  { farmerId: '201410000135', name: 'Kulwant Beniwal',    ndlmTag: '840003129940124', animalBreed: 'Sahiwal Cow',    registeredCows: 7,  district: 'Ambala',      state: 'Haryana', nodeId: 'VLC-ABL-01', purityScore: 93 },
  // Sirsa
  { farmerId: '201410000136', name: 'Omkar Bishnoi',      ndlmTag: '840003129940125', animalBreed: 'Tharparkar',     registeredCows: 9,  district: 'Sirsa',       state: 'Haryana', nodeId: 'VLC-SRS-01', purityScore: 97 },
  { farmerId: '201410000137', name: 'Usha Rani Dahiya',   ndlmTag: '840003129940126', animalBreed: 'Rathi Cow',      registeredCows: 5,  district: 'Sirsa',       state: 'Haryana', nodeId: 'VLC-SRS-01', purityScore: 85 },
  // Jind
  { farmerId: '201410000138', name: 'Narender Hooda',     ndlmTag: '840003129940127', animalBreed: 'Murrah Buffalo', registeredCows: 11, district: 'Jind',        state: 'Haryana', nodeId: 'VLC-JND-01', purityScore: 78 },
  // Bhiwani
  { farmerId: '201410000139', name: 'Sushila Jakhar',     ndlmTag: '840003129940128', animalBreed: 'Sahiwal Cow',    registeredCows: 4,  district: 'Bhiwani',     state: 'Haryana', nodeId: 'VLC-BHW-01', purityScore: 90 },
  // Fatehabad
  { farmerId: '201410000140', name: 'Rajpal Siwach',      ndlmTag: '840003129940129', animalBreed: 'Gir Cow',        registeredCows: 6,  district: 'Fatehabad',   state: 'Haryana', nodeId: 'VLC-FTB-01', purityScore: 96 },
  { farmerId: '201410000141', name: 'Babita Sheoran',     ndlmTag: '840003129940130', animalBreed: 'Murrah Buffalo', registeredCows: 3,  district: 'Fatehabad',   state: 'Haryana', nodeId: 'VLC-FTB-01', purityScore: 83 },
  // Yamunanagar
  { farmerId: '201410000142', name: 'Yashpal Rana',       ndlmTag: '840003129940131', animalBreed: 'HF Cross',       registeredCows: 8,  district: 'Yamunanagar', state: 'Haryana', nodeId: 'VLC-YNR-01', purityScore: 88 },
];

const INITIAL_POUR_EVENTS = [
  { eventId: 'PE-20260831-001', farmerId: '201410000123', farmerName: 'Ramesh Kumar',       nodeId: 'VLC-KNL-01', timestamp: '2026-08-31T06:30:00Z', weightKg: 8.5,  fatPercent: 4.2, snfPercent: 8.7, payoutINR: 382.50, yieldStatus: 'PASS',    receiptHash: 'sha256:7d2b9af8103c31ff78201a44eef938101a44' },
  { eventId: 'PE-20260831-002', farmerId: '201410000124', farmerName: 'Sunita Devi',        nodeId: 'VLC-KNL-02', timestamp: '2026-08-31T06:42:00Z', weightKg: 6.2,  fatPercent: 4.5, snfPercent: 8.9, payoutINR: 297.60, yieldStatus: 'PASS',    receiptHash: 'sha256:8e3c0bf9114d42aa89312b55ff012b55' },
  { eventId: 'PE-20260831-003', farmerId: '201410000126', farmerName: 'Harbhajan Malik',    nodeId: 'VLC-KNL-01', timestamp: '2026-08-31T06:55:00Z', weightKg: 12.0, fatPercent: 4.8, snfPercent: 9.1, payoutINR: 540.00, yieldStatus: 'PASS',    receiptHash: 'sha256:4f1a2c3d9e8b7f6a5c4d3e2f1a0b9c8d' },
  { eventId: 'PE-20260831-004', farmerId: '201410000127', farmerName: 'Rajwinder Kaur',     nodeId: 'VLC-KTL-01', timestamp: '2026-08-31T07:10:00Z', weightKg: 7.8,  fatPercent: 4.1, snfPercent: 8.6, payoutINR: 351.00, yieldStatus: 'PASS',    receiptHash: 'sha256:5a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d' },
  { eventId: 'PE-20260831-005', farmerId: '201410000128', farmerName: 'Balwant Yadav',      nodeId: 'VLC-KTL-02', timestamp: '2026-08-31T07:22:00Z', weightKg: 9.4,  fatPercent: 3.2, snfPercent: 7.1, payoutINR: 423.00, yieldStatus: 'FLAG',    receiptHash: 'sha256:6b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e' },
  { eventId: 'PE-20260831-006', farmerId: '201410000130', farmerName: 'Dharambir Saini',    nodeId: 'VLC-HSR-01', timestamp: '2026-08-31T07:35:00Z', weightKg: 14.2, fatPercent: 4.9, snfPercent: 9.2, payoutINR: 639.00, yieldStatus: 'PASS',    receiptHash: 'sha256:7c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f' },
  { eventId: 'PE-20260831-007', farmerId: '201410000131', farmerName: 'Promila Rani',       nodeId: 'VLC-HSR-02', timestamp: '2026-08-31T07:48:00Z', weightKg: 5.6,  fatPercent: 5.1, snfPercent: 9.5, payoutINR: 252.00, yieldStatus: 'PASS',    receiptHash: 'sha256:8d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a' },
  { eventId: 'PE-20260831-008', farmerId: '201410000132', farmerName: 'Jasbir Singh Rangi', nodeId: 'VLC-HSR-01', timestamp: '2026-08-31T07:55:00Z', weightKg: 22.8, fatPercent: 4.0, snfPercent: 8.5, payoutINR: 1026.00,yieldStatus: 'FLAG',    receiptHash: 'sha256:9e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b' },
  { eventId: 'PE-20260831-009', farmerId: '201410000133', farmerName: 'Mahesh Tyagi',       nodeId: 'VLC-SNP-01', timestamp: '2026-08-31T08:05:00Z', weightKg: 10.1, fatPercent: 4.4, snfPercent: 8.8, payoutINR: 454.50, yieldStatus: 'PASS',    receiptHash: 'sha256:af7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c' },
  { eventId: 'PE-20260831-010', farmerId: '201410000136', farmerName: 'Omkar Bishnoi',      nodeId: 'VLC-SRS-01', timestamp: '2026-08-31T08:18:00Z', weightKg: 18.4, fatPercent: 5.2, snfPercent: 9.7, payoutINR: 828.00, yieldStatus: 'PASS',    receiptHash: 'sha256:b08b9c0d1e2f3a4b5c6d7e8f9a0b1c2d' },
  { eventId: 'PE-20260831-011', farmerId: '201410000138', farmerName: 'Narender Hooda',     nodeId: 'VLC-JND-01', timestamp: '2026-08-31T08:30:00Z', weightKg: 20.5, fatPercent: 3.1, snfPercent: 7.0, payoutINR: 922.50, yieldStatus: 'FLAG',    receiptHash: 'sha256:c19c0d1e2f3a4b5c6d7e8f9a0b1c2d3e' },
  { eventId: 'PE-20260831-012', farmerId: '201410000140', farmerName: 'Rajpal Siwach',      nodeId: 'VLC-FTB-01', timestamp: '2026-08-31T08:45:00Z', weightKg: 11.3, fatPercent: 5.4, snfPercent: 9.8, payoutINR: 508.50, yieldStatus: 'PASS',    receiptHash: 'sha256:d2ad1e2f3a4b5c6d7e8f9a0b1c2d3e4f' },
];

// Deterministic synthetic records keep the prototype map useful for demos
// while making it explicit that these are not live government records.
const DEMO_FARMER_NAMES = ['Amit Kumar', 'Geeta Rani', 'Mohan Lal', 'Kavita Devi', 'Rohit Saini', 'Neelam Kaur', 'Dinesh Yadav', 'Poonam Sharma', 'Vikas Malik', 'Seema Rathi'];
const DEMO_BREEDS = ['Murrah Buffalo', 'Sahiwal Cow', 'Gir Cow', 'HF Cross', 'Tharparkar', 'Rathi Cow'];
const hashNumber = (seed, min, max) => min + ((seed * 9301 + 49297) % 233280) / 233280 * (max - min);
const COLLECTION_NODES = INITIAL_NODES.filter(node => node.type === 'VLC');
const GENERATED_FARMERS = Array.from({ length: 120 }, (_, index) => {
  const node = COLLECTION_NODES[index % COLLECTION_NODES.length];
  const seed = index + 17;
  const farmerId = `20141000${String(200 + index).padStart(4, '0')}`;
  return {
    farmerId,
    name: `${DEMO_FARMER_NAMES[index % DEMO_FARMER_NAMES.length]} ${node.district.split(' ')[0]}`,
    ndlmTag: `84000313${String(299500 + index).padStart(7, '0')}`,
    animalBreed: DEMO_BREEDS[index % DEMO_BREEDS.length],
    registeredCows: 2 + (index % 10),
    district: node.district,
    state: node.state,
    nodeId: node.nodeId,
    village: `${node.district.split(' ')[0]} ${['East', 'West', 'Central', 'Kalan'][index % 4]}`,
    purityScore: Math.round(hashNumber(seed, 78, 99)),
    farmAreaAcres: +(hashNumber(seed + 4, 2.5, 18).toFixed(1)),
    phone: `+91 98${String(10000000 + index * 7919).slice(0, 8)}`,
    registrationStatus: index % 17 === 0 ? 'FIELD_VERIFICATION_PENDING' : 'VERIFIED'
  };
});
const DEMO_FARMERS = [...INITIAL_FARMERS, ...GENERATED_FARMERS];
const GENERATED_POUR_EVENTS = Array.from({ length: 360 }, (_, index) => {
  const farmer = DEMO_FARMERS[index % DEMO_FARMERS.length];
  const seed = index + 31;
  const weightKg = +hashNumber(seed, 4.8, 15.8).toFixed(1);
  const fatPercent = +hashNumber(seed + 2, 3.5, farmer.animalBreed === 'Murrah Buffalo' ? 8.1 : 5.7).toFixed(1);
  const snfPercent = +hashNumber(seed + 5, 8.1, 9.7).toFixed(1);
  const flagged = index % 29 === 0 || index % 47 === 0;
  return {
    eventId: `PE-DEMO-${String(index + 1).padStart(4, '0')}`,
    farmerId: farmer.farmerId,
    farmerName: farmer.name,
    nodeId: farmer.nodeId,
    timestamp: new Date(Date.UTC(2026, 8, 13, 5 + (index % 6), index % 60)).toISOString(),
    weightKg: flagged ? +(weightKg + 6.2).toFixed(1) : weightKg,
    fatPercent: flagged ? +(fatPercent - 1.1).toFixed(1) : fatPercent,
    snfPercent: flagged ? +(snfPercent - 0.8).toFixed(1) : snfPercent,
    payoutINR: +(weightKg * 45).toFixed(2),
    yieldStatus: flagged ? 'FLAG' : 'PASS',
    source: 'DEMO_DATASET',
    receiptHash: `sha256:demo${String(index + 1).padStart(56, '0')}`
  };
});
const DEMO_POUR_EVENTS = [...INITIAL_POUR_EVENTS, ...GENERATED_POUR_EVENTS];
const DEMO_NODES = INITIAL_NODES.map((node, index) => {
  const nodeFarmers = DEMO_FARMERS.filter(farmer => farmer.nodeId === node.nodeId);
  const nodeLogs = DEMO_POUR_EVENTS.filter(log => log.nodeId === node.nodeId);
  return {
    ...node,
    demoData: true,
    operator: node.type === 'VLC' ? 'Village Dairy Cooperative' : node.type === 'MCC' ? 'NDDB / State Dairy Network' : 'Anveshana Compliance Network',
    contactPhone: `+91 1800 ${String(2100 + index).padStart(4, '0')}`,
    registeredFarmers: nodeFarmers.length,
    registeredCattle: nodeFarmers.reduce((total, farmer) => total + farmer.registeredCows, 0),
    dailyVolumeLitres: Math.round(nodeLogs.reduce((total, log) => total + log.weightKg, 0) * 1.08),
    storageCapacityLitres: node.type === 'VLC' ? 2500 : node.type === 'MCC' ? 12000 : 30000,
    currentTemperatureC: +(3.4 + (index % 8) * 0.12).toFixed(1),
    lastHeartbeatAt: '2026-09-13T10:14:00Z',
    connectivity: index % 13 === 0 ? 'DEGRADED' : 'ONLINE'
  };
});

const INITIAL_BATCHES = [
  { batchId: 'BATCH-20260831-TN401', tankerRegistration: 'HR-07-GA-5541', dispatchNodeId: 'VLC-KNL-01', destinationNodeId: 'MCC-KTL-01',  dispatchVolumeL: 4820, receivedVolumeL: 5147, volumeDeltaPercent: 6.8,  batchStatus: 'IN_TRANSIT',   anomalyScore: 92, temperatureLog: [3.8, 3.9, 4.1, 3.8], dispatchTimestamp: '2026-08-31T07:15:00Z' },
  { batchId: 'BATCH-20260831-TN402', tankerRegistration: 'HR-08-B-9912', dispatchNodeId: 'VLC-KNL-02', destinationNodeId: 'MCC-KNL-01',  dispatchVolumeL: 3200, receivedVolumeL: 3206, volumeDeltaPercent: 0.18, batchStatus: 'ARRIVED',      anomalyScore: 12, temperatureLog: [3.5, 3.6, 3.7, 3.6], dispatchTimestamp: '2026-08-31T07:45:00Z' },
  { batchId: 'BATCH-20260831-TN403', tankerRegistration: 'HR-09-C-1122', dispatchNodeId: 'VLC-HSR-01', destinationNodeId: 'PLANT-HSR-01', dispatchVolumeL: 5600, receivedVolumeL: 5608, volumeDeltaPercent: 0.14, batchStatus: 'PASSED',       anomalyScore: 8,  temperatureLog: [3.6, 3.7, 3.7, 3.8], dispatchTimestamp: '2026-08-31T06:00:00Z' },
  { batchId: 'BATCH-20260831-TN404', tankerRegistration: 'HR-10-AA-4412',dispatchNodeId: 'VLC-SRS-01', destinationNodeId: 'MCC-SRS-01',  dispatchVolumeL: 3800, receivedVolumeL: 3802, volumeDeltaPercent: 0.05, batchStatus: 'QUARANTINED',  anomalyScore: 88, temperatureLog: [4.0, 7.2, 11.4, 9.8], dispatchTimestamp: '2026-09-01T09:30:00Z' },
  { batchId: 'BATCH-20260831-TN405', tankerRegistration: 'HR-11-BC-7720',dispatchNodeId: 'VLC-KTL-01', destinationNodeId: 'TERMINAL-KTL-01',dispatchVolumeL: 2900, receivedVolumeL: 2900, volumeDeltaPercent: 0.00, batchStatus: 'QUARANTINED',  anomalyScore: 78, temperatureLog: [3.5, 3.5, 3.6, 3.5], dispatchTimestamp: '2026-08-30T14:00:00Z' },
  { batchId: 'BATCH-20260901-TN501', tankerRegistration: 'HR-12-DE-3301',dispatchNodeId: 'VLC-ABL-01', destinationNodeId: 'MCC-ABL-01',  dispatchVolumeL: 4100, receivedVolumeL: 4103, volumeDeltaPercent: 0.07, batchStatus: 'ARRIVED',      anomalyScore: 15, temperatureLog: [3.7, 3.8, 3.8, 3.9], dispatchTimestamp: '2026-09-01T05:00:00Z' },
  { batchId: 'BATCH-20260901-TN502', tankerRegistration: 'HR-13-FG-5500',dispatchNodeId: 'VLC-KNL-02', destinationNodeId: 'MCC-PNP-01',  dispatchVolumeL: 3980, receivedVolumeL: 4265, volumeDeltaPercent: 7.2,  batchStatus: 'IN_TRANSIT',   anomalyScore: 61, temperatureLog: [3.6, 3.9, 4.2, 4.0], dispatchTimestamp: '2026-09-01T11:00:00Z' },
  { batchId: 'BATCH-20260901-TN503', tankerRegistration: 'HR-14-GH-7700',dispatchNodeId: 'VLC-KKR-01', destinationNodeId: 'MCC-KKR-01',  dispatchVolumeL: 5200, receivedVolumeL: 5196, volumeDeltaPercent: 0.08, batchStatus: 'PASSED',       anomalyScore: 6,  temperatureLog: [3.5, 3.5, 3.6, 3.5], dispatchTimestamp: '2026-09-01T04:00:00Z' },
  { batchId: 'BATCH-20260901-TN504', tankerRegistration: 'HR-05-ZZ-9981',dispatchNodeId: 'VLC-HSR-03', destinationNodeId: 'GATE-HSR-01', dispatchVolumeL: 4400, receivedVolumeL: 4400, volumeDeltaPercent: 0.00, batchStatus: 'QUARANTINED',  anomalyScore: 96, temperatureLog: [3.8, 3.8, 3.9, 3.8], dispatchTimestamp: '2026-09-01T02:00:00Z' },
  { batchId: 'BATCH-20260901-TN505', tankerRegistration: 'HR-15-JK-8820',dispatchNodeId: 'VLC-RTK-01', destinationNodeId: 'MCC-RTK-01',  dispatchVolumeL: 2800, receivedVolumeL: 2798, volumeDeltaPercent: 0.07, batchStatus: 'PASSED',       anomalyScore: 9,  temperatureLog: [3.4, 3.5, 3.5, 3.6], dispatchTimestamp: '2026-09-01T06:30:00Z' },
];

const INITIAL_ANOMALIES = [
  // ─── CRITICAL (Score 80+) ─────────────────────────────────────────────────
  { anomalyId: 'ANO-2026-0901', nodeId: 'MCC-KTL-01',     nodeName: 'Kaithal MCC Gate #4',                  riskScore: 92, type: 'VOLUME_EXPANSION',      details: 'Batch TN-401: +6.8% unreconciled volume vs VLC-KNL-01 dispatch baseline. Exceeds Haryana ±1.0% max delta. Inline mass-flow sensor flagged at 08:10 IST.',          timestamp: '2026-08-31T08:10:00Z', status: 'ACTIVE_INVESTIGATION' },
  { anomalyId: 'ANO-2026-0903', nodeId: 'GATE-HSR-01',    nodeName: 'Hisar Bypass NH-09 Tanker Gate',        riskScore: 96, type: 'UNREGISTERED_TANKER',   details: 'Tanker HR-05-ZZ-9981 has no valid FSSAI dispatch receipt. NDLM tag #840003129940131 not found in Anveshana DPI registry. Suspected adulterated load intercepted at gate.', timestamp: '2026-09-01T03:22:00Z', status: 'ACTIVE_INVESTIGATION' },
  { anomalyId: 'ANO-2026-0906', nodeId: 'MCC-SRS-01',     nodeName: 'Sirsa District MCC — Rajasthan Corridor',riskScore: 88, type: 'TEMPERATURE_BREACH',    details: 'Cold chain broken: Tanker HR-10-AA-4412 sustained 11.4°C for 2h 18min (max allowed: 4°C). Aflatoxin M1 contamination risk flagged. FSSAI DO Sirsa notified.',           timestamp: '2026-09-01T11:45:00Z', status: 'ACTIVE_INVESTIGATION' },
  { anomalyId: 'ANO-2026-0909', nodeId: 'VLC-JND-01',     nodeName: 'Safidon VLC — Jat Livestock Cooperative',riskScore: 84, type: 'SNF_BELOW_THRESHOLD',   details: 'Average SNF 7.1% across 18 consecutive pours from farmer cluster (IDs 201410000138–201410000141) — below FSSAI Haryana min 8.5%. Systemic dilution pattern confirmed.', timestamp: '2026-09-01T06:45:00Z', status: 'ACTIVE_INVESTIGATION' },
  { anomalyId: 'ANO-2026-0912', nodeId: 'GATE-KNL-01',    nodeName: 'Karnal NH-44 Interstate Gate',          riskScore: 91, type: 'DUPLICATE_RECEIPT_HASH', details: 'Batch receipt sha256:7d2b9af8 submitted from two tankers (HR-07-GA-5541 and UP-85-AT-2200) within 4 minutes. Blockchain duplicate-entry attempt detected at gate scanner.', timestamp: '2026-09-02T00:12:00Z', status: 'ACTIVE_INVESTIGATION' },
  // ─── HIGH (Score 50–79) ───────────────────────────────────────────────────
  { anomalyId: 'ANO-2026-0902', nodeId: 'VLC-HSR-01',     nodeName: 'Hisar Dairy Cooperative — Adampur',     riskScore: 74, type: 'YIELD_SPIKE_CLUSTER',   details: 'Simultaneous 40% yield spike across 6 Adampur smallholders in 15-min window. IoT mass-flow disagrees with manual ledger by 22 kg. Probable water spiking pre-collection.',timestamp: '2026-08-31T07:55:00Z', status: 'ACTIVE_INVESTIGATION' },
  { anomalyId: 'ANO-2026-0904', nodeId: 'MCC-KNL-01',     nodeName: 'Karnal Central MCC (NDDB)',             riskScore: 69, type: 'FAT_GRADIENT_MISMATCH', details: 'Fat% averaged 3.2% at VLC-KNL-01 pour vs 4.7% at MCC-KNL-01 inbound scan (Batch TN-409). Delta exceeds 1.0% tolerance — cream skimming en route suspected.',         timestamp: '2026-09-01T05:30:00Z', status: 'ACTIVE_INVESTIGATION' },
  { anomalyId: 'ANO-2026-0905', nodeId: 'MCC-RTK-01',     nodeName: 'Rohtak District MCC (HAFED)',           riskScore: 65, type: 'LICENCE_EXPIRED',       details: 'FSSAI License FSSAI-HR-10019044332211 expired 2025-12-31. Node operated without valid licence for 244 days accepting milk batches. Immediate compliance audit ordered.',   timestamp: '2026-09-01T09:00:00Z', status: 'ACTIVE_INVESTIGATION' },
  { anomalyId: 'ANO-2026-0907', nodeId: 'MCC-PNP-01',     nodeName: 'Panipat Refinery Road MCC',            riskScore: 61, type: 'BATCH_RECONCILE_FAIL',  details: 'Batch TN-502: 3,980L dispatched from VLC-KNL-02, received 4,265L at MCC-PNP-01 (+7.2%). Source VLC records sealed and intact — volume expansion occurred in transit.',  timestamp: '2026-09-01T13:22:00Z', status: 'ACTIVE_INVESTIGATION' },
  { anomalyId: 'ANO-2026-0908', nodeId: 'VLC-KTL-02',     nodeName: 'Siwan VLC — Kaithal',                  riskScore: 58, type: 'NDLM_TAG_ABSENT',       details: '3 pour events from unregistered animals — NDLM tag scan returned TAG_NOT_FOUND. Station operator accepted milk bypassing mandatory NDLM validation. Traceability broken.',  timestamp: '2026-09-02T04:10:00Z', status: 'ACTIVE_INVESTIGATION' },
  { anomalyId: 'ANO-2026-0910', nodeId: 'PLANT-KNL-01',   nodeName: 'HAFED Karnal Processing Plant',         riskScore: 55, type: 'SENSOR_OFFLINE',        details: 'IoT flow-meter ESSAE-SN8834 offline for 6h 42min (02:00–08:42 IST). 4 tanker inflows during blackout have no verified volume data. Manual logs submitted — unverifiable.',timestamp: '2026-09-01T08:42:00Z', status: 'ACTIVE_INVESTIGATION' },
  { anomalyId: 'ANO-2026-0911', nodeId: 'MCC-FTB-01',     nodeName: 'Tohana MCC — Fatehabad',               riskScore: 52, type: 'LATE_SUBMISSION',       details: 'Daily compliance report 30-Aug-2026 submitted 19h late (10:45 IST vs deadline 15:00 IST). Third consecutive late submission this month. Penalty notice issued by DO Fatehabad.',timestamp: '2026-08-31T10:45:00Z', status: 'ACTIVE_INVESTIGATION' },
  // ─── DISPATCHED ───────────────────────────────────────────────────────────
  { anomalyId: 'ANO-2026-0913', nodeId: 'TERMINAL-KTL-01',nodeName: 'Kaithal BMC-9 Terminal',                riskScore: 78, type: 'CHEMICAL_ADULTERANT',   details: 'Urea detected (positive DMAB rapid test) in Tanker HR-11-BC-7720 load at BMC-9. Load quarantined. FSSAI District Flying Squad dispatched and arrived on site.',          timestamp: '2026-08-30T14:30:00Z', status: 'RAID_DISPATCHED'      },
  { anomalyId: 'ANO-2026-0914', nodeId: 'VLC-ABL-01',     nodeName: 'Mullana Agricultural VLC — Ambala',     riskScore: 83, type: 'GHOST_FARMER_POUR',     details: 'Farmer ID 201410000199 (non-existent in NDLM) poured 42.8 kg across 5 sessions. UPI payout ₹1,926 already triggered. Identity fraud confirmed. Investigation complete.',  timestamp: '2026-08-29T09:20:00Z', status: 'RAID_DISPATCHED'      },
];

const INITIAL_RISK_ANOMALIES = [
  {
    anomalyId: 'RISK-DEMO-001',
    observationId: 'OBS-DEMO-001',
    farmerId: '201410000128',
    animalId: 'NDLM-840003129940117',
    farmId: '201410000128',
    village: 'Siwan',
    district: 'Kaithal',
    nodeId: 'VLC-KTL-02',
    tankerRegistration: 'HR-07-GA-5541',
    chillingCenterId: 'MCC-KTL-01',
    type: 'SUSPICIOUS_CONSISTENCY,BREED_DEVIATION',
    riskScore: 68,
    provisionalPoints: 68,
    permanentPoints: 0,
    status: 'PROVISIONAL',
    detectedAt: '2026-09-01T07:22:00Z',
    evidence: [
      { code: 'SUSPICIOUS_CONSISTENCY', label: 'Fat/SNF consistency check failed', details: 'Fat 3.2% and SNF 7.1% are inconsistent for the registered breed.' },
      { code: 'PURITY_SUPPORTING_SIGNAL', label: 'Low purity score (supporting signal only)', details: 'Purity 76/100 is only a capped supporting modifier.' }
    ]
  }
];

// Officer Administrative Hierarchy Directory
export const OFFICER_HIERARCHY = {
  NATIONAL_DIRECTOR: {
    level: 'NATIONAL_DIRECTOR',
    title: 'FSSAI National Director / CEO (Central HQ)',
    titleHindi: 'एफएसएसएआई राष्ट्रीय निदेशक / मुख्य कार्यकारी',
    scopeType: 'NATIONAL',
    badge: 'FSSAI-HQ-001',
    description: 'Full National Oversight — All States, Highway Corridors & Interstate Gates'
  },
  STATE_COMMISSIONER: {
    level: 'STATE_COMMISSIONER',
    title: 'State Food Safety Commissioner (IAS)',
    titleHindi: 'राज्य खाद्य सुरक्षा आयुक्त',
    scopeType: 'STATE',
    badge: 'STATE-COMM-01',
    description: 'State-wide Jurisdiction — All Districts, Chilling Centers & Dairies in State'
  },
  DISTRICT_MAGISTRATE: {
    level: 'DISTRICT_MAGISTRATE',
    title: 'District Magistrate / Designated Officer (DO)',
    titleHindi: 'जिला मजिस्ट्रेट / नामंकित अधिकारी',
    scopeType: 'DISTRICT',
    badge: 'DM-DO-001',
    description: 'District Jurisdiction — Strict Filtering to Assigned District Nodes Only'
  },
  FOOD_SAFETY_OFFICER: {
    level: 'FOOD_SAFETY_OFFICER',
    title: 'Food Safety Officer (FSO - Root Inspector)',
    titleHindi: 'खाद्य सुरक्षा अधिकारी (एफएसओ)',
    scopeType: 'NODE',
    badge: 'FSO-BLOCK-01',
    description: 'Root Block Level — Restricted to Assigned Local Chilling Center / Plant Only'
  }
};

// Valid Registered ID Directory for Role Gatekeeper
export const REGISTERED_ID_DIRECTORY = {
  FARMER: [
    { id: '201410000123', name: 'Ramesh Kumar (Nissing)', tag: '840003129940112' },
    { id: '201410000124', name: 'Sunita Devi (Nissing)', tag: '840003129940113' },
    { id: '201410000125', name: 'Sukhwinder Singh (Hisar)', tag: '840003129940114' }
  ],
  AGGREGATOR: [
    { id: 'AGG-VLC-22', name: 'Nissing Village AMCU Station', tag: 'ESSAE-SN8831' },
    { id: 'AGG-VLC-77', name: 'Hisar Cooperative AMCU Station', tag: 'ESSAE-SN8832' }
  ],
  QC_OFFICER: [
    { id: 'QCO-MCC104-001', name: 'Inspector Kaithal Gate #4', tag: 'FSSAI-BADGE-9940' },
    { id: 'QCO-PLANT-02', name: 'Quality Manager Sonepat', tag: 'FSSAI-BADGE-9941' }
  ],
  GOVT_AUDITOR: [
    { id: 'FSSAI-HR-007', name: 'Auditor Mundhe (Haryana HQ)', tag: 'GOVT-DPI-KEY-2026' },
    { id: 'FSSAI-MH-012', name: 'Auditor FDA Maharashtra', tag: 'GOVT-DPI-KEY-2027' }
  ],
  CONSUMER: [
    { id: 'PUBLIC_GUEST', name: 'Public Consumer QR Guest', tag: 'PUBLIC_PASSPORT' }
  ]
};

// FSSAI License Registry — Per Node
export const LICENSE_REGISTRY = [
  { nodeId: 'FACTORY-DL-01', nodeName: 'Mother Dairy Patparganj', licenseNo: 'FSSAI-DL-10019012345678', expiryDate: '2027-03-31', status: 'COMPLIANT', lastAudit: '2026-07-15' },
  { nodeId: 'TERMINAL-DL-02', nodeName: 'Amul Okhla Terminal #2',  licenseNo: 'FSSAI-DL-10019087654321', expiryDate: '2026-09-30', status: 'EXPIRING_SOON', lastAudit: '2026-06-20' },
  { nodeId: 'GATE-DL-03',    nodeName: 'Alipur Highway Gate',      licenseNo: 'FSSAI-DL-10019011223344', expiryDate: '2027-06-30', status: 'COMPLIANT', lastAudit: '2026-08-01' },
  { nodeId: 'HUB-DL-04',    nodeName: 'Dwarka Cold Hub',          licenseNo: 'FSSAI-DL-10019044332211', expiryDate: '2025-12-31', status: 'EXPIRED',   lastAudit: '2025-11-10' },
  { nodeId: 'VLC-22',        nodeName: 'Nissing VLC (Haryana)',    licenseNo: 'FSSAI-HR-10019055667788', expiryDate: '2027-01-15', status: 'COMPLIANT', lastAudit: '2026-08-22' },
  { nodeId: 'MCC-104',       nodeName: 'Kaithal Chilling Center',  licenseNo: 'FSSAI-HR-10019099887766', expiryDate: '2026-10-01', status: 'EXPIRING_SOON', lastAudit: '2026-07-30' },
  { nodeId: 'DC-SNP-02',    nodeName: 'Sonepat Processing Plant', licenseNo: 'FSSAI-HR-10019022334455', expiryDate: '2027-05-20', status: 'COMPLIANT', lastAudit: '2026-09-01' },
];

export const BREED_PEAK_YIELDS = {
  'Murrah Buffalo': 14,
  'Sahiwal Cow': 12,
  'Gir Cow': 13,
  'HF Cross': 20,
  'Tharparkar': 11,
  'Rathi Cow': 12
};

const getSeasonalFactor = (month) => {
  if ([11, 0, 1].includes(month)) return 1.15;
  if ([3, 4, 5].includes(month)) return 0.85;
  return 1;
};

const getLactationStageFactor = (lactationDay) => {
  if (lactationDay <= 0) return 0.45;
  const woodCurve = Math.pow(lactationDay / 45, 0.12) * Math.exp(-0.003 * (lactationDay - 45));
  return Math.max(0.45, Math.min(1.15, woodCurve));
};

export function calculateDynamicYieldBound({ farmer, pourEvents, asOfDate = new Date(), strictness = 2 }) {
  const registeredCows = Math.max(1, farmer?.registeredCows || 1);
  const lactationDate = new Date(farmer?.calvingDate || '2026-02-01');
  const lactationDay = Math.max(1, Math.floor((asOfDate - lactationDate) / 86400000));
  const breedPeakYield = BREED_PEAK_YIELDS[farmer?.animalBreed] || 14;
  const seasonalFactor = getSeasonalFactor(asOfDate.getMonth());
  const recentYields = (pourEvents || [])
    .filter(event => event.farmerId === farmer?.farmerId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 7)
    .map(event => event.weightKg / registeredCows);
  const rollingMean = recentYields.length
    ? recentYields.reduce((sum, value) => sum + value, 0) / recentYields.length
    : breedPeakYield * 0.7;
  const variance = recentYields.length
    ? recentYields.reduce((sum, value) => sum + ((value - rollingMean) ** 2), 0) / recentYields.length
    : 0;
  const rollingStdDev = Math.sqrt(variance);
  const stageAdjustedBreedPeak = breedPeakYield * getLactationStageFactor(lactationDay);
  const confidenceBound = rollingMean + strictness * rollingStdDev;
  const perCowBound = Math.min(stageAdjustedBreedPeak, confidenceBound) * seasonalFactor;

  return {
    lactationDay,
    breedPeakYield,
    stageAdjustedBreedPeak: +stageAdjustedBreedPeak.toFixed(2),
    rollingMean: +rollingMean.toFixed(2),
    rollingStdDev: +rollingStdDev.toFixed(2),
    seasonalFactor,
    perCowBound: +perCowBound.toFixed(2),
    herdBound: +(perCowBound * registeredCows).toFixed(1),
    isHistoricalBaseline: recentYields.length > 0
  };
}

export function AnveshanaProvider({ children }) {
  const [currentRole, setCurrentRole] = useState('GOVT_AUDITOR');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState('FSSAI-HR');
  const [activeOfficerLevel, setActiveOfficerLevel] = useState('STATE_COMMISSIONER'); // 'NATIONAL_DIRECTOR' | 'STATE_COMMISSIONER' | 'DISTRICT_MAGISTRATE' | 'FOOD_SAFETY_OFFICER'
  const [language, setLanguage] = useState('EN'); // 'EN' | 'HI'
  const [isOnline, setIsOnline] = useState(true);
  const [realtimeStatus, setRealtimeStatus] = useState('connecting');
  const [latestTelemetry, setLatestTelemetry] = useState(null);
  const [activeEvidenceModal, setActiveEvidenceModal] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('anveshana-theme') || 'light');
  const [fontScale, setFontScale] = useState(() => localStorage.getItem('anveshana-font-scale') || 'normal');

  useEffect(() => {
    localStorage.setItem('anveshana-theme', theme);
    localStorage.setItem('anveshana-font-scale', fontScale);
  }, [theme, fontScale]);

  // Authentication State for Role Gatekeeper
  const [authenticatedSessions, setAuthenticatedSessions] = useState({
    FARMER: { isAuthenticated: true, id: '201410000123', name: 'Ramesh Kumar' },
    AGGREGATOR: { isAuthenticated: false, id: null, name: null },
    QC_OFFICER: { isAuthenticated: false, id: null, name: null },
    GOVT_AUDITOR: { isAuthenticated: false, id: null, name: null },
    CONSUMER: { isAuthenticated: true, id: 'PUBLIC_GUEST', name: 'Public Guest' }
  });

  const [authModalState, setAuthModalState] = useState({ isOpen: false, targetRole: 'QC_OFFICER' });

  const [nodes] = useState(DEMO_NODES);
  const [farmers] = useState(DEMO_FARMERS);
  const [pourEvents, setPourEvents] = useState(DEMO_POUR_EVENTS);
  const [batches, setBatches] = useState(INITIAL_BATCHES);
  const [anomalies, setAnomalies] = useState(INITIAL_ANOMALIES);
  const [ndlmVerificationCases, setNdlmVerificationCases] = useState([]);
  const [collectionRequests, setCollectionRequests] = useState([]);
  const [riskAnomalies, setRiskAnomalies] = useState(INITIAL_RISK_ANOMALIES);
  const [riskAggregates, setRiskAggregates] = useState([]);
  const [raidRecommendations, setRaidRecommendations] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    let active = true;
    const applyWorkflowSync = (sync) => {
      if (!active) return;
      if (Array.isArray(sync.milkLogs) && sync.milkLogs.length) setPourEvents(previous => {
        const incoming = sync.milkLogs.filter(item => !previous.some(existing => existing.eventId === item.eventId));
        return incoming.length ? [...incoming, ...previous] : previous;
      });
      if (Array.isArray(sync.collectionRequests)) setCollectionRequests(previous => {
        const incomingById = new Map(sync.collectionRequests.map(item => [item.requestId, item]));
        const retained = previous.filter(item => !incomingById.has(item.requestId));
        return [...sync.collectionRequests, ...retained];
      });
      if (Array.isArray(sync.ndlmRegistrations)) setNdlmVerificationCases(sync.ndlmRegistrations);
    };
    const syncWorkflow = () => fetchWorkflowSync().then(applyWorkflowSync).catch(() => {
      // The dashboards retain their seeded data when the prototype API is offline.
    });
    syncWorkflow();
    // Socket.IO is the primary live path; polling keeps a demo functional when
    // a browser, proxy, or cold-start temporarily delays websocket delivery.
    const syncTimer = window.setInterval(syncWorkflow, 3000);
    Promise.all([fetchRiskAnomalies(), fetchRiskAggregates('district'), fetchRaidRecommendations()])
      .then(([anomalyResponse, aggregateResponse, raidResponse]) => {
        if (!active) return;
        if (anomalyResponse.anomalies?.length) setRiskAnomalies(anomalyResponse.anomalies);
        setRiskAggregates(aggregateResponse.aggregates || []);
        setRaidRecommendations(raidResponse.recommendations || []);
        if (!anomalyResponse.anomalies?.length) {
          seedRiskDemo().then(seeded => {
            if (active && seeded?.anomalies?.length) setRiskAnomalies(seeded.anomalies);
          }).catch(() => {});
        }
      })
      .catch(async () => {
        // Seed once when running against a clean prototype server; this keeps
        // the command centre demonstrable without a database.
        try {
          const seeded = await seedRiskDemo();
          if (seeded?.anomalies) setRiskAnomalies(seeded.anomalies);
          const aggregates = await fetchRiskAggregates('district');
          setRiskAggregates(aggregates.aggregates || []);
          const raids = await fetchRaidRecommendations();
          setRaidRecommendations(raids.recommendations || []);
        } catch {
          // Existing seeded dashboard data remains available if API is offline.
        }
      });
      Promise.all([fetchOfficers(), fetchAssignments()])
        .then(([officerResponse, assignmentResponse]) => {
          if (!active) return;
          setOfficers(officerResponse.officers?.length ? officerResponse.officers : DEMO_OFFICERS);
          setAssignments(assignmentResponse.assignments || []);
        })
        .catch(() => {
          // Keep a visible demo directory when an older backend has not yet
          // deployed the officer endpoint.
          if (active) setOfficers(DEMO_OFFICERS);
        });
    return () => {
      active = false;
      window.clearInterval(syncTimer);
    };
  }, []);

  // Audit Log — immutable append-only action trail
  const [auditLog, setAuditLog] = useState([
    { id: 'AL-001', timestamp: '2026-08-31T08:10:04Z', officerId: 'QCO-MCC104-001', officerName: 'Inspector Kaithal Gate #4', action: 'ANOMALY_DETECTED', targetNode: 'MCC-104', status: 'EXECUTED', evidenceHash: 'sha256:7d2b9af8103c31ff78201a44eef938101a44' },
    { id: 'AL-002', timestamp: '2026-08-31T07:55:12Z', officerId: 'QCO-PLANT-02',    officerName: 'Quality Manager Sonepat',    action: 'YIELD_SPIKE_FLAGGED', targetNode: 'VLC-77', status: 'EXECUTED', evidenceHash: 'sha256:8e3c0bf9114d42aa89312b55ff012b55cd9f' },
    { id: 'AL-003', timestamp: '2026-08-31T07:45:00Z', officerId: 'AGG-VLC-22',      officerName: 'Nissing AMCU Station',       action: 'BATCH_DISPATCHED',   targetNode: 'VLC-22', status: 'EXECUTED', evidenceHash: 'sha256:3a91fc20d8174b6e9a1bc8e7d6e402fa1238' },
    { id: 'AL-004', timestamp: '2026-08-30T14:20:00Z', officerId: 'FSSAI-HR-007',    officerName: 'Auditor Mundhe (Haryana)',   action: 'JURISDICTION_AUDIT', targetNode: 'MCC-104', status: 'EXECUTED', evidenceHash: 'sha256:c01a8b7e3f442d91b72d49f62c184e3b8801' },
  ]);

  const appendAuditEntry = (action, targetNode, officerName, officerId, status = 'EXECUTED') => {
    const entry = {
      id: `AL-${String(Date.now()).slice(-6)}`,
      timestamp: new Date().toISOString(),
      officerId,
      officerName,
      action,
      targetNode,
      status,
      evidenceHash: `sha256:${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`
    };
    setAuditLog(prev => [entry, ...prev]);
    return entry;
  };

  const [liveIncidents, setLiveIncidents] = useState([
    { id: '1', time: '08:12:04', type: 'CRITICAL', text: 'Volume expansion +6.8% detected at MCC-104 Kaithal' },
    { id: '2', time: '08:05:12', type: 'HIGH', text: 'Yield anomaly auto-rejected for NDLM Tag #840003129940113' },
    { id: '3', time: '07:45:00', type: 'INFO', text: 'Tanker HR-08-B-9912 checked in with 0.18% nominal delta' }
  ]);

  useEffect(() => createRealtimeConnection({
    onConnect: () => {
      setRealtimeStatus('connected');
      setIsOnline(true);
    },
    onDisconnect: () => {
      setRealtimeStatus('disconnected');
      setIsOnline(false);
    },
    onMilkLogged: (milkLog) => {
      setPourEvents(previous => previous.some(event => event.eventId === milkLog.eventId)
        ? previous
        : [milkLog, ...previous]);
      setLiveIncidents(previous => [{
        id: milkLog.eventId,
        time: new Date(milkLog.timestamp).toLocaleTimeString(),
        type: 'INFO',
        text: `Mobile milk log received from ${milkLog.farmerName || milkLog.farmerId} at ${milkLog.nodeId}`
      }, ...previous]);
    },
    onGrievanceCreated: (grievance) => {
      setLiveIncidents(previous => [{
        id: grievance.grievanceId,
        time: new Date(grievance.createdAt).toLocaleTimeString(),
        type: 'CRITICAL',
        text: `Whistleblower grievance received for ${grievance.nodeId}: ${grievance.category}`
      }, ...previous]);
    },
    onNdlmRegistrationCreated: (registration) => {
      setNdlmVerificationCases(previous => previous.some(item => item.verificationId === registration.verificationId) ? previous : [registration, ...previous]);
      setLiveIncidents(previous => [{ id: registration.verificationId, time: new Date(registration.submittedAt).toLocaleTimeString(), type: 'INFO', text: `NDLM verification request received for tag ${registration.ndlmTag}` }, ...previous]);
    },
    onNdlmRegistrationUpdated: (registration) => {
      setNdlmVerificationCases(previous => previous.some(item => item.verificationId === registration.verificationId)
        ? previous.map(item => item.verificationId === registration.verificationId ? registration : item)
        : [registration, ...previous]);
    },
    onCollectionRequestCreated: (request) => {
      setCollectionRequests(previous => previous.some(item => item.requestId === request.requestId) ? previous : [request, ...previous]);
    },
    onCollectionRequestUpdated: (request) => {
      setCollectionRequests(previous => previous.some(item => item.requestId === request.requestId)
        ? previous.map(item => item.requestId === request.requestId ? request : item)
        : [request, ...previous]);
    },
    onRiskAnomalyProvisional: (anomaly) => {
      setRiskAnomalies(previous => previous.some(item => item.anomalyId === anomaly.anomalyId) ? previous : [anomaly, ...previous]);
    },
    onRiskAnomalyReviewed: (anomaly) => {
      setRiskAnomalies(previous => previous.map(item => item.anomalyId === anomaly.anomalyId ? anomaly : item));
    },
    onRaidRecommendationUpdated: (recommendation) => {
      setRaidRecommendations(previous => previous.some(item => item.recommendationId === recommendation.recommendationId)
        ? previous.map(item => item.recommendationId === recommendation.recommendationId ? recommendation : item)
        : [recommendation, ...previous]);
    },
    onAssignmentCreated: (assignment) => {
      setAssignments(previous => previous.some(item => item.assignmentId === assignment.assignmentId)
        ? previous
        : [assignment, ...previous]);
      setOfficers(previous => previous.map(officer => officer.officerId === assignment.officerId
        ? { ...officer, workload: (officer.workload || 0) + 1, availability: 'BUSY' }
        : officer));
    },
    onAssignmentUpdated: (assignment) => {
      setAssignments(previous => previous.some(item => item.assignmentId === assignment.assignmentId)
        ? previous.map(item => item.assignmentId === assignment.assignmentId ? assignment : item)
        : [assignment, ...previous]);
      fetchOfficers().then(response => setOfficers(response.officers || [])).catch(() => {});
    },
    onTelemetryTick: (telemetry) => setLatestTelemetry(telemetry)
  }), []);

  const activeJurisdictionConfig = JURISDICTION_CONFIGS[selectedJurisdiction] || JURISDICTION_CONFIGS['FSSAI-HR'];

  // Role Gatekeeper Authentication Handler
  const loginWithRegisteredId = (role, enteredId) => {
    const cleanId = enteredId.trim();

    // MASTER ADMIN PASSCODE: '1234' Unlocks ALL Roles Simultaneously!
    if (cleanId === '1234') {
      const adminSession = {
        isAuthenticated: true,
        id: '1234',
        name: 'Master Admin Overseer',
        token: `jwt_admin_master_1234_${Date.now()}`
      };

      setAuthenticatedSessions({
        FARMER: adminSession,
        AGGREGATOR: adminSession,
        QC_OFFICER: adminSession,
        GOVT_AUDITOR: adminSession,
        CONSUMER: adminSession
      });

      setCurrentRole(role);
      setAuthModalState({ isOpen: false, targetRole: role });
      return { success: true, session: adminSession, isAdmin: true };
    }

    const roleDirectory = REGISTERED_ID_DIRECTORY[role] || [];
    const matchedRecord = roleDirectory.find(
      r => r.id.toLowerCase() === cleanId.toLowerCase() || r.tag.toLowerCase() === cleanId.toLowerCase()
    );

    if (!matchedRecord && role !== 'CONSUMER') {
      return { success: false, error: `Invalid Registered ID / Badge / NDLM Tag for ${role} Role (Hint: Use Master Admin ID '1234')` };
    }

    const session = {
      isAuthenticated: true,
      id: matchedRecord ? matchedRecord.id : 'PUBLIC_GUEST',
      name: matchedRecord ? matchedRecord.name : 'Public Guest',
      token: `jwt_token_${role.toLowerCase()}_${Date.now()}`
    };

    setAuthenticatedSessions(prev => ({
      ...prev,
      [role]: session
    }));

    setCurrentRole(role);
    setAuthModalState({ isOpen: false, targetRole: role });
    return { success: true, session };
  };

  const logoutRole = (role) => {
    setAuthenticatedSessions(prev => ({
      ...prev,
      [role]: { isAuthenticated: false, id: null, name: null }
    }));
  };

  const attemptRoleSwitch = (targetRole) => {
    if (targetRole === 'CONSUMER' || authenticatedSessions[targetRole]?.isAuthenticated) {
      setCurrentRole(targetRole);
    } else {
      setAuthModalState({ isOpen: true, targetRole });
    }
  };

  const addPourEvent = (newEvent) => {
    const eventId = `PE-20260831-${String(pourEvents.length + 1).padStart(3, '0')}`;
    const hash = `sha256:${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
    const fullEvent = {
      ...newEvent,
      eventId,
      receiptHash: hash,
      timestamp: new Date().toISOString(),
      session: newEvent.session || (new Date().getHours() < 14 ? 'MORNING' : 'EVENING'),
      payoutINR: +((newEvent.weightKg || 8.0) * 45).toFixed(2),
      paymentStatus: newEvent.paymentStatus || 'PENDING_AGGREGATOR_CONFIRMATION'
    };
    setPourEvents([fullEvent, ...pourEvents]);
    return fullEvent;
  };

  const createCollectionRequest = async ({ farmerId, nodeId, requestedSession, requestedAmountKg }) => {
    const farmer = farmers.find(item => item.farmerId === farmerId);
    const payload = {
      farmerId,
      farmerName: farmer?.name || 'Unknown farmer',
      nodeId: nodeId || farmer?.nodeId || 'VLC-22',
      district: farmer?.district || 'Karnal',
      state: farmer?.state || 'Haryana',
      requestedSession: requestedSession || (new Date().getHours() < 14 ? 'MORNING' : 'EVENING'),
      requestedAmountKg: Number(requestedAmountKg) || 0
    };
    const localRequest = {
      ...payload,
      requestId: `COL-${Date.now()}`,
      status: 'REQUESTED',
      farmerApproval: 'PENDING',
      aggregatorMeasurements: null,
      createdAt: new Date().toISOString()
    };
    try {
      const response = await createCollectionRequestApi(payload);
      const request = response.collectionRequest;
      setCollectionRequests(previous => [request, ...previous.filter(item => item.requestId !== request.requestId)]);
      return request;
    } catch {
      setCollectionRequests(previous => [localRequest, ...previous]);
      return localRequest;
    }
  };

  const approveCollectionRequest = async (requestId, approval = 'APPROVED') => {
    try {
      const response = await updateCollectionApproval(requestId, approval);
      setCollectionRequests(previous => previous.map(request => request.requestId === requestId ? response.collectionRequest : request));
    } catch {
      setCollectionRequests(previous => previous.map(request => request.requestId === requestId ? { ...request, farmerApproval: approval, status: approval === 'APPROVED' ? 'APPROVED_BY_FARMER' : 'DECLINED_BY_FARMER', approvedAt: new Date().toISOString() } : request));
    }
  };

  const submitAggregatorMeasurements = async (requestId, measurements) => {
    const request = collectionRequests.find(item => item.requestId === requestId);
    const expectedYieldKg = calculateDynamicYieldBound({ farmer: farmers.find(item => item.farmerId === request?.farmerId), pourEvents }).perCowBound;
    try {
      const response = await recordCollectionMeasurements(requestId, measurements);
      const updated = { ...response.collectionRequest, expectedYieldKg, comparison: { differenceKg: +(Number(measurements.weightKg) - expectedYieldKg).toFixed(2), withinDynamicBound: Number(measurements.weightKg) <= expectedYieldKg } };
      setCollectionRequests(previous => previous.map(item => item.requestId === requestId ? updated : item));
    } catch {
      setCollectionRequests(previous => previous.map(item => item.requestId === requestId ? {
        ...item,
        aggregatorMeasurements: { ...measurements, measuredWeightKg: Number(measurements.weightKg), recordedAt: new Date().toISOString() },
        expectedYieldKg,
        comparison: { differenceKg: +(Number(measurements.weightKg) - expectedYieldKg).toFixed(2), withinDynamicBound: Number(measurements.weightKg) <= expectedYieldKg },
        status: 'MEASUREMENTS_RECORDED'
      } : item));
    }
  };

  const transferToChillingCenter = async (requestId, transfer) => {
    try {
      const response = await transferCollectionToChilling(requestId, transfer);
      setCollectionRequests(previous => previous.map(request => request.requestId === requestId ? response.collectionRequest : request));
    } catch {
      setCollectionRequests(previous => previous.map(request => request.requestId === requestId ? {
        ...request,
        transfer: { ...transfer, transferId: `CHILL-${Date.now()}`, destinationType: 'CHILLING_CENTER', transferredAt: new Date().toISOString() },
        status: 'TRANSFERRED_TO_CHILLING_CENTER'
      } : request));
    }
  };

  const markPourPaid = (eventId, paymentReference = `PAY-${Date.now()}`) => {
    setPourEvents(previous => previous.map(event => event.eventId === eventId ? { ...event, paymentStatus: 'PAID', paymentReference, paidAt: new Date().toISOString() } : event));
  };

  const getMilkEligibility = (animal) => {
    if (animal?.pregnancyStatus === 'PREGNANT') return { eligible: false, reason: 'Milk collection paused while the animal is pregnant.' };
    if (animal?.postCalvingRecovery === true) return { eligible: false, reason: 'Milk collection paused during post-calving recovery.' };
    return { eligible: true, reason: 'Eligible for milk collection.' };
  };

  const registerNdlmAnimal = async (animal) => {
    const verificationCase = {
      ...animal,
      farmerId: animal.farmerId || '201410000123',
      verificationId: `NDLM-VER-${Date.now()}`,
      submittedAt: new Date().toISOString(),
      status: 'PENDING_REVIEW',
      visitStatus: 'NOT_PLANNED',
      fieldEvidence: null,
      estimatedYieldKg: calculateDynamicYieldBound({ farmer: { ...animal, registeredCows: 1, animalBreed: animal.breed }, pourEvents }).perCowBound
    };
    try {
      const response = await submitNdlmRegistration({ ...verificationCase, lastVaccinationDate: animal.lastVaccinationDate || animal.vaccinationDate });
      if (response.registration) Object.assign(verificationCase, response.registration);
    } catch {
      // Keep the local submission visible when the prototype API is unavailable.
    }
    setNdlmVerificationCases(previous => [verificationCase, ...previous.filter(item => item.verificationId !== verificationCase.verificationId)]);
    setLiveIncidents(previous => [{ id: verificationCase.verificationId, time: new Date().toLocaleTimeString(), type: 'INFO', text: `NDLM animal registration received for ${animal.animalName || animal.ndlmTag}` }, ...previous]);
    return verificationCase;
  };

  const updateNdlmVerification = async (verificationId, updates) => {
    try {
      const response = await updateNdlmRegistration(verificationId, updates);
      setNdlmVerificationCases(previous => previous.map(item => item.verificationId === verificationId ? response.registration : item));
    } catch {
      setNdlmVerificationCases(previous => previous.map(item => item.verificationId === verificationId ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item));
    }
  };

  const reviewRiskAnomaly = async (anomalyId, decision, reason) => {
    try {
      const response = await reviewRiskAnomalyApi(anomalyId, decision, reason, 'FSSAI-HR-007');
      setRiskAnomalies(previous => previous.map(item => item.anomalyId === anomalyId ? response.anomaly : item));
      const aggregateResponse = await fetchRiskAggregates('district');
      setRiskAggregates(aggregateResponse.aggregates || []);
      return response.anomaly;
    } catch {
      setRiskAnomalies(previous => previous.map(item => item.anomalyId === anomalyId ? {
        ...item,
        status: decision === 'CONFIRM' ? 'CONFIRMED' : decision === 'CLEAR' ? 'CLEARED_VALID' : 'DISMISSED',
        permanentPoints: decision === 'CONFIRM' ? item.provisionalPoints : 0,
        review: { decision, reason, officerId: 'FSSAI-HR-007', reviewedAt: new Date().toISOString() }
      } : item));
      return null;
    }
  };

  const approveRaidRecommendation = async (recommendationId, approval, reason = '') => {
    try {
      const response = await approveRaidRecommendationApi(recommendationId, approval, reason, 'FSSAI-HR-007');
      setRaidRecommendations(previous => previous.map(item => item.recommendationId === recommendationId ? response.recommendation : item));
      return response.recommendation;
    } catch {
      setRaidRecommendations(previous => previous.map(item => item.recommendationId === recommendationId ? { ...item, status: approval } : item));
      return null;
    }
  };

  const assignOfficerToTarget = async (payload) => {
    try {
      const response = await assignOfficerApi(payload);
      const assignment = response.assignment;
      setAssignments(previous => previous.some(item => item.assignmentId === assignment.assignmentId)
        ? previous.map(item => item.assignmentId === assignment.assignmentId ? assignment : item)
        : [assignment, ...previous]);
      const officerResponse = await fetchOfficers();
      setOfficers(officerResponse.officers || []);
      return assignment;
    } catch (error) {
      if (error.status && error.status < 500) return null;
      const officer = officers.find(item => item.officerId === payload.officerId);
      if (!officer) return null;
      const localAssignment = {
        assignmentId: `ASGN-${Date.now()}`,
        officerId: officer.officerId,
        officerName: officer.name,
        officerRole: officer.role,
        officerTitle: officer.title,
        jurisdiction: officer.jurisdiction,
        recommendationId: payload.recommendationId || payload.raidRecommendationId || null,
        targetType: payload.targetType || 'RAID_RECOMMENDATION',
        targetId: payload.targetId || payload.recommendationId || payload.raidRecommendationId,
        status: 'ASSIGNED',
        assignedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setAssignments(previous => [localAssignment, ...previous.filter(item => item.recommendationId !== localAssignment.recommendationId)]);
      setOfficers(previous => previous.map(item => item.officerId === officer.officerId ? { ...item, workload: (item.workload || 0) + 1, availability: 'BUSY' } : item));
      return localAssignment;
    }
  };

  const updateAssignmentStatus = async (assignmentId, updates) => {
    try {
      const response = await updateAssignmentApi(assignmentId, updates);
      setAssignments(previous => previous.map(item => item.assignmentId === assignmentId ? response.assignment : item));
      const officerResponse = await fetchOfficers();
      setOfficers(officerResponse.officers || []);
      return response.assignment;
    } catch {
      let updatedAssignment = null;
      setAssignments(previous => previous.map(item => {
        if (item.assignmentId !== assignmentId) return item;
        updatedAssignment = { ...item, ...updates, updatedAt: new Date().toISOString() };
        return updatedAssignment;
      }));
      return updatedAssignment;
    }
  };

  const quarantineBatch = (batchId) => {
    setBatches(batches.map(b => b.batchId === batchId ? { ...b, batchStatus: 'QUARANTINED' } : b));
    const incident = {
      id: String(Date.now()),
      time: new Date().toLocaleTimeString(),
      type: 'CRITICAL',
      text: `QC OFFICER QUARANTINED BATCH ${batchId}. Upstream payouts frozen!`
    };
    setLiveIncidents([incident, ...liveIncidents]);
    appendAuditEntry('BATCH_QUARANTINED', batchId, 'QC Officer', 'QCO-MCC104-001', 'EXECUTED');
  };

  const acceptBatch = (batchId) => {
    setBatches(batches.map(b => b.batchId === batchId ? { ...b, batchStatus: 'PASSED' } : b));
    const incident = {
      id: String(Date.now()),
      time: new Date().toLocaleTimeString(),
      type: 'INFO',
      text: `Batch ${batchId} verified & accepted into chilling tank`
    };
    setLiveIncidents([incident, ...liveIncidents]);
    appendAuditEntry('BATCH_ACCEPTED', batchId, 'QC Officer', 'QCO-PLANT-02', 'EXECUTED');
  };

  const dispatchRaid = (anomalyId) => {
    const anomaly = anomalies.find(a => a.anomalyId === anomalyId);
    setAnomalies(anomalies.map(a => a.anomalyId === anomalyId ? { ...a, status: 'RAID_DISPATCHED' } : a));
    const incident = {
      id: String(Date.now()),
      time: new Date().toLocaleTimeString(),
      type: 'CRITICAL',
      text: `FSSAI Flying Squad dispatched for Anomaly ${anomalyId}`
    };
    setLiveIncidents([incident, ...liveIncidents]);
    appendAuditEntry('RAID_DISPATCHED', anomaly?.nodeId || anomalyId, 'FSSAI Auditor', 'FSSAI-HR-007', 'EXECUTED');
  };

  const injectVolumeAnomalySimulation = () => {
    const newAnomaly = {
      anomalyId: `ANO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      nodeId: 'MCC-104',
      nodeName: 'Kaithal Chilling Center Gate #2',
      riskScore: 96,
      type: 'VOLUME_EXPANSION',
      details: 'ALERT: Injection of +12.4% volume delta detected by inline mass-flow meter!',
      timestamp: new Date().toISOString(),
      status: 'ACTIVE_INVESTIGATION'
    };
    setAnomalies([newAnomaly, ...anomalies]);
    setLiveIncidents([
      { id: String(Date.now()), time: new Date().toLocaleTimeString(), type: 'CRITICAL', text: newAnomaly.details },
      ...liveIncidents
    ]);
  };

  const flagEntity = ({ entityType, entityId, farmer, nodeId, district }) => {
    const newAnomaly = {
      anomalyId: `MANUAL-${Date.now()}`,
      observationId: `FIELD-${Date.now()}`,
      farmerId: farmer?.farmerId || (entityType === 'FARMER' ? entityId : null),
      animalId: entityType === 'CATTLE' ? entityId : null,
      farmId: farmer?.farmerId || null,
      nodeId: nodeId || farmer?.nodeId || null,
      district: district || farmer?.district || null,
      type: entityType === 'CATTLE' ? 'MANUAL_CATTLE_REVIEW' : 'MANUAL_FARMER_REVIEW',
      riskScore: 60,
      provisionalPoints: 60,
      permanentPoints: 0,
      evidence: [{ code: 'MANUAL_REVIEW', label: `Manually flagged ${entityType.toLowerCase()} for field review`, points: 60, details: 'Created by an FSSAI prototype operator after searching the regional register.' }],
      status: 'PROVISIONAL',
      detectedAt: new Date().toISOString(),
      review: null
    };
    setRiskAnomalies(previous => [newAnomaly, ...previous]);
    setLiveIncidents(previous => [{ id: newAnomaly.anomalyId, time: new Date().toLocaleTimeString(), type: 'HIGH', text: `${entityType} ${entityId} manually flagged for field review` }, ...previous]);
    return newAnomaly;
  };

  return (
    <AnveshanaContext.Provider value={{
      currentRole,
      setCurrentRole,
      attemptRoleSwitch,
      authenticatedSessions,
      loginWithRegisteredId,
      logoutRole,
      authModalState,
      setAuthModalState,
      REGISTERED_ID_DIRECTORY,
      selectedJurisdiction,
      setSelectedJurisdiction,
      activeOfficerLevel,
      setActiveOfficerLevel,
      OFFICER_HIERARCHY,
      JURISDICTION_CONFIGS,
      activeJurisdictionConfig,
      STATE_DISTRICT_DIRECTORY,
      language,
      setLanguage,
      theme,
      setTheme,
      fontScale,
      setFontScale,
      isOnline,
      setIsOnline,
      realtimeStatus,
      latestTelemetry,
      activeEvidenceModal,
      setActiveEvidenceModal,
      nodes,
      farmers,
      pourEvents,
      addPourEvent,
      collectionRequests,
      createCollectionRequest,
      approveCollectionRequest,
      submitAggregatorMeasurements,
      transferToChillingCenter,
      markPourPaid,
      getMilkEligibility,
      ndlmVerificationCases,
      registerNdlmAnimal,
      updateNdlmVerification,
      batches,
      quarantineBatch,
      acceptBatch,
      anomalies,
      riskAnomalies,
      riskAggregates,
      raidRecommendations,
      officers,
      assignments,
      reviewRiskAnomaly,
      approveRaidRecommendation,
      assignOfficerToTarget,
      updateAssignmentStatus,
      dispatchRaid,
      liveIncidents,
      injectVolumeAnomalySimulation,
      flagEntity,
      auditLog,
      LICENSE_REGISTRY,
      appendAuditEntry
    }}>
      {children}
    </AnveshanaContext.Provider>
  );
}

export function useAnveshana() {
  const ctx = useContext(AnveshanaContext);
  if (!ctx) throw new Error('useAnveshana must be used within an AnveshanaProvider');
  return ctx;
}
