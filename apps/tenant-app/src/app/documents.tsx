import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../constants/design';

export default function DocumentsScreen() {
  const [certs, setCerts] = useState([]);

  useEffect(() => {
    // Mock load certificates
    setCerts([
      { id: '1', title: 'Rent Certificate - March 2026', date: '2026-03-24', type: 'certificate' },
      { id: '2', title: 'Rental Agreement', date: '2025-08-15', type: 'agreement' },
    ]);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Documents</Text>
      <FlatList
        data={certs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <Text style={{ fontSize: 24, marginRight: 16 }}>{item.type === 'certificate' ? '🏆' : '📜'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.docTitle}>{item.title}</Text>
              <Text style={styles.date}>Generated on {item.date}</Text>
            </View>
            <Text style={styles.downloadIcon}>⬇️</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ padding: spacing.md }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 24, fontWeight: '700', padding: spacing.md, color: colors.textPrimary },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: spacing.md, borderRadius: 12, marginBottom: spacing.sm, borderWidth: 0.5, borderColor: '#eee' },
  docTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  date: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  downloadIcon: { fontSize: 20 }
});
