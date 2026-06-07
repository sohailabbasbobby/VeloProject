/**
 * VELO DRIVER APP — Root Entry Point
 *
 * App Stages:
 *  STAGE1           → Pre-Shift Compliance Gatekeeper (GatekeeperScreen)
 *  STAGE2_IDLE      → Online & Listening / Radar Pool
 *  STAGE2_TAKEOVER  → Incoming Dispatch (DispatchScreen)
 *  STAGE3           → Active Ride Execution (ActiveRideScreen)
 *  LANDSCAPE_PAGING → Fullscreen Digital Paging Board
 *
 * All state lives here and is passed down as props.
 * Components: SidebarDrawer, VeloSwipeTrack
 * Screens:    GatekeeperScreen, DispatchScreen, ActiveRideScreen
 * Theme:      src/constants/theme.ts
 */

import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View, TextInput, Modal, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

import { COLOURS } from './src/constants/theme';
import { SidebarDrawer } from './src/components/SidebarDrawer';
import { VeloSwipeTrack } from './src/components/VeloSwipeTrack';
import { DriverMap, DriverMapStage } from './src/components/DriverMap';
import './src/i18n';
import { MapErrorBoundary } from './src/components/MapErrorBoundary';
import { GatekeeperScreen } from './src/screens/GatekeeperScreen';
import { DispatchScreen } from './src/screens/DispatchScreen';
import { ActiveRideScreen } from './src/screens/ActiveRideScreen';
import { PostTripScreen } from './src/screens/PostTripScreen';
import { AnimatedStatusDot } from './src/components/AnimatedStatusDot';
import { BottomStatusSheet } from './src/components/BottomStatusSheet';

type AppStage = 'STAGE1' | 'STAGE2_IDLE' | 'STAGE2_TAKEOVER' | 'STAGE3' | 'STAGE4_POST_TRIP' | 'LANDSCAPE_PAGING';
type SidebarTab = 'NONE' | 'PROFILE' | 'EXPENSES' | 'UPCOMING' | 'HISTORY' | 'EARNINGS' | 'OPERATORS' | 'SETTINGS';

