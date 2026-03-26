import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, spacing, radius, typography } from '../../constants/design';

export default function AadhaarKYCScreen() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStartKYC() {
    setLoading(true);
    setError(null);
    try {
      const { MMKV } = await import('react-native-mmkv');
      const token = new MMKV().getString('kiraaya_token');

      const resp = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/kyc/aadhaar/init`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      const data = await resp.json();
      if (data.success && data.data.redirectUrl) {
        // Open Digio KYC in browser or WebView
        const { Linking } = await import('react-native');
        Linking.openURL(data.data.redirectUrl);
        // After redirect, user comes back to the app via callback
        router.replace('/(tabs)');
      } else {
        setError(data.error || 'Failed to initialize KYC');
      }
    } catch (err) {
      setError('Connection error. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.top}>
          <Text style={styles.title}>Aadhaar e-KYC</Text>
          <Text style={styles.subtitle}>
            We use Digio for secure, Aadhaar-based identity verification. 
            Kiraaya never sees or stores your Aadhaar number.
          </Text>
        </View>

        <View style={styles.visual}>
          <View style={styles.shield}>
            <Text style={{ fontSize: 40 }}>🛡️</Text>
          </View>
        </View>

        <View style={styles.bottom}>
          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity 
            style={[styles.btn, loading && styles.btnDisabled]}
            disabled={loading}
            onPress={handleStartKYC}
          >
            {loading ? <ActivityIndicator color="white" /> : (
              <Text style={styles.btnText}>Start Verification</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  inner: { flex: 1, padding: spacing.lg, justifyContent: 'space-between', paddingTop: 100 },
  top: { marginBottom: spacing.xl },
  title: { fontSize: 28, fontWeight: '800', color: colors.textPrimary },
  subtitle: { fontSize: 16, color: colors.textSecondary, marginTop: 12, lineHeight: 24 },
  visual: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  shield: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(15,110,86,0.05)', alignItems: 'center', justifyContent: 'center' },
  bottom: { gap: spacing.md, marginBottom: spacing.xl },
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radius.button,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: 'white', fontSize: 18, fontWeight: '700' },
  skipBtn: { alignItems: 'center' },
  skipText: { color: colors.textSecondary, fontSize: 14, fontWeight: '500' },
  errorText: { color: colors.error, textAlign: 'center', marginBottom: 8 },
});
