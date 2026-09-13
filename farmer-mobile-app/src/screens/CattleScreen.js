import React from 'react';
import { useTranslation } from '../i18n/useTranslation';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView
} from 'react-native';

export default function CattleScreen({ language, cattleList, onAddCattle }) {
  const { t } = useTranslation(language);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      
      {/* Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>
              {t('registeredCattle')}
            </Text>
            <Text style={styles.sub}>
              {cattleList.length} {t('animalsLinked')}
            </Text>
          </View>

          <TouchableOpacity style={styles.addBtn} onPress={onAddCattle} activeOpacity={0.85}>
            <Text style={styles.addBtnText}>{t('addCattle')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Cattle List */}
      {cattleList.map((item) => (
        <View key={item.id} style={styles.cattleCard}>
          <View style={styles.leftBox}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>NDLM</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.breedName}>{item.breed}</Text>
              <Text style={styles.tagText}>टैग संख्या: #{item.tag}</Text>
              
              <View style={styles.badgeRow}>
                <View style={styles.vacBadge}>
                  <Text style={styles.vacBadgeText}>{item.vaccine}</Text>
                </View>
                <Text style={styles.yieldText}>दूध: {item.dailyYield}</Text>
              </View>
              <Text style={styles.verificationText}>NDLM: {item.verificationStatus || 'ACTIVE'}</Text>
            </View>
          </View>

          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>{item.status}</Text>
          </View>
        </View>
      ))}

      {/* Government NDLM Info Box */}
      <View style={styles.infoCard}>
        <Text style={styles.infoIcon}>NDLM</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.infoTitle}>
            {t('ndlmTitle')}
          </Text>
          <Text style={styles.infoDesc}>
            {t('ndlmDesc')}
          </Text>
        </View>
      </View>

      <View style={styles.processCard}>
        <Text style={styles.sectionTitle}>{t('ndlmProcessTitle')}</Text>
        {[
          t('ndlmStep1'),
          t('ndlmStep2'),
          t('ndlmStep3'),
          t('ndlmStep4')
        ].map((step, index) => <View key={step} style={styles.processRow}><View style={styles.stepNumber}><Text style={styles.stepNumberText}>{index + 1}</Text></View><Text style={styles.processText}>{step}</Text></View>)}
        <Text style={styles.helpText}>{t('helpContact')}</Text>
      </View>

      <View style={styles.processCard}>
        <Text style={styles.sectionTitle}>{t('servicesUnlocked')}</Text>
        <View style={styles.serviceGrid}>
          {['Animal health history', 'Vaccination reminders', 'Breeding and calving', 'Insurance readiness', 'KCC documentation', 'Livestock schemes'].map((service) => <Text key={service} style={styles.serviceItem}>{service}</Text>)}
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
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  sub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: '#15803D',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  cattleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 1,
    gap: 10,
  },
  leftBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  avatarText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  breedName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  vacBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  vacBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#15803D',
  },
  yieldText: {
    fontSize: 10,
    color: '#64748B',
  },
  verificationText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '600',
  },
  statusPill: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  statusPillText: {
    color: '#15803D',
    fontSize: 10,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoIcon: {
    fontSize: 22,
    marginTop: 2,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  infoDesc: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
  },
  processCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  processRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  stepNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#15803D',
    fontSize: 10,
    fontWeight: '800',
  },
  processText: {
    flex: 1,
    color: '#475569',
    fontSize: 11,
    lineHeight: 16,
  },
  helpText: {
    color: '#64748B',
    fontSize: 10,
    lineHeight: 15,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceItem: {
    width: '47%',
    color: '#475569',
    fontSize: 11,
    lineHeight: 16,
    borderLeftWidth: 2,
    borderLeftColor: '#16A34A',
    paddingLeft: 6,
  },
});
