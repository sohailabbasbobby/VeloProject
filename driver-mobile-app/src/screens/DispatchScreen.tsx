import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Dimensions, Modal, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLOURS } from '../constants/theme';
import { VeloSwipeTrack } from '../components/VeloSwipeTrack';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DispatchScreenProps {
  dispatches: Array<{
    id: string, tenantName: string, operatorLogo?: string, payout: string, pickup: string,
    dropoff?: string, time: string, conflict?: boolean, conflictWithTaskId?: string,
    etaDeltaMinutes?: number, locationDeltaMiles?: number,
  }>;
  payrollType: 'PERCENTAGE_SPLIT' | 'FIXED_WAGE';
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}

export function DispatchScreen({ dispatches, payrollType, onAccept, onDecline }: DispatchScreenProps) {
  const { t } = useTranslation();
  const isConflict = dispatches.some((d) => d.conflict) || dispatches.length > 1;

  const [isCancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState<string | null>(null);
  const [cancelNotes, setCancelNotes] = useState('');
  const [jobToCancel, setJobToCancel] = useState<string | null>(null);
  
  const reasons = [
    t('cancellation.reason_vehicle_issue'),
    t('cancellation.reason_too_small'),
    t('cancellation.reason_too_many_bags'),
    'Passenger No-Show',
    'Other - Please specify'
  ];

  return (
    <View style={isConflict ? styles.fullScreenContainer : styles.bottomSheetContainer}>
      {isConflict && (
        <View style={styles.conflictHeader}>
          <Text style={styles.conflictTitle}>{t('radar.conflict_detected')}</Text>
          <Text style={styles.conflictSubtitle}>{t('radar.conflict_desc')}</Text>
        </View>
      )}
      
      <View style={isConflict ? styles.conflictScrollContent : styles.singleScrollContent}>
        {dispatches.map((job) => (
          <View key={job.id} style={[styles.jobCard, isConflict ? styles.jobCardConflict : styles.jobCardSingle]}>
            
            {/* Header */}
            <View style={[styles.assignmentHeaderRow, isConflict && { flexDirection: 'row', alignItems: 'center', marginBottom: 10 }]}>
              <Text style={isConflict ? styles.pulsingWarningHeaderSmall : styles.pulsingWarningHeader}>{t('radar.trip_request')}</Text>
              <Text style={isConflict ? styles.tenantOriginatorLabelSmall : styles.tenantOriginatorLabel}>
                {isConflict ? ` - ${job.tenantName}` : job.tenantName}
              </Text>
            </View>

            {/* Compressed Payout & Time Row for Conflicts */}
            <View style={{ flexDirection: isConflict ? 'row' : 'column', justifyContent: 'space-between' }}>
              <View style={[styles.requestedTimeSolidBox, isConflict && { flex: 1, marginRight: 5, padding: 12, marginBottom: 8 }]}>
                <Text style={styles.timeBoxLabel}>{t('post_trip.payout')}</Text>
                <Text style={[styles.timeBoxValueBold, { color: COLOURS.green, fontSize: isConflict ? 15 : 18 }]}>
                  {payrollType === 'PERCENTAGE_SPLIT' ? `Net: ${job.payout}` : t('profile.salaried')}
                </Text>
              </View>

              <View style={[styles.requestedTimeSolidBox, isConflict && { flex: 1, marginLeft: 5, padding: 12, marginBottom: 8 }]}>
                <Text style={styles.timeBoxLabel}>{t('radar.pickup_time')}</Text>
                <Text style={[styles.timeBoxValueBold, { fontSize: isConflict ? 15 : 18 }]}>{job.time}</Text>
              </View>
            </View>

            {/* Route */}
            <View style={[styles.itineraryRouteCard, isConflict && { marginBottom: 8 }]}>
              <View style={[styles.routeNodeBlock, isConflict && { marginVertical: 2 }]}>
                <View style={styles.routeRingNode} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.nodeLocation, isConflict && { fontSize: 13 }]}>{job.pickup}</Text>
                  {!isConflict && <Text style={styles.nodeInlineMetrics}>{t('active_trip.en_route', { time: '8 min', distance: '2.4 mi' })}</Text>}
                </View>
              </View>
              <View style={[styles.routeDashedConnectorLine, isConflict && { height: 10, marginVertical: 2 }]} />
              <View style={[styles.routeNodeBlock, isConflict && { marginVertical: 2 }]}>
                <View style={[styles.routeRingNode, { borderColor: COLOURS.red }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.nodeLocation, isConflict && { fontSize: 13 }]}>{(job.dropoff || job.pickup).toUpperCase()}</Text>
                  {!isConflict && <Text style={styles.nodeInlineMetrics}>{t('active_trip.in_transit', { time: '—', distance: '—' })}</Text>}
                </View>
              </View>
            </View>

            {/* Emergency Cancellation - Hide in conflict to save space */}
            {!isConflict && (
              <TouchableOpacity style={styles.takeoverEmergencyCancelBtn} onPress={() => { setJobToCancel(job.id); setCancelModalVisible(true); }}>
                <Text style={styles.emergencyCancelBtnText}>{t('active_trip.request_cancellation')}</Text>
              </TouchableOpacity>
            )}

            {!isConflict && <View style={{ height: 10 }} />}

            {/* Slider */}
            <VeloSwipeTrack
              text="SLIDE RIGHT TO ACCEPT >>>"
              trackColor="#131F17"
              thumbColor={COLOURS.green}
              textColor={COLOURS.green}
              onComplete={() => onAccept(job.id)}
            />
          </View>
        ))}
      </View>

      <Modal visible={isCancelModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('cancellation.title')}</Text>
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
                  if (jobToCancel) {
                    onDecline(jobToCancel);
                  }
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
  fullScreenContainer:        { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(7,7,8,0.96)', zIndex: 30 },
  bottomSheetContainer:       { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'transparent', zIndex: 20 },
  
  conflictHeader:             { backgroundColor: COLOURS.gold, paddingTop: 50, paddingBottom: 16, paddingHorizontal: 20, alignItems: 'center' },
  conflictTitle:              { color: '#000', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  conflictSubtitle:           { color: '#000', fontSize: 11, fontWeight: '700', marginTop: 6, textAlign: 'center', lineHeight: 14 },
  
  conflictScrollContent:      { padding: 14, flex: 1, justifyContent: 'center' },
  singleScrollContent:        { paddingBottom: 0 },
  
  jobCard:                    { backgroundColor: COLOURS.surface, borderWidth: 1.5, borderColor: COLOURS.gold, padding: 22 },
  jobCardConflict:            { borderRadius: 20, marginBottom: 12, padding: 16 },
  jobCardSingle:              { width: SCREEN_WIDTH, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderBottomWidth: 0, paddingTop: 26 },
  
  assignmentHeaderRow:        { alignItems: 'flex-start', marginBottom: 14, paddingHorizontal: 4 },
  pulsingWarningHeader:       { color: '#FFFFFF', fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  pulsingWarningHeaderSmall:  { color: '#FFFFFF', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  tenantOriginatorLabel:      { color: COLOURS.gold, fontSize: 13, fontWeight: '800', marginTop: 2, letterSpacing: 0.5 },
  tenantOriginatorLabelSmall: { color: COLOURS.gold, fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  
  requestedTimeSolidBox:      { backgroundColor: COLOURS.bg, borderRadius: 10, padding: 14, marginBottom: 12, borderWidth: 1.5, borderColor: COLOURS.gold },
  timeBoxLabel:               { color: COLOURS.textDim, fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  timeBoxValueBold:           { color: '#FFFFFF', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  
  itineraryRouteCard:         { paddingHorizontal: 4, marginBottom: 15 },
  routeNodeBlock:             { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 4 },
  routeRingNode:              { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: COLOURS.gold, backgroundColor: 'transparent', marginTop: 4, marginRight: 16 },
  nodeLocation:               { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
  nodeInlineMetrics:          { color: COLOURS.textMuted, fontSize: 12, fontWeight: '700', marginTop: 3 },
  routeDashedConnectorLine:   { width: 1, height: 22, backgroundColor: '#222225', marginLeft: 4, marginVertical: 2 },
  
  takeoverEmergencyCancelBtn: { backgroundColor: 'rgba(255,59,48,0.06)', height: 44, borderRadius: 10, borderWidth: 1.5, borderColor: COLOURS.gold, justifyContent: 'center', alignItems: 'center' },
  emergencyCancelBtnText:     { color: COLOURS.red, fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  
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
