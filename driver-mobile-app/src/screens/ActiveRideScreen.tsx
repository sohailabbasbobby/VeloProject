import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View, Linking, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLOURS } from '../constants/theme';
import { VeloSwipeTrack } from '../components/VeloSwipeTrack';

const IconCall = ({ color = COLOURS.green }) => (
  <View style={{ width: 14, height: 14, borderRadius: 3, borderWidth: 1.5, borderColor: color, borderTopWidth: 0, borderRightWidth: 0, transform: [{ rotate: '-45deg' }], marginRight: 8, marginTop: 2 }} />
);

const IconChat = ({ color = COLOURS.blue }) => (
  <View style={{ width: 16, height: 12, borderRadius: 4, borderWidth: 1.5, borderColor: color, marginRight: 8 }}>
    <View style={{ position: 'absolute', bottom: -5, left: 3, width: 0, height: 0, borderTopWidth: 5, borderRightWidth: 5, borderTopColor: 'transparent', borderRightColor: color }} />
  </View>
);

const IconWaze = ({ color = COLOURS.gold }) => (
  <View style={{ width: 22, height: 18, marginTop: -2 }}>
    <View style={{ position: 'absolute', top: 2, right: -3, width: 8, height: 8, backgroundColor: COLOURS.surface, borderTopWidth: 1.5, borderRightWidth: 1.5, borderColor: color, transform: [{ rotate: '45deg' }] }} />
    <View style={{ flex: 1, borderRadius: 9, borderWidth: 1.5, borderColor: color, backgroundColor: COLOURS.surface, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ flexDirection: 'row', marginBottom: 2 }}>
        <View style={{ width: 2.5, height: 2.5, borderRadius: 1.25, backgroundColor: color, marginHorizontal: 2 }} />
        <View style={{ width: 2.5, height: 2.5, borderRadius: 1.25, backgroundColor: color, marginHorizontal: 2 }} />
      </View>
      <View style={{ width: 6, height: 1.5, borderRadius: 0.75, backgroundColor: color }} />
    </View>
    <View style={{ position: 'absolute', bottom: -3, left: 3, width: 6, height: 6, borderRadius: 3, backgroundColor: COLOURS.surface, borderWidth: 1.5, borderColor: color }} />
    <View style={{ position: 'absolute', bottom: -3, right: 3, width: 6, height: 6, borderRadius: 3, backgroundColor: COLOURS.surface, borderWidth: 1.5, borderColor: color }} />
  </View>
);

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
  const { t } = useTranslation();
  const [isCancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState<string | null>(null);
  const [cancelNotes, setCancelNotes] = useState('');
  
  const [isCallModalVisible, setCallModalVisible] = useState(false);
  const [isChatModalVisible, setChatModalVisible] = useState(false);
  const [chatInput, setChatInput] = useState('');
  
  const reasons = [
    t('cancellation.reason_vehicle_issue'),
    t('cancellation.reason_too_small'),
    t('cancellation.reason_too_many_bags'),
    'Passenger No-Show',
    'Other - Please specify'
  ];
  return (
    <View style={styles.activeRideExecutionSheet}>
      {/* Waze Floating Icon */}
      <TouchableOpacity 
        style={styles.wazeFloatButton} 
        onPress={() => Linking.openURL(`https://waze.com/ul?q=${encodeURIComponent('Manchester Piccadilly Station, Approach')}&navigate=yes`)}
      >
        <IconWaze color={COLOURS.gold} />
        <Text style={{ color: COLOURS.gold, fontSize: 11, fontWeight: '900', letterSpacing: 1, marginLeft: 10 }}>NAVIGATE</Text>
      </TouchableOpacity>
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
        <Text style={styles.infoBoxMicroHeader}>{t('active_trip.pickup_address_payout', { payout: '80.00' }).toUpperCase()}</Text>
        <Text style={styles.infoBoxValueText}>Manchester Piccadilly Station, Approach</Text>
      </View>

      <View style={styles.infoContentBoxWrapper}>
        <Text style={styles.infoBoxMicroHeader}>{t('radar.pickup_time').toUpperCase()}</Text>
        <Text style={styles.infoBoxValueTextBold}>20:30 BST</Text>
      </View>

      {/* Grace period countdown (phase 2 only) */}
      {tripPhase === 2 && (
        <View style={[styles.infoContentBoxWrapper, { borderColor: countdownSeconds > 0 ? COLOURS.gold : COLOURS.red }]}>
          <Text style={[styles.infoBoxMicroHeader, { color: countdownSeconds > 0 ? COLOURS.gold : COLOURS.red }]}>
            {t('active_trip.grace_period').toUpperCase()}
          </Text>
          {countdownSeconds > 0 ? (
            <Text style={styles.countdownValueDisplayText}>{t('active_trip.grace_remaining')} {formatTimerString(countdownSeconds)}</Text>
          ) : (
            <TouchableOpacity style={styles.independentCancelButton} onPress={() => {}}>
              <Text style={styles.independentCancelButtonText}>{t('active_trip.execute_no_show').toUpperCase()}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Action icons */}
      <View style={styles.privacyActionHubRowCentered}>
        <TouchableOpacity style={[styles.actionNodeButtonCentered, { backgroundColor: 'rgba(46, 211, 98, 0.1)', borderColor: COLOURS.green }]} onPress={() => setCallModalVisible(true)}>
          <IconCall color={COLOURS.green} />
          <Text style={[styles.actionNodeTextLabel, { color: COLOURS.green }]}>CALL</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionNodeButtonCentered, { backgroundColor: 'rgba(10, 132, 255, 0.1)', borderColor: COLOURS.blue }]} onPress={() => setChatModalVisible(true)}>
          <IconChat color={COLOURS.blue} />
          <Text style={[styles.actionNodeTextLabel, { color: COLOURS.blue }]}>CHAT</Text>
        </TouchableOpacity>
      </View>

      {/* Paging board shortcut */}
      <TouchableOpacity style={styles.pagingCardShortcut} onPress={onLaunchPagingBoard}>
        <Text style={styles.pagingShortcutText}>{t('active_trip.paging_board').toUpperCase()}</Text>
      </TouchableOpacity>

      {/* Cancel */}
      <TouchableOpacity style={styles.executionEmergencyCancelBtn} onPress={() => setCancelModalVisible(true)}>
        <Text style={styles.emergencyCancelBtnText}>{t('active_trip.request_cancellation').toUpperCase()}</Text>
      </TouchableOpacity>

      {/* Phase swipe sliders */}
      <View style={{ marginTop: 10 }}>
        {tripPhase === 1 && <VeloSwipeTrack text=">>>  I HAVE ARRIVED  >>>" trackColor="#131A24" thumbColor={COLOURS.blue} textColor={COLOURS.blue} onComplete={onPhaseComplete} />}
        {tripPhase === 2 && <VeloSwipeTrack text=">>>  START TRIP  >>>" trackColor="#131F17" thumbColor={COLOURS.green} textColor={COLOURS.green} onComplete={onPhaseComplete} />}
        {tripPhase === 3 && <VeloSwipeTrack text=">>>  END TRIP  >>>" trackColor="#1F1314" thumbColor={COLOURS.red} textColor={COLOURS.red} onComplete={onPhaseComplete} />}
      </View>

      {/* Call Customer Modal */}
      <Modal visible={isCallModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>CALL CUSTOMER</Text>
            <Text style={styles.modalSubtitle}>Connecting through masked routing to protect your privacy.</Text>
            
            <View style={{ backgroundColor: COLOURS.bg, padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#1C1C1E', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ color: COLOURS.textDim, fontSize: 10, fontWeight: '800', marginBottom: 4 }}>SECURE ROUTING NUMBER</Text>
              <Text style={{ color: COLOURS.green, fontSize: 18, fontWeight: '900', letterSpacing: 1 }}>+44 8000 000000</Text>
            </View>
            
            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#1A1A1C' }]} onPress={() => setCallModalVisible(false)}>
                <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '800' }}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: COLOURS.green }]} 
                onPress={() => {
                  setCallModalVisible(false);
                  Linking.openURL('tel:+448000000000');
                }}>
                <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '900' }}>CALL</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Chat Modal */}
      <Modal visible={isChatModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.chatModalContainer}>
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={() => setChatModalVisible(false)} style={{ padding: 8 }}>
              <Text style={{ color: COLOURS.gold, fontSize: 14, fontWeight: '800' }}>CLOSE</Text>
            </TouchableOpacity>
            <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '900' }}>MR. JOHN</Text>
            <View style={{ width: 50 }} />
          </View>
          
          <ScrollView style={styles.chatScrollContent}>
            <Text style={styles.chatTimestamp}>TODAY 20:25</Text>
            
            <View style={styles.chatBubbleDriver}>
              <Text style={styles.chatTextDriver}>I have arrived at the pickup location. I am parked near the main entrance.</Text>
              <View style={styles.chatMetaRowRight}>
                <Text style={styles.chatMetaText}>20:25</Text>
                <Text style={styles.chatTickReadDriver}>✓✓</Text>
              </View>
            </View>
            
            <View style={styles.chatBubbleCustomer}>
              <Text style={styles.chatTextCustomer}>Thanks! I'm just coming down now. See you in 2 mins.</Text>
              <View style={styles.chatMetaRowRight}>
                <Text style={styles.chatMetaText}>20:26</Text>
                <Text style={styles.chatTickReadCustomer}>✓✓</Text>
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.chatInputContainer}>
            <TextInput
              style={styles.chatTextInput}
              placeholder="Type message..."
              placeholderTextColor={COLOURS.textDim}
              value={chatInput}
              onChangeText={setChatInput}
            />
            <TouchableOpacity style={styles.chatSendBtn} onPress={() => { setChatInput(''); }}>
              <Text style={{ color: COLOURS.blue, fontWeight: '900', fontSize: 12 }}>SEND</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={isCancelModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('cancellation.title').toUpperCase()}</Text>
            <Text style={styles.modalSubtitle}>{t('cancellation.select_reason')}</Text>
            
            {reasons.map(r => (
              <TouchableOpacity key={r} style={[styles.reasonPill, cancelReason === r && styles.reasonPillActive]} onPress={() => setCancelReason(r)}>
                <Text style={[styles.reasonPillText, cancelReason === r && styles.reasonPillTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
            
            <TextInput
              style={styles.modalInput}
              placeholder={t('cancellation.optional_notes')}
              placeholderTextColor={COLOURS.textDim}
              value={cancelNotes}
              onChangeText={setCancelNotes}
              multiline
            />
            
            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#1A1A1C' }]} onPress={() => setCancelModalVisible(false)}>
                <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '800' }}>{t('cancellation.close').toUpperCase()}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: cancelReason ? COLOURS.red : '#3A1515' }]} 
                disabled={!cancelReason}
                onPress={() => {
                  setCancelModalVisible(false);
                  onRequestCancellation();
                }}>
                <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '900' }}>{t('post_trip.submit').toUpperCase()}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  activeRideExecutionSheet:   { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLOURS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1.5, borderBottomWidth: 0, borderColor: COLOURS.gold, paddingHorizontal: 22, paddingTop: 26, paddingBottom: 22, zIndex: 15 },
  passengerSplitRow:          { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  monogramAssetBox:           { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#222225', justifyContent: 'center', alignItems: 'center' },
  monogramText:               { color: COLOURS.gold, fontWeight: '800', fontSize: 14 },
  passengerNameText:          { color: '#FFFFFF', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
  passengerCorporateTag:      { color: COLOURS.textDark, fontSize: 12, fontWeight: '700', marginTop: 2 },
  
  wazeFloatButton:            { position: 'absolute', top: -56, right: 20, height: 42, borderRadius: 21, paddingHorizontal: 16, flexDirection: 'row', backgroundColor: COLOURS.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: COLOURS.gold, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },

  infoContentBoxWrapper:      { backgroundColor: COLOURS.bg, padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#1C1C1E' },
  infoBoxMicroHeader:         { color: COLOURS.textDim, fontSize: 8, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  infoBoxValueText:           { color: '#FFFFFF', fontSize: 13, fontWeight: '700', lineHeight: 18 },
  infoBoxValueTextBold:       { color: COLOURS.gold, fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  countdownValueDisplayText:  { color: COLOURS.red, fontSize: 13, fontWeight: '900', marginTop: 2 },
  independentCancelButton:    { backgroundColor: 'rgba(255,59,48,0.1)', height: 40, borderRadius: 6, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLOURS.red, marginTop: 4 },
  independentCancelButtonText:{ color: COLOURS.red, fontSize: 11, fontWeight: '900' },
  privacyActionHubRowCentered:{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 10, width: '100%' },
  actionNodeButtonCentered:   { flex: 1, flexDirection: 'row', height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginHorizontal: 6, borderWidth: 1.5 },
  actionNodeIconText:         { fontSize: 16, marginRight: 8 },
  actionNodeTextLabel:        { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
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
  
  chatModalContainer:         { flex: 1, backgroundColor: COLOURS.bg, paddingTop: 50 },
  chatHeader:                 { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#1C1C1E' },
  chatScrollContent:          { flex: 1, padding: 16 },
  chatTimestamp:              { color: COLOURS.textDim, fontSize: 10, fontWeight: '800', textAlign: 'center', marginVertical: 12 },
  chatBubbleDriver:           { backgroundColor: COLOURS.blue, padding: 12, borderRadius: 12, borderBottomRightRadius: 4, alignSelf: 'flex-end', maxWidth: '80%', marginBottom: 12 },
  chatTextDriver:             { color: '#FFF', fontSize: 14, fontWeight: '600' },
  chatBubbleCustomer:         { backgroundColor: '#1C1C1E', padding: 12, borderRadius: 12, borderBottomLeftRadius: 4, alignSelf: 'flex-start', maxWidth: '80%', marginBottom: 12, borderWidth: 1, borderColor: '#2A2A2C' },
  chatTextCustomer:           { color: '#FFF', fontSize: 14, fontWeight: '600' },
  chatInputContainer:         { flexDirection: 'row', padding: 16, borderTopWidth: 1, borderTopColor: '#1C1C1E', backgroundColor: COLOURS.surface, paddingBottom: 30 },
  chatTextInput:              { flex: 1, backgroundColor: COLOURS.bg, height: 44, borderRadius: 22, paddingHorizontal: 16, color: '#FFF', fontSize: 14 },
  chatSendBtn:                { marginLeft: 12, justifyContent: 'center', paddingHorizontal: 10 },
  chatMetaRowRight:           { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 6, alignItems: 'center' },
  chatMetaText:               { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginRight: 4 },
  chatTickReadDriver:         { fontSize: 11, color: COLOURS.gold, fontWeight: '800' },
  chatTickReadCustomer:       { fontSize: 11, color: COLOURS.blue, fontWeight: '800' },
  chatTickUnread:             { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '800' },
});
