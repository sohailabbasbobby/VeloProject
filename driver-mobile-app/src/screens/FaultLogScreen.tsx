import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLOURS } from '../constants/theme';
import * as Api from '../api/client';

interface IssueRow {
  id: string;
  description: string;
  severity: string;
  status: string;
  vehicle_code?: string;
  plate_number?: string;
  reported_at: string;
  resolved_at?: string | null;
}

/**
 * VEHICLE ISSUES / FAULT LOG — the driver's defect history, live from
 * GET /api/fm/issues (vehicle_issues table). Empty state is honest, never fabricated.
 */
export function FaultLogScreen({ onClose }: { onClose?: () => void }) {
  void onClose;
  const [issues, setIssues] = React.useState<IssueRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    Api.fetchVehicleIssues()
      .then((d: any) => { setIssues(d || []); setError(null); })
      .catch((e: any) => setError(e?.message || 'Unable to load fault log.'))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const severityColor = (s: string) =>
    s === 'CRITICAL' ? '#FF453A' : s === 'MAJOR' ? '#D4AF37' : '#8A8A8E';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
      <Text style={styles.headerTitle}>VEHICLE FAULT LOG</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {loading ? (
        <ActivityIndicator color="#D4AF37" style={{ marginTop: 24 }} />
      ) : (
        <>
          {issues.map((i) => (
            <View key={i.id} style={styles.issueCard}>
              <View style={styles.issueHeader}>
                <Text style={[styles.severityBadge, { color: severityColor(i.severity) }]}>{i.severity}</Text>
                <Text style={[styles.statusBadge, { color: i.status === 'RESOLVED' ? '#34C759' : '#FF9F0A' }]}>{i.status}</Text>
              </View>
              <Text style={styles.issueDescription}>{i.description}</Text>
              <Text style={styles.issueMeta}>
                {i.vehicle_code ? `${i.vehicle_code}${i.plate_number ? ` · ${i.plate_number}` : ''} · ` : ''}
                Reported {new Date(i.reported_at).toLocaleString()}
                {i.resolved_at ? ` · Resolved ${new Date(i.resolved_at).toLocaleDateString()}` : ''}
              </Text>
            </View>
          ))}
          {issues.length === 0 && !error ? (
            <Text style={styles.emptyText}>No defects logged against your vehicle — clean fault log.</Text>
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
  issueCard: {
    backgroundColor: '#131315',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2D',
    marginBottom: 12,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  severityBadge: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  issueDescription: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  issueMeta: {
    color: '#555',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 8,
  },
  emptyText: {
    color: '#555',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
  },
});
