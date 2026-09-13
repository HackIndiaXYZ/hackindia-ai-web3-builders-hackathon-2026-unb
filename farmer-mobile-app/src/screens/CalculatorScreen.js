import React, { useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView
} from 'react-native';

export default function CalculatorScreen({ language }) {
  const { t } = useTranslation(language);
  const [weight, setWeight] = useState('10.0');
  const [fat, setFat] = useState('4.5');
  const [snf, setSnf] = useState('8.8');

  const w = parseFloat(weight) || 0;
  const f = parseFloat(fat) || 0;
  const s = parseFloat(snf) || 0;

  const ratePerLiter = +(f * 7.5 + s * 4.0).toFixed(2);
  const totalPayout = +(w * ratePerLiter).toFixed(2);

  const applyPreset = (pw, pf, ps) => {
    setWeight(String(pw));
    setFat(String(pf));
    setSnf(String(ps));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.title}>
              {t('calcTitle')}
            </Text>
            <Text style={styles.sub}>
              {t('calcFormula')}
            </Text>
          </View>
          <View style={styles.rateBadge}>
            <Text style={styles.rateBadgeText}>₹{ratePerLiter} / ली</Text>
          </View>
        </View>

        {/* Quick Presets */}
        <Text style={styles.presetHeading}>{t('quickPresets')}</Text>
        <View style={styles.presetRow}>
          <TouchableOpacity
            style={styles.presetBtn}
            onPress={() => applyPreset(12, 6.8, 9.0)}
            activeOpacity={0.7}
          >
            <Text style={styles.presetText}>🐂 मुर्रा भैंस</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.presetBtn}
            onPress={() => applyPreset(10, 4.2, 8.6)}
            activeOpacity={0.7}
          >
            <Text style={styles.presetText}>🐄 साहीवाल गाय</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.presetBtn}
            onPress={() => applyPreset(8, 4.8, 8.9)}
            activeOpacity={0.7}
          >
            <Text style={styles.presetText}>⭐ गीर गाय</Text>
          </TouchableOpacity>
        </View>

        {/* Weight */}
        <View style={styles.inputBoxGroup}>
          <Text style={styles.inputLabel}>{t('milkWeightLiters')}</Text>
          <TextInput
            style={styles.inputBox}
            keyboardType="numeric"
            value={weight}
            onChangeText={setWeight}
          />
        </View>

        {/* Fat & SNF */}
        <View style={styles.formRow}>
          <View style={styles.formCol}>
            <Text style={styles.inputLabel}>{t('fatPercent')}</Text>
            <TextInput
              style={[styles.inputBox, { color: '#15803D' }]}
              keyboardType="numeric"
              value={fat}
              onChangeText={setFat}
            />
          </View>
          <View style={styles.formCol}>
            <Text style={styles.inputLabel}>{t('snfPercent')}</Text>
            <TextInput
              style={[styles.inputBox, { color: '#0284C7' }]}
              keyboardType="numeric"
              value={snf}
              onChangeText={setSnf}
            />
          </View>
        </View>

        {/* Results Card */}
        <View style={styles.resultCard}>
          <View style={styles.resultRow}>
            <Text style={styles.resLabel}>{t('ratePerLiterCalc')}</Text>
            <Text style={styles.resRate}>₹{ratePerLiter}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.resultRow}>
            <Text style={styles.resBoldLabel}>{t('totalPayout')}</Text>
            <Text style={styles.resTotal}>₹{totalPayout}</Text>
          </View>
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
    gap: 12,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  sub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  rateBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rateBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },
  presetHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginTop: 2,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
    alignItems: 'center',
  },
  presetText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  inputBoxGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  inputBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  formRow: {
    flexDirection: 'row',
    gap: 8,
  },
  formCol: {
    flex: 1,
    gap: 4,
  },
  resultCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 14,
    gap: 8,
    marginTop: 4,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resLabel: {
    fontSize: 12,
    color: '#475569',
  },
  resRate: {
    fontSize: 14,
    fontWeight: '800',
    color: '#15803D',
  },
  divider: {
    height: 1,
    backgroundColor: '#DCFCE7',
  },
  resBoldLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  resTotal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#15803D',
  },
});
