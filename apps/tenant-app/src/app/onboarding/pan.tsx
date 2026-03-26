import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, spacing, radius, typography } from '../../constants/design';

export default function PANEntryScreen() {
  const { t } = useTranslation();
  const [pan, setPan] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleVerifyPAN() {
    if (pan.length !== 10) return;
    setLoading(true);
    setError(null);
    try {
      const { MMKV } = await import('react-native-mmkv');
      const token = new MMKV().getString('kiraaya_token');

      const resp = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/kyc/pan/verify`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ pan, name }),
      });
      const data = await resp.json();
      if (data.success && data.data.verified) {
        router.push('/onboarding/aadhaar');
      } else {
        setError(data.error || 'PAN verification failed. Check details.');
      }
    } catch (err) {
      setError('Connection error. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <View style={styles.top}>
          <Text style={styles.title}>{t('onboarding.panLabel')}</Text>
          <Text style={styles.subtitle}>{t('onboarding.panHint')}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name (as on PAN)</Text>
            <TextInput
              style={styles.input}
              placeholder="Gautam ..."
              autoCapitalize="characters"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>PAN Number</Text>
            <TextInput
              style={[styles.input, error ? styles.inputError : null]}
              placeholder="ABCDE1234F"
              autoCapitalize="characters"
              maxLength={10}
              value={pan}
              onChangeText={(val) => setPan(val.toUpperCase())}
            />
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity 
            style={[styles.btn, (loading || pan.length !== 10 || name.length < 3) && styles.btnDisabled]}
            disabled={loading || pan.length !== 10 || name.length < 3}
            onPress={handleVerifyPAN}
          >
            {loading ? <ActivityIndicator color="white" /> : (
              <Text style={styles.btnText}>{t('onboarding.next')}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  inner: { flex: 1, padding: spacing.lg, paddingTop: 100 },
  top: { marginBottom: spacing.xl },
  title: { fontSize: 28, fontWeight: '800', color: colors.textPrimary },
  subtitle: { fontSize: 16, color: colors.textSecondary, marginTop: 4 },
  form: { gap: spacing.md },
  inputGroup: { gap: 4 },
  label: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase' },
  input: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: radius.button,
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  inputError: { borderWidth: 1.5, borderColor: colors.error },
  errorText: { color: colors.error, fontSize: 13, fontWeight: '500' },
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radius.button,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: 'white', fontSize: 18, fontWeight: '700' },
  skipBtn: { alignItems: 'center', marginTop: spacing.sm },
  skipText: { color: colors.textSecondary, fontSize: 14, fontWeight: '500' },
});