export default function App() {
  // ── Navigation ──────────────────────────────────────────────────────────────
  const [currentStage, setCurrentStage] = useState<AppStage>('STAGE1');
  const [isSidebarOpen, setIsSidebarOpen]   = useState(false);
  const [sidebarActiveTab, setSidebarActiveTab] = useState<SidebarTab>('NONE');

  // ── Driver & Payroll ────────────────────────────────────────────────────────
  const [tenantPayrollType, setTenantPayrollType] = useState<'PERCENTAGE_SPLIT' | 'FIXED_WAGE'>('PERCENTAGE_SPLIT');
  const [isAdminApprovalPending, setIsAdminApprovalPending] = useState(false);
  const [adminApprovalResult, setAdminApprovalResult] = useState(false);
  const [driverProfile, setDriverProfile] = useState({
    name: 'JOHN DOE',
    phone: '+44 7700 900077',
    address: 'Suite 42, Executive Quarters, Manchester M1',
  });

  // ── Multi-Tenant Dispatch Engine ────────────────────────────────────────────
  const [pendingDispatches, setPendingDispatches] = useState<{ id: string, tenantName: string, payout: string, pickup: string, time: string }[]>([
    { id: 'job-1', tenantName: 'ELITE LIMOS', payout: '£80.00', pickup: 'MANCHESTER PICCADILLY', time: '20:30 BST' }
  ]);

  // ── Compliance Gatekeeper ───────────────────────────────────────────────────
  const [compliance, setCompliance] = useState({ pristine: false, cabin: false, tyres: false, fuel: false });
  const [hasCameraPayload, setHasCameraPayload] = useState(false);
  const [odometerValue, setOdometerValue] = useState('');
  const isGatekeeperUnlocked = compliance.pristine && compliance.cabin && compliance.tyres && compliance.fuel && hasCameraPayload && odometerValue.trim().length > 0;

  // ── Active Trip ─────────────────────────────────────────────────────────────
  const [tripPhase, setTripPhase] = useState<1 | 2 | 3>(1);
  const [countdownSeconds, setCountdownSeconds] = useState(900);

  // ── Expenses ────────────────────────────────────────────────────────────────
  const [customTripExpenseName, setCustomTripExpenseName]     = useState('');
  const [customTripExpenseAmount, setCustomTripExpenseAmount] = useState('');
  const [tripExpenses, setTripExpenses] = useState<{ [key: string]: Array<{ name: string; amount: string; timestamp: string, receiptImageUrl?: string }> }>({});
  
  const [globalExpenses, setGlobalExpenses] = useState<Array<{ id: string, name: string, amount: string, timestamp: string, receiptImageUrl?: string }>>([]);

  // ── Admin Chat ──────────────────────────────────────────────────────────────
  const [isAdminChatVisible, setIsAdminChatVisible] = useState(false);
  const [adminChatInput, setAdminChatInput] = useState('');

  // ── Animations ──────────────────────────────────────────────────────────────
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1,   duration: 1100, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 1100, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // ── Grace period countdown ───────────────────────────────────────────────────
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentStage === 'STAGE3' && tripPhase === 2 && countdownSeconds > 0) {
      interval = setInterval(() => setCountdownSeconds(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [currentStage, tripPhase, countdownSeconds]);

  const formatTimerString = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const requestAdminCancellationPrivilege = () => {
    setIsAdminApprovalPending(true);
    setAdminApprovalResult(false);
    setTimeout(() => {
      setAdminApprovalResult(true);
    }, 3000);
  };

  const handleAddTripExpense = (tripId: string, name: string, amount?: string) => {
    const finalName   = name   || customTripExpenseName;
    const finalAmount = amount || customTripExpenseAmount;
    if (!finalName || !finalAmount) return;
    const list = tripExpenses[tripId] || [];
    setTripExpenses({ ...tripExpenses, [tripId]: [...list, { name: finalName, amount: finalAmount.startsWith('£') ? finalAmount : '£' + finalAmount, timestamp: '03 Jun 2026, 22:00' }] });
    setCustomTripExpenseName('');
    setCustomTripExpenseAmount('');
  };

  const handleTripPhaseComplete = () => {
    if (tripPhase === 1) { setTripPhase(2); }
    else if (tripPhase === 2) { setTripPhase(3); }
    else { setCurrentStage('STAGE4_POST_TRIP'); }
  };

  // ── Landscape Paging Board ───────────────────────────────────────────────────
  if (currentStage === 'LANDSCAPE_PAGING') {
    return (
      <TouchableOpacity activeOpacity={1} style={styles.landscapeContainer} onPress={() => setCurrentStage('STAGE3')}>
        <StatusBar hidden />
        <Text style={styles.landscapePagingText}>MR. JOHN</Text>
      </TouchableOpacity>
    );
  }

  // ── Main Render ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLOURS.bg} />
      <View style={styles.mainWrapper}>

        {/* Admin cancellation lockout overlay */}
        {isAdminApprovalPending && (
          <View style={styles.adminLockoutOverlaySurface}>
            <View style={styles.lockoutCardContainer}>
              {!adminApprovalResult ? (
                <>
                  <ActivityIndicator size="large" color={COLOURS.red} style={{ marginBottom: 12 }} />
                  <Text style={styles.lockoutPulsingText}>TRANSMITTING EMERGENCY OVERRIDE TICKET</Text>
                  <Text style={styles.lockoutSubText}>Awaiting secure cancellation privilege approval from back-office tenant controllers...</Text>
                  <TouchableOpacity style={styles.cancelRequestBtn} onPress={() => setIsAdminApprovalPending(false)}>
                    <Text style={{ color: '#A5A5A7', fontWeight: '800', fontSize: 11 }}>DISMISS REQUEST</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={[styles.lockoutPulsingText, { color: COLOURS.gold, fontSize: 15 }]}>RIDE CANCELLED</Text>
                  <Text style={styles.lockoutSubText}>Back office has approved the cancellation ticket remotely. Manifest voided successfully.</Text>
                  <TouchableOpacity style={[styles.cancelRequestBtn, { borderColor: COLOURS.gold }]} onPress={() => { 
                    setIsAdminApprovalPending(false); 
                    setAdminApprovalResult(false); 
                    setTripPhase(1); 
                    setCurrentStage('STAGE2_IDLE'); 
                  }}>
                    <Text style={{ color: COLOURS.gold, fontWeight: '800', fontSize: 11 }}>RETURN TO RADAR POOL</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        )}


        {/* Admin Support Chat Modal */}
        <Modal visible={isAdminChatVisible} transparent animationType="slide">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.chatModalContainer}>
            <View style={styles.chatHeader}>
              <TouchableOpacity onPress={() => setIsAdminChatVisible(false)} style={{ padding: 8 }}>
                <Text style={{ color: COLOURS.gold, fontSize: 14, fontWeight: '800' }}>CLOSE</Text>
              </TouchableOpacity>
              <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '900' }}>DISPATCH CONTROL</Text>
              <View style={{ width: 50 }} />
            </View>
            
            <ScrollView style={styles.chatScrollContent}>
              <Text style={styles.chatTimestamp}>TODAY 11:45</Text>
              
              <View style={styles.chatBubbleCustomer}>
                <Text style={styles.chatTextCustomer}>Attention: There's heavy traffic reported on M62. Please use alternate route if heading East.</Text>
                <View style={styles.chatMetaRowRight}>
                  <Text style={styles.chatMetaText}>11:45</Text>
                  <Text style={styles.chatTickReadCustomer}>✓✓</Text>
                </View>
              </View>
              
              <View style={styles.chatBubbleDriver}>
                <Text style={styles.chatTextDriver}>Copy that. I'm taking the A57 instead.</Text>
                <View style={styles.chatMetaRowRight}>
                  <Text style={styles.chatMetaText}>11:46</Text>
                  <Text style={styles.chatTickUnread}>✓</Text>
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.chatInputContainer}>
              <TextInput
                style={styles.chatTextInput}
                placeholder="Type message to Dispatch..."
                placeholderTextColor={COLOURS.textDim}
                value={adminChatInput}
                onChangeText={setAdminChatInput}
              />
              <TouchableOpacity style={styles.chatSendBtn} onPress={() => setAdminChatInput('')}>
                <Text style={{ color: COLOURS.blue, fontWeight: '900', fontSize: 12 }}>SEND</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Sidebar Drawer */}
        {isSidebarOpen && (
          <SidebarDrawer
            driverProfile={driverProfile}
            setDriverProfile={setDriverProfile}
            tenantPayrollType={tenantPayrollType}
            setTenantPayrollType={setTenantPayrollType}
            activeTab={sidebarActiveTab}
            setActiveTab={setSidebarActiveTab}
            odometerValue={odometerValue}
            tripExpenses={tripExpenses}
            globalExpenses={globalExpenses}
            onAddGlobalExpense={(name, amount, receiptImageUrl) => {
              const newExpense = { id: 'exp-'+Date.now(), name, amount, timestamp: '03 Jun 2026, 22:15', receiptImageUrl };
              setGlobalExpenses([...globalExpenses, newExpense]);
            }}
            customTripExpenseName={customTripExpenseName}
            setCustomTripExpenseName={setCustomTripExpenseName}
            customTripExpenseAmount={customTripExpenseAmount}
            setCustomTripExpenseAmount={setCustomTripExpenseAmount}
            onAddTripExpense={handleAddTripExpense}
            onClose={() => { setIsSidebarOpen(false); setSidebarActiveTab('NONE'); }}
            onGoOffline={() => { setIsSidebarOpen(false); setSidebarActiveTab('NONE'); setCurrentStage('STAGE1'); }}
          />
        )}

        {/* STAGE 1 — Compliance Gatekeeper */}
        {currentStage === 'STAGE1' && (
          <GatekeeperScreen
            driverProfile={driverProfile}
            compliance={compliance}
            setCompliance={setCompliance}
            hasCameraPayload={hasCameraPayload}
            setHasCameraPayload={setHasCameraPayload}
            odometerValue={odometerValue}
            setOdometerValue={setOdometerValue}
            isUnlocked={isGatekeeperUnlocked}
            onGoOnline={() => setCurrentStage('STAGE2_IDLE')}
          />
        )}

        {/* STAGES 2 & 3 — Map Workspace */}
        {currentStage !== 'STAGE1' && (
          <View style={styles.workspaceCanvas}>

            {/* Live dark map — rendered FIRST so it sits behind all overlays */}
            <DriverMap
              stage={
                currentStage === 'STAGE2_TAKEOVER' ? 'DISPATCHED'
                : currentStage === 'STAGE3' ? 'ACTIVE'
                : 'IDLE'
              }
            />

            {/* Top status bar — floats above the map */}
            <View style={styles.topFloatingStatusBar}>
              <TouchableOpacity onPress={() => setIsSidebarOpen(true)} style={styles.burgerButton}>
                <Text style={styles.hamburgerLines}>☰</Text>
              </TouchableOpacity>
              <View style={styles.statusPill}>
                <AnimatedStatusDot status={currentStage === 'STAGE2_IDLE' ? 'ONLINE' : currentStage === 'STAGE2_TAKEOVER' ? 'ONLINE' : 'TRIP'} />
              </View>
            </View>

            {/* Right FABs */}
            <View style={styles.fabContainer}>
              <TouchableOpacity style={styles.fabBtn} onPress={() => setIsAdminChatVisible(true)}>
                <View style={styles.chatIconBubble} />
                <View style={styles.chatIconTail} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.fabBtn}>
                <View style={styles.locationIconPin} />
                <View style={styles.locationIconNeedle} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.fabBtn} onPress={() => { setIsSidebarOpen(true); setSidebarActiveTab('EXPENSES'); }}>
                <Text style={{ color: COLOURS.gold, fontSize: 16, fontWeight: '900' }}>£</Text>
              </TouchableOpacity>
            </View>

            {/* STAGE 2 IDLE — Radar / On Break slider */}
            {currentStage === 'STAGE2_IDLE' && (
              <>
                <BottomStatusSheet
                  statusText="ONLINE — SEARCHING TRIPS"
                  dotStatus="ONLINE"
                  sliderText="SLIDE RIGHT TO GO ON BREAK"
                  onSlideComplete={() => { /* Handle Break */ }}
                />
                
                {/* Dev triggers */}
                <View style={styles.devTriggerContainer}>
                  <TouchableOpacity style={styles.devTriggerButton} onPress={() => {
                    setPendingDispatches([{ id: 'job-' + Date.now(), tenantName: 'ELITE LIMOS', payout: '£80.00', pickup: 'MANCHESTER PICCADILLY', time: '20:30 BST' }]);
                    setCurrentStage('STAGE2_TAKEOVER');
                  }}>
                    <Text style={styles.devTriggerText}>[ Sim Single Trip ]</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={[styles.devTriggerButton, { marginLeft: 10 }]} onPress={() => {
                    setPendingDispatches([
                      { id: 'job-1' + Date.now(), tenantName: 'ELITE LIMOS', payout: '£80.00', pickup: 'MANCHESTER PICCADILLY', time: '20:30 BST' },
                      { id: 'job-2' + Date.now(), tenantName: 'BLACKLANE UK', payout: '£120.00', pickup: 'MANCHESTER AIRPORT T2', time: '17:30 BST' }
                    ]);
                    setCurrentStage('STAGE2_TAKEOVER');
                  }}>
                    <Text style={styles.devTriggerText}>[ Sim Conflict ]</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* STAGE 2 TAKEOVER — Incoming dispatch */}
            {currentStage === 'STAGE2_TAKEOVER' && (
              <DispatchScreen
                dispatches={pendingDispatches}
                payrollType={tenantPayrollType}
                onAccept={(jobId) => { setCountdownSeconds(900); setCurrentStage('STAGE3'); setTripPhase(1); }}
                onDecline={requestAdminCancellationPrivilege}
              />
            )}

            {/* STAGE 3 — Active Ride */}
            {currentStage === 'STAGE3' && (
              <ActiveRideScreen
                tripPhase={tripPhase}
                countdownSeconds={countdownSeconds}
                formatTimerString={formatTimerString}
                onPhaseComplete={handleTripPhaseComplete}
                onRequestCancellation={requestAdminCancellationPrivilege}
                onLaunchPagingBoard={() => setCurrentStage('LANDSCAPE_PAGING')}
              />
            )}

            {/* STAGE 4 — Post Trip Summary */}
            {currentStage === 'STAGE4_POST_TRIP' && (
              <PostTripScreen 
                onComplete={() => {
                  setTripPhase(1);
                  setCurrentStage('STAGE2_IDLE');
                }}
              />
            )}

          </View>
        )}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:    { flex: 1, backgroundColor: COLOURS.bg },
  mainWrapper: { flex: 1, backgroundColor: COLOURS.bg },

  // Admin lockout
  adminLockoutOverlaySurface: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(7,7,8,0.96)', zIndex: 999, justifyContent: 'center', alignItems: 'center', padding: 24 },
  lockoutCardContainer:       { backgroundColor: COLOURS.surface, padding: 24, borderRadius: 16, borderWidth: 1, borderColor: COLOURS.red, width: '100%', alignItems: 'center' },
  lockoutPulsingText:         { color: COLOURS.red, fontSize: 13, fontWeight: '900', letterSpacing: 0.5, textAlign: 'center', marginBottom: 12 },
  lockoutSubText:             { color: COLOURS.textMuted, fontSize: 12, fontWeight: '600', textAlign: 'center', lineHeight: 18, marginBottom: 20 },
  cancelRequestBtn:           { paddingVertical: 10, paddingHorizontal: 16, backgroundColor: COLOURS.bg, borderRadius: 8, borderWidth: 0.5, borderColor: '#222' },

  // Map workspace
  workspaceCanvas:        { flex: 1, position: 'relative', backgroundColor: '#070708' },
  topFloatingStatusBar:   { position: 'absolute', top: 15, left: 15, right: 15, height: 60, backgroundColor: 'rgba(7,7,8,0.88)', paddingTop: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, zIndex: 10, justifyContent: 'space-between' },
  burgerButton:           { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: COLOURS.gold, alignItems: 'center', justifyContent: 'center' },
  hamburgerLines:         { color: COLOURS.gold, fontSize: 24 },
  statusPill:             { width: 44, height: 44, backgroundColor: '#0E0E10', borderRadius: 22, borderWidth: 1.5, borderColor: COLOURS.gold, alignItems: 'center', justifyContent: 'center' },
  fabContainer:           { position: 'absolute', right: 16, top: '40%', alignItems: 'center', zIndex: 10 },
  fabBtn:                 { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(12,12,15,0.9)', borderWidth: 1.5, borderColor: COLOURS.gold, alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 4 },
  chatIconBubble:         { width: 20, height: 14, borderRadius: 6, borderWidth: 1.5, borderColor: COLOURS.gold },
  chatIconTail:           { position: 'absolute', bottom: 10, left: 12, width: 0, height: 0, borderTopWidth: 6, borderRightWidth: 6, borderTopColor: 'transparent', borderRightColor: COLOURS.gold },
  locationIconPin:        { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, borderColor: COLOURS.gold },
  locationIconNeedle:     { width: 1.5, height: 6, backgroundColor: COLOURS.gold, marginTop: 1 },
  devTriggerContainer:    { position: 'absolute', top: 90, alignSelf: 'center', flexDirection: 'row', zIndex: 10 },
  devTriggerButton:       { padding: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 6, borderWidth: 1, borderColor: COLOURS.blue },
  devTriggerText:         { color: COLOURS.blue, fontSize: 10, fontWeight: '700' },

  // Landscape paging
  landscapeContainer:  { flex: 1, backgroundColor: COLOURS.bg, width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  landscapePagingText: { color: '#FFFFFF', fontSize: 68, fontWeight: '900', letterSpacing: 6 },
  
  // Chat Modal
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
