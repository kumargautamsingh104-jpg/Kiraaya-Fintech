import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../constants/design';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const settingsOptions = [
    { title: 'Personal Details', icon: '👤', route: '/profile/details' },
    { title: 'Documents & Certificates', icon: '📄', route: '/documents' },
    { title: 'Language', icon: '🌐', route: '/profile/language' },
    { title: 'Account Settings', icon: '⚙️', route: '/profile/settings' },
  ];

  const handleLogout = async () => {
    const { MMKV } = await import('react-native-mmkv');
    new MMKV().delete('kiraaya_token');
    router.replace('/onboarding');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>U</Text>
          </View>
          <Text style={styles.name}>User Name</Text>
          <Text style={styles.phone}>+91 XXXX XXXX XX</Text>
        </View>

        <View style={styles.section}>
          {settingsOptions.map((opt, i) => (
            <TouchableOpacity key={i} style={styles.option} onPress={() => router.push(opt.route)}>
              <Text style={{ fontSize: 20, marginRight: 12 }}>{opt.icon}</Text>
              <Text style={styles.optionText}>{opt.title}</Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { alignItems: 'center', paddingVertical: 40, borderBottomWidth: 0.5, borderColor: '#eee' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  avatarText: { color: 'white', fontSize: 32, fontWeight: 'bold' },
  name: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  phone: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  section: { padding: spacing.md, marginTop: 20 },
  option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 0.5, borderColor: '#f0f0f0' },
  optionText: { flex: 1, fontSize: 16, color: colors.textPrimary },
  arrow: { fontSize: 24, color: '#ccc' },
  logoutBtn: { margin: spacing.md, marginTop: 40, padding: 16, borderRadius: 12, borderHeight: 1, borderColor: colors.error, alignItems: 'center', borderWidth: 1 },
  logoutText: { color: colors.error, fontWeight: '700', fontSize: 16 }
});
