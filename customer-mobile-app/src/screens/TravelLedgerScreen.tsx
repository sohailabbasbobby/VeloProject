import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fetchMyTrips } from '../api/client';

interface TripRow {
  id: string;
  task_id?: string;
  state: string;
  custom_price?: number;
  final_price?: number;
  pickup_address: string;
  dropoff_address: string;
  completed_at?: string | null;
  scheduled_at?: string | null;
}

/**
 * TRAVEL LEDGER — the passenger's real trip history and spend, live from
 * GET /api/trips/mine. No fabricated rows, no fake balance: every figure is
 * computed from the passenger's own bookings.
 */
export const TravelLedgerScreen = ({ onClose }: { onClose?: () => void }) => {
  void onClose;
  const [trips, setTrips] = useState<TripRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchMyTrips()
      .then((rows: any) => { setTrips(rows || []); setError(null); })
      .catch((e: any) => setError(e?.message || 'Unable to load your travel ledger.'))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const past: TripRow[] = (trips || [])
    .filter((t) => ['COMPLETED', 'CANCELLED'].includes(t.state))
    .sort((a, b) => new Date(b.completed_at || b.scheduled_at || 0).getTime() - new Date(a.completed_at || a.scheduled_at || 0).getTime());

  const totalSpend = past
    .filter((t) => t.state === 'COMPLETED')
    .reduce((sum, t) => sum + Number(t.final_price || t.custom_price || 0), 0);

  const fmtGbp = (n: number) => `£${n.toFixed(2)}`;

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.headerTitle}>TRAVEL LEDGER</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>TOTAL SPEND (COMPLETED TRIPS)</Text>
        {loading ? (
          <ActivityIndicator color="#D4AF37" style={{ marginVertical: 20 }} />
        ) : (
          <Text style={styles.summaryValue}>{error ? '—' : fmtGbp(totalSpend)}</Text>
        )}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <TouchableOpacity style={styles.actionBtn} onPress={load}>
          <Text style={styles.actionBtnText}>Refresh Ledger</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>PAST TRIPS</Text>

      {past.map((t) => (
        <View key={t.id} style={styles.tripCard}>
          <View style={styles.tripHeader}>
            <Text style={styles.tripDate}>
              {new Date(t.completed_at || t.scheduled_at || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
            <Text style={styles.tripCost}>{fmtGbp(Number(t.final_price || t.custom_price || 0))}</Text>
          </View>
          <Text style={styles.tripRoute}>{t.pickup_address} → {t.dropoff_address}</Text>
          <View style={styles.tripFooter}>
            <Text style={[styles.statusBadge, t.state !== 'COMPLETED' && { color: '#8A8A8E' }]}>{t.state.replace(/_/g, ' ')}</Text>
            <Text style={styles.linkText}>{t.task_id || ''}</Text>
          </View>
        </View>
      ))}

      {!loading && !error && past.length === 0 ? (
        <Text style={styles.emptyText}>No past trips yet — your completed journeys will appear here with real fares.</Text>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 100,
  },
  headerTitle: {
    color: '#D4AF37',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 30,
  },
  summaryCard: {
    backgroundColor: '#131315',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2D',
    marginBottom: 40,
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#8A8A8E',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '900',
    marginTop: 10,
    marginBottom: 20,
  },
  errorText: {
    color: '#FF6B60',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 12,
  },
  actionBtn: {
    backgroundColor: '#1C1C1E',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2A2D',
    width: '100%',
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#D4AF37',
    fontWeight: 'bold',
  },
  sectionTitle: {
    color: '#8A8A8E',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 15,
  },
  tripCard: {
    backgroundColor: '#131315',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2D',
    marginBottom: 15,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tripDate: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tripCost: {
    color: '#D4AF37',
    fontSize: 18,
    fontWeight: '900',
  },
  tripRoute: {
    color: '#8A8A8E',
    fontSize: 14,
    marginBottom: 15,
  },
  tripFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2D',
  },
  statusBadge: {
    color: '#34C759',
    fontSize: 12,
    fontWeight: '800',
  },
  linkText: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#555',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
  },
});
