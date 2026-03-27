import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../../constants/design';

export default function PaymentsScreen() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPayments() {
      try {
        const token = await import('react-native-mmkv')
          .then(({ MMKV }) => new MMKV().getString('kiraaya_token'));
        
        const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.kiraaya.in';
        const res = await fetch(`${baseUrl}/api/v1/tenant/payments`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setPayments(data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadPayments();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Payment History</Text>
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.paymentCard}>
              <View>
                <Text style={styles.month}>{new Date(item.dueDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</Text>
                <Text style={styles.method}>{item.method === 'cash' ? 'Cash Payment' : 'UPI Payment'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.amount}>₹{(Number(item.amountPaise) / 100).toLocaleString()}</Text>
                <Text style={[styles.status, { color: item.status === 'paid' ? colors.primary : colors.error }]}>
                  {item.status.toUpperCase()}
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No payments found</Text>}
          contentContainerStyle={{ padding: spacing.md }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 24, fontWeight: '700', padding: spacing.md, color: colors.textPrimary },
  paymentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    borderWidth: 0.5,
    borderColor: '#eee'
  },
  month: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  method: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  amount: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  status: { fontSize: 12, fontWeight: 'bold', marginTop: 4 },
  empty: { textAlign: 'center', marginTop: 100, color: colors.textMuted }
});
