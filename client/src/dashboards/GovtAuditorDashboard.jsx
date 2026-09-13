import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useAnveshana } from '../context/AnveshanaContext';
import {
  Shield, ShieldAlert, MapPin, Radio, Send, FileText, CheckCircle2,
  Navigation, Globe, TrendingUp, BarChart2, ClipboardList, Database,
  Download, AlertTriangle, Activity, Zap, ChevronDown, RefreshCw,
  Lock, UserCheck, Eye, Filter, Landmark, Target, ClipboardCheck, Camera, Navigation2, Clock
} from 'lucide-react';
import L from 'leaflet';

// ─── Utility ────────────────────────────────────────────────────────────────
const fmtTs = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.toLocaleDateString('en-IN')} ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
};

// ─── Sub-components ──────────────────────────────────────────────────────────

/** KPI card tile */
function KpiCard({ label, value, sub, accent = 'amber', pulse = false, icon: Icon }) {
  const colors = {
    amber:   { bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  text: 'text-amber-400' },
    rose:    { bg: 'bg-rose-500/10',   border: 'border-rose-500/30',   text: 'text-rose-400'  },
    emerald: { bg: 'bg-emerald-500/10',border: 'border-emerald-500/30',text: 'text-emerald-400'},
    blue:    { bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   text: 'text-blue-400'  },
    purple:  { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400'},
  };
  const c = colors[accent] || colors.amber;
  return (
    <div className={`flex-1 min-w-[120px] p-3 rounded-2xl border ${c.bg} ${c.border} flex flex-col gap-1 relative overflow-hidden`}>
      {pulse && (
        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-400 animate-ping" />
      )}
      <div className={`flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider ${c.text}`}>
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </div>
      <div className={`text-2xl font-black ${c.text} leading-none`}>{value}</div>
      {sub && <div className="text-[10px] text-slate-500 font-mono">{sub}</div>}
    </div>
  );
}

/** Section tab button */
function TabBtn({ label, icon: Icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
        active
          ? 'bg-amber-500/15 border-amber-400/50 text-amber-300 shadow-md'
          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

/** Analytics: simple CSS bar chart row */
function StateBar({ state, pct, color }) {
  const bg = color === 'emerald' ? 'bg-emerald-500' : color === 'amber' ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="text-slate-400 w-24 shrink-0 font-mono text-right text-[11px]">{state}</span>
      <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
        <div className={`${bg} h-full rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`w-10 text-right font-bold text-[11px] ${bg.replace('bg-', 'text-')}`}>{pct}%</span>
    </div>
  );
}

/** Analytics: donut ring (pure CSS/SVG) */
function DonutChart({ segments }) {
  const r = 40, cx = 50, cy = 50, stroke = 12;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {segments.map((seg, i) => {
        const dash = (seg.pct / 100) * circumference;
        const gap  = circumference - dash;
        const el = (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            transform="rotate(-90 50 50)"
            opacity="0.85"
          />
        );
        offset += dash;
        return el;
      })}
      <text x="50" y="54" textAnchor="middle" className="text-xs fill-slate-300" fontSize="10" fontWeight="bold">
        Risk
      </text>
    </svg>
  );
}

/** Analytics: mini sparkline (SVG) */
function Sparkline({ data, color = '#f59e0b' }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const w = 200, h = 50;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - (v / max) * (h - 6) - 3;
    return `${x},${y}`;
  }).join(' ');
  const area = `0,${h} ${pts} ${w},${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-14" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#sparkGrad)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

function ExplainableRiskPanel({ riskAnomalies, riskAggregates, raidRecommendations, reviewRiskAnomaly, approveRaidRecommendation }) {
  const [level, setLevel] = useState('district');
  const [selection, setSelection] = useState({});
  const [reviewReason, setReviewReason] = useState('');

  const levelLabel = { district: 'District', village: 'Village', farm: 'Farm', farmer: 'Farmer', animal: 'Animal' };
  const rows = useMemo(() => {
    const keyFor = item => level === 'animal' ? item.animalId : level === 'farmer' ? item.farmerId : level === 'farm' ? item.farmId : level === 'village' ? item.village : item.district;
    const scoped = riskAnomalies.filter(item => (
      (!selection.district || item.district === selection.district) &&
      (!selection.village || item.village === selection.village) &&
      (!selection.farmId || item.farmId === selection.farmId) &&
      (!selection.farmerId || item.farmerId === selection.farmerId)
    ));
    const grouped = new Map();
    scoped.forEach(item => {
      const key = keyFor(item) || 'UNMAPPED';
      const row = grouped.get(key) || { key, provisional: 0, permanent: 0, confirmed: 0, provisionalCount: 0, evidence: [], associations: [] };
      row.provisional += item.provisionalPoints || 0;
      row.permanent += item.permanentPoints || 0;
      if (item.status === 'CONFIRMED') row.confirmed += 1;
      if (item.status === 'PROVISIONAL' || item.status === 'OBSERVED') row.provisionalCount += 1;
      row.evidence.push(...(item.evidence || []).map(evidence => evidence.label));
      if (item.tankerRegistration || item.chillingCenterId) row.associations.push(`${item.tankerRegistration || 'tanker ?'} → ${item.chillingCenterId || 'chilling center ?'}`);
      grouped.set(key, row);
    });
    return [...grouped.values()].map(row => ({ ...row, evidence: [...new Set(row.evidence)].slice(0, 3), associations: [...new Set(row.associations)].slice(0, 2) })).sort((a, b) => b.permanent - a.permanent || b.provisional - a.provisional);
  }, [riskAnomalies, level, selection]);

  const chooseRow = row => {
    const next = { ...selection };
    if (level === 'district') next.district = row.key;
    if (level === 'village') next.village = row.key;
    if (level === 'farm') next.farmId = row.key;
    if (level === 'farmer') next.farmerId = row.key;
    setSelection(next);
    const nextLevel = { district: 'village', village: 'farm', farm: 'farmer', farmer: 'animal' }[level];
    if (nextLevel) setLevel(nextLevel);
  };

  const resetDrill = nextLevel => {
    setLevel(nextLevel);
    const next = { ...selection };
    const keys = ['district', 'village', 'farmId', 'farmerId'];
    const index = ['district', 'village', 'farm', 'farmer'].indexOf(nextLevel);
    keys.forEach((key, i) => { if (i >= index) delete next[key]; });
    setSelection(next);
  };

  const pendingRaids = raidRecommendations.filter(item => item.status === 'PENDING_OFFICER_APPROVAL');
  const confirmedPoints = riskAnomalies.reduce((total, anomaly) => total + (anomaly.permanentPoints || 0), 0);
  const provisionalPoints = riskAnomalies.reduce((total, anomaly) => total + (anomaly.provisionalPoints || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-white">Explainable anomaly & risk ledger</h3>
          <p className="text-xs text-slate-400 mt-1">One unusual observation is provisional. Only an officer confirmation moves points into the permanent score.</p>
        </div>
        <div className="flex gap-2 text-[10px] font-mono">
          <span className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-amber-300">Provisional {provisionalPoints}</span>
          <span className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-rose-300">Permanent {confirmedPoints}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {Object.keys(levelLabel).map(item => (
            <button key={item} onClick={() => resetDrill(item)} className={`rounded-lg border px-3 py-1.5 text-[11px] font-bold ${level === item ? 'border-amber-400 bg-amber-500/15 text-amber-300' : 'border-slate-700 text-slate-400'}`}>{levelLabel[item]}</button>
          ))}
          {Object.keys(selection).length > 0 && <button onClick={() => { setSelection({}); setLevel('district'); }} className="ml-auto text-[10px] text-slate-500 hover:text-white">Reset drilldown</button>}
        </div>
        {rows.length === 0 ? <div className="py-8 text-center text-xs text-slate-500">No observations at this scope.</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="border-b border-slate-800 text-[10px] uppercase text-slate-500"><tr><th className="py-2">Scope</th><th>Provisional</th><th>Permanent</th><th>Confirmed</th><th>Signals / associations</th><th /></tr></thead>
              <tbody className="divide-y divide-slate-900">
                {rows.map(row => <tr key={row.key}>
                  <td className="py-3 pr-3 font-mono font-bold text-white">{row.key}</td>
                  <td className="text-amber-300">{row.provisional}</td>
                  <td className="text-rose-300">{row.permanent}</td>
                  <td className="text-slate-300">{row.confirmed}</td>
                  <td className="max-w-[280px] text-slate-400">{row.evidence.join(' · ') || 'No signal'}{row.associations.length > 0 && <div className="mt-1 text-[10px] text-sky-300">{row.associations.join(' · ')}</div>}</td>
                  <td className="text-right"><button onClick={() => chooseRow(row)} className="rounded border border-slate-700 px-2 py-1 text-[10px] font-bold text-amber-300 hover:border-amber-400">Drill →</button></td>
                </tr>)}
              </tbody>
            </table>
          </div>
        )}
        {riskAggregates.length > 0 && <p className="mt-3 text-[10px] text-slate-600">Server aggregate snapshot: {riskAggregates.length} district groups · permanent scores exclude uncleared provisional points.</p>}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <div className="flex items-center justify-between mb-3"><h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Officer review queue</h4><span className="text-[10px] text-amber-300">{riskAnomalies.filter(item => ['PROVISIONAL', 'OBSERVED'].includes(item.status)).length} provisional</span></div>
          <input value={reviewReason} onChange={event => setReviewReason(event.target.value)} placeholder="Review reason (required for every decision)" className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none" />
          <div className="space-y-3 max-h-[420px] overflow-y-auto">
            {riskAnomalies.slice(0, 12).map(anomaly => <div key={anomaly.anomalyId} className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
              <div className="flex items-start justify-between gap-2"><div><div className="text-xs font-bold text-white">{anomaly.anomalyId} · {anomaly.type}</div><div className="mt-1 text-[10px] text-slate-500">{anomaly.farmerId || anomaly.nodeId || 'unmapped'} · {anomaly.status}</div></div><span className="font-mono text-amber-300">{anomaly.provisionalPoints} pts</span></div>
              <div className="mt-2 text-[10px] text-slate-400">{(anomaly.evidence || []).map(item => item.details).join(' ') || 'No explainable signal recorded.'}</div>
              {anomaly.status === 'PROVISIONAL' || anomaly.status === 'OBSERVED' ? <div className="mt-3 flex gap-2"><button disabled={!reviewReason.trim()} onClick={() => { reviewRiskAnomaly(anomaly.anomalyId, 'CONFIRM', reviewReason); setReviewReason(''); }} className="rounded bg-emerald-500/15 px-2 py-1 text-[10px] font-bold text-emerald-300 disabled:opacity-40">Confirm</button><button disabled={!reviewReason.trim()} onClick={() => { reviewRiskAnomaly(anomaly.anomalyId, 'CLEAR', reviewReason); setReviewReason(''); }} className="rounded bg-sky-500/15 px-2 py-1 text-[10px] font-bold text-sky-300 disabled:opacity-40">Clear valid</button><button disabled={!reviewReason.trim()} onClick={() => { reviewRiskAnomaly(anomaly.anomalyId, 'DISMISS', reviewReason); setReviewReason(''); }} className="rounded bg-rose-500/15 px-2 py-1 text-[10px] font-bold text-rose-300 disabled:opacity-40">Dismiss</button></div> : <div className="mt-2 text-[10px] text-emerald-300">Reviewed: {anomaly.review?.reason || 'reason recorded'}</div>}
            </div>)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <div className="flex items-center justify-between mb-3"><h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Raid recommendations</h4><span className="text-[10px] text-rose-300">{pendingRaids.length} require officer approval</span></div>
          <div className="space-y-3">
            {pendingRaids.length === 0 ? <div className="py-8 text-center text-xs text-slate-500">No pending raid recommendations.</div> : pendingRaids.map(raid => <div key={raid.recommendationId} className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3">
              <div className="text-xs font-bold text-white">{raid.targetType}: {raid.targetId}</div>
              <div className="mt-1 text-[10px] text-slate-400">{raid.reason}</div>
              <div className="mt-3 flex gap-2"><button onClick={() => approveRaidRecommendation(raid.recommendationId, 'APPROVED')} className="rounded bg-rose-500/20 px-2 py-1 text-[10px] font-bold text-rose-300">Approve raid</button><button disabled={!reviewReason.trim()} onClick={() => { approveRaidRecommendation(raid.recommendationId, 'DECLINED', reviewReason); setReviewReason(''); }} className="rounded bg-slate-800 px-2 py-1 text-[10px] font-bold text-slate-300 disabled:opacity-40">Decline with reason</button></div>
            </div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function GovtAuditorDashboard() {
  const {
    nodes, anomalies, dispatchRaid, liveIncidents,
    selectedJurisdiction, setSelectedJurisdiction,
    activeOfficerLevel, setActiveOfficerLevel,
    OFFICER_HIERARCHY, STATE_DISTRICT_DIRECTORY,
    language, setActiveEvidenceModal,
    injectVolumeAnomalySimulation,
    auditLog, LICENSE_REGISTRY, batches, ndlmVerificationCases, updateNdlmVerification,
    riskAnomalies, riskAggregates, raidRecommendations, reviewRiskAnomaly, approveRaidRecommendation,
  } = useAnveshana();

  const mapRef         = useRef(null);
  const mapInstanceRef = useRef(null);

  const [activeTab,            setActiveTab]            = useState('OPERATIONS');
  const [selectedDistrictName, setSelectedDistrictName] = useState('ALL');
  const [showRaidModal,        setShowRaidModal]        = useState(false);
  const [selectedRaidAnomaly,  setSelectedRaidAnomaly]  = useState(null);
  const [raidStep,             setRaidStep]             = useState(0);
  const [auditFilter,          setAuditFilter]          = useState('ALL');
  const [selectedVerificationId, setSelectedVerificationId] = useState(null);
  const [fieldEvidence, setFieldEvidence] = useState({ earTagSeen: false, animalMatches: false, ownerConfirmed: false, vaccinationChecked: false, notes: '' });

  const isHindi = language === 'HI';
  const currentJurisdictionData = STATE_DISTRICT_DIRECTORY[selectedJurisdiction] || STATE_DISTRICT_DIRECTORY['FSSAI-DL'];
  const districtList            = currentJurisdictionData.districts || [];
  const currentOfficerProfile   = OFFICER_HIERARCHY[activeOfficerLevel] || OFFICER_HIERARCHY['STATE_COMMISSIONER'];

  // ── Computed Scope ──────────────────────────────────────────────────────
  const isAllDistricts = !selectedDistrictName || selectedDistrictName === 'ALL' || selectedDistrictName.toLowerCase().startsWith('all');

  const visibleNodes = useMemo(() => {
    let filtered = nodes;
    if (activeOfficerLevel === 'NATIONAL_DIRECTOR') {
      if (!isAllDistricts) {
        filtered = filtered.filter(n => n.district.toLowerCase() === selectedDistrictName.toLowerCase());
      }
      return filtered;
    }

    // State Jurisdiction Filter
    const targetState = currentJurisdictionData.state;
    filtered = filtered.filter(n => n.state === targetState);

    if (!isAllDistricts) {
      filtered = filtered.filter(n => n.district.toLowerCase() === selectedDistrictName.toLowerCase());
    }

    if (activeOfficerLevel === 'FOOD_SAFETY_OFFICER') {
      return filtered.slice(0, 1);
    }
    return filtered;
  }, [nodes, activeOfficerLevel, selectedJurisdiction, selectedDistrictName, currentJurisdictionData, isAllDistricts]);

  const visibleAnomalies = useMemo(() => {
    const ids = new Set(visibleNodes.map(n => n.nodeId));
    return anomalies.filter(a => ids.has(a.nodeId));
  }, [anomalies, visibleNodes]);

  // ── KPI Metrics ─────────────────────────────────────────────────────────
  const raidedCount      = anomalies.filter(a => a.status === 'RAID_DISPATCHED').length;
  const activeAnomalies  = anomalies.filter(a => a.status !== 'RAID_DISPATCHED').length;
  const avgRisk          = anomalies.length
    ? Math.round(anomalies.reduce((s, a) => s + a.riskScore, 0) / anomalies.length)
    : 0;
  const compliantNodes   = LICENSE_REGISTRY ? LICENSE_REGISTRY.filter(l => l.status === 'COMPLIANT').length : 0;
  const compliancePct    = LICENSE_REGISTRY ? Math.round((compliantNodes / LICENSE_REGISTRY.length) * 100) : 0;
  const batchesInTransit = (batches || []).filter(batch => batch.batchStatus === 'IN_TRANSIT').length;

  // ── Simulated 7-day Anomaly Trend ───────────────────────────────────────
  const anomalyTrend = [1, 3, 2, 4, 3, 5, anomalies.length];
  const stateCompliance = [
    { state: 'Delhi NCR', pct: 94, color: 'emerald' },
    { state: 'Haryana',   pct: 78, color: 'amber'   },
    { state: 'UP',        pct: 62, color: 'amber'   },
    { state: 'Maharashtra', pct: 88, color: 'emerald' },
    { state: 'Gujarat',   pct: 91, color: 'emerald' },
    { state: 'Punjab',    pct: 55, color: 'rose'    },
  ];
  const donutSegments = [
    { pct: 35, color: '#ef4444', label: 'Critical' },
    { pct: 45, color: '#f59e0b', label: 'High'     },
    { pct: 20, color: '#10b981', label: 'Nominal'  },
  ];

  const selectedVerification = ndlmVerificationCases.find(item => item.verificationId === selectedVerificationId);
  const setVisitStatus = (status) => selectedVerification && updateNdlmVerification(selectedVerification.verificationId, { visitStatus: status, status: status === 'REACHED' ? 'FIELD_REVIEW' : 'VISIT_PLANNED' });
  const submitVerificationDecision = (status) => {
    if (!selectedVerification) return;
    updateNdlmVerification(selectedVerification.verificationId, { status, fieldEvidence: { ...fieldEvidence, checkedAt: new Date().toISOString() }, verificationStatus: status });
    setSelectedVerificationId(null);
    setFieldEvidence({ earTagSeen: false, animalMatches: false, ownerConfirmed: false, vaccinationChecked: false, notes: '' });
  };

  // ── Leaflet Map ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== 'OPERATIONS') return;
    if (!mapRef.current) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current, {
      center: currentJurisdictionData.center || [29.2000, 76.4000],
      zoom: currentJurisdictionData.zoom || 8,
      zoomControl: true,
      attributionControl: false
    });

    const tileLayerUrl = import.meta.env.VITE_MAP_TILE_LAYER || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    L.tileLayer(tileLayerUrl, { maxZoom: 19, subdomains: 'abc' }).addTo(map);
    mapInstanceRef.current = map;

    // Center and Fit Bounds
    if (visibleNodes.length > 1) {
      const bounds = L.latLngBounds(visibleNodes.map(n => [n.coordinates.lat, n.coordinates.lng]));
      map.fitBounds(bounds, { padding: [35, 35], maxZoom: 13 });
    } else if (visibleNodes.length === 1) {
      map.setView([visibleNodes[0].coordinates.lat, visibleNodes[0].coordinates.lng], 12);
    } else {
      map.setView(currentJurisdictionData.center || [29.2000, 76.4000], currentJurisdictionData.zoom || 8);
    }

    // Add Markers for all nodes in scope
    visibleNodes.forEach(node => {
      const nodeAnoms = visibleAnomalies.filter(a => a.nodeId === node.nodeId);
      const maxRisk   = nodeAnoms.length > 0 ? Math.max(...nodeAnoms.map(a => a.riskScore)) : 10;
      const pinColor  = maxRisk >= 80 ? '#ef4444' : maxRisk >= 50 ? '#f59e0b' : '#10b981';

      const icon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="position:relative;display:flex;align-items:center;justify-content:center;cursor:pointer;">
            ${maxRisk >= 80 ? `<div style="position:absolute;width:34px;height:34px;background:rgba(239,68,68,0.4);border-radius:50%;animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>` : ''}
            <div style="width:26px;height:26px;background:${pinColor};border:2px solid white;border-radius:50%;box-shadow:0 0 12px ${pinColor};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:#000;">
              ${maxRisk >= 50 ? '!' : 'OK'}
            </div>
          </div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
        popupAnchor: [0, -13]
      });

      const marker = L.marker([node.coordinates.lat, node.coordinates.lng], { icon }).addTo(map);
      marker.on('click', () => map.flyTo([node.coordinates.lat, node.coordinates.lng], 13, { duration: 1.2 }));
      marker.bindPopup(`
        <div style="padding:6px;min-width:180px;color:#f8fafc;font-family:sans-serif;">
          <div style="font-size:11px;font-weight:800;color:#10b981;letter-spacing:0.5px;">${node.nodeId} (${node.type})</div>
          <div style="font-size:13px;font-weight:800;color:#ffffff;margin-top:2px;">${node.name}</div>
          <div style="font-size:11px;color:#94a3b8;margin-top:4px;">District: <b>${node.district}</b> • ${node.state}</div>
          <div style="font-size:11px;color:${pinColor};font-weight:800;margin-top:4px;background:rgba(15,23,42,0.6);padding:2px 6px;border-radius:4px;display:inline-block;">Risk Rating: ${maxRisk}/100</div>
        </div>`);
    });

    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [selectedJurisdiction, visibleNodes, visibleAnomalies, activeOfficerLevel, activeTab, currentJurisdictionData]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleDistrictChange = (distName) => {
    setSelectedDistrictName(distName);
    if (!mapInstanceRef.current) return;
    if (!distName || distName === 'ALL' || distName.toLowerCase().startsWith('all')) {
      if (visibleNodes.length > 1) {
        const bounds = L.latLngBounds(visibleNodes.map(n => [n.coordinates.lat, n.coordinates.lng]));
        mapInstanceRef.current.fitBounds(bounds, { padding: [35, 35], maxZoom: 13 });
      } else {
        mapInstanceRef.current.flyTo(currentJurisdictionData.center, currentJurisdictionData.zoom || 8, { duration: 1.2 });
      }
    } else {
      const distObj = districtList.find(d => d.name === distName || d.nameHindi === distName);
      if (distObj) mapInstanceRef.current.flyTo([distObj.lat, distObj.lng], distObj.zoom || 11, { duration: 1.5 });
    }
  };

  const handleStateChange = (code) => {
    setSelectedJurisdiction(code);
    setSelectedDistrictName('ALL');
    const newData = STATE_DISTRICT_DIRECTORY[code];
    if (newData && mapInstanceRef.current)
      mapInstanceRef.current.flyTo(newData.center, newData.zoom, { duration: 1.5 });
  };

  const handleStartRaidProtocol = (anomaly) => {
    setSelectedRaidAnomaly(anomaly);
    setShowRaidModal(true);
    setRaidStep(1);
    setTimeout(() => { setRaidStep(2);
      setTimeout(() => { setRaidStep(3);
        setTimeout(() => {
          setRaidStep(4);
          dispatchRaid(anomaly.anomalyId);
        }, 1200);
      }, 1200);
    }, 1200);
  };

  const exportAuditCsv = () => {
    const headers = ['ID', 'Timestamp', 'Officer ID', 'Officer Name', 'Action', 'Target Node', 'Status', 'Evidence Hash'];
    const rows = auditLog.map(e => [
      e.id, e.timestamp, e.officerId, e.officerName, e.action, e.targetNode, e.status, e.evidenceHash
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `fssai_audit_log_${Date.now()}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const exportAuditPdf = () => {
    window.print();
  };

  const filteredAuditLog = auditFilter === 'ALL'
    ? auditLog
    : auditLog.filter(e => e.action.includes(auditFilter));

  // ────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto my-4 bg-[#090d1a]/95 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 space-y-5">

      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center shadow-lg"><Landmark className="h-7 w-7 text-amber-400" /></div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold text-amber-400 tracking-wider uppercase">
                {isHindi ? 'अन्वेषण डीपीआई कमान' : 'ANVESHANA DPI COMMAND'}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-rose-400 font-mono bg-rose-950 px-2 py-0.5 rounded border border-rose-500/30">
                <Radio className="w-3 h-3 animate-pulse" /> {isHindi ? 'लाइव' : 'LIVE TELEMETRY'}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              {isHindi ? 'एफएसएसएआई ऑडिटर कमांड सेंटर' : 'FSSAI State Auditor Command Center'}
            </h2>
          </div>
        </div>

        {/* Jurisdiction selector + Quick Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* State selector */}
          <div className="relative">
            <label className="text-[9px] text-slate-500 font-mono block mb-0.5 uppercase">Jurisdiction</label>
            <div className="relative">
              <select
                value={selectedJurisdiction}
                onChange={e => handleStateChange(e.target.value)}
                className="appearance-none bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold pl-3 pr-8 py-2 rounded-xl focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {Object.keys(STATE_DISTRICT_DIRECTORY).map(k => (
                  <option key={k} value={k}>{STATE_DISTRICT_DIRECTORY[k].state}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Active badge */}
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-500 font-mono uppercase">Officer</span>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950 px-2.5 py-1.5 rounded-xl border border-emerald-500/30 font-bold">{currentOfficerProfile.badge}</span>
          </div>

          {/* Inject simulation button */}
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-500 font-mono uppercase">Sim</span>
            <button
              onClick={() => { injectVolumeAnomalySimulation(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-[11px] font-bold rounded-xl transition-all"
            >
              <Zap className="w-3 h-3" /> Inject Anomaly
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI METRICS BAR ─────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        <KpiCard icon={Activity}    label="Nodes Online"        value={`${visibleNodes.length}/${nodes.length}`} sub="in jurisdiction scope" accent="emerald" />
        <KpiCard icon={AlertTriangle} label="Active Anomalies"  value={activeAnomalies}  sub="pending investigation" accent="rose"    pulse={activeAnomalies > 0} />
        <KpiCard icon={Send}        label="Raids Dispatched"    value={raidedCount}      sub="flying squads en-route" accent="amber" />
        <KpiCard icon={RefreshCw}   label="Batches In Transit"  value={batchesInTransit} sub="live movement records" accent="blue" />
        <KpiCard icon={Shield}      label="Compliance Score"    value={`${compliancePct}%`} sub={`${compliantNodes}/${LICENSE_REGISTRY?.length || 0} nodes compliant`} accent="emerald" />
        <KpiCard icon={TrendingUp}  label="Avg Risk Score"      value={avgRisk}          sub="across all anomalies" accent={avgRisk > 70 ? 'rose' : avgRisk > 50 ? 'amber' : 'emerald'} />
        <KpiCard icon={BarChart2}   label="Audit Log Entries"   value={auditLog.length}  sub="immutable records"    accent="blue" />
      </div>

      {/* ── RBAC + TAB NAVIGATOR ────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-amber-500/20">
        {/* Officer Hierarchy */}
        <div className="flex flex-wrap gap-2">
          {Object.keys(OFFICER_HIERARCHY).map(key => {
            const prof = OFFICER_HIERARCHY[key];
            const isActive = activeOfficerLevel === key;
            return (
              <button
                key={key}
                onClick={() => {
                  setActiveOfficerLevel(key);
                  if (key === 'DISTRICT_MAGISTRATE' && selectedDistrictName === 'ALL') {
                    handleDistrictChange(districtList[1]?.name || 'ALL');
                  }
                }}
                className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all ${
                  isActive
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className={`font-mono mr-1 text-[9px] px-1 py-0.5 rounded ${isActive ? 'bg-amber-400 text-slate-950' : 'bg-slate-800'}`}>{prof.scopeType}</span>
                {isHindi ? prof.titleHindi.split(' ')[0] : prof.title.split(' ')[0]}
              </button>
            );
          })}
        </div>

        {/* Section Tabs */}
        <div className="flex gap-2">
          <TabBtn label="Operations"       icon={MapPin}      active={activeTab === 'OPERATIONS'} onClick={() => setActiveTab('OPERATIONS')} />
          <TabBtn label="Analytics"        icon={BarChart2}   active={activeTab === 'ANALYTICS'}  onClick={() => setActiveTab('ANALYTICS')}  />
          <TabBtn label="Registry & Audit" icon={ClipboardList} active={activeTab === 'AUDIT'}   onClick={() => setActiveTab('AUDIT')}      />
          <TabBtn label="NDLM Verification" icon={ClipboardCheck} active={activeTab === 'VERIFICATION'} onClick={() => setActiveTab('VERIFICATION')} />
          <TabBtn label="Risk Control"     icon={ShieldAlert} active={activeTab === 'RISK'} onClick={() => setActiveTab('RISK')} />
        </div>
      </div>

      {activeTab === 'RISK' && (
        <ExplainableRiskPanel
          riskAnomalies={riskAnomalies || []}
          riskAggregates={riskAggregates || []}
          raidRecommendations={raidRecommendations || []}
          reviewRiskAnomaly={reviewRiskAnomaly}
          approveRaidRecommendation={approveRaidRecommendation}
        />
      )}

      {activeTab === 'VERIFICATION' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div><h3 className="text-base font-bold text-white">NDLM animal verification queue</h3><p className="text-xs text-slate-400 mt-1">Review farmer submissions, plan a field visit, and record evidence before activation.</p></div>
            <span className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300">{ndlmVerificationCases.filter(item => item.status !== 'VERIFIED').length} pending</span>
          </div>
          {ndlmVerificationCases.length === 0 ? <div className="rounded-xl border border-slate-800 bg-slate-950 p-10 text-center text-sm text-slate-400">No farmer registrations are waiting for field verification.</div> : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {ndlmVerificationCases.map(item => {
                const statusStyle = item.status === 'VERIFIED' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : item.visitStatus === 'REACHED' ? 'border-sky-500/40 bg-sky-500/10 text-sky-300' : item.visitStatus === 'VISIT_PLANNED' ? 'border-amber-500/40 bg-amber-500/10 text-amber-300' : 'border-rose-500/40 bg-rose-500/10 text-rose-300';
                return <button key={item.verificationId} onClick={() => setSelectedVerificationId(item.verificationId)} className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-left hover:border-amber-500/50 transition-colors">
                  <div className="flex items-start justify-between gap-3"><div><div className="text-sm font-bold text-white">{item.animalName || 'Unnamed animal'} · {item.breed}</div><div className="mt-1 text-xs font-mono text-emerald-400">Tag #{item.ndlmTag}</div></div><span className={`rounded-lg border px-2 py-1 text-[10px] font-bold ${statusStyle}`}>{item.status}</span></div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400"><span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{item.village}, {item.district}</span><span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{fmtTs(item.submittedAt)}</span><span>Type: {item.breed}</span><span>Yield: <b className="text-emerald-400">{item.estimatedYieldKg} kg</b></span></div>
                </button>;
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'VERIFICATION' && selectedVerification && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border border-amber-500/40 bg-slate-900 p-6 space-y-5">
            <div className="flex items-start justify-between border-b border-slate-700 pb-3"><div><h3 className="text-lg font-bold text-white">Field verification: {selectedVerification.animalName || selectedVerification.ndlmTag}</h3><p className="text-xs text-slate-400 mt-1">Submitted {fmtTs(selectedVerification.submittedAt)} · {selectedVerification.village}, {selectedVerification.district}</p></div><button onClick={() => setSelectedVerificationId(null)} className="text-slate-400 hover:text-white">Close</button></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs"><div className="rounded-lg bg-slate-800 p-3"><span className="block text-slate-400">Animal type</span><b className="text-white">{selectedVerification.breed}</b></div><div className="rounded-lg bg-slate-800 p-3"><span className="block text-slate-400">Ear tag</span><b className="font-mono text-emerald-400">{selectedVerification.ndlmTag}</b></div><div className="rounded-lg bg-slate-800 p-3"><span className="block text-slate-400">System yield</span><b className="text-emerald-400">{selectedVerification.estimatedYieldKg} kg</b></div><div className="rounded-lg bg-slate-800 p-3"><span className="block text-slate-400">Visit status</span><b className="text-amber-300">{selectedVerification.visitStatus}</b></div></div>
            <div className="flex flex-wrap gap-2"><button onClick={() => setVisitStatus('VISIT_PLANNED')} className="flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950"><Navigation2 className="h-4 w-4" /> Plan visit</button><button onClick={() => setVisitStatus('REACHED')} className="flex items-center gap-2 rounded-lg bg-sky-500 px-3 py-2 text-xs font-bold text-slate-950"><MapPin className="h-4 w-4" /> Mark reached</button><span className="flex items-center gap-1 text-xs text-slate-400"><Camera className="h-4 w-4" /> Capture/check visual evidence below</span></div>
            <div className="space-y-2 text-sm text-slate-300">{[['earTagSeen', 'RFID / ear tag physically matches'], ['animalMatches', 'Animal appearance matches submitted record'], ['ownerConfirmed', 'Owner and location confirmed'], ['vaccinationChecked', 'Vaccination/health record checked']].map(([key, label]) => <label key={key} className="flex items-center gap-2"><input type="checkbox" checked={fieldEvidence[key]} onChange={e => setFieldEvidence({ ...fieldEvidence, [key]: e.target.checked })} className="accent-emerald-500" />{label}</label>)}</div>
            <textarea value={fieldEvidence.notes} onChange={e => setFieldEvidence({ ...fieldEvidence, notes: e.target.value })} placeholder="Visual evidence notes: tag condition, coat/markings, sex, approximate age, vaccination card, GPS/site observations" className="w-full min-h-24 rounded-lg border border-slate-700 bg-slate-800 p-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none" />
            <div className="flex gap-2"><button onClick={() => submitVerificationDecision('VERIFIED')} disabled={!Object.values(fieldEvidence).slice(0, 4).every(Boolean)} className="flex-1 rounded-lg bg-emerald-500 py-3 text-xs font-extrabold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40">Verify and activate animal</button><button onClick={() => submitVerificationDecision('REJECTED')} className="rounded-lg border border-rose-500/50 px-4 py-3 text-xs font-bold text-rose-300">Reject / return</button></div>
          </div>
        </div>
      )}

      {/* Scope banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800 text-slate-300 font-mono">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-amber-400 font-bold"><Target className="h-3.5 w-3.5" /> SCOPE:</span>
          <span>
            {activeOfficerLevel === 'NATIONAL_DIRECTOR'  && 'All India — Unlimited National Access'}
            {activeOfficerLevel === 'STATE_COMMISSIONER' && `State-Wide — ${currentJurisdictionData.state} (${visibleNodes.length} Nodes)`}
            {activeOfficerLevel === 'DISTRICT_MAGISTRATE'&& `District — ${selectedDistrictName} (${visibleNodes.length} Nodes)`}
            {activeOfficerLevel === 'FOOD_SAFETY_OFFICER'&& `Block Inspector — ${visibleNodes[0]?.name || 'Node'}`}
          </span>
        </div>
        <span className="text-emerald-400 font-bold text-[11px]">
          Visible Anomalies: {visibleAnomalies.length} / {anomalies.length}
        </span>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          TAB: OPERATIONS
      ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'OPERATIONS' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

            {/* GIS Map + District filter */}
            <div className="lg:col-span-7 space-y-3">
              <div className="glass-panel p-5 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      {isHindi ? 'जिला विसंगति हीटमैप' : 'DISTRICT ANOMALY HEATMAP'}
                    </h3>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                    {isHindi ? `ज़ूम: ${selectedDistrictName}` : `Zoom: ${selectedDistrictName}`}
                  </span>
                </div>

                {/* District filter pills */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {districtList.map(d => (
                    <button
                      key={d.name}
                      onClick={() => handleDistrictChange(d.name)}
                      className={`text-[10px] px-2.5 py-1 rounded-full border font-mono transition-all ${
                        selectedDistrictName === d.name
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {isHindi ? d.nameHindi : d.name.split(' ')[0]}
                    </button>
                  ))}
                </div>

                <div ref={mapRef} className="w-full h-96 rounded-xl overflow-hidden border border-slate-800 shadow-inner z-0" />

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> {isHindi ? 'गंभीर (80+)' : 'Critical (80+)'}</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> {isHindi ? 'उच्च (50-79)' : 'High (50-79)'}</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> {isHindi ? 'सामान्य' : 'Nominal (<50)'}</span>
                  </div>
                  <span className="font-mono text-emerald-400 font-bold">Nodes on Map: {visibleNodes.length}</span>
                </div>
              </div>
            </div>

            {/* Priority Raid Index */}
            <div className="lg:col-span-5 space-y-3">
              <div className="glass-panel p-5 rounded-2xl">
                <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      {isHindi ? 'प्राथमिकता छापा सूचकांक' : 'PRIORITY RAID INDEX'}
                    </h3>
                  </div>
                  <span className="text-[10px] text-rose-400 font-bold bg-rose-950 px-2 py-0.5 rounded border border-rose-500/30">
                    {visibleAnomalies.length} {isHindi ? 'लक्ष्य' : 'Targets'}
                  </span>
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {visibleAnomalies.length === 0 && (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
                      No active anomalies in this scope
                    </div>
                  )}
                  {visibleAnomalies.map((ano, idx) => {
                    const isDispatched = ano.status === 'RAID_DISPATCHED';
                    return (
                      <div key={ano.anomalyId} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 hover:border-amber-500/30 transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-900 text-amber-400 text-xs font-mono font-bold flex items-center justify-center border border-amber-500/30">#{idx + 1}</span>
                            <span className="font-bold text-xs text-white">{ano.nodeName}</span>
                          </div>
                          <span className="font-mono text-xs font-extrabold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-500/40">
                            [{ano.riskScore}]
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-snug">{ano.details}</p>
                        <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                          {!isDispatched ? (
                            <button
                              onClick={() => handleStartRaidProtocol(ano)}
                              className="px-3 py-1.5 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-bold text-[11px] rounded-lg shadow flex items-center gap-1"
                            >
                              <Send className="w-3 h-3" />
                              <span>{isHindi ? 'उड़न दस्ता रवाना' : 'Dispatch Flying Squad'}</span>
                            </button>
                          ) : (
                            <div className="text-[11px] font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{isHindi ? 'उड़न दस्ता मार्ग पर' : 'Flying Squad En-Route'}</span>
                            </div>
                          )}
                          <button
                            onClick={() => setActiveEvidenceModal({
                              type: 'ANOMALY',
                              title: `SHA-256 Audit Package (${ano.anomalyId})`,
                              hash: `sha256:${ano.anomalyId.toLowerCase()}`,
                              data: ano
                            })}
                            className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-mono"
                          >
                            <FileText className="w-3 h-3" />
                            <span>{isHindi ? 'साक्ष्य पैकेज →' : 'Evidence Package →'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Live Incident Feed */}
          <div className="glass-panel p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  {isHindi ? 'लाइव घटना फ़ीड' : 'LIVE INCIDENT FEED (WEBSOCKET CHANNEL)'}
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Channel: room:govt-{selectedJurisdiction.toLowerCase()} · {liveIncidents.length} events
              </span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {liveIncidents.map(inc => (
                <div key={inc.id} className="flex items-center justify-between bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-xs font-mono">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 shrink-0">{inc.time}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      inc.type === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : inc.type === 'HIGH'   ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    }`}>{inc.type}</span>
                    <span className="text-slate-200">{inc.text}</span>
                  </div>
                  <span className="text-[10px] text-emerald-400/80 shrink-0">Socket ACK RECEIVED</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB: ANALYTICS
      ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'ANALYTICS' && (
        <div className="space-y-5">

          {/* Node Status Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Operational', count: nodes.length - anomalies.filter(a=>a.status!=='RAID_DISPATCHED').length, color: 'emerald', icon: CheckCircle2 },
              { label: 'Flagged',     count: anomalies.filter(a=>a.status!=='RAID_DISPATCHED').length, color: 'amber', icon: AlertTriangle },
              { label: 'Raided',      count: raidedCount, color: 'rose', icon: Send },
              { label: 'Expired Lic.',count: LICENSE_REGISTRY?.filter(l=>l.status==='EXPIRED').length || 0, color: 'purple', icon: Lock },
            ].map(s => (
              <div key={s.label} className={`p-4 rounded-2xl border ${
                s.color==='emerald' ? 'bg-emerald-500/10 border-emerald-500/30' :
                s.color==='amber'   ? 'bg-amber-500/10 border-amber-500/30' :
                s.color==='rose'    ? 'bg-rose-500/10 border-rose-500/30' :
                'bg-purple-500/10 border-purple-500/30'
              } flex items-center gap-3`}>
                <s.icon className={`w-8 h-8 ${
                  s.color==='emerald' ? 'text-emerald-400' :
                  s.color==='amber'   ? 'text-amber-400'   :
                  s.color==='rose'    ? 'text-rose-400'    :
                  'text-purple-400'
                }`} />
                <div>
                  <div className={`text-2xl font-black ${
                    s.color==='emerald' ? 'text-emerald-400' :
                    s.color==='amber'   ? 'text-amber-400'   :
                    s.color==='rose'    ? 'text-rose-400'    :
                    'text-purple-400'
                  }`}>{s.count}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Anomaly Trend (Sparkline) */}
            <div className="glass-panel p-5 rounded-2xl lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Anomaly Trend — Last 7 Days</h3>
                </div>
                <span className="text-[10px] text-amber-400 font-mono font-bold">SIMULATED</span>
              </div>
              <div className="flex items-end gap-2 mt-2">
                {['Mon','Tue','Wed','Thu','Fri','Sat','Today'].map((day, i) => {
                  const val = anomalyTrend[i];
                  const maxV = Math.max(...anomalyTrend, 1);
                  const hPct = Math.round((val / maxV) * 100);
                  const today = i === 6;
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-1">
                      <span className={`text-[11px] font-mono font-bold ${today ? 'text-rose-400' : 'text-amber-400'}`}>{val}</span>
                      <div className="w-full bg-slate-800 rounded-t-sm overflow-hidden" style={{ height: '80px' }}>
                        <div
                          className={`w-full rounded-t-sm transition-all duration-700 ${today ? 'bg-gradient-to-t from-rose-600 to-rose-400' : 'bg-gradient-to-t from-amber-700 to-amber-400'}`}
                          style={{ height: `${hPct}%`, marginTop: `${100 - hPct}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono">{day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Risk Score Donut */}
            <div className="glass-panel p-5 rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Risk Distribution</h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-28 h-28 shrink-0">
                  <DonutChart segments={donutSegments} />
                </div>
                <div className="space-y-2 flex-1">
                  {donutSegments.map(s => (
                    <div key={s.label} className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: s.color }} />
                        <span className="text-slate-300 font-mono">{s.label}</span>
                      </div>
                      <span className="font-bold text-slate-200">{s.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Compliance Rate by State */}
          <div className="glass-panel p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Compliance Rate by State</h3>
            </div>
            <div className="space-y-3">
              {stateCompliance.map(s => <StateBar key={s.state} {...s} />)}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB: REGISTRY & AUDIT
      ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'AUDIT' && (
        <div className="space-y-5">

          {/* Audit Trail */}
          <div className="glass-panel p-5 rounded-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Audit Trail & Activity Log</h3>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> IMMUTABLE BLOCKCHAIN RECORD
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Filter */}
                <select
                  value={auditFilter}
                  onChange={e => setAuditFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-300 text-[11px] font-mono px-2 py-1.5 rounded-lg focus:outline-none focus:border-amber-500"
                >
                  <option value="ALL">All Actions</option>
                  <option value="RAID">Raids</option>
                  <option value="BATCH">Batch Events</option>
                  <option value="ANOMALY">Anomalies</option>
                  <option value="AUDIT">Audits</option>
                </select>
                <button
                  onClick={exportAuditCsv}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-bold rounded-lg transition-all"
                >
                  <Download className="w-3 h-3" /> Export CSV
                </button>
                <button
                  onClick={exportAuditPdf}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-bold rounded-lg transition-all"
                >
                  <FileText className="w-3 h-3" /> Print / PDF
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[11px] font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 uppercase text-[10px] tracking-wider">
                    <th className="text-left py-2 px-3">Timestamp</th>
                    <th className="text-left py-2 px-3">Officer</th>
                    <th className="text-left py-2 px-3">Action</th>
                    <th className="text-left py-2 px-3">Target Node</th>
                    <th className="text-left py-2 px-3">Status</th>
                    <th className="text-left py-2 px-3">Evidence Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {filteredAuditLog.map(entry => (
                    <tr
                      key={entry.id}
                      className={`hover:bg-slate-900/50 transition-colors ${
                        entry.action.includes('RAID') ? 'bg-rose-950/10' :
                        entry.action.includes('QUARANTINE') ? 'bg-amber-950/10' : ''
                      }`}
                    >
                      <td className="py-2 px-3 text-slate-400 whitespace-nowrap">{fmtTs(entry.timestamp)}</td>
                      <td className="py-2 px-3 text-slate-300 whitespace-nowrap">{entry.officerName}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          entry.action.includes('RAID') || entry.action.includes('CRITICAL') ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                          entry.action.includes('QUARANTINE') ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}>{entry.action}</span>
                      </td>
                      <td className="py-2 px-3 text-blue-400">{entry.targetNode}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          entry.status === 'EXECUTED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>{entry.status}</span>
                      </td>
                      <td className="py-2 px-3 text-amber-400/70 font-mono text-[10px] max-w-[160px] truncate" title={entry.evidenceHash}>
                        {entry.evidenceHash}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredAuditLog.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-xs">No audit entries match the current filter.</div>
              )}
            </div>
          </div>

          {/* FSSAI License Registry */}
          <div className="glass-panel p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">FSSAI License Registry</h3>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="text-emerald-400">{LICENSE_REGISTRY?.filter(l=>l.status==='COMPLIANT').length} Compliant</span>
                <span className="text-amber-400">{LICENSE_REGISTRY?.filter(l=>l.status==='EXPIRING_SOON').length} Expiring</span>
                <span className="text-rose-400">{LICENSE_REGISTRY?.filter(l=>l.status==='EXPIRED').length} Expired</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 uppercase text-[10px] tracking-wider">
                    <th className="text-left py-2 px-3">Node ID</th>
                    <th className="text-left py-2 px-3">Node Name</th>
                    <th className="text-left py-2 px-3">License Number</th>
                    <th className="text-left py-2 px-3">Expiry Date</th>
                    <th className="text-left py-2 px-3">Last Audit</th>
                    <th className="text-left py-2 px-3">Status</th>
                    <th className="text-left py-2 px-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {LICENSE_REGISTRY?.map(lic => (
                    <tr key={lic.nodeId} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-2 px-3 text-blue-400">{lic.nodeId}</td>
                      <td className="py-2 px-3 text-slate-200">{lic.nodeName}</td>
                      <td className="py-2 px-3 text-amber-400/80">{lic.licenseNo}</td>
                      <td className="py-2 px-3 text-slate-300">{lic.expiryDate}</td>
                      <td className="py-2 px-3 text-slate-400">{lic.lastAudit}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          lic.status === 'COMPLIANT'     ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                          lic.status === 'EXPIRING_SOON' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                          'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        }`}>{lic.status}</span>
                      </td>
                      <td className="py-2 px-3">
                        <button
                          onClick={() => setActiveEvidenceModal({
                            type: 'LICENSE',
                            title: `License Audit Package — ${lic.nodeId}`,
                            hash: `sha256:lic-${lic.licenseNo.toLowerCase()}`,
                            data: lic
                          })}
                          className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 font-mono"
                        >
                          <Eye className="w-3 h-3" /> View Audit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Officer Management */}
          <div className="glass-panel p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
              <UserCheck className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Officer Management</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] font-mono">
                <thead><tr className="border-b border-slate-800 text-slate-500 uppercase text-[10px]"><th className="text-left py-2 px-3">Role</th><th className="text-left py-2 px-3">Badge</th><th className="text-left py-2 px-3">Scope</th><th className="text-left py-2 px-3">Assignment</th><th className="text-left py-2 px-3">Status</th></tr></thead>
                <tbody className="divide-y divide-slate-900">{Object.values(OFFICER_HIERARCHY).map(profile => <tr key={profile.level}><td className="py-2 px-3 text-slate-200">{isHindi ? profile.titleHindi : profile.title}</td><td className="py-2 px-3 text-emerald-400">{profile.badge}</td><td className="py-2 px-3 text-amber-300">{profile.scopeType}</td><td className="py-2 px-3 text-slate-400">{profile.description}</td><td className="py-2 px-3"><span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-emerald-400">ACTIVE</span></td></tr>)}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── RAID DISPATCH MODAL ──────────────────────────────────────── */}
      {showRaidModal && selectedRaidAnomaly && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-lg w-full border border-rose-500/50 shadow-2xl space-y-5 animate-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-6 h-6 text-rose-400 animate-bounce" />
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    {isHindi ? 'एफएसएसएआई उड़न दस्ता प्रवर्तन' : 'FSSAI Flying Squad Enforcement Protocol'}
                  </h3>
                  <div className="text-[10px] font-mono text-rose-400">TARGET: {selectedRaidAnomaly.nodeName}</div>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-500/30 px-2.5 py-1 rounded-lg">WAR-ROOM</span>
            </div>

            {/* Stepper */}
            <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono">
              {['Target Lock', 'RBAC Warrant', 'Lock Evidence', 'Squad Sent'].map((step, i) => (
                <div key={i} className={`p-2 rounded-xl border ${
                  raidStep > i + 1 || (raidStep === i + 1)
                    ? (i === 3 && raidStep >= 4 ? 'bg-emerald-950 border-emerald-500 text-emerald-300' : 'bg-rose-950 border-rose-500 text-rose-300')
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}>{i + 1}. {step}</div>
              ))}
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-xs font-mono text-center py-6">
              {raidStep === 1 && (<><MapPin className="w-8 h-8 text-rose-400 animate-spin mx-auto mb-2" /><div className="text-white font-bold">{isHindi ? 'लक्ष्य GPS लॉक हो रहा है...' : 'Locking Target GPS Telemetry...'}</div><div className="text-rose-400 text-[11px] mt-1">{selectedRaidAnomaly.nodeId}</div></>)}
              {raidStep === 2 && (<><Shield className="w-8 h-8 text-amber-400 animate-pulse mx-auto mb-2" /><div className="text-white font-bold">{isHindi ? 'वारंट हस्ताक्षर हो रहा है...' : 'Signing RBAC Enforcement Warrant...'}</div><div className="text-slate-300 text-[11px] mt-1 font-sans">Issued by: {currentOfficerProfile.title}</div></>)}
              {raidStep === 3 && (<><FileText className="w-8 h-8 text-blue-400 animate-bounce mx-auto mb-2" /><div className="text-white font-bold">{isHindi ? 'क्रिप्टोग्राफिक साक्ष्य सील...' : 'Sealing Cryptographic Evidence Package...'}</div><div className="text-blue-400 text-[10px] mt-1">sha256:raid{Math.random().toString(16).slice(2, 12)}</div></>)}
              {raidStep >= 4 && (
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto"><ShieldAlert className="h-6 w-6" /></div>
                  <div className="text-emerald-400 font-extrabold text-sm">{isHindi ? 'उड़न दस्ता रवाना!' : 'Flying Squad En-Route to Site!'}</div>
                  <div className="text-slate-300 text-[11px] font-sans">{isHindi ? 'विशेष टास्क फोर्स रवाना। टिकट #884 ट्रैकिंग जारी।' : 'Special Enforcement Task Force dispatched. Real-time GPS tracking initialized (Ticket #884).'}</div>
                </div>
              )}
            </div>

            {raidStep >= 4 && (
              <button
                onClick={() => setShowRaidModal(false)}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow"
              >
                {isHindi ? 'पूर्ण / बंद करें' : 'DONE / CLOSE WAR-ROOM'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
