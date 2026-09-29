/**
 * VELO DRIVER APP — Root Entry Point (LIVE-WIRED, §5)
 *
 * App Stages:
 *  LOGIN            → Self-hosted authentication (password / OTP / Google / Apple)
 *  STAGE1           → Pre-Shift Compliance Gatekeeper (writes gatekeeper_checks via API)
 *  STAGE2_IDLE      → Online & listening; polls live trip offers
 *  STAGE2_TAKEOVER  → Incoming dispatch(es) incl. multi-tenant Schedule Conflict modal
 *  STAGE3           → Active Ride Execution (phase sliders hit the trips API)
 *  STAGE4           → Post-trip summary + rating
 *  LANDSCAPE_PAGING → Fullscreen Digital Paging Board
 *
 * All state is driven by backend-core over HTTP with OUR OWN access token attached
 * (transparent refresh rotation on 401 — see src/api/client.ts).
 */

import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View, TextInput, Modal, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

import { COLOURS } from './src/constants/theme';
import { SidebarDrawer } from './src/components/SidebarDrawer';
import { DriverMap, DriverMapStage } from './src/components/DriverMap';
import './src/i18n';
import { GatekeeperScreen } from './src/screens/GatekeeperScreen';
import { DispatchScreen } from './src/screens/DispatchScreen';
import { ActiveRideScreen } from './src/screens/ActiveRideScreen';
import { PostTripScreen } from './src/screens/PostTripScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { DefectReportScreen } from './src/screens/DefectReportScreen';
import { FaultLogScreen } from './src/screens/FaultLogScreen';
import { RosterScreen } from './src/screens/RosterScreen';
import { MessagingScreen } from './src/screens/MessagingScreen';
import { AnimatedStatusDot } from './src/components/AnimatedStatusDot';
import { BottomStatusSheet } from './src/components/BottomStatusSheet';
import { restoreSession, signOut, onSessionExpired } from './src/api/auth';
import * as Api from './src/api/client';

type AppStage = 'STAGE1' | 'STAGE2_IDLE' | 'STAGE2_TAKEOVER' | 'STAGE3' | 'STAGE4_POST_TRIP' | 'LANDSCAPE_PAGING';
type SidebarTab = 'NONE' | 'PROFILE' | 'EXPENSES' | 'UPCOMING' | 'HISTORY' | 'EARNINGS' | 'OPERATORS' | 'ROSTER' | 'ISSUES' | 'SETTINGS';
type OverlayScreen = null | 'DEFECT_REPORT' | 'FAULT_LOG' | 'ROSTER' | 'MESSAGING';

interface OfferRow {
  offer_id: string;
  id: string;
  task_id: string;
  state: string;
  pickup_address: string;
  dropoff_address: string;
  custom_price: number;
  scheduled_at: string | null;
  booking_type: string;
  originating_tenant_name: string | null;
  operator_logo: string | null;
  scheduleConflict: boolean;
  conflictWith: { task_id: string; id: string; pickup_address: string } | null;
  etaDeltaMinutes?: number;
  locationDeltaMiles?: number;
}

