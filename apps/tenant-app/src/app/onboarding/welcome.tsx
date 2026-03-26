import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, spacing, radius, typography } from '../../constants/design';

export default function WelcomeScreen() {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.logo}>Kiraaya</Text>
        <Text style={styles.tagline}>{t('onboarding.tagline')}</Text>
      </View>

      <View style={styles.visual}>
        {/* Placeholder for branding image */}
        <View style={styles.circle} />
      </View>

      <View style={styles.bottom}>
        <Text style={styles.welcomeText}>{t('onboarding.welcome')}</Text>
        
        <TouchableOpacity 
          style={styles.primaryBtn} 
          onPress={() => router.push('/onboarding/phone')}
        >
          <Text style={styles.primaryBtnText}>{t('onboarding.next')}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryBtn} 
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.secondaryBtnText}>{t('onboarding.skip')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  top: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  logo: {
    fontSize: 42,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  visual: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(15, 110, 86, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(15, 110, 86, 0.1)',
  },
  bottom: {
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radius.button,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
});
