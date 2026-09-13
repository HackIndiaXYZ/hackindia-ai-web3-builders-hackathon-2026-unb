import React, { useState } from 'react';
import { useAnveshana } from '../context/AnveshanaContext';
import { Smartphone, Tablet, Monitor, Building2, QrCode, Wifi, WifiOff, Zap, Sliders, Lock, CheckCircle2, LogOut, User, Home, Accessibility, Sun, Moon, Type, Plus, Globe } from 'lucide-react';

export default function HeaderNav({ onBackToHome }) {
  const {
    currentRole,
    attemptRoleSwitch,
    authenticatedSessions,
    logoutRole,
    language,
    setLanguage,
    theme,
    setTheme,
    fontScale,
    setFontScale,
    isOnline,
    setIsOnline,
    injectVolumeAnomalySimulation,
    addPourEvent
  } = useAnveshana();
  const [showAccessibility, setShowAccessibility] = useState(false);

  const activeSession = authenticatedSessions[currentRole];

  const handleSimulateQuickPour = () => {
    addPourEvent({
      farmerId: "201410000123",
      farmerName: "Ramesh Kumar",
      nodeId: "VLC-22",
      weightKg: +(8.0 + Math.random() * 2).toFixed(1),
      fatPercent: +(4.0 + Math.random() * 0.4).toFixed(1),
      snfPercent: +(8.5 + Math.random() * 0.3).toFixed(1),
      yieldStatus: 'PASS'
    });
  };

  const isHindi = language === 'HI';

  const portals = [
    { id: 'FARMER', label: isHindi ? 'किसान ऐप (PWA)' : 'Farmer PWA', domain: 'farmer.anveshana.in', icon: Smartphone, color: 'text-emerald-400' },
    { id: 'AGGREGATOR', label: isHindi ? 'संग्राहक टैब' : 'Aggregator Tablet', domain: 'agg.anveshana.in', icon: Tablet, color: 'text-teal-400' },
    { id: 'QC_OFFICER', label: isHindi ? 'गुणवत्ता अधिकारी' : 'QC Officer Desktop', domain: 'qco.anveshana.in', icon: Monitor, color: 'text-blue-400' },
    { id: 'GOVT_AUDITOR', label: isHindi ? 'एफएसएसएआई कमान' : 'FSSAI Auditor Command', domain: 'govt.anveshana.in', icon: Building2, color: 'text-amber-400' },
    { id: 'CONSUMER', label: isHindi ? 'उपभोक्ता पासपोर्ट' : 'Consumer Passport', domain: 'verify.anveshana.in', icon: QrCode, color: 'text-purple-400' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#070b14]/90 backdrop-blur-xl border-b border-slate-800 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        
        {/* Brand Header */}
        <div className="flex items-center gap-3">
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/40 transition-all"
              title="Back to Home"
            >
              <Home className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>Anveshana</span>
                <span className="text-emerald-400 font-hindi font-normal text-base">(अन्वेषण)</span>
              </h1>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/40 font-mono font-bold uppercase">
                {isHindi ? 'राष्ट्रीय डीपीआई प्रोटोकॉल' : 'NATIONAL DPI PROTOCOL'}
              </span>
              <span className="bg-rose-950/90 text-rose-400 text-[10px] px-2.5 py-0.5 rounded-full border border-rose-500/40 font-mono font-bold uppercase flex items-center gap-1 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                <span>REC • LIVE DEMO</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              {isHindi 
                ? 'भारत का खुला डेयरी इंटेलिजेंस प्रोटोकॉल — हार्डवेयर-एंकर्ड एनडीएलएम आपूर्ति श्रृंखला लेखापरीक्षा इंजन'
                : "India's Open Dairy Intelligence Protocol — Hardware-Anchored NDLM Supply Chain Audit Engine"}
            </p>
          </div>
        </div>

        {/* User Identity & Global Control Actions */}
        <div className="flex items-center gap-3">
          
          {/* Active Registered ID Badge */}
          {activeSession?.isAuthenticated && (
            <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-emerald-500/30 text-xs">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <div className="flex flex-col text-[10px] font-mono leading-tight">
                <span className="font-bold text-white">{activeSession.name}</span>
                <span className="text-emerald-400">ID: {activeSession.id}</span>
              </div>
              {currentRole !== 'CONSUMER' && (
                <button
                  onClick={() => logoutRole(currentRole)}
                  className="ml-1 p-1 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded transition-colors"
                  title={isHindi ? "पंजीकृत आईडी बदलें / लॉगआउट" : "Switch Registered ID / Logout"}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Quick Simulation Actions */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-[10px] text-slate-400 font-mono px-2 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> {isHindi ? 'सिमुलेशन:' : 'SIMULATE:'}
            </span>
            <button
              onClick={handleSimulateQuickPour}
              className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 rounded border border-emerald-500/30 font-semibold text-[11px]"
            >
              {isHindi ? '+ दुग्ध जमाव' : '+ Pour Event'}
            </button>
            <button
              onClick={injectVolumeAnomalySimulation}
              className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded border border-rose-500/30 font-semibold text-[11px]"
            >
              {isHindi ? '+ मिलावट विसंगति' : '+ Water Anomaly'}
            </button>
          </div>

          {/* Multi-Language Switcher (English EN / Hindi हिंदी) */}
          <button
            onClick={() => setLanguage(language === 'EN' ? 'HI' : 'EN')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-500/40 bg-teal-950/60 hover:bg-teal-900/60 text-teal-300 text-xs font-bold transition-all shadow-md"
            title="Toggle Language / भाषा बदलें"
          >
            <Globe className="h-4 w-4" />
            <span>{language === 'EN' ? 'EN' : 'हिंदी'}</span>
          </button>

          {/* Online/Offline Network Toggle */}
          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
              isOnline ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
            }`}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-rose-400" />}
            <span className="hidden md:inline">
              {isOnline ? (isHindi ? 'ऑनलाइन' : 'ONLINE') : (isHindi ? 'ऑफ़लाइन मोड' : 'OFFLINE MODE')}
            </span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowAccessibility(!showAccessibility)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:border-emerald-500 hover:text-emerald-700 text-xs font-bold transition-all"
              title="Accessibility settings"
              aria-expanded={showAccessibility}
              aria-controls="accessibility-settings"
            >
              <Accessibility className="w-4 h-4" />
              <span className="hidden sm:inline">ACCESSIBILITY</span>
            </button>
            {showAccessibility && (
              <div id="accessibility-settings" className="absolute right-0 top-11 z-50 w-64 rounded-2xl border border-slate-200 bg-white p-4 text-slate-800 shadow-2xl">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-bold">Accessibility</span>
                  <Accessibility className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold">Theme</span>
                  <div className="flex rounded-lg border border-slate-200 p-0.5" role="group" aria-label="Theme">
                    <button onClick={() => setTheme('light')} className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs ${theme === 'light' ? 'bg-emerald-600 text-white' : 'text-slate-600'}`} aria-label="Light theme"><Sun className="h-3.5 w-3.5" /> Light</button>
                    <button onClick={() => setTheme('dark')} className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs ${theme === 'dark' ? 'bg-slate-800 text-white' : 'text-slate-600'}`} aria-label="Dark theme"><Moon className="h-3.5 w-3.5" /> Dark</button>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1 text-xs font-semibold"><Type className="h-3.5 w-3.5" /> Text size</span>
                  <div className="flex rounded-lg border border-slate-200 p-0.5" role="group" aria-label="Text size">
                    <button onClick={() => setFontScale('normal')} className={`rounded-md px-2 py-1 text-xs ${fontScale === 'normal' ? 'bg-emerald-600 text-white' : 'text-slate-600'}`} aria-label="Normal text size">A</button>
                    <button onClick={() => setFontScale('large')} className={`rounded-md px-2 py-1 text-sm ${fontScale === 'large' ? 'bg-emerald-600 text-white' : 'text-slate-600'}`} aria-label="Large text size"><Plus className="h-3 w-3" /></button>
                    <button onClick={() => setFontScale('x-large')} className={`rounded-md px-2 py-1 text-base ${fontScale === 'x-large' ? 'bg-emerald-600 text-white' : 'text-slate-600'}`} aria-label="Extra large text size"><Plus className="h-3.5 w-3.5" /><Plus className="-ml-1.5 h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Role Portal Tabs Bar with Registered ID Lock Badges */}
      <div className="bg-slate-950/80 border-t border-slate-800/80 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto py-1 text-xs">
          <div className="flex items-center gap-1 min-w-max">
            <span className="text-[10px] text-emerald-400 font-extrabold uppercase px-2.5 py-1 rounded-lg bg-emerald-950/90 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <Sliders className="w-3 h-3 text-emerald-400" /> {isHindi ? 'डेमो पोर्टल:' : 'DEMO PORTAL:'}
            </span>

            {portals.map((portal) => {
              const IconComponent = portal.icon;
              const isActive = currentRole === portal.id;
              const isAuth = portal.id === 'CONSUMER' || authenticatedSessions[portal.id]?.isAuthenticated;

              return (
                <button
                  key={portal.id}
                  onClick={() => attemptRoleSwitch(portal.id)}
                  className={`px-3 py-2 rounded-xl flex items-center gap-2 font-medium transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white border border-slate-700 shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                  }`}
                >
                  <IconComponent className={`w-3.5 h-3.5 ${portal.color}`} />
                  <span className="font-bold">{portal.label}</span>

                  {/* Lock / Verified Badge Indicator */}
                  {isAuth ? (
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/30 font-mono font-bold flex items-center gap-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> {isHindi ? 'प्रमाणित' : 'AUTH'}
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/30 font-mono font-bold flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5 text-amber-400" /> {isHindi ? 'लॉक' : 'LOCKED'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
