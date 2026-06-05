import React from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLOURS } from '../constants/theme';
import { VeloSwipeTrack } from '../components/VeloSwipeTrack';

interface GatekeeperScreenProps {
  driverProfile: { name: string };
  compliance: { pristine: boolean; cabin: boolean; tyres: boolean; fuel: boolean };
  setCompliance: (c: any) => void;
  hasCameraPayload: boolean;
  setHasCameraPayload: (v: boolean) => void;
  odometerValue: string;
  setOdometerValue: (v: string) => void;
  isUnlocked: boolean;
  onGoOnline: () => void;
}

export function GatekeeperScreen({
  driverProfile, compliance, setCompliance,
  hasCameraPayload, setHasCameraPayload,
  odometerValue, setOdometerValue,
  isUnlocked, onGoOnline,
}: GatekeeperScreenProps) {

  const checks = [
    { id: 'pristine', text: 'Pristine exterior body' },
    { id: 'cabin',    text: 'Cabin vacuumed & prepped' },
    { id: 'tyres',    text: 'Tyre pressure verified' },
    { id: 'fuel',     text: 'Fuel/Battery > 75%' },
  ];

  return (
    <View style={styles.fullTakeoverContainer}>
      {/* Driver header */}
      <View style={styles.gatekeeperHeader}>
        <View style={styles.avatarPlaceholder} />
        <View style={{ marginLeft: 14, flex: 1 }}>
          <Text style={styles.chauffeurName}>{driverProfile.name}</Text>
          <Text style={styles.carMeta}>MERCEDES-BENZ S-CLASS{'\n'}BLACK - REG: LN26 XAA</Text>
        </View>
        <TouchableOpacity style={{ padding: 8, backgroundColor: COLOURS.gold, borderRadius: 8 }} onPress={onGoOnline}>
          <Text style={{ color: '#000', fontSize: 10, fontWeight: '900' }}>DEV SKIP</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Compliance checklist */}
        {checks.map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.complianceRowCard}
            onPress={() => setCompliance({ ...compliance, [item.id]: !compliance[item.id as keyof typeof compliance] })}
          >
            <View style={[styles.checkboxToggle, compliance[item.id as keyof typeof compliance] && styles.checkboxChecked]}>
              {compliance[item.id as keyof typeof compliance] && <Text style={styles.checkIcon}>✓</Text>}
            </View>
            <Text style={styles.complianceCardText}>{item.text}</Text>
          </TouchableOpacity>
        ))}

        {/* Odometer */}
        <View style={styles.odometerInputWrapper}>
          <Text style={styles.odometerLabel}>CURRENT VEHICLE ODOMETER MILEAGE</Text>
          <TextInput
            style={styles.odometerTextInput}
            placeholder="Enter mileage..."
            placeholderTextColor="#3C3C3E"
            keyboardType="numeric"
            value={odometerValue}
            onChangeText={setOdometerValue}
          />
        </View>

        {/* Camera capture */}
        <TouchableOpacity style={styles.cameraWindowTarget} onPress={() => setHasCameraPayload(!hasCameraPayload)}>
          {hasCameraPayload
            ? <Text style={styles.cameraPayloadSuccessText}>✓ CABIN CAPTURED SUCCESSFUL</Text>
            : <Text style={styles.cameraPlaceholderText}>📷   TAP TO CAPTURE REAR CABIN PRESENTATION</Text>
          }
        </TouchableOpacity>
      </ScrollView>

      <VeloSwipeTrack
        text="SLIDE RIGHT TO GO ONLINE >>>"
        trackColor="#131F17"
        thumbColor={COLOURS.green}
        textColor={COLOURS.green}
        disabled={!isUnlocked}
        onComplete={onGoOnline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fullTakeoverContainer: { flex: 1, backgroundColor: COLOURS.bg, padding: 20 },
  gatekeeperHeader:      { flexDirection: 'row', alignItems: 'center', paddingBottom: 22, marginBottom: 22 },
  avatarPlaceholder:     { width: 50, height: 50, borderRadius: 25, backgroundColor: '#141416' },
  chauffeurName:         { color: '#FFFFFF', fontSize: 18, fontWeight: '800', letterSpacing: 1.5 },
  carMeta:               { color: COLOURS.textDark, fontSize: 11, marginTop: 4, fontWeight: '700', letterSpacing: 0.5, lineHeight: 14 },
  complianceRowCard:     { flexDirection: 'row', alignItems: 'center', backgroundColor: COLOURS.surface, padding: 18, borderRadius: 12, marginBottom: 10 },
  complianceCardText:    { color: '#EAEAEA', fontSize: 13, fontWeight: '700', marginLeft: 14, flex: 1 },
  checkboxToggle:        { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#3A3A3C', justifyContent: 'center', alignItems: 'center' },
  checkboxChecked:       { borderColor: COLOURS.gold },
  checkIcon:             { color: COLOURS.gold, fontSize: 13, fontWeight: 'bold' },
  odometerInputWrapper:  { backgroundColor: COLOURS.surface, padding: 16, borderRadius: 12, marginBottom: 10 },
  odometerLabel:         { color: COLOURS.gold, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  odometerTextInput:     { backgroundColor: COLOURS.bg, height: 44, borderRadius: 8, borderColor: '#1C1C1E', borderWidth: 1, color: '#FFFFFF', paddingHorizontal: 14, fontSize: 14, fontWeight: '700' },
  cameraWindowTarget:    { height: 60, borderRadius: 12, backgroundColor: COLOURS.surface, justifyContent: 'center', alignItems: 'center', marginTop: 5, marginBottom: 25 },
  cameraPlaceholderText: { color: COLOURS.gold, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  cameraPayloadSuccessText: { color: COLOURS.gold, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
});
