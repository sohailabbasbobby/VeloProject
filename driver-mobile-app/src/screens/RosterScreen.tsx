import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Api from '../api/client';

interface ShiftRow {
  id: string;
  shift_type: string;
  start_time: string;
  end_time: string;
  plate_number?: string | null;
  reference_code?: string | null;
}

/**
 * MY ROSTER — the driver's shifts from the Workforce Scheduler (chauffeur_shifts
 * table) via GET /api/onboarding/my/roster. Empty state is honest when no shifts
 * are published for this driver yet.
 */
export function RosterScreen({ onClose }: { onClose?: () => void }) {
  void onClose;
  const [shifts, setShifts] = React.useState<ShiftRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    Api.fetchMyRoster()
      .then((d: any) => { setShifts(d || []); setError(null); })
      .catch((e: any) => setError(e?.message || 'Unable to load your roster.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
      <Text style={styles.headerTitle}>MY ROSTER</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {loading ? (
        <ActivityIndicator color="#D4AF37" style={{ marginTop: 24 }} />
      ) : (
        <>
          {shifts.map((s) => (
            <View key={s.id} style={styles.shiftCard}>
              <View style={styles.shiftHeader}>
                <Text style={styles.shiftDate}>
                  {new Date(s.start_time).toLocaleDateString([], { weekday: 'long', day: '2-digit', month: 'long' }).toUpperCase()}
                </Text>
                <Text style={styles.shiftType}>{String(s.shift_type || 'SHIFT').replace(/_/g, ' ')}</Text>
              </View>
              <Text style={styles.shiftTime}>
                {new Date(s.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {' – '}
                {new Date(s.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              {s.plate_number ? (
                <Text style={styles.shiftVehicle}>Vehicle {s.plate_number}{s.reference_code ? ` · ${s.reference_code}` : ''}</Text>
              ) : null}
            </View>
          ))}
          {shifts.length === 0 && !error ? (
            <Text style={styles.emptyText}>No shifts scheduled — your rota is empty.</Text>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingBottom: 100,
  },
  headerTitle: {
    color: '#D4AF37',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 20,
  },
  errorText: {
    color: '#FF6B60',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 10,
  },
  shiftCard: {
    backgroundColor: '#131315',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2D',
    marginBottom: 12,
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shiftDate: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  shiftType: {
    color: '#555',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  shiftTime: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 8,
  },
  shiftVehicle: {
    color: '#8A8A8E',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
  },
  emptyText: {
    color: '#555',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
  },
});
