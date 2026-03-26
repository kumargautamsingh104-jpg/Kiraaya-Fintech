import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import ScoreMeter from '../../components/ScoreMeter';
import { colors, spacing, radius, typography } from '../../constants/design';
import { ScoreOutput } from '@kiraaya/types';

interface DashboardData {
  score: ScoreOutput | null;
  status: 'building' | 'consent_required' | 'no_tenancy' | 'loaded';
  streakMonths: number;
  rentDueDate: Date | null;
  rentStatus: 'paid' | 'due' | 'overdue' | null;
  rentAmountPaise: number;
  razorpayOrderId: string | null;
  tenantName: string;
}

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language ?? 'en') as 'en' | 'hi';
  const [data, setData] = useState<DashboardData>({
    score: null,
    status: 'building',
    streakMonths: 0,
    rentDueDate: null,
    rentStatus: null,
    rentAmountPaise: 0,
    razorpayOrderId: null,
    tenantName: '',
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      const token = await import('react-native-mmkv')
        .then(({ MMKV }) => new MMKV().getString('kiraaya_token'));

      if (!token) { router.replace('/onboarding'); return; }

      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
      const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.kiraaya.in';

      const [scoreRes, dashRes] = await Promise.all([
        fetch(`${baseUrl}/api/v1/score`, { headers }),
        fetch(`${baseUrl}/api/v1/tenant/dashboard`, { headers }),
      ]);

      const scoreData = await scoreRes.json();
      const dashData = await dashRes.json();

      setData({
        score: scoreData.success && scoreData.data?.score ? scoreData.data : null,
        status: scoreData.data?.status ?? 'loaded',
        streakMonths: dashData.data?.streakMonths ?? 0,
        rentDueDate: dashData.data?.rentDueDate ? new Date(dashData.data.rentDueDate) : null,
        rentStatus: dashData.data?.rentStatus ?? null,
        rentAmountPaise: dashData.data?.rentAmountPaise ?? 0,
        razorpayOrderId: dashData.data?.razorpayOrderId ?? null,
        tenantName: dashData.data?.tenantName ?? '',
      });
    } catch (err) {
      console.error('[Home] Load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  function handlePayRent() {
    if (!data.razorpayOrderId) return;
    // Deep-link to any UPI app via intent
    const upiUrl = Platform.OS === 'android'
      ? `upi://pay?pa=kiraaya@razorpay&pn=Kiraaya&am=${data.rentAmountPaise / 100}&tn=Rent%20Payment&mc=&tid=${data.razorpayOrderId}`
      : `upi://pay?pa=kiraaya@razorpay&pn=Kiraaya&am=${data.rentAmountPaise / 100}`;
    Linking.openURL(upiUrl).catch(() => {
      // Fallback: open Razorpay checkout webview
      router.push(`/pay-now?orderId=${data.razorpayOrderId}`);
    });
  }

  const rentDaysInfo = (): { text: string; urgent: boolean } | null => {
    if (!data.rentDueDate) return null;
    const today = new Date();
    const diff = Math.round((data.rentDueDate.getTime() - today.getTime()) / (86400000));
    if (data.rentStatus === 'paid') {
      return { text: t('home.rentPaid'), urgent: false };
    }
    if (diff < 0) {
      return { text: t('home.rentOverdue', { days: Math.abs(diff) }), urgent: true };
    }
    return { text: t('home.rentDue', { days: diff }), urgent: diff <= 3 };
  };

  const rentInfo = rentDaysInfo();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{t('home.greeting', { name: data.tenantName || 'there' })}</Text>
            <Text style={styles.subtleTitle}>{t('home.scoreTitle')}</Text>
          </View>
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => router.push('/profile')}
            accessibilityLabel="Profile settings"
            accessibilityRole="button"
          >
            <Text style={styles.avatarText}>
              {(data.tenantName?.[0] ?? 'U').toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Rent status banner */}
        {rentInfo && (
          <View style={[styles.banner, rentInfo.urgent && styles.bannerUrgent]}>
            <Text style={[styles.bannerText, rentInfo.urgent && styles.bannerTextUrgent]}>
              {rentInfo.text}
            </Text>
            {data.rentStatus !== 'paid' && (
              <TouchableOpacity onPress={handlePayRent}>
                <Text style={styles.bannerAction}>Pay now →</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Score meter */}
        <View style={styles.scoreCard}>
          {loading ? (
            <View style={{ height: 280, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: colors.textMuted }}>Loading your score...</Text>
            </View>
          ) : data.status === 'building' ? (
            <View style={styles.buildingContainer}>
              <Text style={styles.buildingEmoji}>🏗️</Text>
              <Text style={styles.buildingTitle}>{t('home.building')}</Text>
              <Text style={styles.buildingHint}>
                {t('home.buildingHint', { needed: 3 })}
              </Text>
            </View>
          ) : data.score ? (
            <ScoreMeter
              score={data.score.score}
              tier={data.score.tier}
              streakMonths={data.streakMonths}
              onTimePayments={data.score.onTimePayments}
              totalPayments={data.score.totalPaymentsDue}
              language={lang}
            />
          ) : null}
        </View>

        {/* Quick actions — PRD §8.2 */}
        <View style={styles.actions}>
          {data.rentStatus !== 'paid' && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnPrimary]}
              onPress={handlePayRent}
              accessibilityLabel={t('home.payNow')}
              accessibilityRole="button"
            >
              <Text style={styles.actionBtnPrimaryText}>💳  {t('home.payNow')}</Text>
            </TouchableOpacity>
          )}

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnSecondary, { flex: 1 }]}
              onPress={() => router.push('/documents')}
              accessibilityLabel={t('home.viewCertificate')}
              accessibilityRole="button"
            >
              <Text style={styles.actionBtnSecondaryText}>📄  {t('home.viewCertificate')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnSecondary, { flex: 1 }]}
              onPress={async () => {
                const token = await import('react-native-mmkv')
                  .then(({ MMKV }) => new MMKV().getString('kiraaya_token'));
                const resp = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/score/share/create`, {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${token}` },
                });
                const d = await resp.json();
                if (d.success) {
                  const { Share } = await import('react-native');
                  Share.share({ message: `Check my Kiraaya RentScore: ${d.data.shareUrl}` });
                }
              }}
              accessibilityLabel={t('home.shareScore')}
              accessibilityRole="button"
            >
              <Text style={styles.actionBtnSecondaryText}>🔗  {t('home.shareScore')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtleTitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  banner: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(15,110,86,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerUrgent: {
    backgroundColor: 'rgba(216,90,48,0.10)',
  },
  bannerText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  bannerTextUrgent: {
    color: colors.error,
  },
  bannerAction: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
  },
  scoreCard: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.md,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.07)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: spacing.md,
  },
  buildingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  buildingEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  buildingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  buildingHint: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  actions: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  actionBtnPrimary: {
    backgroundColor: colors.primary,
  },
  actionBtnPrimaryText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  actionBtnSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  actionBtnSecondaryText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});
