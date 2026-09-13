import React, { useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView
} from 'react-native';

export default function PourLogScreen({ language, pourEvents, onQuickPour, onViewReceipt }) {
  const { t } = useTranslation(language);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'MORNING' | 'EVENING'

  const filteredPours = pourEvents.filter((p) => {
    if (filter === 'ALL') return true;
    if (filter === 'MORNING') return p.session.includes('सुबह') || p.session.includes('Morning');
    if (filter === 'EVENING') return p.session.includes('शाम') || p.session.includes('Evening');
    return true;
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      
      {/* Header with Filter Chips */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>
              {t('milkCollectionReceipts')}
            </Text>
            <Text style={styles.headerSub}>
              {pourEvents.length} {t('totalSessions')}
            </Text>
          </View>

          <TouchableOpacity style={styles.logBtn} onPress={onQuickPour} activeOpacity={0.85}>
            <Text style={styles.logBtnText}>{t('logMilk')}</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {[
            { id: 'ALL', label: t('allSessions') },
            { id: 'MORNING', label: t('morning') },
            { id: 'EVENING', label: t('evening') }
          ].map((item) => {
            const active = filter === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setFilter(item.id)}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* List of Pours */}
      {filteredPours.map((pour) => (
        <View key={pour.eventId} style={styles.pourCard}>
          <View style={styles.pourCardTop}>
            <View>
              <Text style={styles.sessionTitle}>{pour.session}</Text>
              <Text style={styles.dateText}>{pour.dateStr} • {pour.center}</Text>
            </View>
            <View style={styles.payoutBox}>
              <Text style={styles.payoutAmount}>₹{pour.payoutINR}</Text>
              <Text style={styles.payoutStatus}>✓ {t('paidToBank')}</Text>
            </View>
          </View>

          {/* Stat Boxes */}
          <View style={styles.metricGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.mLabel}>{t('weight')}</Text>
              <Text style={styles.mVal}>{pour.weightKg} kg</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.mLabel}>{t('fat')}</Text>
              <Text style={[styles.mVal, { color: '#15803D' }]}>{pour.fatPercent}%</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.mLabel}>{t('snf')}</Text>
              <Text style={[styles.mVal, { color: '#0284C7' }]}>{pour.snfPercent}%</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.mLabel}>{t('ratePerL')}</Text>
              <Text style={styles.mVal}>₹{pour.ratePerLiter}</Text>
            </View>
          </View>

          {/* Footer Receipt Action */}
          <View style={styles.cardFooter}>
            <Text style={styles.receiptCode}>{t('receiptCode')} {pour.receiptHash}</Text>
            <TouchableOpacity
              style={styles.viewSlipBtn}
              onPress={() => onViewReceipt && onViewReceipt(pour)}
            >
              <Text style={styles.viewSlipText}>
                {t('viewSlipLong')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

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
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    elevation: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  logBtn: {
    backgroundColor: '#15803D',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  logBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#15803D',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#15803D',
    fontWeight: '800',
  },
  pourCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 10,
    elevation: 1,
  },
  pourCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sessionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  dateText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  payoutBox: {
    alignItems: 'flex-end',
  },
  payoutAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#15803D',
  },
  payoutStatus: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
    marginTop: 1,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  mLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  mVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  receiptCode: {
    fontSize: 11,
    color: '#94A3B8',
  },
  viewSlipBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  viewSlipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
});
