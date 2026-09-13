import React from 'react';
import { useTranslation } from '../i18n/useTranslation';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView
} from 'react-native';

export default function KccLoanScreen({ language, approved, onApply }) {
  const { t } = useTranslation(language);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      
      {/* Main Loan Banner */}
      <View style={styles.mainCard}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconEmoji}>🏛️</Text>
        </View>

        <Text style={styles.title}>
          {t('nabardKccTitle')}
        </Text>
        <Text style={styles.sub}>
          {t('kccPreApprovedSub')}
        </Text>

        {/* Breakdown Box */}
        <View style={styles.detailsBox}>
          <View style={styles.row}>
            <Text style={styles.label}>{t('approvedLimit')}</Text>
            <Text style={styles.valGreen}>₹1,60,000</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t('interestRate')}</Text>
            <Text style={styles.valDark}>{t('interestRateVal')}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t('bankAccount')}</Text>
            <Text style={styles.valDark}>SBI **4012 (Ramesh Kumar)</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t('collateral')}</Text>
            <Text style={styles.valGreen}>{t('collateralVal')}</Text>
          </View>
        </View>

        {approved ? (
          <View style={styles.approvedCard}>
            <Text style={styles.approvedTitle}>
              {t('loanSanctioned')}
            </Text>
            <Text style={styles.approvedSub}>
              {t('loanSanctionedDesc')}
            </Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.applyButton} onPress={onApply} activeOpacity={0.85}>
            <Text style={styles.applyButtonText}>
              {t('sanctionLoan')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Highlights */}
      <View style={styles.highlightsGrid}>
        <View style={styles.highlightCard}>
          <Text style={styles.hlIcon}>📝</Text>
          <Text style={styles.hlTitle}>{t('noPaperwork')}</Text>
          <Text style={styles.hlDesc}>
            {t('noPaperworkDesc')}
          </Text>
        </View>

        <View style={styles.highlightCard}>
          <Text style={styles.hlIcon}>🌾</Text>
          <Text style={styles.hlTitle}>{t('lowInterest')}</Text>
          <Text style={styles.hlDesc}>
            {t('lowInterestDesc')}
          </Text>
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
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    alignItems: 'center',
    gap: 10,
    elevation: 1,
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 26,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  sub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 8,
  },
  detailsBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 10,
    marginVertical: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: '#64748B',
  },
  valGreen: {
    fontSize: 14,
    fontWeight: '800',
    color: '#15803D',
  },
  valDark: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  applyButton: {
    width: '100%',
    backgroundColor: '#15803D',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  approvedCard: {
    width: '100%',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  approvedTitle: {
    color: '#15803D',
    fontSize: 14,
    fontWeight: '800',
  },
  approvedSub: {
    color: '#475569',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  highlightsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  highlightCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 4,
    elevation: 1,
  },
  hlIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  hlTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  hlDesc: {
    fontSize: 10,
    color: '#64748B',
    lineHeight: 14,
  },
});
