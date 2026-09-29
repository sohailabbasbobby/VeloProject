import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLOURS } from '../constants/theme';
import * as Api from '../api/client';

const SEVERITIES = ['MINOR', 'MAJOR', 'CRITICAL'] as const;
type Severity = typeof SEVERITIES[number];

/**
 * DEFECT REPORT FORM — reports a real defect on the driver's assigned vehicle
 * via POST /api/fm/vehicles/:id/defects (persisted to vehicle_issues + audit log).
 * No fake confirmation: failure surfaces an error; success confirms the record id.
 */
export function DefectReportScreen({ onClose }: { onClose?: () => void }) {
  void onClose;
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<Severity>('MINOR');
  const [submitting, setSubmitting] = useState(false);
  const [lastReported, setLastReported] = useState<string | null>(null);
  const [driverVehicle, setDriverVehicle] = useState<any>(null);
  const [vehicleError, setVehicleError] = useState<string | null>(null);

  React.useEffect(() => {
    Api.fetchMyVehicle()
      .then((rows: any) => setDriverVehicle(Array.isArray(rows) ? rows[0] || null : rows))
      .catch((e: any) => setVehicleError(e?.message || 'Unable to load your vehicle.'));
  }, []);

  const submit = async () => {
    const vehicleId = (driverVehicle as any)?.id;
    if (!vehicleId) {
      Alert.alert('No vehicle', 'No vehicle is assigned to your profile, so a defect cannot be filed.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Description required', 'Describe the defect before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      const issue = await Api.reportDefect(vehicleId, description.trim(), severity);
      setLastReported(String(issue?.id || 'reported'));
      setDescription('');
      setSeverity('MINOR');
      Alert.alert('Defect reported', 'Your report is logged against the vehicle and visible to the back office.');
    } catch (e: any) {
      Alert.alert('Report failed', e?.message || 'Unable to submit defect report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
      <Text style={styles.headerTitle}>REPORT VEHICLE DEFECT</Text>

      {vehicleError ? <Text style={styles.errorText}>{vehicleError}</Text> : null}

      <View style={styles.vehicleCard}>
        <Text style={styles.vehicleLabel}>ASSIGNED VEHICLE</Text>
        {driverVehicle ? (
          <>
            <Text style={styles.vehicleName}>{driverVehicle.make} {driverVehicle.model}</Text>
            <Text style={styles.vehiclePlate}>{driverVehicle.plate_number} · {driverVehicle.reference_code}</Text>
          </>
        ) : (
          <Text style={styles.vehiclePlate}>{vehicleError ? 'Unavailable' : 'Loading…'}</Text>
        )}
      </View>

      <Text style={styles.sectionLabel}>WHAT IS WRONG?</Text>
      <TextInput
        style={styles.input}
        multiline
        numberOfLines={4}
        placeholder="e.g. Front left tyre pressure warning light is on; steering vibrates above 60mph."
        placeholderTextColor="#555"
        value={description}
        onChangeText={setDescription}
        textAlignVertical="top"
      />

      <Text style={styles.sectionLabel}>SEVERITY</Text>
      <View style={{ flexDirection: 'row', marginBottom: 8 }}>
        {SEVERITIES.map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => setSeverity(s)}
            style={[
              styles.severityPill,
              severity === s && { borderColor: s === 'CRITICAL' ? COLOURS.red : s === 'MAJOR' ? COLOURS.gold : '#3A3A3C', backgroundColor: s === 'CRITICAL' ? 'rgba(255,69,58,0.12)' : 'rgba(212,175,55,0.12)' },
            ]}
          >
            <Text style={{ color: severity === s ? (s === 'CRITICAL' ? COLOURS.red : COLOURS.gold) : '#8A8A8E', fontSize: 12, fontWeight: '900' }}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.helperText}>
        CRITICAL defects should take the vehicle off the road immediately — the back office is alerted with a critical audit entry.
      </Text>

      {lastReported ? (
        <View style={styles.successBadge}>
          <Text style={styles.successText}>✓ Last report logged ({lastReported.slice(0, 8)}…)</Text>
        </View>
      ) : null}

      <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.5 }]} onPress={submit} disabled={submitting}>
        {submitting
          ? <ActivityIndicator color="#0B0B0C" />
          : <Text style={styles.submitBtnText}>SUBMIT DEFECT REPORT</Text>}
      </TouchableOpacity>
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
  vehicleCard: {
    backgroundColor: '#131315',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2D',
    marginBottom: 24,
  },
  vehicleLabel: {
    color: '#8A8A8E',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  vehicleName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 6,
  },
  vehiclePlate: {
    color: '#8A8A8E',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  sectionLabel: {
    color: '#8A8A8E',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#131315',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A2A2D',
    color: '#FFFFFF',
    fontSize: 14,
    padding: 12,
    minHeight: 110,
    marginBottom: 20,
  },
  severityPill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2A2D',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  helperText: {
    color: '#555',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 20,
  },
  successBadge: {
    backgroundColor: 'rgba(52,199,89,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(52,199,89,0.4)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  successText: {
    color: '#34C759',
    fontSize: 12,
    fontWeight: '800',
  },
  submitBtn: {
    backgroundColor: '#D4AF37',
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: '#0B0B0C',
    fontWeight: '900',
    letterSpacing: 1,
    fontSize: 13,
  },
});