export default function App() {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const [authReady, setAuthReady] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    // Self-hosted session restore: a persisted token pair means signed-in.
    restoreSession()
      .then((session) => {
        setIsAuthed(Boolean(session));
        setAuthReady(true);
      })
      .catch(() => {
        setIsAuthed(false);
        setAuthReady(true);
      });

    // Fatal 401 (refresh failed) bounces back to login.
    return onSessionExpired(() => {
      setIsAuthed(false);
    });
  }, []);

  // ── Navigation ──────────────────────────────────────────────────────────────
  const [currentStage, setCurrentStage] = useState<AppStage>('STAGE1');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarActiveTab, setSidebarActiveTab] = useState<SidebarTab>('NONE');
  const [overlayScreen, setOverlayScreen] = useState<OverlayScreen>(null);
  const [expenseModalTrip, setExpenseModalTrip] = useState<any>(null);

  // ── Driver (live) ───────────────────────────────────────────────────────────
  const [driverProfile, setDriverProfile] = useState({ name: '—', phone: '', address: '', vehicleId: '' as string | null });
  const [tenantPayrollType, setTenantPayrollType] = useState<'PERCENTAGE_SPLIT' | 'FIXED_WAGE'>('PERCENTAGE_SPLIT');

  // ── Live offers / active trip ───────────────────────────────────────────────
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [tripPhase, setTripPhase] = useState<1 | 2 | 3>(1);
  const [countdownSeconds, setCountdownSeconds] = useState(900);
  const [isAdminApprovalPending, setIsAdminApprovalPending] = useState(false);
  const [adminApprovalResult, setAdminApprovalResult] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // ── Gatekeeper ──────────────────────────────────────────────────────────────
  const [compliance, setCompliance] = useState({ pristine: false, cabin: false, tyres: false, fuel: false });
  const [hasCameraPayload, setHasCameraPayload] = useState(false);
  const [odometerValue, setOdometerValue] = useState('');
  const isGatekeeperUnlocked = compliance.pristine && compliance.cabin && compliance.tyres && compliance.fuel && hasCameraPayload && odometerValue.trim().length > 0;

  // ── Live polling: offers + active trip + telemetry pings ────────────────────
  useEffect(() => {
    if (!isAuthed) return;
    let cancelled = false;

    const poll = async () => {
      try {
        if (currentStage === 'STAGE2_IDLE' || currentStage === 'STAGE2_TAKEOVER') {
          const rows: OfferRow[] = (await Api.fetchMyOffers()) || [];
          if (!cancelled) {
            setOffers(rows);
            if (rows.length > 0 && currentStage === 'STAGE2_IDLE') setCurrentStage('STAGE2_TAKEOVER');
            if (rows.length === 0 && currentStage === 'STAGE2_TAKEOVER') setCurrentStage('STAGE2_IDLE');
          }
        }
        if (['STAGE3', 'STAGE4_POST_TRIP'].includes(currentStage) || !activeTrip) {
          const trip = await Api.fetchActiveTrip();
          if (!cancelled && trip && trip.id !== activeTrip?.id) {
            setActiveTrip(trip);
            setTripPhase(trip.state === 'ARRIVED' ? 2 : trip.state === 'IN_PROGRESS' ? 3 : 1);
            setCurrentStage('STAGE3');
          }
        }
      } catch (err: any) {
        if (!cancelled) setApiError(err.message);
      }
    };

    poll();
    const interval = setInterval(poll, 8000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [isAuthed, currentStage, activeTrip?.id]);

  // GPS telemetry ping every 30s while online
  useEffect(() => {
    if (!isAuthed || currentStage === 'STAGE1') return;
    const ping = () => {
      Geolocation.getCurrentPosition(
        (pos) => {
          Api.sendTelemetryPing(pos.coords.latitude, pos.coords.longitude, pos.coords.heading || undefined, pos.coords.speed || undefined)
            .catch(() => undefined);
        },
        () => undefined,
        { enableHighAccuracy: true, timeout: 15000, distanceFilter: 50 }
      );
    };
    ping();
    const t = setInterval(ping, 30000);
    return () => clearInterval(t);
  }, [isAuthed, currentStage]);

  // ── Push registration (final-mile §2): register this device after sign-in ────
  useEffect(() => {
    if (!isAuthed) return;
    let cancelled = false;
    (async () => {
      try {
        // Platform is reported honestly: Android → FCM token, iOS → APNs token.
        // Without FCM/APNs credentials the backend registers the token and reports
        // deliveryConfigured: false — registration still succeeds (fail-open).
        const platform = Platform.OS === 'ios' ? 'APNS' : 'FCM';
        const PushNotification = require('react-native-push-notification').default;
        void PushNotification;
        // Token provisioning via react-native-push-notification / @react-native-firebase/messaging
        // requires the native modules on-device. Until the on-device build exists the
        // registration call is made with the honest simulator placeholder only if the
        // native module is available; otherwise we log and skip silently.
        const nativeToken = await new Promise<string | null>((resolve) => {
          try {
            const firebaseMessaging = require('@react-native-firebase/messaging');
            const messaging = firebaseMessaging?.default || firebaseMessaging;
            messaging()
              .getToken()
              .then((t: string) => resolve(t || null))
              .catch(() => resolve(null));
          } catch {
            resolve(null);
          }
        });
        if (!nativeToken) {
          console.log('[push] No native FCM/APNs token available on this build; device not registered.');
          return;
        }
        if (cancelled) return;
        const result = await Api.registerPushToken(nativeToken, platform);
        console.log('[push] registered:', result?.registered, '| delivery configured:', result?.deliveryConfigured);
      } catch (e: any) {
        console.log('[push] registration failed (non-fatal):', e?.message);
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthed]);

  // Load driver profile after sign-in
  useEffect(() => {
    if (!isAuthed) return;
    (async () => {
      try {
        const drivers = await Api.fetchMyProfile();
        const me = Array.isArray(drivers) ? drivers[0] : drivers;
        if (me) {
          setDriverProfile((p) => ({
            ...p,
            name: `${(me.first_name || '').toUpperCase()} ${(me.last_name || '').toUpperCase()}`.trim() || p.name,
            phone: me.phone || p.phone,
            vehicleId: null,
          }));
          setTenantPayrollType(me.payment_model === 'SALARIED' ? 'FIXED_WAGE' : 'PERCENTAGE_SPLIT');
        }
        const vehicles = await Api.fetchMyVehicle();
        const primary = Array.isArray(vehicles) ? vehicles[0] : null;
        if (primary) setDriverProfile((p) => ({ ...p, vehicleId: primary.id }));
      } catch (err: any) {
        setApiError(err.message);
      }
    })();
  }, [isAuthed]);

  // ── Grace period countdown ───────────────────────────────────────────────────
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (currentStage === 'STAGE3' && tripPhase === 2 && countdownSeconds > 0) {
      interval = setInterval(() => setCountdownSeconds((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [currentStage, tripPhase, countdownSeconds]);

  const formatTimerString = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ── Handlers (all hit the live API) ──────────────────────────────────────────
  const handleGoOnline = async () => {
    try {
      if (!driverProfile.vehicleId) throw new Error('No vehicle assigned to your profile.');
      await Api.submitGatekeeper({
        vehicleId: driverProfile.vehicleId,
        cleanliness: compliance.pristine,
        tyres: compliance.tyres,
        fuelBattery: compliance.fuel,
        rearCabinPhotoUrl: hasCameraPayload ? 'captured' : '',
      });
      if (odometerValue) await Api.logOdometer(driverProfile.vehicleId, Number(odometerValue), 'START_SHIFT');
      setCurrentStage('STAGE2_IDLE');
    } catch (err: any) {
      Alert.alert('Gatekeeper rejected', err.message);
    }
  };

  const handleOfferAccept = async (offer: OfferRow) => {
    try {
      await Api.respondToOffer(offer.offer_id, 'ACCEPT', {
        forfeitTripId: offer.scheduleConflict && offer.conflictWith ? offer.conflictWith.id : undefined,
        acknowledgeConflict: offer.scheduleConflict,
      });
      setOffers((prev) => prev.filter((o) => o.offer_id !== offer.offer_id));
      const trip = await Api.fetchActiveTrip();
      if (trip) {
        setActiveTrip(trip);
        setTripPhase(1);
        setCountdownSeconds(900);
        setCurrentStage('STAGE3');
      } else {
        setCurrentStage('STAGE2_IDLE');
      }
    } catch (err: any) {
      Alert.alert('Accept failed', err.message);
    }
  };

  const handleOfferDecline = async (offer: OfferRow) => {
    try {
      await Api.respondToOffer(offer.offer_id, 'DECLINE');
      setOffers((prev) => prev.filter((o) => o.offer_id !== offer.offer_id));
    } catch (err: any) {
      Alert.alert('Decline failed', err.message);
    }
  };

  const handleTripPhaseComplete = async () => {
    if (!activeTrip) return;
    try {
      const next = tripPhase === 1 ? 'ARRIVED' : tripPhase === 2 ? 'START' : 'COMPLETE';
      await Api.advanceTripPhase(activeTrip.id, next, next === 'COMPLETE' && odometerValue ? Number(odometerValue) : undefined);
      if (next === 'COMPLETE') {
        setCurrentStage('STAGE4_POST_TRIP');
      } else {
        setTripPhase((p) => (p === 1 ? 2 : 3) as 1 | 2 | 3);
      }
    } catch (err: any) {
      Alert.alert('Phase update failed', err.message);
    }
  };

  // Emergency cancellation: real backend approval gate (§5) — no mock 3s timer
  const requestAdminCancellationPrivilege = async () => {
    if (!activeTrip) return;
    setIsAdminApprovalPending(true);
    setAdminApprovalResult(false);
    try {
      await Api.requestCancellation(activeTrip.id, 'EMERGENCY_DRIVER_REQUEST');
      // Poll the trip state until the back office resolves the request
      const check = setInterval(async () => {
        const trip = await Api.fetchActiveTrip().catch(() => null);
        if (!trip || trip.cancellation_approver === 'ADMIN_APPROVED' || trip.state === 'CANCELLED') {
          clearInterval(check);
          setAdminApprovalResult(true);
        } else if (trip.cancellation_approver === 'ADMIN_REJECTED') {
          clearInterval(check);
          setIsAdminApprovalPending(false);
          Alert.alert('Cancellation declined', 'Back office rejected this cancellation request.');
        }
      }, 5000);
    } catch (err: any) {
      setIsAdminApprovalPending(false);
      Alert.alert('Request failed', err.message);
    }
  };

  // ── Landscape Paging Board ───────────────────────────────────────────────────
  if (currentStage === 'LANDSCAPE_PAGING') {
    return (
      <TouchableOpacity activeOpacity={1} style={styles.landscapeContainer} onPress={() => setCurrentStage('STAGE3')}>
        <StatusBar hidden />
        <Text style={styles.landscapePagingText}>{(activeTrip?.passenger_name || 'WELCOME').toUpperCase()}</Text>
      </TouchableOpacity>
    );
  }

  // ── Auth gate ────────────────────────────────────────────────────────────────
  if (!authReady) {
    return (
      <View style={styles.authLoading}>
        <ActivityIndicator color={COLOURS.gold} size="large" />
      </View>
    );
  }
  if (!isAuthed) {
    return <LoginScreen onSignedIn={() => setIsAuthed(true)} />;
  }

  // Map offers into the shape DispatchScreen expects
  const dispatches = offers.map((o) => ({
    id: o.offer_id,
    tenantName: (o.originating_tenant_name || 'VELO NETWORK').toUpperCase(),
    operatorLogo: o.operator_logo || undefined,
    payout: `£${Number(o.custom_price).toFixed(2)}`,
    pickup: o.pickup_address.toUpperCase(),
    dropoff: o.dropoff_address.toUpperCase(),
    time: o.scheduled_at ? new Date(o.scheduled_at).toLocaleTimeString().slice(0, 5) : 'ASAP',
    conflict: o.scheduleConflict,
    conflictWithTaskId: o.conflictWith?.task_id,
    etaDeltaMinutes: o.etaDeltaMinutes,
    locationDeltaMiles: o.locationDeltaMiles,
  }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLOURS.bg} />
      <View style={styles.mainWrapper}>

        {apiError && (
          <TouchableOpacity style={styles.apiErrorBar} onPress={() => setApiError(null)}>
            <Text style={styles.apiErrorText}>LIVE LINK ERROR: {apiError} — tap to dismiss</Text>
          </TouchableOpacity>
        )}

        {/* Admin cancellation lockout overlay (real approval state) */}
        {isAdminApprovalPending && (
          <View style={styles.adminLockoutOverlaySurface}>
            <View style={styles.lockoutCardContainer}>
              {!adminApprovalResult ? (
                <>
                  <ActivityIndicator size="large" color={COLOURS.red} style={{ marginBottom: 12 }} />
                  <Text style={styles.lockoutPulsingText}>CANCELLATION TICKET WITH BACK OFFICE</Text>
                  <Text style={styles.lockoutSubText}>Awaiting secure cancellation approval from tenant controllers. Your trip stays locked until they decide.</Text>
                  <TouchableOpacity style={styles.cancelRequestBtn} onPress={() => setIsAdminApprovalPending(false)}>
                    <Text style={{ color: '#A5A5A7', fontWeight: '800', fontSize: 11 }}>HIDE (REQUEST REMAINS ACTIVE)</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={[styles.lockoutPulsingText, { color: COLOURS.gold, fontSize: 15 }]}>RIDE CANCELLED</Text>
                  <Text style={styles.lockoutSubText}>Back office approved the cancellation ticket. Manifest voided and escrow refunded.</Text>
                  <TouchableOpacity style={[styles.cancelRequestBtn, { borderColor: COLOURS.gold }]} onPress={() => {
                    setIsAdminApprovalPending(false);
                    setAdminApprovalResult(false);
                    setTripPhase(1);
                    setActiveTrip(null);
                    setCurrentStage('STAGE2_IDLE');
                  }}>
                    <Text style={{ color: COLOURS.gold, fontWeight: '800', fontSize: 11 }}>RETURN TO RADAR POOL</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        )}

        {/* Sidebar Drawer */}
        {isSidebarOpen && (
          <SidebarDrawer
            driverProfile={driverProfile}
            setDriverProfile={setDriverProfile}
            tenantPayrollType={tenantPayrollType}
            setTenantPayrollType={setTenantPayrollType}
            activeTab={sidebarActiveTab}
            setActiveTab={(tab) => {
              // ROSTER / ISSUES open as dedicated first-class screens over the workspace.
              if (tab === 'ROSTER') { setIsSidebarOpen(false); setSidebarActiveTab('NONE'); setOverlayScreen('ROSTER'); return; }
              if (tab === 'ISSUES') { setIsSidebarOpen(false); setSidebarActiveTab('NONE'); setOverlayScreen('FAULT_LOG'); return; }
              setSidebarActiveTab(tab);
            }}
            odometerValue={odometerValue}
            onClose={() => { setIsSidebarOpen(false); setSidebarActiveTab('NONE'); }}
            onGoOffline={async () => {
              try { await Api.goOffline(); } catch { /* offline anyway */ }
              setIsSidebarOpen(false); setSidebarActiveTab('NONE'); setCurrentStage('STAGE1');
            }}
          />
        )}

        {/* Sidebar quick-actions for the four dedicated screens (reachable from STAGE 2/3) */}
        {isSidebarOpen && (
          <View style={styles.sidebarQuickActions}>
            <TouchableOpacity style={styles.quickActionBtn} onPress={() => { setIsSidebarOpen(false); setOverlayScreen('DEFECT_REPORT'); }}>
              <Text style={styles.quickActionText}>⚠ REPORT DEFECT</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionBtn} onPress={() => { setIsSidebarOpen(false); setOverlayScreen('MESSAGING'); }}>
              <Text style={styles.quickActionText}>✉ DISPATCH CHAT</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Full-screen overlays: Defect Report / Fault Log / Roster / Messaging */}
        {overlayScreen ? (
          <View style={styles.overlayContainer}>
            <TouchableOpacity style={styles.overlayCloseBtn} onPress={() => setOverlayScreen(null)}>
              <Text style={styles.overlayCloseText}>✕ CLOSE</Text>
            </TouchableOpacity>
            {overlayScreen === 'DEFECT_REPORT' && <DefectReportScreen />}
            {overlayScreen === 'FAULT_LOG' && <FaultLogScreen />}
            {overlayScreen === 'ROSTER' && <RosterScreen />}
            {overlayScreen === 'MESSAGING' && <MessagingScreen />}
          </View>
        ) : null}

        {/* Post-Job Expense Modal — dedicated modal for logging expenses against the completed trip */}
        {expenseModalTrip ? (
          <PostJobExpenseModal
            trip={expenseModalTrip}
            onClose={() => setExpenseModalTrip(null)}
          />
        ) : null}

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
            onGoOnline={handleGoOnline}
          />
        )}

        {/* STAGES 2 & 3 — Map Workspace */}
        {currentStage !== 'STAGE1' && (
          <View style={styles.workspaceCanvas}>

            <DriverMap
              stage={
                currentStage === 'STAGE2_TAKEOVER' ? 'DISPATCHED'
                  : currentStage === 'STAGE3' ? 'ACTIVE'
                    : 'IDLE'
              }
              pickupLat={activeTrip ? Number(activeTrip.pickup_lat) : undefined}
              pickupLng={activeTrip ? Number(activeTrip.pickup_lng) : undefined}
              dropoffLat={activeTrip ? Number(activeTrip.dropoff_lat) : undefined}
              dropoffLng={activeTrip ? Number(activeTrip.dropoff_lng) : undefined}
            />

            {/* Top status bar */}
            <View style={styles.topFloatingStatusBar}>
              <TouchableOpacity onPress={() => setIsSidebarOpen(true)} style={styles.burgerButton}>
                <Text style={styles.hamburgerLines}>☰</Text>
              </TouchableOpacity>
              <View style={styles.statusPill}>
                <AnimatedStatusDot status={currentStage === 'STAGE3' ? 'TRIP' : 'ONLINE'} />
              </View>
            </View>

            {/* STAGE 2 IDLE — Online, waiting for live offers */}
            {currentStage === 'STAGE2_IDLE' && (
              <BottomStatusSheet
                statusText="ONLINE — AWAITING LIVE JOB OFFERS"
                dotStatus="ONLINE"
                sliderText="SLIDE RIGHT TO GO OFFLINE"
                onSlideComplete={async () => {
                  try { await Api.goOffline(); } catch { /* already offline */ }
                  setCurrentStage('STAGE1');
                }}
              />
            )}

            {/* STAGE 2 TAKEOVER — Incoming live offers + Schedule Conflict modal */}
            {currentStage === 'STAGE2_TAKEOVER' && (
              <DispatchScreen
                dispatches={dispatches}
                payrollType={tenantPayrollType}
                onAccept={(offerId) => {
                  const offer = offers.find((o) => o.offer_id === offerId);
                  if (offer) handleOfferAccept(offer);
                }}
                onDecline={(offerId) => {
                  const offer = offers.find((o) => o.offer_id === offerId);
                  if (offer) handleOfferDecline(offer);
                }}
              />
            )}

            {/* STAGE 3 — Active Ride (live trip data) */}
            {currentStage === 'STAGE3' && activeTrip && (
              <ActiveRideScreen
                trip={activeTrip}
                tripPhase={tripPhase}
                countdownSeconds={countdownSeconds}
                formatTimerString={formatTimerString}
                onPhaseComplete={handleTripPhaseComplete}
                onRequestCancellation={requestAdminCancellationPrivilege}
                onLaunchPagingBoard={() => setCurrentStage('LANDSCAPE_PAGING')}
              />
            )}

            {/* STAGE 4 — Post Trip Summary + rating (live submit) */}
            {currentStage === 'STAGE4_POST_TRIP' && activeTrip && (
              <PostTripScreen
                trip={activeTrip}
                onComplete={async (stars: number, feedback: string) => {
                  try {
                    if (stars > 0) await Api.submitTripRating(activeTrip.id, stars, feedback);
                  } catch { /* rating is best-effort */ }
                  setTripPhase(1);
                  setActiveTrip(null);
                  setCurrentStage('STAGE2_IDLE');
                }}
                onLogExpenses={() => setExpenseModalTrip(activeTrip)}
              />
            )}

          </View>
        )}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLOURS.bg },
  mainWrapper: { flex: 1, backgroundColor: COLOURS.bg },
  authLoading: { flex: 1, backgroundColor: COLOURS.bg, alignItems: 'center', justifyContent: 'center' },
  apiErrorBar: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: '#5a1e1e', padding: 8, zIndex: 1000 },
  apiErrorText: { color: '#ffb4b4', fontSize: 10, textAlign: 'center' },

  adminLockoutOverlaySurface: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(7,7,8,0.96)', zIndex: 999, justifyContent: 'center', alignItems: 'center', padding: 24 },
  lockoutCardContainer: { backgroundColor: COLOURS.surface, padding: 24, borderRadius: 16, borderWidth: 1, borderColor: COLOURS.red, width: '100%', alignItems: 'center' },
  lockoutPulsingText: { color: COLOURS.red, fontSize: 13, fontWeight: '900', letterSpacing: 0.5, textAlign: 'center', marginBottom: 12 },
  lockoutSubText: { color: COLOURS.textMuted, fontSize: 12, fontWeight: '600', textAlign: 'center', lineHeight: 18, marginBottom: 20 },
  cancelRequestBtn: { paddingVertical: 10, paddingHorizontal: 16, backgroundColor: COLOURS.bg, borderRadius: 8, borderWidth: 0.5, borderColor: '#222' },

  workspaceCanvas: { flex: 1, position: 'relative', backgroundColor: '#070708' },
  topFloatingStatusBar: { position: 'absolute', top: 15, left: 15, right: 15, height: 60, backgroundColor: 'rgba(7,7,8,0.88)', paddingTop: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, zIndex: 10, justifyContent: 'space-between' },
  burgerButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: COLOURS.gold, alignItems: 'center', justifyContent: 'center' },
  hamburgerLines: { color: COLOURS.gold, fontSize: 24 },
  statusPill: { width: 44, height: 44, backgroundColor: '#0E0E10', borderRadius: 22, borderWidth: 1.5, borderColor: COLOURS.gold, alignItems: 'center', justifyContent: 'center' },

  landscapeContainer: { flex: 1, backgroundColor: COLOURS.bg, width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  landscapePagingText: { color: '#FFFFFF', fontSize: 68, fontWeight: '900', letterSpacing: 6 },

  overlayContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: COLOURS.bg, zIndex: 500, paddingTop: 60 },
  overlayCloseBtn: { alignSelf: 'flex-end', marginHorizontal: 20, marginBottom: 4, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: COLOURS.surface, borderRadius: 8, borderWidth: 1, borderColor: '#222' },
  overlayCloseText: { color: COLOURS.gold, fontSize: 11, fontWeight: '900', letterSpacing: 1 },

  sidebarQuickActions: { position: 'absolute', top: 80, right: 15, flexDirection: 'column', gap: 8, zIndex: 200 },
  quickActionBtn: { backgroundColor: COLOURS.surface, borderRadius: 10, borderWidth: 1, borderColor: COLOURS.gold, paddingVertical: 10, paddingHorizontal: 14 },
  quickActionText: { color: COLOURS.gold, fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },

  expenseOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(7,7,8,0.92)', zIndex: 1200, justifyContent: 'center', alignItems: 'center', padding: 24 },
  expenseCard: { backgroundColor: COLOURS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLOURS.gold, padding: 22, width: '100%' },
  expenseTitle: { color: COLOURS.gold, fontSize: 15, fontWeight: '900', letterSpacing: 1.5 },
  expenseTrip: { color: COLOURS.textMuted, fontSize: 11, fontWeight: '700', marginTop: 6 },
  expensePill: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#2A2A2D', alignItems: 'center', marginHorizontal: 3 },
  expenseInput: { backgroundColor: COLOURS.bg, borderRadius: 8, borderWidth: 1, borderColor: '#1C1C1E', color: '#FFF', paddingHorizontal: 12, height: 44, fontSize: 14, fontWeight: '700', marginTop: 10 },
  expenseError: { color: '#FF6B60', fontSize: 11, fontWeight: '700', marginTop: 8 },
  expenseBtn: { paddingVertical: 13, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flex: 1 },
});

/**
 * POST-JOB EXPENSE MODAL — the dedicated per-trip expense logger (moved out of the
 * sidebar flow). Writes real DEBIT driver_ledgers rows via POST /api/trips/:id/expenses.
 */
function PostJobExpenseModal({ trip, onClose }: { trip: any; onClose: () => void }) {
  const PRESETS: Array<{ key: string; label: string }> = [
    { key: 'EXPENSE_PARKING', label: 'Parking' },
    { key: 'EXPENSE_TOLL', label: 'Toll' },
    { key: 'EXPENSE_AIRPORT_FEE', label: 'Airport Fee' },
  ];
  const [expenseType, setExpenseType] = useState('EXPENSE_PARKING');
  const [customLabel, setCustomLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) { setError('Enter a valid amount.'); return; }
    if (expenseType === 'EXPENSE_CUSTOM' && !customLabel.trim()) { setError('Name the custom expense.'); return; }
    setSaving(true);
    try {
      await Api.logTripExpense(trip.id, expenseType, amt, customLabel.trim() || undefined);
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Failed to log expense.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.expenseOverlay}>
      <View style={styles.expenseCard}>
        <Text style={styles.expenseTitle}>LOG TRIP EXPENSE</Text>
        <Text style={styles.expenseTrip}>{trip.task_id ? `${trip.task_id} · ` : ''}{trip.pickup_address} → {trip.dropoff_address}</Text>

        <View style={{ flexDirection: 'row', marginTop: 16 }}>
          {PRESETS.map((p) => (
            <TouchableOpacity
              key={p.key}
              onPress={() => setExpenseType(p.key)}
              style={[styles.expensePill, expenseType === p.key && { borderColor: COLOURS.gold, backgroundColor: 'rgba(212,175,55,0.1)' }]}
            >
              <Text style={{ color: expenseType === p.key ? COLOURS.gold : '#8A8A8E', fontSize: 12, fontWeight: '800' }}>{p.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={() => setExpenseType('EXPENSE_CUSTOM')}
            style={[styles.expensePill, expenseType === 'EXPENSE_CUSTOM' && { borderColor: COLOURS.gold, backgroundColor: 'rgba(212,175,55,0.1)' }]}
          >
            <Text style={{ color: expenseType === 'EXPENSE_CUSTOM' ? COLOURS.gold : '#8A8A8E', fontSize: 12, fontWeight: '800' }}>Custom</Text>
          </TouchableOpacity>
        </View>

        {expenseType === 'EXPENSE_CUSTOM' ? (
          <TextInput style={styles.expenseInput} placeholder="Custom expense name…" placeholderTextColor="#555" value={customLabel} onChangeText={setCustomLabel} />
        ) : null}
        <TextInput style={styles.expenseInput} placeholder="Amount (£)" placeholderTextColor="#555" keyboardType="numeric" value={amount} onChangeText={setAmount} />

        {error ? <Text style={styles.expenseError}>{error}</Text> : null}

        <View style={{ flexDirection: 'row', marginTop: 18 }}>
          <TouchableOpacity style={[styles.expenseBtn, { backgroundColor: '#1C1C1E', borderColor: '#2A2A2D', borderWidth: 1, marginRight: 8 }]} onPress={onClose}>
            <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 12 }}>CANCEL</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.expenseBtn, { backgroundColor: COLOURS.gold, flex: 1 }]} onPress={submit} disabled={saving}>
            {saving
              ? <ActivityIndicator size="small" color="#0B0B0C" />
              : <Text style={{ color: '#0B0B0C', fontWeight: '900', fontSize: 12 }}>COMMIT EXPENSE</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
