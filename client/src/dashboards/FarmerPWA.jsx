import React, { useState } from 'react';
import { calculateDynamicYieldBound, useAnveshana } from '../context/AnveshanaContext';
import {
  Volume2,
  Award,
  Calendar,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  QrCode,
  Building2,
  User,
  ArrowUpRight,
  Monitor,
  ShieldCheck,
  Cpu,
  RefreshCw,
  Plus,
  Calculator,
  Wifi,
  Activity,
  FileText,
  CreditCard,
  Radio,
  Info,
  AlertTriangle,
  Scan,
  Check,
  TrendingUp,
  Clock,
  ExternalLink,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function FarmerPWA() {
  const { farmers, pourEvents, addPourEvent, setActiveEvidenceModal, language, isOnline, registerNdlmAnimal, ndlmVerificationCases, collectionRequests, approveCollectionRequest } = useAnveshana();
  const farmer = farmers[0] || {
    farmerId: '201410000123',
    name: 'Ramesh Kumar',
    ndlmTag: '840003129940112',
    animalBreed: 'Murrah Buffalo',
    registeredCows: 4,
    purityScore: 87
  };

  // State Management
  const [activeTab, setActiveTab] = useState('HOME'); // 'HOME' | 'POURS' | 'CATTLE' | 'KCC' | 'AMCU'
  
  // Modals & Forms
  const [showQuickPourModal, setShowQuickPourModal] = useState(false);
  const [showKccModal, setShowKccModal] = useState(false);
  const [showAddCattleModal, setShowAddCattleModal] = useState(false);
  const [registrationNotice, setRegistrationNotice] = useState(null);
  const [showCollectionRequestModal, setShowCollectionRequestModal] = useState(false);
  const [ignoredRequestIds, setIgnoredRequestIds] = useState([]);
  
  const [kccStatus, setKccStatus] = useState('IDLE'); // 'IDLE' | 'SUBMITTING' | 'APPROVED'
  const [spoken, setSpoken] = useState(false);

  // Quick Pour Form Inputs
  const [pourWeight, setPourWeight] = useState('8.5');
  const [pourFat, setPourFat] = useState('4.2');
  const [pourSnf, setPourSnf] = useState('8.7');
  const [pourSession, setPourSession] = useState('MORNING');

  // Interactive Calculator State
  const [calcWeight, setCalcWeight] = useState(10);
  const [calcFat, setCalcFat] = useState(4.5);
  const [calcSnf, setCalcSnf] = useState(8.8);

  // Cattle Data List
  const [cattleList, setCattleList] = useState([
    { id: '1', breed: 'Murrah Buffalo (मुर्रा भैंस)', ndlmTag: '840003129940112', dailyYield: '12.5 L/day', status: 'HEALTHY', vaccination: 'FMD Verified' },
    { id: '2', breed: 'Sahiwal Cow (साहीवाल गाय)', ndlmTag: '840003129940113', dailyYield: '9.0 L/day', status: 'HEALTHY', vaccination: 'HS Booster Done' },
    { id: '3', breed: 'Gir Cow (गीर गाय)', ndlmTag: '840003129940114', dailyYield: '10.2 L/day', status: 'HEALTHY', vaccination: 'Brucellosis Clear' },
    { id: '4', breed: 'Murrah Buffalo (मुर्रा भैंस #2)', ndlmTag: '840003129940115', dailyYield: '11.8 L/day', status: 'HEALTHY', vaccination: 'FMD Verified' }
  ]);

  const [newTagInput, setNewTagInput] = useState('');
  const [newBreedInput, setNewBreedInput] = useState('Sahiwal Cow');
  const [newCattleForm, setNewCattleForm] = useState({
    animalName: '', sex: 'Female', dateOfBirth: '', ownerMobile: '', village: '', district: 'Karnal',
    vaccinationStatus: 'Vaccination record pending', lastVaccinationDate: '', calvingDate: '', insuranceStatus: 'Not insured', consent: false
    ,pregnancyStatus: 'NOT_PREGNANT', postCalvingRecovery: false
  });

  const latestPour = pourEvents[0] || {
    eventId: 'PE-20260831-001',
    weightKg: 8.5,
    fatPercent: 4.2,
    snfPercent: 8.7,
    payoutINR: 382.50,
    timestamp: new Date().toISOString()
  };
  const farmerYieldModel = calculateDynamicYieldBound({ farmer, pourEvents });

  React.useEffect(() => {
    if (!ndlmVerificationCases.length) return;
    setCattleList(previous => {
      const mapped = previous.map(animal => {
        const verification = ndlmVerificationCases.find(item => item.ndlmTag === animal.ndlmTag);
        return verification ? { ...animal, ...verification, verificationStatus: verification.status, status: verification.status === 'VERIFIED' ? 'VERIFIED' : animal.status } : animal;
      });
      const missing = ndlmVerificationCases
        .filter(verification => !mapped.some(animal => animal.ndlmTag === verification.ndlmTag))
        .map(verification => ({ ...verification, id: verification.verificationId, ndlmTag: verification.ndlmTag, vaccination: verification.vaccinationStatus || 'Record submitted', dailyYield: `${verification.estimatedYieldKg || 'Pending'} kg/day`, status: verification.status === 'VERIFIED' ? 'VERIFIED' : 'PENDING', verificationStatus: verification.status }));
      return [...missing, ...mapped];
    });
  }, [ndlmVerificationCases]);

  const pendingCollectionRequests = collectionRequests.filter(request => request.farmerId === farmer.farmerId && request.farmerApproval === 'PENDING');
  const activeCollectionRequest = pendingCollectionRequests.find(request => !ignoredRequestIds.includes(request.requestId)) || null;

  React.useEffect(() => {
    if (activeCollectionRequest) setShowCollectionRequestModal(true);
  }, [activeCollectionRequest?.requestId]);

  // Dual Language Translation Dictionary
  const t = {
    EN: {
      appTitle: "Anveshana Farmer Web Dashboard",
      subTitle: "NDLM Dairy Intelligence & Payout Portal",
      ndlmTagVerified: "NDLM TAG VERIFIED",
      purityScoreTitle: "FARM PURITY SCORE (ANVESHANA INDEX)",
      gradeA: "GRADE A+",
      purityDesc: "linked • Zero dilution anomalies recorded in 90 days.",
      listenStatus: "Listen Status (Hindi Voice)",
      applyKccTitle: "Pre-Approved Kisan Credit Card (KCC)",
      applyKccDesc: "Instant credit up to ₹1,60,000 based on Purity Score 87.",
      applyNow: "Apply Now",
      todaysPours: "Today's Verified Milk Pours",
      sessionsCompleted: "Sessions Completed",
      quickPour: "+ Log Milk Pour",
      quickPourTitle: "Log Today's Milk Pour",
      calcPayout: "Interactive Payout Calculator",
      weightLabel: "Milk Weight (kg)",
      fatLabel: "Fat Percentage (%)",
      snfLabel: "SNF Percentage (%)",
      sessionLabel: "Session",
      morning: "Morning (सुबह)",
      evening: "Evening (शाम)",
      submitPour: "Record Pour to Hardware AMCU",
      viewReceipt: "View SHA-256 Receipt",
      directPayout: "Direct Bank Payout",
      cattleTitle: "Registered Cattle & NDLM Ear Tags",
      addCattle: "+ Register NDLM Tag",
      kccHeader: "NABARD Instant KCC Loan",
      kccSub: "Pre-approved based on Anveshana Purity Score 87",
      confirmLoan: "Confirm & Sanction Loan",
      close: "Close",
      amcuHeader: "Essae-SN8831 AMCU Hardware Link",
      amcuStatus: "HARDWARE LOCKED & SYNCED",
      offlineBuffer: "Offline Pour Queue Buffer",
      allSynced: "0 Pending • Cloud Sync Active",
      tabHome: "Overview",
      tabPours: "Pour Receipts",
      tabCattle: "Cattle Directory",
      tabKcc: "KCC Credit",
      tabAmcu: "AMCU Status",
      scanQr: "Scan Dairy Pass",
      calculatedRate: "Calculated Price Rate",
      estPayout: "Est. Total Payout",
      perLiter: "per liter"
    },
    HI: {
      appTitle: "अन्वेषण किसान वेब डैशबोर्ड",
      subTitle: "एनडीएलएम डेयरी बुद्धिमत्ता एवं त्वरित भुगतान",
      ndlmTagVerified: "NDLM टैग सत्यापित",
      purityScoreTitle: "फॉर्म शुद्धता स्कोर (अन्वेषण इंडेक्स)",
      gradeA: "श्रेणी A+",
      purityDesc: "संबद्ध • पिछले 90 दिनों में शून्य मिलावट का रिकॉर्ड।",
      listenStatus: "स्थिति सुनें (हिंदी आवाज)",
      applyKccTitle: "पूर्व-स्वीकृत किसान क्रेडिट कार्ड (KCC)",
      applyKccDesc: "शुद्धता स्कोर 87 के आधार पर ₹1,60,000 तक तुरंत ऋण।",
      applyNow: "अभी आवेदन करें",
      todaysPours: "आज का सत्यापित दूध संग्रह",
      sessionsCompleted: "सत्र पूर्ण",
      quickPour: "+ दूध दर्ज करें",
      quickPourTitle: "आज का दूध संग्रह दर्ज करें",
      calcPayout: "इंटरएक्टिव भुगतान कैलकुलेटर",
      weightLabel: "दूध का वजन (किलो)",
      fatLabel: "फैट प्रतिशत (%)",
      snfLabel: "एसएनएफ प्रतिशत (%)",
      sessionLabel: "समय",
      morning: "सुबह",
      evening: "शाम",
      submitPour: "AMCU मशीन में दर्ज करें",
      viewReceipt: "SHA-256 रसीद देखें",
      directPayout: "सीधा बैंक भुगतान",
      cattleTitle: "पंजीकृत पशुधन एवं NDLM कान टैग",
      addCattle: "+ नया NDLM टैग जोड़ें",
      kccHeader: "नाबार्ड इंस्टेंट KCC लोन",
      kccSub: "अन्वेषण शुद्धता स्कोर 87 के आधार पर स्वीकृत",
      confirmLoan: "लोन स्वीकृत एवं प्राप्त करें",
      close: "बंद करें",
      amcuHeader: "एम्सीयू Essae-SN8831 हार्डवेयर लिंक",
      amcuStatus: "हार्डवेयर सुरक्षित एवं सिंक",
      offlineBuffer: "ऑफलाइन कतार बफर",
      allSynced: "0 लंबित • क्लाउड सिंक सक्रिय",
      tabHome: "अवलोकन",
      tabPours: "दूध रसीदें",
      tabCattle: "पशुधन निर्देशिका",
      tabKcc: "KCC क्रेडिट",
      tabAmcu: "AMCU स्थिति",
      scanQr: "क्यूआर पास स्कैन करें",
      calculatedRate: "गणना की गई दर",
      estPayout: "अनुमानित कुल भुगतान",
      perLiter: "प्रति लीटर"
    }
  };

  const text = t[language] || t.EN;

  // Text-To-Speech Audio Narration
  const speakStatus = () => {
    if (!('speechSynthesis' in window)) {
      alert("TTS Speech Synthesis not supported in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const hindiText = `नमस्ते ${farmer.name} जी। अन्वेषण किसान ऐप में आपका स्वागत है। आपका आज का दूध कुल ${latestPour.weightKg} किलो दर्ज हुआ है। फैट ${latestPour.fatPercent} प्रतिशत और एसएनएफ ${latestPour.snfPercent} प्रतिशत है। आपकी कुल राशि ₹${latestPour.payoutINR} आपके एसबीआई बैंक खाते में सफलतापूर्वक भेज दी गई है। आपका फार्म शुद्धता स्कोर 87 प्रतिशत है और ₹1,60,000 का केसीसी ऋण स्वीकृत है।`;
    const utterance = new SpeechSynthesisUtterance(hindiText);
    utterance.lang = 'hi-IN';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
    setSpoken(true);
    setTimeout(() => setSpoken(false), 8000);
  };

  // Quick Pour Submit Handler
  const handleQuickPourSubmit = (e) => {
    e.preventDefault();
    const w = parseFloat(pourWeight) || 8.0;
    const f = parseFloat(pourFat) || 4.2;
    const s = parseFloat(pourSnf) || 8.7;

    addPourEvent({
      farmerId: farmer.farmerId,
      farmerName: farmer.name,
      nodeId: "VLC-22",
      weightKg: w,
      fatPercent: f,
      snfPercent: s,
      session: new Date().getHours() < 14 ? 'MORNING' : 'EVENING',
      yieldStatus: 'PASS'
    });

    confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
    setShowQuickPourModal(false);
  };

  // KCC Loan Application Handler
  const handleApplyKCC = () => {
    setKccStatus('SUBMITTING');
    setTimeout(() => {
      setKccStatus('APPROVED');
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
    }, 1500);
  };

  // Add Cattle Handler
  const handleAddCattle = (e) => {
    e.preventDefault();
    if (!newTagInput.trim() || Object.entries(newCattleForm).some(([key, value]) => key !== 'consent' && !String(value).trim()) || !newCattleForm.consent) return;
    const newAnimal = {
      id: String(Date.now()),
      farmerId: farmer.farmerId,
      breed: `${newBreedInput} (NDLM)`,
      ndlmTag: newTagInput.trim(),
      animalName: newCattleForm.animalName,
      sex: newCattleForm.sex,
      dateOfBirth: newCattleForm.dateOfBirth,
      ownerMobile: newCattleForm.ownerMobile,
      village: newCattleForm.village,
      district: newCattleForm.district,
      vaccinationStatus: newCattleForm.vaccinationStatus,
      lastVaccinationDate: newCattleForm.lastVaccinationDate,
      calvingDate: newCattleForm.calvingDate,
      insuranceStatus: newCattleForm.insuranceStatus,
      pregnancyStatus: newCattleForm.pregnancyStatus,
      postCalvingRecovery: newCattleForm.postCalvingRecovery,
      dailyYield: '10.5 L/day',
      status: 'HEALTHY',
      vaccination: newCattleForm.vaccinationStatus,
      verificationStatus: 'SUBMITTED_FOR_FIELD_VERIFICATION'
    };
    registerNdlmAnimal(newAnimal);
    setCattleList([...cattleList, newAnimal]);
    setRegistrationNotice({ name: newAnimal.animalName, tag: newAnimal.ndlmTag, status: 'PENDING_REVIEW' });
    setActiveTab('CATTLE');
    setNewTagInput('');
    setNewCattleForm({ animalName: '', sex: 'Female', dateOfBirth: '', ownerMobile: '', village: '', district: 'Karnal', vaccinationStatus: 'Vaccination record pending', lastVaccinationDate: '', calvingDate: '', insuranceStatus: 'Not insured', consent: false, pregnancyStatus: 'NOT_PREGNANT', postCalvingRecovery: false });
    setShowAddCattleModal(false);
    confetti({ particleCount: 50, spread: 50 });
  };

  const prefillNdlmDemo = () => {
    setNewBreedInput('Sahiwal Cow');
    setNewTagInput('840003129940999');
    setNewCattleForm({
      animalName: 'Ganga',
      sex: 'Female',
      dateOfBirth: '2022-01-01',
      ownerMobile: '9876543210',
      village: 'Nissing',
      district: 'Karnal',
      vaccinationStatus: 'FMD and HS verified',
      lastVaccinationDate: '2026-08-01',
      calvingDate: '2026-02-15',
      insuranceStatus: 'Insurance active',
      consent: true,
      pregnancyStatus: 'NOT_PREGNANT',
      postCalvingRecovery: false
    });
  };

  // Calculator Helper Rate Formula
  const calculatedPricePerLiter = +(calcFat * 7.5 + calcSnf * 4.0).toFixed(2);
  const calculatedTotalPayout = +(calcWeight * calculatedPricePerLiter).toFixed(2);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Web Header Banner */}
      <div className="bg-[#090d1a]/95 backdrop-blur-2xl border border-emerald-500/30 rounded-3xl p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-2xl shadow-lg">
            <User className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white">{farmer.name}</h2>
              <span className="text-xs font-mono bg-emerald-950 text-emerald-400 px-2.5 py-0.5 rounded-lg border border-emerald-500/30 font-bold uppercase">
                {text.ndlmTagVerified}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Farmer ID: <span className="text-slate-200 font-bold">{farmer.farmerId}</span> • NDLM Tag: <span className="text-emerald-400 font-bold">#{farmer.ndlmTag}</span> • {farmer.animalBreed} ({cattleList.length} Registered Cattle)
            </p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowQuickPourModal(true)}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{text.quickPour}</span>
          </button>

          <button
            onClick={() => setShowAddCattleModal(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>{text.addCattle}</span>
          </button>

          <button
            onClick={speakStatus}
            className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 ${
              spoken 
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-md shadow-emerald-500/20 animate-pulse'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title={text.listenStatus}
          >
            <Volume2 className={`w-4 h-4 ${spoken ? 'text-emerald-300 animate-bounce' : 'text-emerald-400'}`} />
            <span className="text-xs font-bold hidden sm:inline">{text.listenStatus}</span>
          </button>
        </div>
      </div>

      {/* Web Tab Navigation Bar */}
      <div className="flex items-center gap-2 bg-slate-950/80 p-2 rounded-2xl border border-slate-800 overflow-x-auto">
        {[
          { id: 'HOME', label: text.tabHome, icon: Monitor },
          { id: 'POURS', label: text.tabPours, icon: FileText },
          { id: 'CATTLE', label: text.tabCattle, icon: Activity },
          { id: 'KCC', label: text.tabKcc, icon: CreditCard },
          { id: 'AMCU', label: text.tabAmcu, icon: Cpu }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Farm Purity & KCC Loan Status */}
        <div className="space-y-6">
          
          {/* Farm Purity Score Gauge Ring Card */}
          <div className="glass-panel-glow p-6 rounded-3xl border border-emerald-500/40 text-center relative overflow-hidden space-y-4">
            <div className="text-xs font-extrabold tracking-widest text-emerald-400 uppercase">
              {text.purityScoreTitle}
            </div>

            <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-400 transition-all duration-1000 ease-out"
                  strokeDasharray={`${farmer.purityScore}, 100`}
                  strokeWidth="3.8"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-extrabold text-white tracking-tight font-mono">
                  {farmer.purityScore}
                </span>
                <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider mt-1">
                  {text.gradeA}
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-300 max-w-xs mx-auto">
              NDLM Ear Tag <span className="font-mono text-emerald-400 font-bold">#{farmer.ndlmTag}</span> {text.purityDesc}
            </div>
          </div>

          {/* KCC Loan Card Banner */}
          <div className="bg-gradient-to-br from-emerald-950/90 to-teal-950/90 p-5 rounded-3xl border border-emerald-500/40 shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <span>{text.applyKccTitle}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{text.applyKccDesc}</p>
            
            <button
              onClick={() => setShowKccModal(true)}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow transition-all"
            >
              {text.applyNow}
            </button>
          </div>

        </div>

        {/* Middle Column: Tab Body Views */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* TAB 1: OVERVIEW & POUR LOG */}
          {(activeTab === 'HOME' || activeTab === 'POURS') && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  <span>{text.todaysPours}</span>
                </h3>
                <span className="text-xs text-emerald-400 font-mono font-bold bg-emerald-950/80 px-3 py-1 rounded-lg border border-emerald-500/30">
                  {pourEvents.length} {text.sessionsCompleted}
                </span>
              </div>

              <div className="space-y-3">
                {pourEvents.map((pour) => (
                  <div key={pour.eventId} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3 hover:border-emerald-500/30 transition-all">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white font-mono text-sm">{pour.eventId}</span>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {new Date(pour.timestamp).toLocaleString()} • Station: {pour.nodeId || 'VLC-22'}
                        </div>
                      </div>
                      <span className={`font-bold px-3 py-1.5 rounded-xl border text-sm font-mono ${pour.paymentStatus === 'PAID' ? 'text-emerald-400 bg-emerald-950/90 border-emerald-500/40' : 'text-amber-300 bg-amber-950/70 border-amber-500/40'}`}>
                        ₹{pour.payoutINR} {pour.paymentStatus === 'PAID' ? text.directPayout : 'Payment pending aggregator confirmation'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center text-xs font-mono">
                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-400 font-sans">{text.weightLabel}</div>
                        <div className="font-bold text-white text-base mt-0.5">{pour.weightKg} kg</div>
                      </div>
                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-400 font-sans">{text.fatLabel}</div>
                        <div className="font-bold text-emerald-400 text-base mt-0.5">{pour.fatPercent}%</div>
                      </div>
                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-400 font-sans">{text.snfLabel}</div>
                        <div className="font-bold text-teal-400 text-base mt-0.5">{pour.snfPercent}%</div>
                      </div>
                    </div>

                    <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400 truncate max-w-md">SHA-256: {pour.receiptHash}</span>
                      <button
                        onClick={() => setActiveEvidenceModal({
                          type: 'POUR',
                          title: `Farmer Pour Receipt ${pour.eventId}`,
                          hash: pour.receiptHash,
                          data: pour
                        })}
                        className="text-emerald-400 font-bold hover:underline flex items-center gap-1 ml-2 whitespace-nowrap"
                      >
                        <span>{text.viewReceipt}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: CATTLE DIRECTORY */}
          {activeTab === 'CATTLE' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  <span>{text.cattleTitle}</span>
                </h3>
                <button
                  onClick={() => setShowAddCattleModal(true)}
                  className="px-3.5 py-1.5 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>{text.addCattle}</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/40">
                  <div className="text-[10px] text-emerald-300 uppercase font-mono">System estimated yield</div>
                  <div className="text-lg font-extrabold text-emerald-400">{farmerYieldModel.perCowBound} kg / animal</div>
                  <div className="text-[10px] text-slate-400">Lactation day {farmerYieldModel.lactationDay} · seasonal factor {farmerYieldModel.seasonalFactor}</div>
                </div>
                <div className="p-3 rounded-xl border border-sky-500/30 bg-sky-950/30">
                  <div className="text-[10px] text-sky-300 uppercase font-mono">Dynamic bound</div>
                  <div className="text-lg font-extrabold text-sky-400">{farmerYieldModel.herdBound} kg / herd</div>
                  <div className="text-[10px] text-slate-400">Based on 7-day mean and breed peak</div>
                </div>
                <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-950/30">
                  <div className="text-[10px] text-amber-300 uppercase font-mono">Verification queue</div>
                  <div className="text-lg font-extrabold text-amber-400">{ndlmVerificationCases.filter(item => item.status !== 'VERIFIED').length}</div>
                  <div className="text-[10px] text-slate-400">Your registrations awaiting field review</div>
                </div>
              </div>

              {registrationNotice && (
                <div className="rounded-xl border border-sky-500/40 bg-sky-500/10 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" />
                    <div>
                      <div className="text-sm font-bold text-sky-300">Registration received for {registrationNotice.name}</div>
                      <div className="mt-1 text-xs text-slate-300">NDLM tag #{registrationNotice.tag} is now visible below.</div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-mono"><span className="rounded border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-amber-300">PENDING REVIEW</span><span className="text-slate-400">Officer visit, field evidence, and approval are next.</span></div>
                    </div>
                    <button onClick={() => setRegistrationNotice(null)} className="ml-auto text-xs text-slate-400 hover:text-white">Dismiss</button>
                  </div>
                </div>
              )}

              {pendingCollectionRequests.map(request => (
                <div key={request.requestId} className="rounded-xl border border-sky-500/40 bg-sky-500/10 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><div className="text-sm font-bold text-sky-200">Milk collection request received</div><div className="mt-1 text-xs text-slate-300">{request.requestedSession} · {request.nodeId} · {request.district}, {request.state}</div><div className="mt-1 text-[10px] font-mono text-slate-400">Requested {new Date(request.createdAt).toLocaleString()}</div></div>
                    <div className="flex gap-2"><button onClick={() => { setShowCollectionRequestModal(true); }} className="rounded-lg bg-sky-500 px-3 py-2 text-xs font-bold text-slate-950">Review request</button><span className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-400">Pending</span></div>
                  </div>
                </div>
              ))}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cattleList.map((item) => (
                  <div key={item.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl">
                        <ShieldCheck className="h-6 w-6 text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{item.breed}</div>
                        <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
                          NDLM Tag: #{item.ndlmTag}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                          <span className="bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30 font-mono">
                            {item.vaccination}
                          </span>
                          <span>• {item.dailyYield}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-1">NDLM: {item.verificationStatus || 'ACTIVE'}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono font-bold bg-slate-900 text-emerald-300 px-2 py-1 rounded-lg border border-slate-700">
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {showCollectionRequestModal && activeCollectionRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
                  <div className="w-full max-w-md rounded-2xl border border-sky-500/40 bg-slate-900 p-6 shadow-2xl">
                    <div className="flex items-start justify-between border-b border-slate-700 pb-4">
                      <div><div className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-300">New collection request</div><h3 className="mt-1 text-lg font-extrabold text-white">Milk collection requested</h3></div>
                      <button onClick={() => setShowCollectionRequestModal(false)} className="text-xs text-slate-400 hover:text-white">Close</button>
                    </div>
                    <div className="mt-4 space-y-3 text-sm">
                      <div className="rounded-xl border border-slate-700 bg-slate-800 p-4"><div className="font-bold text-white">{activeCollectionRequest.requestedSession} collection</div><div className="mt-1 text-sm font-bold text-sky-300">Requested amount: {activeCollectionRequest.requestedAmountKg} kg</div><div className="mt-1 text-xs text-slate-300">Collection point: {activeCollectionRequest.nodeId}</div><div className="text-xs text-slate-400">{activeCollectionRequest.district}, {activeCollectionRequest.state}</div><div className="mt-2 text-[10px] font-mono text-slate-500">Requested {new Date(activeCollectionRequest.createdAt).toLocaleString()}</div></div>
                      <p className="text-xs leading-relaxed text-slate-300">Approve to let the aggregator record independent weight, fat, SNF, temperature, and quality readings. Decline if you are unavailable. Ignore keeps this request pending.</p>
                    </div>
                    <div className="mt-5 grid grid-cols-3 gap-2"><button onClick={() => { approveCollectionRequest(activeCollectionRequest.requestId, 'APPROVED'); setShowCollectionRequestModal(false); }} className="rounded-lg bg-emerald-500 px-3 py-3 text-xs font-extrabold text-slate-950">Approve</button><button onClick={() => { approveCollectionRequest(activeCollectionRequest.requestId, 'DECLINED'); setShowCollectionRequestModal(false); }} className="rounded-lg border border-rose-500/50 px-3 py-3 text-xs font-bold text-rose-300">Decline</button><button onClick={() => { setIgnoredRequestIds(previous => [...previous, activeCollectionRequest.requestId]); setShowCollectionRequestModal(false); }} className="rounded-lg border border-slate-600 px-3 py-3 text-xs font-bold text-slate-300">Ignore</button></div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-2 mb-3"><ShieldCheck className="h-4 w-4 text-emerald-600" /><h4 className="text-sm font-bold text-slate-900">NDLM verification process</h4></div>
                  <ol className="space-y-2 text-xs text-slate-600 list-decimal pl-4">
                    <li>Owner and animal details are submitted with the 15-digit ear tag.</li>
                    <li>A trained field worker scans the RFID tag and checks the animal record.</li>
                    <li>Vaccination, health, breeding, and location data are linked to the animal identity.</li>
                    <li>Duplicate or invalid tags are held for correction; verified records become active.</li>
                  </ol>
                  <p className="mt-3 text-[11px] text-slate-500">Need a correction or field visit? Contact your local livestock office or the 1962 farmer service.</p>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200 bg-white">
                  <div className="flex items-center gap-2 mb-3"><Building2 className="h-4 w-4 text-emerald-600" /><h4 className="text-sm font-bold text-slate-900">Services unlocked by a verified record</h4></div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                    {['Animal health and vaccination history', 'Breeding, pregnancy and calving records', '1962 veterinary support and advisories', 'Livestock insurance and claim readiness', 'KCC and dairy credit documentation', 'Eligibility for livestock schemes'].map(service => <div key={service} className="border-l-2 border-emerald-400 pl-2 py-1">{service}</div>)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: KCC CREDIT */}
          {activeTab === 'KCC' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="glass-panel-glow p-6 rounded-3xl border border-emerald-500/40 text-center relative overflow-hidden space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/40 mx-auto flex items-center justify-center text-emerald-400 text-3xl">
                  <Building2 className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-bold text-white">{text.kccHeader}</h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto">{text.kccSub}</p>

                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3 text-xs font-mono text-left max-w-md mx-auto">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Approved Credit Limit:</span>
                    <span className="text-emerald-400 font-bold text-sm">₹1,60,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Interest Subvention:</span>
                    <span className="text-white font-bold">4.0% p.a.</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Security Guarantee:</span>
                    <span className="text-emerald-400 font-bold">Anveshana DPI Lock</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowKccModal(true)}
                  className="w-full max-w-md mx-auto py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg"
                >
                  {text.applyNow}
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: AMCU STATUS */}
          {activeTab === 'AMCU' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Cpu className="w-6 h-6 text-teal-400" />
                    <div>
                      <div className="text-sm font-bold text-white">{text.amcuHeader}</div>
                      <div className="text-xs text-slate-400 font-mono">Serial: ESSAE-SN8831-VLC22</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold bg-emerald-950 text-emerald-400 px-3 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                    <span>ONLINE & SYNCED</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
                    <div className="text-[10px] text-slate-400 font-sans">Lactometer Calibration</div>
                    <div className="text-emerald-400 font-bold text-sm">100% Calibrated</div>
                  </div>
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
                    <div className="text-[10px] text-slate-400 font-sans">Bluetooth / NFC Signal</div>
                    <div className="text-teal-400 font-bold text-sm">-48 dBm (Strong)</div>
                  </div>
                </div>

                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
                  <span className="text-slate-300">{text.offlineBuffer}:</span>
                  <span className="text-emerald-400 font-mono font-bold">{text.allSynced}</span>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Calculator Widget */}
          <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Calculator className="w-5 h-5 text-emerald-400" />
                <span>{text.calcPayout}</span>
              </div>
              <span className="text-xs text-emerald-400 font-mono font-bold bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                Rate: ₹{calculatedPricePerLiter} / L
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-xs text-slate-400 block mb-1 font-medium">{text.weightLabel}</label>
                <input
                  type="number"
                  step="0.5"
                  value={calcWeight}
                  onChange={(e) => setCalcWeight(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono text-center focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1 font-medium">{text.fatLabel}</label>
                <input
                  type="number"
                  step="0.1"
                  value={calcFat}
                  onChange={(e) => setCalcFat(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-emerald-400 font-mono text-center focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1 font-medium">{text.snfLabel}</label>
                <input
                  type="number"
                  step="0.1"
                  value={calcSnf}
                  onChange={(e) => setCalcSnf(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-teal-400 font-mono text-center focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="bg-emerald-950/60 p-3 rounded-2xl border border-emerald-500/30 flex justify-between items-center text-xs">
              <span className="text-slate-300 font-medium text-sm">{text.estPayout}:</span>
              <span className="text-emerald-300 font-bold font-mono text-lg">₹{calculatedTotalPayout}</span>
            </div>
          </div>

        </div>

      </div>

      {/* MODAL 1: QUICK POUR SIMULATOR MODAL */}
      {showQuickPourModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-md w-full border border-emerald-500/40 relative animate-in fade-in zoom-in duration-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                <span>{text.quickPourTitle}</span>
              </h3>
              <button
                onClick={() => setShowQuickPourModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleQuickPourSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">{text.weightLabel}</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={pourWeight}
                  onChange={(e) => setPourWeight(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-mono text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">{text.fatLabel}</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={pourFat}
                    onChange={(e) => setPourFat(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-emerald-400 font-mono text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">{text.snfLabel}</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={pourSnf}
                    onChange={(e) => setPourSnf(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-teal-400 font-mono text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-3 text-xs text-sky-200">
                Session is automatic: <strong>{new Date().getHours() < 14 ? text.morning : text.evening}</strong>. The system uses the collection time.
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow"
                >
                  {text.submitPour}
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuickPourModal(false)}
                  className="px-4 py-3 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
                >
                  {text.close}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: KCC LOAN APPLICATION MODAL */}
      {showKccModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-md w-full border border-emerald-500/40 relative animate-in fade-in zoom-in duration-200 space-y-4">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-400/40 mx-auto flex items-center justify-center text-emerald-400 text-3xl">
                  <Building2 className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-white">{text.kccHeader}</h3>
              <p className="text-xs text-slate-400">{text.kccSub}</p>
            </div>

            {kccStatus === 'IDLE' && (
              <div className="space-y-3 text-xs font-mono">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between">
                  <span>Approved Credit Limit:</span>
                  <span className="text-emerald-400 font-bold">₹1,60,000</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between">
                  <span>Interest Rate Subvention:</span>
                  <span className="text-white font-bold">4.0% p.a.</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between">
                  <span>Discrepancy Guarantee:</span>
                  <span className="text-emerald-400 font-bold">FSSAI Hardware Lock</span>
                </div>
              </div>
            )}

            {kccStatus === 'SUBMITTING' && (
              <div className="py-8 text-center text-xs text-emerald-400 font-mono animate-pulse">
                Verifying NDLM Livestock Tag with NABARD API...
              </div>
            )}

            {kccStatus === 'APPROVED' && (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                <div className="text-base font-bold text-white">Loan Approved Instantly!</div>
                <div className="text-xs text-slate-400 font-mono">₹1,60,000 credited to SBI Account **4012</div>
              </div>
            )}

            <div className="pt-2 flex gap-2">
              {kccStatus === 'IDLE' && (
                <button
                  onClick={handleApplyKCC}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow"
                >
                  {text.confirmLoan}
                </button>
              )}
              <button
                onClick={() => {
                  setShowKccModal(false);
                  setKccStatus('IDLE');
                }}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
              >
                {text.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD CATTLE NDLM TAG MODAL */}
      {showAddCattleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-3xl max-h-[92vh] overflow-y-auto w-full border border-emerald-500/40 relative animate-in fade-in zoom-in duration-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Register animal on NDLM / Pashudhan</span>
              </h3>
              <button onClick={() => setShowAddCattleModal(false)} className="text-slate-400 hover:text-white font-bold">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddCattle} className="space-y-4 text-xs">
              <p className="text-slate-400">Complete the required owner, identity, location, health, and breeding details. Submission status will remain pending until field verification.</p>
              <button type="button" onClick={prefillNdlmDemo} className="w-full rounded-xl border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-left text-xs font-bold text-sky-300 hover:bg-sky-500/20">Load demo registration details</button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Animal name / local identifier *</label>
                  <input required value={newCattleForm.animalName} onChange={(e) => setNewCattleForm({ ...newCattleForm, animalName: e.target.value })} placeholder="e.g. Ganga" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Breed *</label>
                <select
                  value={newBreedInput}
                  onChange={(e) => setNewBreedInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Sahiwal Cow">Sahiwal Cow (साहीवाल गाय)</option>
                  <option value="Murrah Buffalo">Murrah Buffalo (मुर्रा भैंस)</option>
                  <option value="Gir Cow">Gir Cow (गीर गाय)</option>
                  <option value="HF Crossbred">HF Crossbred (एचएफ गाय)</option>
                </select>
              </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">NDLM / Pashu Aadhaar ear tag *</label>
                  <input type="text" required pattern="[0-9]{15}" maxLength={15} placeholder="15-digit tag" value={newTagInput} onChange={(e) => setNewTagInput(e.target.value.replace(/\D/g, ''))} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-emerald-400 font-mono text-xs focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Sex *</label>
                  <select value={newCattleForm.sex} onChange={(e) => setNewCattleForm({ ...newCattleForm, sex: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-emerald-500 focus:outline-none"><option>Female</option><option>Male</option></select>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Date of birth / age *</label>
                  <input required type="date" value={newCattleForm.dateOfBirth} onChange={(e) => setNewCattleForm({ ...newCattleForm, dateOfBirth: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Owner mobile *</label>
                  <input required type="tel" pattern="[0-9]{10}" maxLength={10} value={newCattleForm.ownerMobile} onChange={(e) => setNewCattleForm({ ...newCattleForm, ownerMobile: e.target.value.replace(/\D/g, '') })} placeholder="10-digit mobile" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Village / panchayat *</label>
                  <input required value={newCattleForm.village} onChange={(e) => setNewCattleForm({ ...newCattleForm, village: e.target.value })} placeholder="Village name" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">District *</label>
                  <input required value={newCattleForm.district} onChange={(e) => setNewCattleForm({ ...newCattleForm, district: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Last vaccination date *</label>
                  <input required type="date" value={newCattleForm.lastVaccinationDate} onChange={(e) => setNewCattleForm({ ...newCattleForm, lastVaccinationDate: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Vaccination / health status *</label>
                  <select value={newCattleForm.vaccinationStatus} onChange={(e) => setNewCattleForm({ ...newCattleForm, vaccinationStatus: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-emerald-500 focus:outline-none"><option>Vaccination record pending</option><option>FMD verified</option><option>HS verified</option><option>FMD and HS verified</option></select>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Latest calving date *</label>
                  <input required type="date" value={newCattleForm.calvingDate} onChange={(e) => setNewCattleForm({ ...newCattleForm, calvingDate: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Insurance status *</label>
                  <select value={newCattleForm.insuranceStatus} onChange={(e) => setNewCattleForm({ ...newCattleForm, insuranceStatus: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-emerald-500 focus:outline-none"><option>Not insured</option><option>Insurance active</option><option>Claim in progress</option></select>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Pregnancy status *</label>
                  <select value={newCattleForm.pregnancyStatus} onChange={(e) => setNewCattleForm({ ...newCattleForm, pregnancyStatus: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-emerald-500 focus:outline-none"><option value="NOT_PREGNANT">Not pregnant</option><option value="PREGNANT">Pregnant</option></select>
                </div>
                <label className="flex items-center gap-2 text-slate-300"><input type="checkbox" checked={newCattleForm.postCalvingRecovery} onChange={(e) => setNewCattleForm({ ...newCattleForm, postCalvingRecovery: e.target.checked })} className="accent-emerald-600" /> Recently calved / recovery period: pause milk collection</label>
              </div>

              <label className="flex items-start gap-2 text-slate-300"><input type="checkbox" required checked={newCattleForm.consent} onChange={(e) => setNewCattleForm({ ...newCattleForm, consent: e.target.checked })} className="mt-0.5 accent-emerald-600" /><span>I confirm these animal and owner details are correct and consent to NDLM/Anveshana verification. *</span></label>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow"
                >
                  Save & Link NDLM Tag
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCattleModal(false)}
                  className="px-4 py-3 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
                >
                  {text.close}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
