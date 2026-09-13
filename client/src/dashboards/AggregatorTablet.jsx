import React, { useState, useEffect } from 'react';
import { calculateDynamicYieldBound, useAnveshana } from '../context/AnveshanaContext';
import { Lock, Tablet, Wifi, WifiOff, AlertTriangle, CheckCircle2, QrCode, RefreshCw, Send, ShieldAlert, Cpu, HardDrive, Key, FileCheck, ArrowRight, X } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function AggregatorTablet() {
  const {
    farmers,
    addPourEvent,
    isOnline,
    pourEvents,
    setActiveEvidenceModal,
    language,
    createCollectionRequest,
    markPourPaid,
    ndlmVerificationCases,
    collectionRequests,
    submitAggregatorMeasurements,
    transferToChillingCenter
  } = useAnveshana();

  const isHindi = language === 'HI';

  const [selectedFarmerId, setSelectedFarmerId] = useState(farmers[0].farmerId);
  const selectedFarmer = farmers.find(f => f.farmerId === selectedFarmerId) || farmers[0];
  const dynamicYieldModel = calculateDynamicYieldBound({ farmer: selectedFarmer, pourEvents });
  const ineligibleAnimals = ndlmVerificationCases.filter(item => item.farmerId === selectedFarmer.farmerId && (item.pregnancyStatus === 'PREGNANT' || item.postCalvingRecovery));

  // Hardware Serial Telemetry Lock State (Essae-SN8831)
  const [amcuStream, setAmcuStream] = useState({
    weightKg: 8.5,
    fatPercent: 4.2,
    snfPercent: 8.7,
    hardwareStatus: 'LOCKED_SERIAL',
    chillerTempC: 3.8,
    gpsSealLocked: true
  });

  const [yieldViolationError, setYieldViolationError] = useState(null);
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [showManifestQR, setShowManifestQR] = useState(false);
  const [requestFarmerId, setRequestFarmerId] = useState('');
  const [requestSession, setRequestSession] = useState(new Date().getHours() < 14 ? 'MORNING' : 'EVENING');
  const [requestAmountKg, setRequestAmountKg] = useState('8');
  const [requestNotice, setRequestNotice] = useState(null);
  const [measurementRequestId, setMeasurementRequestId] = useState(null);
  const [measurements, setMeasurements] = useState({ weightKg: '', fatPercent: '', snfPercent: '', temperatureC: '', adulterationCheck: 'PASS', notes: '' });
  const [transferRequestId, setTransferRequestId] = useState(null);
  const [transferDetails, setTransferDetails] = useState({ destinationNodeId: 'MCC-KNL-01', amountKg: '', fatPercent: '', snfPercent: '', temperatureC: '', vehicleId: '', sealId: '', notes: '' });

  // Hardware Signing Interactive Simulation Modal State
  const [signingModal, setSigningModal] = useState({
    isOpen: false,
    step: 1, // 1: RS232 Serial Read, 2: HSM Secp256k1 Signature, 3: Yield Verification, 4: SHA-256 Digest & Payout
    payload: null,
    hardwareSignature: null,
    shaHash: null,
    payoutAmt: 0
  });

  // Live Hardware Simulation Stream
  useEffect(() => {
    const interval = setInterval(() => {
      setAmcuStream(prev => ({
        ...prev,
        weightKg: +(7.8 + Math.random() * 2.2).toFixed(1),
        fatPercent: +(3.9 + Math.random() * 0.5).toFixed(1),
        snfPercent: +(8.4 + Math.random() * 0.4).toFixed(1),
        chillerTempC: +(3.6 + Math.random() * 0.4).toFixed(1)
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleStartHardwareSigning = () => {
    setYieldViolationError(null);

    if (ineligibleAnimals.length === selectedFarmer.registeredCows && selectedFarmer.registeredCows > 0) {
      setYieldViolationError({
        farmerName: selectedFarmer.name,
        actualKg: amcuStream.weightKg,
        maxExpectedKg: 0,
        reason: isHindi ? 'सभी पंजीकृत पशु गर्भवती या प्रसवोत्तर रिकवरी में हैं। दूध संग्रह अस्थायी रूप से रोका गया है।' : 'Collection paused: all registered animals are pregnant or in post-calving recovery.'
      });
      return;
    }

    const maxExpectedKg = dynamicYieldModel.herdBound;

    if (amcuStream.weightKg > maxExpectedKg) {
      setYieldViolationError({
        farmerName: selectedFarmer.name,
        cows: selectedFarmer.registeredCows,
        maxExpectedKg,
        actualKg: amcuStream.weightKg,
        model: dynamicYieldModel,
        reason: isHindi
          ? `दूध का वजन ${amcuStream.weightKg}किग्रा गतिशील जैविक सीमा (${maxExpectedKg}किग्रा) से अधिक है। औसत ${dynamicYieldModel.rollingMean}किग्रा/पशु, चरण ${dynamicYieldModel.lactationDay} दिन।`
          : `Pour weight ${amcuStream.weightKg}kg exceeds the dynamic biological bound (${maxExpectedKg}kg). Rolling mean is ${dynamicYieldModel.rollingMean}kg/cow at lactation day ${dynamicYieldModel.lactationDay}.`
      });
      return;
    }

    const calculatedPayout = +(amcuStream.weightKg * (amcuStream.fatPercent * 6.5 + amcuStream.snfPercent * 4.2)).toFixed(2);
    const mockSignature = `0x8f3a${Math.random().toString(16).substring(2, 10)}9c0b1e4f${Math.random().toString(16).substring(2, 10)}`;
    const mockHash = `sha256:${Math.random().toString(16).substring(2, 18)}...${Math.random().toString(16).substring(2, 8)}`;

    const pourPayload = {
      farmerId: selectedFarmer.farmerId,
      farmerName: selectedFarmer.name,
      nodeId: 'VLC-22',
      weightKg: amcuStream.weightKg,
      fatPercent: amcuStream.fatPercent,
      snfPercent: amcuStream.snfPercent,
      yieldStatus: 'PASS',
      dynamicYieldModel
    };

    // Launch Hardware Signing Modal
    setSigningModal({
      isOpen: true,
      step: 1,
      payload: pourPayload,
      hardwareSignature: mockSignature,
      shaHash: mockHash,
      payoutAmt: calculatedPayout
    });

    // Step 1 -> 2
    setTimeout(() => {
      setSigningModal(prev => ({ ...prev, step: 2 }));
    }, 900);

    // Step 2 -> 3
    setTimeout(() => {
      setSigningModal(prev => ({ ...prev, step: 3 }));
    }, 1800);

    // Step 3 -> 4 (Final Confirmation)
    setTimeout(() => {
      setSigningModal(prev => ({ ...prev, step: 4 }));
      if (!isOnline) {
        setOfflineQueue(prev => [pourPayload, ...prev]);
      } else {
        const recordedPour = addPourEvent(pourPayload);
        setSigningModal(prev => ({ ...prev, payload: { ...prev.payload, eventId: recordedPour.eventId, paymentStatus: recordedPour.paymentStatus } }));
        confetti({ particleCount: 60, spread: 70 });
      }
    }, 2700);
  };

  const handleSyncOfflineQueue = () => {
    if (offlineQueue.length === 0) return;
    offlineQueue.forEach(item => addPourEvent(item));
    setOfflineQueue([]);
    confetti({ particleCount: 70 });
  };

  const handleCreateCollectionRequest = async () => {
    const farmer = farmers.find(item => item.farmerId === requestFarmerId);
    if (!farmer) return;
    const request = await createCollectionRequest({ farmerId: farmer.farmerId, nodeId: farmer.nodeId, requestedSession: requestSession, requestedAmountKg: requestAmountKg });
    setRequestNotice(`${request.farmerName} requested for ${request.requestedSession.toLowerCase()} collection at ${request.nodeId}`);
  };

  const activeMeasurementRequest = collectionRequests.find(request => request.requestId === measurementRequestId);
  const saveMeasurements = () => {
    if (!activeMeasurementRequest || !measurements.weightKg || !measurements.fatPercent || !measurements.snfPercent) return;
    submitAggregatorMeasurements(activeMeasurementRequest.requestId, measurements);
    setMeasurementRequestId(null);
    setMeasurements({ weightKg: '', fatPercent: '', snfPercent: '', temperatureC: '', adulterationCheck: 'PASS', notes: '' });
  };

  const activeTransferRequest = collectionRequests.find(request => request.requestId === transferRequestId);
  const saveTransfer = () => {
    if (!activeTransferRequest || !transferDetails.amountKg || !transferDetails.fatPercent || !transferDetails.snfPercent || !transferDetails.vehicleId || !transferDetails.sealId) return;
    transferToChillingCenter(activeTransferRequest.requestId, transferDetails);
    setTransferRequestId(null);
    setTransferDetails({ destinationNodeId: 'MCC-KNL-01', amountKg: '', fatPercent: '', snfPercent: '', temperatureC: '', vehicleId: '', sealId: '', notes: '' });
  };

  return (
    <div className="max-w-7xl mx-auto my-2 space-y-6">
      
      {/* Top Banner / Station Overview */}
      <div className="glass-panel p-5 rounded-2xl border border-teal-500/30 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 font-bold shadow-lg">
            <Tablet className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-teal-500/20 text-teal-400 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold border border-teal-500/30">
                STATION AMCU-VLC-22
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {isHindi ? 'निसिंग गांव संग्रह केंद्र (करनाल, हरियाणा)' : 'Nissing Village Collection Center (Karnal, HR)'}
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight mt-0.5">
              {isHindi ? 'संग्राहक एएमसीयू संग्रह और हार्डवेयर साइनिंग कंसोल' : 'Aggregator AMCU Milk Collection & Hardware Signing Console'}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Hardware Lock Badge */}
          <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-emerald-500/40 text-xs font-mono font-bold text-emerald-400 flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>ESSAE-SN8831 HSM LOCKED</span>
          </div>

          {/* Connection Status Badge */}
          <div className={`px-3.5 py-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 ${
            isOnline ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400' : 'bg-amber-950/80 border-amber-500/40 text-amber-400'
          }`}>
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4 animate-pulse" />}
            <span>
              {isOnline 
                ? (isHindi ? 'ऑनलाइन सिंक (लाइव)' : 'ONLINE SYNC (LIVE)') 
                : (isHindi ? `ऑफ़लाइन कतार (${offlineQueue.length})` : `OFFLINE QUEUE (${offlineQueue.length})`)}
            </span>
          </div>

          {!isOnline && offlineQueue.length > 0 && (
            <button
              onClick={handleSyncOfflineQueue}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md"
            >
              <RefreshCw className="w-4 h-4" /> {isHindi ? 'सिंक करें' : 'Sync'} ({offlineQueue.length})
            </button>
          )}
        </div>
      </div>

      {/* Main 12-Column Responsive Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Farmer Selection & Session Config (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                {isHindi ? 'किसान चुनें (NDLM टैग प्रमाणित)' : 'SELECT FARMER (NDLM TAG VERIFIED)'}
              </label>
              <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                NDLM Verified
              </span>
            </div>

            <select
              value={selectedFarmerId}
              onChange={(e) => setSelectedFarmerId(e.target.value)}
              className="w-full glass-input text-xs rounded-xl p-3 focus:outline-none text-white font-medium bg-slate-900 border border-slate-700"
            >
              {farmers.map((f) => (
                <option key={f.farmerId} value={f.farmerId} className="bg-slate-900 text-white">
                  {f.name} ({f.farmerId}) — {f.registeredCows} {isHindi ? 'मवेशी' : 'Cattle'}
                </option>
              ))}
            </select>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center pb-1.5 border-b border-slate-800">
                <span className="text-slate-400">NDLM RFID Ear Tag:</span>
                <span className="font-mono text-emerald-400 font-bold">{selectedFarmer.ndlmTag}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">{isHindi ? 'नस्ल और मवेशी संख्या:' : 'Breed & Cattle Count:'}</span>
                <span className="text-white font-semibold">{selectedFarmer.animalBreed} ({selectedFarmer.registeredCows} {isHindi ? 'मवेशी' : 'Cattle'})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">{isHindi ? 'गतिशील जैविक सीमा:' : 'Dynamic Biological Bound:'}</span>
                <span className="text-amber-400 font-mono font-bold">{dynamicYieldModel.herdBound} kg</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-400">{isHindi ? '7-दिन औसत / चरण:' : '7-day mean / lactation day:'}</span>
                <span className="text-teal-300 font-mono font-bold">{dynamicYieldModel.rollingMean} kg/cow · D{dynamicYieldModel.lactationDay}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-800 text-[11px]">
                <span className="text-slate-400">{isHindi ? 'अनुमानित भुगतान दर:' : 'Estimated Rate:'}</span>
                <span className="text-teal-300 font-mono font-bold">₹{(amcuStream.fatPercent * 6.5 + amcuStream.snfPercent * 4.2).toFixed(2)} / L</span>
              </div>
            </div>
          </div>
            <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-4 space-y-3">
              <div className="text-xs font-bold text-sky-200">Fast farmer collection request</div>
              <div className="flex gap-2">
                <input value={requestFarmerId} onChange={(e) => setRequestFarmerId(e.target.value)} list="farmer-id-list" placeholder="Enter Farmer ID" className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 p-2.5 text-xs text-white" />
                <datalist id="farmer-id-list">{farmers.map(farmer => <option key={farmer.farmerId} value={farmer.farmerId}>{farmer.name}</option>)}</datalist>
                <button onClick={handleCreateCollectionRequest} className="rounded-lg bg-sky-500 px-3 py-2 text-xs font-bold text-slate-950">Request</button>
              </div>
              <div className="text-[10px] text-slate-300">Auto location: <strong className="text-sky-300">{selectedFarmer.nodeId} · {selectedFarmer.district}, {selectedFarmer.state}</strong></div>
              <label className="block text-[10px] text-slate-300">Requested milk amount (kg)<input type="number" min="0.1" step="0.1" value={requestAmountKg} onChange={e => setRequestAmountKg(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 p-2.5 text-xs text-white" /></label>
              <div className="flex gap-2">{['MORNING', 'EVENING'].map(session => <button key={session} onClick={() => setRequestSession(session)} className={`rounded border px-2 py-1 text-[10px] font-bold ${requestSession === session ? 'border-sky-400 bg-sky-500/20 text-sky-200' : 'border-slate-700 text-slate-400'}`}>{session}</button>)}</div>
              {requestNotice && <div className="text-[10px] text-emerald-300">{requestNotice}</div>}
              <div className="text-[10px] text-slate-400">Nearby farmers: {farmers.filter(farmer => farmer.nodeId === selectedFarmer.nodeId).map(farmer => farmer.name).join(', ') || 'None'}</div>
              {ineligibleAnimals.length > 0 && <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-2 text-[10px] text-amber-200">{ineligibleAnimals.length} animal(s) marked pregnant/recovery. Collection will pause for those animals.</div>}
            </div>
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
              <div className="flex items-center justify-between"><div className="text-xs font-bold text-emerald-200">Farmer-approved milk requests</div><span className="text-[10px] text-slate-300">{collectionRequests.filter(request => request.farmerApproval === 'APPROVED').length} approved</span></div>
              {collectionRequests.filter(request => request.farmerApproval === 'APPROVED' && request.status !== 'MEASUREMENTS_RECORDED').map(request => <div key={request.requestId} className="rounded-lg border border-slate-700 bg-slate-900 p-3 text-xs"><div className="flex items-center justify-between"><div><b className="text-white">{request.farmerName}</b><div className="text-[10px] text-slate-400">{request.requestedSession} · {request.nodeId} · {request.district}</div></div><button onClick={() => setMeasurementRequestId(request.requestId)} className="rounded-lg bg-emerald-500 px-3 py-2 text-[10px] font-bold text-slate-950">Enter collection data</button></div><div className="mt-2 text-[10px] text-slate-400">Farmer reference yield: <b className="text-emerald-300">{calculateDynamicYieldBound({ farmer: farmers.find(farmer => farmer.farmerId === request.farmerId), pourEvents }).perCowBound} kg/animal</b>. Enter your independent scale and test readings below.</div></div>)}
              {collectionRequests.filter(request => request.farmerApproval === 'APPROVED').length === 0 && <div className="text-[10px] text-slate-400">No farmer-approved requests yet.</div>}
              {collectionRequests.filter(request => request.status === 'MEASUREMENTS_RECORDED').map(request => <div key={request.requestId} className="rounded-lg border border-slate-700 bg-slate-900 p-3 text-xs"><div className="flex justify-between"><b className="text-white">{request.farmerName} · readings recorded</b><span className={request.comparison?.withinDynamicBound ? 'text-emerald-300' : 'text-rose-300'}>{request.comparison?.withinDynamicBound ? 'Within bound' : 'Review variance'}</span></div><div className="mt-2 grid grid-cols-3 gap-2 text-[10px] text-slate-400"><span>Aggregator: <b className="text-white">{request.aggregatorMeasurements?.weightKg} kg</b></span><span>System: <b className="text-emerald-300">{request.expectedYieldKg} kg</b></span><span>Difference: <b className="text-amber-300">{request.comparison?.differenceKg} kg</b></span></div><button onClick={() => { setTransferRequestId(request.requestId); setTransferDetails(previous => ({ ...previous, amountKg: request.aggregatorMeasurements?.weightKg || '' })); }} className="mt-3 w-full rounded-lg bg-teal-500 px-3 py-2 text-[10px] font-extrabold text-slate-950">Transfer to chilling centre</button></div>)}
              {collectionRequests.filter(request => request.status === 'TRANSFERRED_TO_CHILLING_CENTER').map(request => <div key={request.requestId} className="rounded-lg border border-teal-500/30 bg-teal-500/10 p-3 text-xs"><div className="flex justify-between"><b className="text-teal-100">{request.farmerName} · transferred</b><span className="text-teal-300">CHILLING CENTRE</span></div><div className="mt-2 grid grid-cols-3 gap-2 text-[10px] text-slate-300"><span>Amount: <b>{request.transfer?.amountKg} kg</b></span><span>Fat: <b>{request.transfer?.fatPercent}%</b></span><span>SNF: <b>{request.transfer?.snfPercent}%</b></span></div><div className="mt-1 text-[10px] text-slate-400">Destination {request.transfer?.destinationNodeId} · Vehicle {request.transfer?.vehicleId} · Seal {request.transfer?.sealId}</div></div>)}
            </div>

          <button
            onClick={() => setShowManifestQR(true)}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-2xl border border-slate-700 flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <QrCode className="w-4 h-4 text-teal-400" />
            <span>{isHindi ? 'टैंकर प्रेषण मैनिफेस्ट QR बनाएं' : 'Generate Tanker Dispatch Manifest QR'}</span>
          </button>
        </div>

        {/* Right Column: Live Telemetry Gauges & Hardware Signing (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel-glow p-6 rounded-2xl border border-teal-500/40 relative space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-teal-400 animate-pulse" />
                <span className="text-xs font-extrabold text-teal-400 tracking-wider uppercase font-mono">
                  {isHindi ? 'एसाए-SN8831 एएमसीयू हार्डवेयर टेलीमेट्री स्ट्रीम' : 'ESSAE-SN8831 AMCU HARDWARE STREAM'}
                </span>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-mono bg-teal-950 text-teal-300 px-2.5 py-1 rounded-lg border border-teal-500/30">
                <Lock className="w-3.5 h-3.5 text-teal-400" /> READ-ONLY SERIAL LOCK
              </span>
            </div>

            {/* Read-Only Hardware Metric Telemetry Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">{isHindi ? 'दूध वजन' : 'MILK WEIGHT'}</div>
                <div className="text-2xl font-extrabold text-white font-mono mt-1">{amcuStream.weightKg} <span className="text-xs text-slate-400">kg</span></div>
                <div className="text-[9px] text-emerald-400 font-mono mt-1">Load-Cell Scale</div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">{isHindi ? 'फैट %' : 'FAT %'}</div>
                <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">{amcuStream.fatPercent}%</div>
                <div className="text-[9px] text-teal-400 font-mono mt-1">Ultrasonic Sensor</div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">{isHindi ? 'एसएनएफ %' : 'SNF %'}</div>
                <div className="text-2xl font-extrabold text-teal-400 font-mono mt-1">{amcuStream.snfPercent}%</div>
                <div className="text-[9px] text-teal-400 font-mono mt-1">Refractometer</div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">{isHindi ? 'चिलर तापमान' : 'CHILLER TEMP'}</div>
                <div className="text-2xl font-extrabold text-cyan-300 font-mono mt-1">{amcuStream.chillerTempC}°C</div>
                <div className="text-[9px] text-cyan-400 font-mono mt-1">Thermal Probe</div>
              </div>
            </div>

            {/* Dynamic AI Yield Violation Banner */}
            {yieldViolationError && (
              <div className="p-4 rounded-xl bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold text-rose-400">
                  <ShieldAlert className="w-5 h-5 text-rose-500" />
                  <span>{isHindi ? 'गतिशील जैविक उपज उल्लंघन — स्वतः निरस्त' : 'DYNAMIC BIOLOGICAL BOUND — AUTO-REJECTED'}</span>
                </div>
                <p className="text-[11px] leading-snug opacity-95">{yieldViolationError.reason}</p>
                <div className="text-[10px] text-rose-300 font-mono">
                  {isHindi ? 'Wood चरण मॉडल' : 'Wood lactation curve'} · μ {yieldViolationError.model.rollingMean} · σ {yieldViolationError.model.rollingStdDev} · S {yieldViolationError.model.seasonalFactor}
                </div>
                <div className="text-[10px] text-rose-300 font-mono bg-slate-950 p-2 rounded border border-rose-500/30">
                  {isHindi ? 'FSSAI जिला अलर्ट दर्ज किया गया • करनाल अधिकारी को एसएमएस अलर्ट भेजा गया' : 'FSSAI District Alert Logged • SMS alert dispatched to Karnal Officer'}
                </div>
              </div>
            )}

            {/* Main Interactive Action Button */}
            <button
              onClick={handleStartHardwareSigning}
              className="w-full py-4 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-400 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-2xl flex items-center justify-center gap-2 tracking-wider uppercase transition-all ring-1 ring-teal-400/40"
            >
              <Key className="w-5 h-5 text-slate-950" />
              <span>{isHindi ? 'स्वीकार करें और हार्डवेयर हस्ताक्षरित रसीद दर्ज करें' : 'ACCEPT & LOG HARDWARE SIGNED POUR RECEIPT'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Step-by-Step Hardware Cryptographic Signing Modal */}
      {signingModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-lg w-full border border-teal-500/50 space-y-5 relative animate-in fade-in zoom-in duration-200 shadow-2xl">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-teal-400 animate-spin" />
                <h3 className="text-base font-extrabold text-white">
                  {isHindi ? 'हार्डवेयर क्रिप्टोग्राफिक हस्ताक्षर सिमुलेशन' : 'IoT Hardware Cryptographic Signing Protocol'}
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-teal-400 bg-teal-950 px-2.5 py-0.5 rounded border border-teal-500/40">
                HSM Secp256k1
              </span>
            </div>

            {/* Step Progress Tracker */}
            <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono font-bold">
              <div className={`p-2 rounded-lg border ${signingModal.step >= 1 ? 'bg-teal-950 border-teal-500 text-teal-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                1. RS232 Read
              </div>
              <div className={`p-2 rounded-lg border ${signingModal.step >= 2 ? 'bg-teal-950 border-teal-500 text-teal-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                2. HSM Sign
              </div>
              <div className={`p-2 rounded-lg border ${signingModal.step >= 3 ? 'bg-teal-950 border-teal-500 text-teal-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                3. AI Verification
              </div>
              <div className={`p-2 rounded-lg border ${signingModal.step >= 4 ? 'bg-emerald-950 border-emerald-500 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                4. Payout Sent
              </div>
            </div>

            {/* Step Content Visualizer */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-xs space-y-3">
              {signingModal.step === 1 && (
                <div className="space-y-2 text-slate-300">
                  <div className="flex items-center gap-2 text-teal-400 font-bold">
                    <Cpu className="w-4 h-4 animate-pulse" />
                    <span>Phase 1: Reading RS232 Encrypted Telemetry</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Weight: {signingModal.payload?.weightKg}kg | Fat: {signingModal.payload?.fatPercent}% | SNF: {signingModal.payload?.snfPercent}%
                  </div>
                  <div className="text-[10px] text-slate-500">Hardware Serial: ESSAE-SN8831-VLC22</div>
                </div>
              )}

              {signingModal.step === 2 && (
                <div className="space-y-2 text-slate-300">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <Key className="w-4 h-4 animate-spin" />
                    <span>Phase 2: Generating Secp256k1 Hardware Signature</span>
                  </div>
                  <div className="text-[10px] text-amber-300 break-all bg-slate-900 p-2 rounded border border-amber-500/30">
                    {signingModal.hardwareSignature}
                  </div>
                </div>
              )}

              {signingModal.step === 3 && (
                <div className="space-y-2 text-slate-300">
                  <div className="flex items-center gap-2 text-teal-400 font-bold">
                    <FileCheck className="w-4 h-4 text-teal-400" />
                    <span>Phase 3: Dynamic Biological Yield Verification</span>
                  </div>
                  <div className="text-[11px] text-emerald-400 font-bold">
                    Dynamic Bound Passed ({signingModal.payload?.weightKg}kg ≤ {signingModal.payload?.dynamicYieldModel?.herdBound}kg)
                  </div>
                  <div className="text-[10px] text-slate-400 break-all">
                    Digest: {signingModal.shaHash}
                  </div>
                </div>
              )}

              {signingModal.step === 4 && (
                <div className="space-y-3 text-slate-300 text-center py-2 animate-in zoom-in">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400 mx-auto flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-extrabold text-white font-sans">
                    {isHindi ? 'हार्डवेयर रसीद क्रिप्टोग्राफिक रूप से लॉक!' : 'Hardware Receipt Cryptographically Locked!'}
                  </h4>
                  <div className="text-2xl font-extrabold text-emerald-400">
                    ₹{signingModal.payoutAmt} <span className="text-xs text-slate-400">Direct Bank Credit</span>
                  </div>
                  <div className="text-xs text-amber-300">Payment status: {signingModal.payload?.paymentStatus || 'PENDING_AGGREGATOR_CONFIRMATION'}</div>
                  <div className="text-[10px] text-slate-400">
                    Farmer: {signingModal.payload?.farmerName} ({signingModal.payload?.farmerId})
                  </div>
                </div>
              )}
            </div>

            {/* Action Footer */}
            {signingModal.step === 4 && (
              <div className="space-y-2">
                {signingModal.payload?.paymentStatus !== 'PAID' && <button onClick={() => { markPourPaid(signingModal.payload?.eventId); setSigningModal(prev => ({ ...prev, payload: { ...prev.payload, paymentStatus: 'PAID' } })); }} className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-xl uppercase tracking-wider">Mark payment confirmed</button>}
                <button onClick={() => setSigningModal(prev => ({ ...prev, isOpen: false }))} className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs rounded-xl uppercase tracking-wider">{isHindi ? 'पूर्ण / बंद करें' : 'Done / Close Receipt'}</button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeMeasurementRequest && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-emerald-500/40 bg-slate-900 p-6 space-y-4">
            <div className="flex items-start justify-between"><div><h3 className="text-base font-bold text-white">Record independent collection data</h3><p className="mt-1 text-xs text-slate-400">{activeMeasurementRequest.farmerName} · {activeMeasurementRequest.requestedSession}</p></div><button onClick={() => setMeasurementRequestId(null)} className="text-xs text-slate-400">Close</button></div>
            <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-3 text-xs text-sky-200">Farmer reference only: {calculateDynamicYieldBound({ farmer: farmers.find(farmer => farmer.farmerId === activeMeasurementRequest.farmerId), pourEvents }).perCowBound} kg/animal. These fields are entered by the aggregator and are not copied from the farmer.</div>
            <div className="grid grid-cols-3 gap-2">{[['weightKg', 'Weight kg'], ['fatPercent', 'Fat %'], ['snfPercent', 'SNF %']].map(([field, label]) => <label key={field} className="text-[10px] text-slate-400">{label}<input type="number" step="0.1" value={measurements[field]} onChange={e => setMeasurements({ ...measurements, [field]: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-sm text-white" /></label>)}</div>
            <div className="grid grid-cols-2 gap-2"><label className="text-[10px] text-slate-400">Temperature °C<input type="number" step="0.1" value={measurements.temperatureC} onChange={e => setMeasurements({ ...measurements, temperatureC: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-sm text-white" /></label><label className="text-[10px] text-slate-400">Adulteration check<select value={measurements.adulterationCheck} onChange={e => setMeasurements({ ...measurements, adulterationCheck: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-sm text-white"><option>PASS</option><option>FLAG</option></select></label></div>
            <textarea value={measurements.notes} onChange={e => setMeasurements({ ...measurements, notes: e.target.value })} placeholder="Aggregator notes" className="min-h-20 w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-sm text-white placeholder:text-slate-500" />
            <button onClick={saveMeasurements} className="w-full rounded-lg bg-emerald-500 py-3 text-xs font-extrabold text-slate-950">Save aggregator readings and compare</button>
          </div>
        </div>
      )}

      {activeTransferRequest && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-teal-500/40 bg-slate-900 p-6 space-y-4">
            <div className="flex items-start justify-between"><div><h3 className="text-base font-bold text-white">Transfer milk to chilling centre</h3><p className="mt-1 text-xs text-slate-400">Source {activeTransferRequest.nodeId} · {activeTransferRequest.farmerName}</p></div><button onClick={() => setTransferRequestId(null)} className="text-xs text-slate-400">Close</button></div>
            <div className="rounded-lg border border-teal-500/30 bg-teal-500/10 p-3 text-xs text-teal-200">Enter the aggregator’s transfer readings. This is a new custody record for the chilling centre, separate from the farmer and collection readings.</div>
            <label className="block text-[10px] text-slate-400">Destination chilling centre<select value={transferDetails.destinationNodeId} onChange={e => setTransferDetails({ ...transferDetails, destinationNodeId: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-sm text-white"><option>MCC-KNL-01</option><option>MCC-KTL-01</option><option>MCC-HSR-01</option><option>PLANT-KNL-01</option></select></label>
            <div className="grid grid-cols-3 gap-2">{[['amountKg', 'Amount kg'], ['fatPercent', 'Fat %'], ['snfPercent', 'SNF %']].map(([field, label]) => <label key={field} className="text-[10px] text-slate-400">{label}<input required type="number" step="0.1" value={transferDetails[field]} onChange={e => setTransferDetails({ ...transferDetails, [field]: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-sm text-white" /></label>)}</div>
            <div className="grid grid-cols-2 gap-2">{[['temperatureC', 'Temperature °C'], ['vehicleId', 'Vehicle / tanker ID'], ['sealId', 'Transfer seal ID']].map(([field, label]) => <label key={field} className="text-[10px] text-slate-400">{label}<input required type={field === 'temperatureC' ? 'number' : 'text'} step={field === 'temperatureC' ? '0.1' : undefined} value={transferDetails[field]} onChange={e => setTransferDetails({ ...transferDetails, [field]: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-sm text-white" /></label>)}</div>
            <textarea value={transferDetails.notes} onChange={e => setTransferDetails({ ...transferDetails, notes: e.target.value })} placeholder="Transfer notes" className="min-h-20 w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-sm text-white placeholder:text-slate-500" />
            <button onClick={saveTransfer} className="w-full rounded-lg bg-teal-500 py-3 text-xs font-extrabold text-slate-950">Confirm transfer to chilling centre</button>
          </div>
        </div>
      )}

      {/* Manifest QR Modal */}
      {showManifestQR && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-sm w-full border border-teal-500/40 text-center relative animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-full bg-teal-500/20 border border-teal-400/40 mx-auto flex items-center justify-center text-teal-400 text-2xl mb-2 font-mono">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">{isHindi ? 'टैंकर प्रेषण मैनिफेस्ट QR' : 'Tanker Dispatch Manifest QR'}</h3>
            <p className="text-xs text-slate-400 mt-1 font-mono">Batch #BATCH-20260903-TN401 (4,820 L)</p>

            <div className="my-5 p-4 bg-white rounded-2xl max-w-[200px] mx-auto border-4 border-teal-500 shadow-2xl">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=ANVESHANA_MANIFEST_BATCH_TN401_SHA256_VERIFIED"
                alt="Manifest QR"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="text-[11px] text-slate-400 font-mono mb-4">
              {isHindi ? '22 किसान जमाव रसीदें और वे-ब्रिज हैश युक्त क्रिप्टोग्राफिक रूप से हस्ताक्षरित मैनिफेस्ट।' : 'Cryptographically signed manifest containing 22 farmer pour receipts & hardware weigh-bridge hash.'}
            </div>

            <button
              onClick={() => setShowManifestQR(false)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl"
            >
              {isHindi ? 'पूर्ण / बंद करें' : 'Done / Close Manifest'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
