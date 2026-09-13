import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  Switch
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import * as Location from 'expo-location';
import { useTranslation } from './src/i18n/useTranslation';

import HomeScreen from './src/screens/HomeScreen';
import PourLogScreen from './src/screens/PourLogScreen';
import CattleScreen from './src/screens/CattleScreen';
import KccLoanScreen from './src/screens/KccLoanScreen';
import AmcuSyncScreen from './src/screens/AmcuSyncScreen';
import CalculatorScreen from './src/screens/CalculatorScreen';
import { logMilkDeposit, submitGrievance, submitNdlmRegistration } from './src/services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('HOME'); // 'HOME' | 'POURS' | 'CATTLE' | 'KCC' | 'AMCU' | 'CALC'
  const [language, setLanguage] = useState('hi-IN'); 

  const { t } = useTranslation(language);

  React.useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      try {
        let location = await Location.getCurrentPositionAsync({});
        let geocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
        
        if (geocode && geocode.length > 0) {
          const state = geocode[0].region || '';
          if (state.includes('Maharashtra')) setLanguage('mr-IN');
          else if (state.includes('Andhra') || state.includes('Telangana')) setLanguage('te-IN');
          else if (state.includes('Haryana') || state.includes('Delhi') || state.includes('Uttar')) setLanguage('hi-IN');
        }
      } catch (e) {
        console.log('Location error:', e);
      }
    })();
  }, []);

  // Farmer Information
  const [farmer] = useState({
    farmerId: '201410000123',
    name: 'रमेश कुमार (Ramesh Kumar)',
    ndlmTag: '840003129940112',
    village: 'निसिंग, करनाल (Nissing, Karnal)',
    bankAccount: 'SBI खाता **4012',
    purityScore: 87
  });

  // Cattle Data List
  const [cattleList, setCattleList] = useState([
    { id: '1', breed: 'मुर्रा भैंस (Murrah Buffalo)', tag: '840003129940112', dailyYield: '12.5 ली/दिन', status: 'स्वस्थ (Healthy)', vaccine: 'FMD टीका सत्यापित', icon: '🐂' },
    { id: '2', breed: 'साहीवाल गाय (Sahiwal Cow)', tag: '840003129940113', dailyYield: '9.0 ली/दिन', status: 'स्वस्थ (Healthy)', vaccine: 'HS बूस्टर पूर्ण', icon: '🐄' },
    { id: '3', breed: 'गीर गाय (Gir Cow)', tag: '840003129940114', dailyYield: '10.2 ली/दिन', status: 'स्वस्थ (Healthy)', vaccine: 'टीकाकरण पूर्ण', icon: '🐄' },
    { id: '4', breed: 'मुर्रा भैंस #2 (Murrah)', tag: '840003129940115', dailyYield: '11.8 ली/दिन', status: 'स्वस्थ (Healthy)', vaccine: 'FMD टीका सत्यापित', icon: '🐂' }
  ]);

  // Pour Events State
  const [pourEvents, setPourEvents] = useState([
    {
      eventId: 'PE-20260831-001',
      session: 'सुबह (Morning)',
      dateStr: 'आज, 07:15 AM',
      weightKg: 8.5,
      fatPercent: 4.2,
      snfPercent: 8.7,
      ratePerLiter: 66.30,
      payoutINR: 563.55,
      center: 'VLC-22 निसिंग केंद्र',
      bankStatus: 'खाते में जमा (Credited)',
      receiptHash: 'REC-2026-VLC22-0941'
    },
    {
      eventId: 'PE-20260830-002',
      session: 'कल शाम (Evening)',
      dateStr: 'कल, 06:40 PM',
      weightKg: 7.0,
      fatPercent: 4.4,
      snfPercent: 8.8,
      ratePerLiter: 68.20,
      payoutINR: 477.40,
      center: 'VLC-22 निसिंग केंद्र',
      bankStatus: 'खाते में जमा (Credited)',
      receiptHash: 'REC-2026-VLC22-0938'
    }
  ]);

  // Modals
  const [showQuickPourModal, setShowQuickPourModal] = useState(false);
  const [showAddCattleModal, setShowAddCattleModal] = useState(false);
  const [showKccModal, setShowKccModal] = useState(false);
  const [showGrievanceModal, setShowGrievanceModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [grievanceCategory, setGrievanceCategory] = useState('QUALITY_CONCERN');
  const [grievanceDescription, setGrievanceDescription] = useState('');
  const [grievanceAnonymous, setGrievanceAnonymous] = useState(false);

  // Form States
  const [pourWeight, setPourWeight] = useState('8.5');
  const [pourFat, setPourFat] = useState('4.2');
  const [pourSnf, setPourSnf] = useState('8.7');
  const [pourSession, setPourSession] = useState('सुबह (Morning)');

  const [newTag, setNewTag] = useState('');
  const [newBreed, setNewBreed] = useState('मुर्रा भैंस');
  const [newCattleForm, setNewCattleForm] = useState({
    animalName: '', sex: 'Female', dateOfBirth: '', ownerMobile: '', village: '', district: 'Karnal',
    vaccinationDate: '', calvingDate: '', consent: false
  });

  const [kccApproved, setKccApproved] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const handleSpeak = () => {
    const latest = pourEvents[0] || { weightKg: 8.5, payoutINR: 563.55 };
    const speechText = language === 'hi-IN'
      ? `नमस्ते रमेश जी। आज का दूध ${latest.weightKg} किलो दर्ज हुआ है। आपकी कुल राशि ${latest.payoutINR} रुपये खाते में भेज दी गई है।`
      : language === 'mr-IN'
      ? `नमस्कार रमेश जी. आजचे दूध ${latest.weightKg} किलो नोंदवले गेले आहे. तुमची एकूण रक्कम ${latest.payoutINR} रुपये खात्यात जमा झाली आहे.`
      : language === 'te-IN'
      ? `నమస్కారం రమేష్ జీ. ఈ రోజు పాలు ${latest.weightKg} కిలోలు నమోదు చేయబడింది. మొత్తం ${latest.payoutINR} రూపాయలు ఖాతాలో జమ చేయబడ్డాయి.`
      : `Hello Ramesh ji. Your milk pour of ${latest.weightKg} kg has been recorded. Total amount of ${latest.payoutINR} rupees has been credited.`;

    Speech.speak(speechText, {
      language: language,
      rate: 0.95,
      onDone: () => setSpeaking(false),
      onError: () => setSpeaking(false)
    });
    setSpeaking(true);
  };

  // Add milk pour
  const handleAddPour = async () => {
    const w = parseFloat(pourWeight) || 8.0;
    const f = parseFloat(pourFat) || 4.2;
    const s = parseFloat(pourSnf) || 8.7;
    const rate = +(f * 7.5 + s * 4.0).toFixed(2);
    const payout = +(w * rate).toFixed(2);

    const newPour = {
      eventId: `PE-20260831-${String(pourEvents.length + 1).padStart(3, '0')}`,
      session: pourSession,
      dateStr: 'अभी (Just now)',
      weightKg: w,
      fatPercent: f,
      snfPercent: s,
      ratePerLiter: rate,
      payoutINR: payout,
      center: 'VLC-22 निसिंग केंद्र',
      bankStatus: 'खाते में जमा (Credited)',
      receiptHash: `REC-2026-VLC22-${Math.floor(1000 + Math.random() * 9000)}`
    };

    try {
      const response = await logMilkDeposit({
        farmerId: farmer.farmerId,
        farmerName: farmer.name,
        nodeId: 'VLC-22',
        weightKg: w,
        fatPercent: f,
        snfPercent: s,
        session: pourSession.includes('सुबह') ? 'MORNING' : 'EVENING'
      });
      newPour.eventId = response.milkLog.eventId;
      newPour.receiptHash = response.milkLog.receiptHash;
    } catch (error) {
      Alert.alert(isHindi ? 'ऑफलाइन रिकॉर्ड' : 'Offline record', 'The pour was saved on this phone and will need a later sync.');
    }

    setPourEvents([newPour, ...pourEvents]);
    setShowQuickPourModal(false);
    Alert.alert(
      t('pourLogged'),
      `${w} kg - ₹${payout}`
    );
  };

  const handleSubmitGrievance = async () => {
    if (!grievanceDescription.trim()) {
      Alert.alert(isHindi ? 'विवरण लिखें' : 'Add details', isHindi ? 'कृपया शिकायत का विवरण लिखें।' : 'Please describe the issue.');
      return;
    }

    try {
      await submitGrievance({
        farmerId: farmer.farmerId,
        category: grievanceCategory,
        description: grievanceDescription,
        nodeId: 'VLC-22',
        isAnonymous: grievanceAnonymous
      });
      setGrievanceDescription('');
      setShowGrievanceModal(false);
      Alert.alert(isHindi ? 'शिकायत दर्ज हुई' : 'Report submitted', isHindi ? 'आपकी शिकायत FSSAI डैशबोर्ड पर भेज दी गई है।' : 'Your report is now visible to the FSSAI dashboard.');
    } catch (error) {
      Alert.alert(isHindi ? 'भेजना असफल' : 'Could not submit', error.message);
    }
  };

  // Add cattle
  const handleAddCattle = () => {
    if (!newTag.trim() || newTag.length !== 15 || Object.entries(newCattleForm).some(([key, value]) => key !== 'consent' && !String(value).trim()) || !newCattleForm.consent) {
      Alert.alert(isHindi ? 'सभी जरूरी विवरण भरें' : 'Complete required details', isHindi ? '15 अंकों का टैग, मालिक, स्थान, स्वास्थ्य और सहमति जरूरी है।' : 'The 15-digit tag, owner, location, health details and consent are required.');
      return;
    }
    const newAnimal = {
      id: String(Date.now()),
      breed: newBreed,
      tag: newTag.trim(),
      ...newCattleForm,
      dailyYield: '10.5 ली/दिन',
      status: 'स्वस्थ (Healthy)',
      vaccine: 'FMD टीका सत्यापित',
      verificationStatus: 'SUBMITTED_FOR_FIELD_VERIFICATION'
    };
    submitNdlmRegistration({
      ...newAnimal,
      ndlmTag: newAnimal.tag,
      lastVaccinationDate: newCattleForm.vaccinationDate,
      consent: newCattleForm.consent
    }).catch(() => null);
    setCattleList([newAnimal, ...cattleList]);
    setNewTag('');
    setNewCattleForm({ animalName: '', sex: 'Female', dateOfBirth: '', ownerMobile: '', village: '', district: 'Karnal', vaccinationDate: '', calvingDate: '', consent: false });
    setShowAddCattleModal(false);
    Alert.alert(
      isHindi ? 'पशु पंजीकृत हुआ' : 'Cattle Registered',
      isHindi ? `टैग #${newAnimal.tag} आपके खाते से जोड़ दिया गया है।` : `Tag #${newAnimal.tag} linked to profile.`
    );
  };

  const prefillNdlmDemo = () => {
    setNewBreed('साहीवाल गाय');
    setNewTag('840003129940999');
    setNewCattleForm({
      animalName: 'गंगा (Ganga)',
      sex: 'Female',
      dateOfBirth: '2022-01-01',
      ownerMobile: '9876543210',
      village: 'निसिंग (Nissing)',
      district: 'Karnal',
      vaccinationDate: '2026-08-01',
      calvingDate: '2026-02-15',
      consent: true
    });
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        {/* Clean, Simple Top Navigation Header */}
        <View style={styles.topHeader}>
          <View style={styles.headerBrand}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>🥛</Text>
            </View>
            <View>
              <View style={styles.titleRow}>
                <Text style={styles.headerTitle}>
                  {isHindi ? 'अन्वेषण किसान' : 'Anveshana Kisan'}
                </Text>
                <View style={styles.onlineBadge}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.onlineText}>{isHindi ? 'सक्रिय' : 'Live'}</Text>
                </View>
              </View>
              <Text style={styles.headerSubtitle}>
                {isHindi ? 'राष्ट्रीय डेयरी सेवा पोर्टल' : 'National Dairy Platform'}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.grievanceButton} onPress={() => setShowGrievanceModal(true)} activeOpacity={0.8}>
              <Text style={styles.grievanceText}>{isHindi ? 'शिकायत' : 'Report'}</Text>
            </TouchableOpacity>
            {/* Simple Voice Helper Button */}
            <TouchableOpacity
              style={[styles.voiceButton, speaking && styles.voiceButtonActive]}
              onPress={handleSpeak}
              activeOpacity={0.8}
            >
              <Text style={styles.voiceIcon}>{speaking ? '🔊' : '🗣️'}</Text>
              <Text style={styles.voiceText}>{isHindi ? 'बोलें' : 'Voice'}</Text>
            </TouchableOpacity>

            {/* Language Switch */}
            <TouchableOpacity
              style={styles.langButton}
              onPress={() => {
                const nextLang = language === 'hi-IN' ? 'en-IN' : language === 'en-IN' ? 'mr-IN' : language === 'mr-IN' ? 'te-IN' : 'hi-IN';
                setLanguage(nextLang);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.langText}>{language.split('-')[0].toUpperCase()}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Simple Horizontal Scroll Navigation */}
        <View style={styles.navScrollWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navScroll}>
            {[
              { id: 'HOME', label: t('home'), icon: '🏠' },
              { id: 'POURS', label: t('receipts'), icon: '📋' },
              { id: 'CATTLE', label: t('cattle'), icon: '🐄' },
              { id: 'KCC', label: t('loan'), icon: '💰' },
              { id: 'AMCU', label: t('machine'), icon: '⚖️' },
              { id: 'CALC', label: t('calculator'), icon: '🧮' }
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tabChip, active && styles.tabChipActive]}
                  onPress={() => setActiveTab(tab.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.tabChipIcon}>{tab.icon}</Text>
                  <Text style={[styles.tabChipText, active && styles.tabChipTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Main Content Body */}
        <View style={styles.mainBody}>
          {activeTab === 'HOME' && (
            <HomeScreen
              language={language}
              farmer={farmer}
              pourEvents={pourEvents}
              cattleCount={cattleList.length}
              speaking={speaking}
              onSpeak={handleSpeak}
              onQuickPour={() => setShowQuickPourModal(true)}
              onAddCattle={() => setShowAddCattleModal(true)}
              onOpenKcc={() => setShowKccModal(true)}
              onOpenCalculator={() => setActiveTab('CALC')}
              onViewReceipt={(receipt) => setSelectedReceipt(receipt)}
            />
          )}

          {activeTab === 'POURS' && (
            <PourLogScreen
              language={language}
              pourEvents={pourEvents}
              onQuickPour={() => setShowQuickPourModal(true)}
              onViewReceipt={(receipt) => setSelectedReceipt(receipt)}
            />
          )}

          {activeTab === 'CATTLE' && (
            <CattleScreen
              language={language}
              cattleList={cattleList}
              onAddCattle={() => setShowAddCattleModal(true)}
            />
          )}

          {activeTab === 'KCC' && (
            <KccLoanScreen
              language={language}
              approved={kccApproved}
              onApply={() => {
                setKccApproved(true);
                Alert.alert(
                  isHindi ? 'बधाई! KCC लोन स्वीकृत' : 'KCC Loan Approved!',
                  isHindi
                    ? '₹1,60,000 की राशि आपके स्टेट बैंक खाते में स्वीकृत कर दी गई है।'
                    : '₹1,60,000 credit limit has been sanctioned to your SBI account.'
                );
              }}
            />
          )}

          {activeTab === 'AMCU' && (
            <AmcuSyncScreen language={language} />
          )}

          {activeTab === 'CALC' && (
            <CalculatorScreen language={language} />
          )}
        </View>

        {/* Clean Bottom Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.bottomItem}
            onPress={() => setActiveTab('HOME')}
          >
            <Text style={[styles.bottomIcon, activeTab === 'HOME' && styles.bottomIconActive]}>🏠</Text>
            <Text style={[styles.bottomLabel, activeTab === 'HOME' && styles.bottomLabelActive]}>
              {isHindi ? 'मुख्य' : 'Home'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bottomItem}
            onPress={() => setActiveTab('POURS')}
          >
            <Text style={[styles.bottomIcon, activeTab === 'POURS' && styles.bottomIconActive]}>📋</Text>
            <Text style={[styles.bottomLabel, activeTab === 'POURS' && styles.bottomLabelActive]}>
              {isHindi ? 'रसीदें' : 'Receipts'}
            </Text>
          </TouchableOpacity>

          {/* Large Center Action Button */}
          <TouchableOpacity
            style={styles.centerActionButton}
            onPress={() => setShowQuickPourModal(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.centerActionIcon}>➕</Text>
            <Text style={styles.centerActionLabel}>{isHindi ? 'दूध डालें' : 'Add Milk'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bottomItem}
            onPress={() => setActiveTab('CATTLE')}
          >
            <Text style={[styles.bottomIcon, activeTab === 'CATTLE' && styles.bottomIconActive]}>🐄</Text>
            <Text style={[styles.bottomLabel, activeTab === 'CATTLE' && styles.bottomLabelActive]}>
              {isHindi ? 'पशुधन' : 'Cattle'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bottomItem}
            onPress={() => setActiveTab('KCC')}
          >
            <Text style={[styles.bottomIcon, activeTab === 'KCC' && styles.bottomIconActive]}>💰</Text>
            <Text style={[styles.bottomLabel, activeTab === 'KCC' && styles.bottomLabelActive]}>
              {isHindi ? 'लोन' : 'Loan'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* MODAL 1: Quick Milk Pour */}
        <Modal visible={showQuickPourModal} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalHeading}>
                    {isHindi ? 'दूध संग्रह दर्ज करें' : 'Log Milk Pour'}
                  </Text>
                  <Text style={styles.modalSubheading}>
                    {isHindi ? 'डेयरी मशीन (AMCU) में सीधा दर्ज' : 'Direct Entry to Dairy Scale'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowQuickPourModal(false)} style={styles.modalCloseButton}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Morning / Evening Selection */}
              <Text style={styles.fieldLabel}>{isHindi ? 'समय चुनें (Session)' : 'Select Session'}</Text>
              <View style={styles.sessionToggle}>
                {['सुबह (Morning)', 'शाम (Evening)'].map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.sessionOption, pourSession === s && styles.sessionOptionActive]}
                    onPress={() => setPourSession(s)}
                  >
                    <Text style={[styles.sessionText, pourSession === s && styles.sessionTextActive]}>
                      {s.includes('सुबह') ? '🌅 ' : '🌙 '}{s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Inputs */}
              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>{isHindi ? 'वजन (किलो / Liters)' : 'Weight (Kg)'}</Text>
                  <TextInput
                    style={styles.inputBox}
                    keyboardType="numeric"
                    value={pourWeight}
                    onChangeText={setPourWeight}
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>{isHindi ? 'फैट (%)' : 'Fat (%)'}</Text>
                  <TextInput
                    style={[styles.inputBox, { color: '#15803D' }]}
                    keyboardType="numeric"
                    value={pourFat}
                    onChangeText={setPourFat}
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>{isHindi ? 'एसएनएफ (%)' : 'SNF (%)'}</Text>
                  <TextInput
                    style={[styles.inputBox, { color: '#0284C7' }]}
                    keyboardType="numeric"
                    value={pourSnf}
                    onChangeText={setPourSnf}
                  />
                </View>
              </View>

              {/* Total Calculation Preview */}
              <View style={styles.calcPreviewCard}>
                <View style={styles.calcPreviewRow}>
                  <Text style={styles.calcPreviewLabel}>{isHindi ? 'दूध दर प्रति लीटर:' : 'Rate per Liter:'}</Text>
                  <Text style={styles.calcPreviewRate}>
                    ₹{(parseFloat(pourFat || 4.2) * 7.5 + parseFloat(pourSnf || 8.7) * 4.0).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.calcPreviewRow}>
                  <Text style={styles.calcPreviewBoldLabel}>{isHindi ? 'कुल मिलने वाली राशि:' : 'Total Payout:'}</Text>
                  <Text style={styles.calcPreviewTotal}>
                    ₹{(
                      (parseFloat(pourFat || 4.2) * 7.5 + parseFloat(pourSnf || 8.7) * 4.0) *
                      parseFloat(pourWeight || 8.5)
                    ).toFixed(2)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleAddPour} activeOpacity={0.85}>
                <Text style={styles.submitButtonText}>
                  {isHindi ? '✓ मशीन में दर्ज करें और रसीद लें' : '✓ Submit Pour to Scale'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* MODAL 2: Add Cattle */}
        <Modal visible={showAddCattleModal} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalHeading}>
                    {isHindi ? 'नया पशु पंजीकृत करें' : 'Register New Cattle'}
                  </Text>
                  <Text style={styles.modalSubheading}>
                    {isHindi ? 'NDLM 15-अंकों का कान का टैग' : '15-Digit NDLM Ear Tag'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowAddCattleModal(false)} style={styles.modalCloseButton}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.registrationScroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.formHint}>{isHindi ? 'NDLM / पशुधन रिकॉर्ड के लिए सभी जरूरी विवरण भरें।' : 'Complete the required details for the NDLM / Pashudhan record.'}</Text>
                <TouchableOpacity style={styles.prefillButton} onPress={prefillNdlmDemo} activeOpacity={0.8}><Text style={styles.prefillButtonText}>{isHindi ? 'डेमो विवरण भरें' : 'Load demo registration details'}</Text></TouchableOpacity>
                <Text style={styles.fieldLabel}>{isHindi ? 'पशु का नाम / पहचान *' : 'Animal name / local identifier *'}</Text>
                <TextInput style={styles.inputBox} placeholder="Ganga" placeholderTextColor="#94A3B8" value={newCattleForm.animalName} onChangeText={(value) => setNewCattleForm({ ...newCattleForm, animalName: value })} />

                <Text style={styles.fieldLabel}>{isHindi ? 'कान का टैग नंबर (15 अंक) *' : '15-digit NDLM ear tag *'}</Text>
                <TextInput style={styles.inputBox} keyboardType="numeric" maxLength={15} placeholder="840003129940116" placeholderTextColor="#94A3B8" value={newTag} onChangeText={(value) => setNewTag(value.replace(/\D/g, ''))} />

                <Text style={[styles.fieldLabel, { marginTop: 12 }]}>{isHindi ? 'पशु की नस्ल चुनें *' : 'Select breed *'}</Text>
                <View style={styles.breedGrid}>
                  {['मुर्रा भैंस', 'साहीवाल गाय', 'गीर गाय', 'थारपारकर'].map((b) => (
                    <TouchableOpacity key={b} style={[styles.breedChip, newBreed === b && styles.breedChipActive]} onPress={() => setNewBreed(b)}>
                      <Text style={[styles.breedChipText, newBreed === b && styles.breedChipTextActive]}>{b}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>{isHindi ? 'लिंग *' : 'Sex *'}</Text>
                <View style={styles.breedGrid}>
                  {['Female', 'Male'].map((sex) => <TouchableOpacity key={sex} style={[styles.breedChip, newCattleForm.sex === sex && styles.breedChipActive]} onPress={() => setNewCattleForm({ ...newCattleForm, sex })}><Text style={[styles.breedChipText, newCattleForm.sex === sex && styles.breedChipTextActive]}>{sex}</Text></TouchableOpacity>)}
                </View>

                {[
                  ['dateOfBirth', isHindi ? 'जन्म तिथि *' : 'Date of birth / age *'],
                  ['ownerMobile', isHindi ? 'मालिक का मोबाइल *' : 'Owner mobile *'],
                  ['village', isHindi ? 'गांव / पंचायत *' : 'Village / panchayat *'],
                  ['district', isHindi ? 'जिला *' : 'District *'],
                  ['vaccinationDate', isHindi ? 'अंतिम टीकाकरण तिथि *' : 'Last vaccination date *'],
                  ['calvingDate', isHindi ? 'अंतिम बछड़ा देने की तिथि *' : 'Latest calving date *']
                ].map(([field, label]) => <View key={field}><Text style={styles.fieldLabel}>{label}</Text><TextInput style={styles.inputBox} keyboardType={field === 'ownerMobile' ? 'phone-pad' : field.includes('Date') ? 'numbers-and-punctuation' : 'default'} maxLength={field === 'ownerMobile' ? 10 : undefined} placeholder={field.includes('Date') ? 'YYYY-MM-DD' : ''} placeholderTextColor="#94A3B8" value={newCattleForm[field]} onChangeText={(value) => setNewCattleForm({ ...newCattleForm, [field]: value })} /></View>)}

                <TouchableOpacity style={styles.consentRow} onPress={() => setNewCattleForm({ ...newCattleForm, consent: !newCattleForm.consent })} activeOpacity={0.8}>
                  <View style={[styles.checkbox, newCattleForm.consent && styles.checkboxActive]} />
                  <Text style={styles.consentText}>{isHindi ? 'मैं पशु और मालिक की जानकारी की पुष्टि करता/करती हूं और NDLM सत्यापन की सहमति देता/देती हूं। *' : 'I confirm these details and consent to NDLM field verification. *'}</Text>
                </TouchableOpacity>
              </ScrollView>

              <TouchableOpacity style={[styles.submitButton, { marginTop: 18 }]} onPress={handleAddCattle}>
                <Text style={styles.submitButtonText}>
                  {isHindi ? '✓ पशु को प्रोफाइल से जोड़ें' : '✓ Link Cattle to Profile'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* MODAL 3: KCC Loan Sanction */}
        <Modal visible={showKccModal} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalHeading}>
                    {isHindi ? 'सरकारी किसान क्रेडिट कार्ड (KCC)' : 'Govt Kisan Credit Card (KCC)'}
                  </Text>
                  <Text style={styles.modalSubheading}>
                    {isHindi ? 'नाबार्ड एवं भारतीय स्टेट बैंक द्वारा अनुमोदित' : 'NABARD & SBI Approved'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowKccModal(false)} style={styles.modalCloseButton}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.kccSummaryCard}>
                <View style={styles.kccSummaryRow}>
                  <Text style={styles.kccSummaryLabel}>{isHindi ? 'स्वीकृत ऋण राशि:' : 'Approved Loan Limit:'}</Text>
                  <Text style={styles.kccSummaryValueGreen}>₹1,60,000</Text>
                </View>
                <View style={styles.kccSummaryRow}>
                  <Text style={styles.kccSummaryLabel}>{isHindi ? 'वार्षिक ब्याज दर:' : 'Interest Rate:'}</Text>
                  <Text style={styles.kccSummaryValue}>4.0% प्रति वर्ष (सब्सिडी सहित)</Text>
                </View>
                <View style={styles.kccSummaryRow}>
                  <Text style={styles.kccSummaryLabel}>{isHindi ? 'लाभार्थी बैंक खाता:' : 'Bank Account:'}</Text>
                  <Text style={styles.kccSummaryValue}>SBI **4012 (रमेश कुमार)</Text>
                </View>
                <View style={styles.kccSummaryRow}>
                  <Text style={styles.kccSummaryLabel}>{isHindi ? 'जमानत की आवश्यकता:' : 'Security Deposit:'}</Text>
                  <Text style={styles.kccSummaryValueGreen}>{isHindi ? 'शून्य (डेयरी दूध गारंटी)' : 'Zero (Milk Pour Guarantee)'}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={() => {
                  setKccApproved(true);
                  setShowKccModal(false);
                  Alert.alert(
                    isHindi ? 'ऋण स्वीकृत हुआ!' : 'Loan Sanctioned!',
                    isHindi
                      ? '₹1,60,000 की ऋण सीमा आपके खाते से जोड़ दी गई है।'
                      : '₹1,60,000 credit limit has been sanctioned.'
                  );
                }}
              >
                <Text style={styles.submitButtonText}>
                  {isHindi ? '✓ ₹1,60,000 ऋण स्वीकार करें' : '✓ Accept ₹1,60,000 Loan'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* MODAL 4: Whistleblower Grievance */}
        <Modal visible={showGrievanceModal} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalHeading}>{isHindi ? 'गोपनीय शिकायत दर्ज करें' : 'Report a grievance'}</Text>
                  <Text style={styles.modalSubheading}>{isHindi ? 'सीधे FSSAI निगरानी डैशबोर्ड पर' : 'Sent directly to the FSSAI monitoring dashboard'}</Text>
                </View>
                <TouchableOpacity onPress={() => setShowGrievanceModal(false)} style={styles.modalCloseButton}>
                  <Text style={styles.modalCloseText}>Close</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>{isHindi ? 'शिकायत का प्रकार' : 'Report type'}</Text>
              <View style={styles.breedGrid}>
                {['QUALITY_CONCERN', 'PAYMENT_CONCERN', 'MISCONDUCT'].map((category) => (
                  <TouchableOpacity key={category} style={[styles.breedChip, grievanceCategory === category && styles.breedChipActive]} onPress={() => setGrievanceCategory(category)}>
                    <Text style={[styles.breedChipText, grievanceCategory === category && styles.breedChipTextActive]}>{category.replace('_', ' ')}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={[styles.inputBox, styles.grievanceInput]}
                multiline
                textAlignVertical="top"
                placeholder={isHindi ? 'घटना का विवरण लिखें...' : 'Describe what happened...'}
                placeholderTextColor="#94A3B8"
                value={grievanceDescription}
                onChangeText={setGrievanceDescription}
              />
              <View style={styles.anonymousRow}>
                <Text style={styles.fieldLabel}>{isHindi ? 'गुमनाम रूप से भेजें' : 'Submit anonymously'}</Text>
                <Switch value={grievanceAnonymous} onValueChange={setGrievanceAnonymous} trackColor={{ false: '#CBD5E1', true: '#86EFAC' }} thumbColor="#15803D" />
              </View>
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmitGrievance}>
                <Text style={styles.submitButtonText}>{isHindi ? 'शिकायत भेजें' : 'Submit report'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* MODAL 5: Receipt Details */}
        <Modal visible={!!selectedReceipt} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalHeading}>
                    {isHindi ? 'दूध संग्रह रसीद' : 'Milk Collection Receipt'}
                  </Text>
                  <Text style={styles.modalSubheading}>{selectedReceipt?.eventId}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedReceipt(null)} style={styles.modalCloseButton}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              {selectedReceipt && (
                <View style={styles.receiptCard}>
                  <View style={styles.receiptMainBox}>
                    <Text style={styles.receiptAmountLabel}>{isHindi ? 'खाते में भुगतान राशि' : 'Total Amount Paid'}</Text>
                    <Text style={styles.receiptAmountValue}>₹{selectedReceipt.payoutINR}</Text>
                    <View style={styles.receiptStatusPill}>
                      <Text style={styles.receiptStatusText}>✓ {selectedReceipt.bankStatus}</Text>
                    </View>
                  </View>

                  <View style={styles.receiptDetailsGrid}>
                    <View style={styles.receiptDetailItem}>
                      <Text style={styles.rdLabel}>{isHindi ? 'वजन' : 'Weight'}</Text>
                      <Text style={styles.rdValue}>{selectedReceipt.weightKg} kg</Text>
                    </View>
                    <View style={styles.receiptDetailItem}>
                      <Text style={styles.rdLabel}>{isHindi ? 'फैट' : 'Fat'}</Text>
                      <Text style={[styles.rdValue, { color: '#15803D' }]}>{selectedReceipt.fatPercent}%</Text>
                    </View>
                    <View style={styles.receiptDetailItem}>
                      <Text style={styles.rdLabel}>{isHindi ? 'एसएनएफ' : 'SNF'}</Text>
                      <Text style={[styles.rdValue, { color: '#0284C7' }]}>{selectedReceipt.snfPercent}%</Text>
                    </View>
                    <View style={styles.receiptDetailItem}>
                      <Text style={styles.rdLabel}>{isHindi ? 'दर/लीटर' : 'Rate/L'}</Text>
                      <Text style={styles.rdValue}>₹{selectedReceipt.ratePerLiter}</Text>
                    </View>
                  </View>

                  <View style={styles.receiptMetaItem}>
                    <Text style={styles.rmKey}>{isHindi ? 'डेयरी केंद्र:' : 'Center:'}</Text>
                    <Text style={styles.rmVal}>{selectedReceipt.center}</Text>
                  </View>
                  <View style={styles.receiptMetaItem}>
                    <Text style={styles.rmKey}>{isHindi ? 'रसीद संख्या:' : 'Receipt No:'}</Text>
                    <Text style={styles.rmVal}>{selectedReceipt.receiptHash}</Text>
                  </View>
                  <View style={styles.receiptMetaItem}>
                    <Text style={styles.rmKey}>{isHindi ? 'दिनांक व समय:' : 'Date & Time:'}</Text>
                    <Text style={styles.rmVal}>{selectedReceipt.dateStr}</Text>
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: '#334155' }]}
                onPress={() => setSelectedReceipt(null)}
              >
                <Text style={styles.submitButtonText}>{isHindi ? 'बंद करें' : 'Close'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  logoText: {
    fontSize: 22,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#86EFAC',
    gap: 4,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  onlineText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  grievanceButton: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FDBA74',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  grievanceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C2410C',
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  voiceButtonActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16A34A',
  },
  voiceIcon: {
    fontSize: 14,
  },
  voiceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  langButton: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  langText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  navScrollWrapper: {
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 8,
  },
  navScroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  tabChipActive: {
    backgroundColor: '#15803D',
    borderColor: '#15803D',
  },
  tabChipIcon: {
    fontSize: 13,
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  tabChipTextActive: {
    color: '#FFFFFF',
  },
  mainBody: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  bottomItem: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  bottomIcon: {
    fontSize: 20,
    color: '#64748B',
  },
  bottomIconActive: {
    color: '#15803D',
  },
  bottomLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  bottomLabelActive: {
    color: '#15803D',
    fontWeight: '800',
  },
  centerActionButton: {
    backgroundColor: '#15803D',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    shadowColor: '#15803D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  centerActionIcon: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  centerActionLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  // Modal styling (Light Mode)
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubheading: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: 'bold',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  registrationScroll: {
    maxHeight: 470,
  },
  formHint: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 10,
    lineHeight: 16,
  },
  prefillButton: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#93C5FD',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  prefillButtonText: {
    color: '#0369A1',
    fontSize: 12,
    fontWeight: '800',
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    marginBottom: 4,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#94A3B8',
    backgroundColor: '#FFFFFF',
  },
  checkboxActive: {
    backgroundColor: '#15803D',
    borderColor: '#15803D',
  },
  consentText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    color: '#475569',
  },
  grievanceInput: {
    minHeight: 100,
    marginTop: 12,
  },
  anonymousRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  sessionToggle: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  sessionOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  sessionOptionActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#15803D',
  },
  sessionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  sessionTextActive: {
    color: '#15803D',
    fontWeight: '800',
  },
  formRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  formCol: {
    flex: 1,
  },
  inputBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  calcPreviewCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 6,
  },
  calcPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcPreviewLabel: {
    fontSize: 12,
    color: '#475569',
  },
  calcPreviewRate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  calcPreviewBoldLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  calcPreviewTotal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#15803D',
  },
  submitButton: {
    backgroundColor: '#15803D',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  breedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  breedChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  breedChipActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#15803D',
  },
  breedChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  breedChipTextActive: {
    color: '#15803D',
    fontWeight: '800',
  },
  kccSummaryCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    marginBottom: 16,
  },
  kccSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kccSummaryLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  kccSummaryValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  kccSummaryValueGreen: {
    fontSize: 15,
    fontWeight: '900',
    color: '#15803D',
  },
  receiptCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 14,
    gap: 10,
  },
  receiptMainBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  receiptAmountLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  receiptAmountValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#15803D',
    marginVertical: 4,
  },
  receiptStatusPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  receiptStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  receiptDetailsGrid: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  receiptDetailItem: {
    flex: 1,
    alignItems: 'center',
  },
  rdLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  rdValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  receiptMetaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  rmKey: {
    fontSize: 11,
    color: '#64748B',
  },
  rmVal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
  },
});
