import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLOURS } from '../constants/theme';
import { VeloSwipeTrack } from '../components/VeloSwipeTrack';

interface ActiveRideScreenProps {
  tripPhase: 1 | 2 | 3;
  countdownSeconds: number;
  formatTimerString: (s: number) => string;
  onPhaseComplete: () => void;
  onRequestCancellation: () => void;
  onLaunchPagingBoard: () => void;
}

export function ActiveRideScreen({
  tripPhase, countdownSeconds, formatTimerString,
  onPhaseComplete, onRequestCancellation, onLaunchPagingBoard,
}: ActiveRideScreenProps) {
  const [isCancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState<string | null>(null);
  const [cancelNotes, setCancelNotes] = useState('');
  
  const reasons = ['Vehicle Issue', 'Vehicle Too Small', 'Too Many Bags', 'Passenger No-Show'];
  return (
    <View style={styles.activeRideExecutionSheet}>
      {/* Passenger */}
      <View style={styles.passengerSplitRow}>
        <View style={styles.monogramAssetBox}>
          <Text style={styles.monogramText}>J</Text>
        </View>
        <View style={{ marginLeft: 14 }}>
          <Text style={styles.passengerNameText}>MR. JOHN</Text>
          <Text style={styles.passengerCorporateTag}>GOLDMAN SACHS</Text>
        </View>
      </View>

      {/* Info boxes */}
      <View style={styles.infoContentBoxWrapper}>
        <Text style={styles.infoBoxMicroHeader}>📍  PICKUP ADDRESS | NET ASSIGNED PAYOUT: £80.00</Text>
        <Text style={styles.infoBoxValueText}>Manchester Piccadilly Station, Approach</Text>
      </View>

      <View style={styles.infoContentBoxWrapper}>
        <Text style={styles.infoBoxMicroHeader}>🕒  PICKUP TIME REQUESTED</Text>
        <Text style={styles.infoBoxValueTextBold}>20:30 BST</Text>
      </View>

      {/* Grace period countdown (phase 2 only) */}
      {tripPhase === 2 && (
        <View style={[styles.infoContentBoxWrapper, { borderColor: countdownSeconds > 0 ? COLOURS.gold : COLOURS.red }]}>
          <Text style={[styles.infoBoxMicroHeader, { color: countdownSeconds > 0 ? COLOURS.gold : COLOURS.red }]}>
            ⏱️  PASSENGER GRACE PERIOD WINDOW
          </Text>
          {countdownSeconds > 0 ? (
            <Text style={styles.countdownValueDisplayText}>Grace Remaining: {formatTimerString(countdownSeconds)}</Text>
          ) : (
            <TouchableOpacity style={styles.independentCancelButton} onPress={() => {}}>
              <Text style={styles.independentCancelButtonText}>🟥   EXECUTE NO-SHOW CANCELLATION</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Action icons */}
      <View style={styles.privacyActionHubRowCentered}>
        <TouchableOpacity style={styles.actionNodeButtonCentered}><Text style={styles.actionNodeIconText}>📞</Text></TouchableOpacity>
        <TouchableOpacity style={styles.actionNodeButtonCentered}><Text style={styles.actionNodeIconText}>💬</Text></TouchableOpacity>
      </View>

      {/* Paging board shortcut */}
      <TouchableOpacity style={styles.pagingCardShortcut} onPress={onLaunchPagingBoard}>
        <Text style={styles.pagingShortcutText}>☆   TAP TO LAUNCH DIGITAL PAGING BOARD</Text>
      </TouchableOpacity>

      {/* Cancel */}
      <TouchableOpacity style={styles.executionEmergencyCancelBtn} onPress={() => setCancelModalVisible(true)}>
        <Text style={styles.emergencyCancelBtnText}>🛑   REQUEST CANCELLATION</Text>
      </TouchableOpacity>

      {/* Phase swipe sliders */}
      <View style={{ marginTop: 10 }}>
        {tripPhase === 1 && <VeloSwipeTrack text=">>>  I HAVE ARRIVED  >>>" trackColor="#131A24" thumbColor={COLOURS.blue} textColor={COLOURS.blue} onComplete={onPhaseComplete} />}
        {tripPhase === 2 && <VeloSwipeTrack text=">>>  START TRIP  >>>" trackColor="#131F17" thumbColor={COLOURS.green} textColor={COLOURS.green} onComplete={onPhaseComplete} />}
        {tripPhase === 3 && <VeloSwipeTrack text=">>>  END TRIP  >>>" trackColor="#1F1314" thumbColor={COLOURS.red} textColor={COLOURS.red} onComplete={onPhaseComplete} />}
      </View>

      <Modal visible={isCancelModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>REQUEST CANCELLATION</Text>
            <Text style={styles.modalSubtitle}>Please select a reason for cancelling this trip.</Text>
            
            {reasons.map(r => (
              <TouchableOpacity key={r} style={[styles.reasonPill, cancelReason === r && styles.reasonPillActive]} onPress={() => setCancelReason(r)}>
                <Text style={[styles.reasonPillText, cancelReason === r && styles.reasonPillTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
            
            <TextInput
              style={styles.modalInput}
              placeholder="Additional notes (optional)..."
              placeholderTextColor={COLOURS.textDim}
              value={cancelNotes}
              onChangeText={setCancelNotes}
              multiline
            />
            
            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#1A1A1C' }]} onPress={() => setCancelModalVisible(false)}>
                <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '800' }}>GO BACK</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: cancelReason ? COLOURS.red : '#3A1515' }]} 
                disabled={!cancelReason}
                onPress={() => {
                  setCancelModalVisible(false);
                  onRequestCancellation();
                }}>
                <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '900' }}>SUBMIT</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  activeRideExecutionSheet:   { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLOURS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1.5, borderBottomWidth: 0, borderColor: COLOURS.gold, padding: 22, paddingTop: 26, zIndex: 15 },
  passengerSplitRow:          { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  monogramAssetBox:           { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#222225', justifyContent: 'center', alignItems: 'center' },
  monogramText:               { color: COLOURS.gold, fontWeight: '800', fontSize: 14 },
  passengerNameText:          { color: '#FFFFFF', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
  passengerCorporateTag:      { color: COLOURS.textDark, fontSize: 12, fontWeight: '700', marginTop: 2 },
  infoContentBoxWrapper:      { backgroundColor: COLOURS.bg, padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#1C1C1E' },
  infoBoxMicroHeader:         { color: COLOURS.textDim, fontSize: 8, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  infoBoxValueText:           { color: '#FFFFFF', fontSize: 13, fontWeight: '700', lineHeight: 18 },
  infoBoxValueTextBold:       { color: COLOURS.gold, fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  countdownValueDisplayText:  { color: COLOURS.red, fontSize: 13, fontWeight: '900', marginTop: 2 },
  independentCancelButton:    { backgroundColor: 'rgba(255,59,48,0.1)', height: 40, borderRadius: 6, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLOURS.red, marginTop: 4 },
  independentCancelButtonText:{ color: COLOURS.red, fontSize: 11, fontWeight: '900' },
  privacyActionHubRowCentered:{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 10, width: '100%' },
  actionNodeButtonCentered:   { width: 64, height: 48, backgroundColor: COLOURS.bg, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginHorizontal: 8, borderWidth: 1, borderColor: '#1C1C1E' },
  actionNodeIconText:         { color: '#FFFFFF', fontSize: 18 },
  executionEmergencyCancelBtn:{ backgroundColor: 'rgba(255,59,48,0.06)', height: 44, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,59,48,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  emergencyCancelBtnText:     { color: COLOURS.red, fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  pagingCardShortcut:         { paddingVertical: 8, alignItems: 'center', marginBottom: 8, marginTop: -4 },
  pagingShortcutText:         { color: COLOURS.textDark, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  
  modalOverlay:               { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 24 },
  modalContent:               { backgroundColor: COLOURS.surface, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: COLOURS.gold },
  modalTitle:                 { color: COLOURS.gold, fontSize: 15, fontWeight: '900', letterSpacing: 1, textAlign: 'center', marginBottom: 8 },
  modalSubtitle:              { color: COLOURS.textDim, fontSize: 12, fontWeight: '700', textAlign: 'center', marginBottom: 20 },
  reasonPill:                 { backgroundColor: COLOURS.bg, paddingVertical: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#1A1A1C', alignItems: 'center' },
  reasonPillActive:           { backgroundColor: 'rgba(212,175,55,0.1)', borderColor: COLOURS.gold },
  reasonPillText:             { color: '#FFF', fontSize: 13, fontWeight: '700' },
  reasonPillTextActive:       { color: COLOURS.gold },
  modalInput:                 { backgroundColor: COLOURS.bg, height: 80, borderRadius: 8, borderWidth: 1, borderColor: '#1C1C1E', color: '#FFF', paddingHorizontal: 12, paddingTop: 12, fontSize: 13, marginTop: 10, marginBottom: 24, fontWeight: '600' },
  modalButtonRow:             { flexDirection: 'row', justifyContent: 'space-between' },
  modalBtn:                   { flex: 1, height: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginHorizontal: 6 },
});
