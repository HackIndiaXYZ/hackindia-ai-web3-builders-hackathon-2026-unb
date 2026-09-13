import React, { useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput
} from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

export default function HomeScreen({
  language,
  farmer,
  pourEvents,
  cattleCount,
  speaking,
  onSpeak,
  onQuickPour,
  onAddCattle,
  onOpenKcc,
  onOpenCalculator,
  onViewReceipt,
  collectionRequests = [],
  realtimeStatus,
  onCollectionApproval
}) {
  const { t } = useTranslation(language);

  // Quick Home Calculator state
  const [calcW, setCalcW] = useState('10');
  const [calcF, setCalcF] = useState('4.5');
  const [calcS, setCalcS] = useState('8.8');

  const w = parseFloat(calcW) || 0;
  const f = parseFloat(calcF) || 0;
  const s = parseFloat(calcS) || 0;
  const rate = +(f * 7.5 + s * 4.0).toFixed(2);
  const total = +(w * rate).toFixed(2);

  // SVG Gauge calculations
  const size = 130;
  const strokeWidth = 9;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (circumference * farmer.purityScore) / 100;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      
      {/* 1. Farmer Profile & Action Card */}
      <View style={styles.card}>
        <View style={styles.farmerHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarIcon}>👨‍🌾</Text>
          </View>
          <View style={styles.farmerInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.farmerName}>{farmer.name}</Text>
              <View style={styles.verifiedTag}>
                <Text style={styles.verifiedTagText}>✓ {t('verified')}</Text>
              </View>
            </View>
            <Text style={styles.farmerMetaText}>
              {farmer.village} • NDLM #{farmer.ndlmTag}
            </Text>
            <Text style={styles.farmerSubText}>
              {farmer.bankAccount} • {cattleCount} {t('cattleRegistered')}
            </Text>
          </View>
        </View>

        {/* Big Easy Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.primaryBtn} onPress={onQuickPour} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>
              ➕ {t('logMilkPour')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={onAddCattle} activeOpacity={0.85}>
            <Text style={styles.secondaryBtnText}>
              🐄 {t('addCattle')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Cross-device aggregator requests */}
      <View style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <View>
            <Text style={styles.requestTitle}>{language === 'hi-IN' ? 'दूध संग्रह अनुरोध' : 'Milk collection requests'}</Text>
            <Text style={styles.requestSub}>{realtimeStatus === 'connected' ? 'Live sync active' : 'Syncing with dairy network'}</Text>
          </View>
          <Text style={styles.requestCount}>{collectionRequests.filter(request => request.farmerApproval === 'PENDING').length}</Text>
        </View>
        {collectionRequests.filter(request => request.farmerApproval === 'PENDING').map(request => (
          <View key={request.requestId} style={styles.requestRow}>
            <View style={styles.requestDetails}>
              <Text style={styles.requestFarmer}>{request.farmerName || 'Aggregator'}</Text>
              <Text style={styles.requestMeta}>{request.requestedAmountKg} kg · {request.requestedSession} · {request.nodeId}</Text>
            </View>
            <View style={styles.requestActions}>
              <TouchableOpacity style={styles.declineButton} onPress={() => onCollectionApproval(request.requestId, 'DECLINED')}>
                <Text style={styles.declineText}>{language === 'hi-IN' ? 'मना' : 'Decline'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.approveButton} onPress={() => onCollectionApproval(request.requestId, 'APPROVED')}>
                <Text style={styles.approveText}>{language === 'hi-IN' ? 'स्वीकार' : 'Approve'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {collectionRequests.filter(request => request.farmerApproval === 'PENDING').length === 0 && (
          <Text style={styles.emptyRequests}>{language === 'hi-IN' ? 'कोई नया अनुरोध नहीं' : 'No pending requests'}</Text>
        )}
      </View>

      {/* 2. Purity Score Card (Clean Light Gauge) */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardHeaderTitle}>
            {t('farmPurityScore')}
          </Text>
          <View style={styles.gradePill}>
            <Text style={styles.gradePillText}>{t('gradeA')}</Text>
          </View>
        </View>

        <View style={styles.gaugeContainer}>
          <View style={styles.svgWrapper}>
            <Svg width={size} height={size}>
              <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
                <Circle
                  stroke="#E2E8F0"
                  fill="none"
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  strokeWidth={strokeWidth}
                />
                <Circle
                  stroke="#16A34A"
                  fill="none"
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </G>
            </Svg>

            <View style={styles.gaugeCenter}>
              <Text style={styles.gaugeNumber}>{farmer.purityScore}</Text>
              <Text style={styles.gaugeTotal}>/ 100</Text>
            </View>
          </View>

          <View style={styles.gaugeTextCol}>
            <Text style={styles.gaugeBoldDesc}>
              {t('zeroDilution')}
            </Text>
            <Text style={styles.gaugeDesc}>
              {t('zeroDilutionDesc')}
            </Text>
          </View>
        </View>
      </View>

      {/* 3. Pre-Approved KCC Loan Banner */}
      <View style={styles.kccCard}>
        <View style={styles.kccTop}>
          <View style={styles.kccIconWrapper}>
            <Text style={styles.kccEmoji}>💰</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.kccTitle}>
              {t('preApprovedKcc')}
            </Text>
            <Text style={styles.kccSub}>
              {t('kccSub')}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.kccButton} onPress={onOpenKcc} activeOpacity={0.85}>
          <Text style={styles.kccButtonText}>
            {t('applyForCredit')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 4. Today's Milk Collection */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {t('milkCollectionHistory')}
        </Text>
        <Text style={styles.sectionBadge}>
          {pourEvents.length} {t('sessions')}
        </Text>
      </View>

      {pourEvents.map((pour) => (
        <View key={pour.eventId} style={styles.pourCard}>
          <View style={styles.pourHeader}>
            <View>
              <Text style={styles.pourSessionText}>{pour.session}</Text>
              <Text style={styles.pourDateText}>{pour.dateStr} • {pour.center}</Text>
            </View>
            <View style={styles.payoutTag}>
              <Text style={styles.payoutTagText}>₹{pour.payoutINR}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>{t('weight')}</Text>
              <Text style={styles.statVal}>{pour.weightKg} kg</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>{t('fat')}</Text>
              <Text style={[styles.statVal, { color: '#15803D' }]}>{pour.fatPercent}%</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>{t('snf')}</Text>
              <Text style={[styles.statVal, { color: '#0284C7' }]}>{pour.snfPercent}%</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>{t('ratePerL')}</Text>
              <Text style={styles.statVal}>₹{pour.ratePerLiter}</Text>
            </View>
          </View>

          <View style={styles.pourFooter}>
            <Text style={styles.receiptNo}>रसीद: {pour.receiptHash}</Text>
            <TouchableOpacity
              style={styles.viewReceiptLink}
              onPress={() => onViewReceipt && onViewReceipt(pour)}
            >
              <Text style={styles.viewReceiptLinkText}>
                {t('viewSlip')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* 5. Quick Rate Calculator Widget */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardHeaderTitle}>
            {t('milkRateCalc')}
          </Text>
          <Text style={styles.rateHighlight}>₹{rate} / ली</Text>
        </View>

        <View style={styles.calcRow}>
          <View style={styles.calcCol}>
            <Text style={styles.calcLabel}>{t('weight')}</Text>
            <TextInput
              style={styles.calcInput}
              keyboardType="numeric"
              value={calcW}
              onChangeText={setCalcW}
            />
          </View>
          <View style={styles.calcCol}>
            <Text style={styles.calcLabel}>{t('fat')}</Text>
            <TextInput
              style={[styles.calcInput, { color: '#15803D' }]}
              keyboardType="numeric"
              value={calcF}
              onChangeText={setCalcF}
            />
          </View>
          <View style={styles.calcCol}>
            <Text style={styles.calcLabel}>{t('snf')}</Text>
            <TextInput
              style={[styles.calcInput, { color: '#0284C7' }]}
              keyboardType="numeric"
              value={calcS}
              onChangeText={setCalcS}
            />
          </View>
        </View>

        <View style={styles.calcResultStrip}>
          <Text style={styles.calcResultLabel}>{t('totalPayout')}</Text>
          <Text style={styles.calcResultTotal}>₹{total}</Text>
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  requestCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: 14,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  requestTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  requestSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  requestCount: {
    minWidth: 26,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 12,
    textAlign: 'center',
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    fontWeight: '800',
  },
  requestRow: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#DBEAFE',
    gap: 8,
  },
  requestDetails: {
    flex: 1,
  },
  requestFarmer: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  requestMeta: {
    fontSize: 10,
    color: '#475569',
    marginTop: 2,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  approveButton: {
    backgroundColor: '#15803D',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  approveText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  declineButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FDA4AF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  declineText: {
    color: '#BE123C',
    fontSize: 11,
    fontWeight: '800',
  },
  emptyRequests: {
    fontSize: 11,
    color: '#64748B',
  },
  farmerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  avatarIcon: {
    fontSize: 26,
  },
  farmerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  farmerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  verifiedTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  farmerMetaText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  farmerSubText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryBtn: {
    flex: 1.2,
    backgroundColor: '#15803D',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  gradePill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  gradePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  gaugeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  svgWrapper: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  gaugeCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeNumber: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0F172A',
  },
  gaugeTotal: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  gaugeTextCol: {
    flex: 1,
  },
  gaugeBoldDesc: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
    marginBottom: 4,
  },
  gaugeDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  kccCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 16,
    gap: 12,
  },
  kccTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  kccIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kccEmoji: {
    fontSize: 20,
  },
  kccTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400E',
  },
  kccSub: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 2,
    lineHeight: 16,
  },
  kccButton: {
    backgroundColor: '#D97706',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  kccButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  pourCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 10,
  },
  pourHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pourSessionText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  pourDateText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  payoutTag: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  payoutTagText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#15803D',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  statVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  pourFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  receiptNo: {
    fontSize: 10,
    color: '#94A3B8',
  },
  viewReceiptLink: {
    paddingHorizontal: 4,
  },
  viewReceiptLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  rateHighlight: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D',
  },
  calcRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  calcCol: {
    flex: 1,
  },
  calcLabel: {
    fontSize: 11,
    color: '#475569',
    marginBottom: 4,
  },
  calcInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  calcResultStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  calcResultLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  calcResultTotal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#15803D',
  },
});
