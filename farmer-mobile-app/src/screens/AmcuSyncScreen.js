import React, { useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';

export default function AmcuSyncScreen({ language }) {
  const { t } = useTranslation(language);
  const [testing, setTesting] = useState(false);

  const handleTest = () => {
    setTesting(true);
    setTimeout(() => {
      setTesting(false);
      Alert.alert(
        t('amcuTestTitle'),
        t('amcuTestDesc')
      );
    }, 600);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      
      {/* Main Machine Status Card */}
      <View style={styles.mainCard}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.title}>
              {t('amcuTitle')}
            </Text>
            <Text style={styles.sub}>
              {t('amcuSub')}
            </Text>
          </View>

          <View style={styles.onlineBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>{t('online')}</Text>
          </View>
        </View>

        {/* 4 Sensor Stat Cards */}
        <View style={styles.grid}>
          <View style={styles.gridCard}>
            <Text style={styles.gLabel}>{t('scale')}</Text>
            <Text style={styles.gValGreen}>{t('calibrated')}</Text>
            <Text style={styles.gNote}>{t('scaleNote')}</Text>
          </View>

          <View style={styles.gridCard}>
            <Text style={styles.gLabel}>{t('lactometer')}</Text>
            <Text style={styles.gValGreen}>100% {t('passed')}</Text>
            <Text style={styles.gNote}>{t('lactoNote')}</Text>
          </View>

          <View style={styles.gridCard}>
            <Text style={styles.gLabel}>{t('signal')}</Text>
            <Text style={styles.gValBlue}>{t('strong')}</Text>
            <Text style={styles.gNote}>4G / Wi-Fi Active</Text>
          </View>

          <View style={styles.gridCard}>
            <Text style={styles.gLabel}>{t('pending')}</Text>
            <Text style={styles.gValDark}>0 {t('pending')}</Text>
            <Text style={styles.gNote}>{t('fullySynced')}</Text>
          </View>
        </View>

        {/* Test Button */}
        <TouchableOpacity
          style={styles.testBtn}
          onPress={handleTest}
          disabled={testing}
          activeOpacity={0.85}
        >
          <Text style={styles.testBtnText}>
            {testing
              ? t('checking')
              : t('runDiagnostics')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoIcon}>💡</Text>
        <Text style={styles.infoText}>
          {t('amcuInfo')}
        </Text>
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 14,
    elevation: 1,
  },
  topRow: {
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
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 2,
  },
  gLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  gValGreen: {
    fontSize: 14,
    fontWeight: '800',
    color: '#15803D',
    marginTop: 2,
  },
  gValBlue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0284C7',
    marginTop: 2,
  },
  gValDark: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  gNote: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  testBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  testBtnText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    elevation: 1,
  },
  infoIcon: {
    fontSize: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
});
