import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
  PanResponder,
  Animated,
  Alert,
  TextInput
} from 'react-native';

const { width } = Dimensions.get('window');
const SLIDER_WIDTH = width - 40;
const THUMB_SIZE = 46;
const SWIPE_RANGE = SLIDER_WIDTH - THUMB_SIZE - 8;

interface VeloSwipeTrackProps {
  text: string;
  trackColor: string;
  thumbColor: string;
  textColor: string;
  onComplete: () => void;
  disabled?: boolean;
}

function VeloSwipeTrack({ text, trackColor, thumbColor, textColor, onComplete, disabled = false }: VeloSwipeTrackProps) {
  const pan = useRef(new Animated.Value(0)).current;
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponderCapture: () => !disabled,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) pan.setValue(0);
        else if (gestureState.dx > SWIPE_RANGE) pan.setValue(SWIPE_RANGE);
        else pan.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx >= SWIPE_RANGE * 0.8) {
          Animated.timing(pan, {
            toValue: SWIPE_RANGE,
            duration: 120,
            useNativeDriver: false,
          }).start(() => {
            onComplete();
            Animated.timing(pan, { toValue: 0, duration: 0, useNativeDriver: false }).start();
          });
        } else {
          Animated.spring(pan, {
            toValue: 0,
            friction: 5,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  return (
    <TouchableOpacity 
      activeOpacity={0.9}
      onPress={() => { if (!disabled) onComplete(); }}
      disabled={disabled}
      style={[styles.sliderContainer, { backgroundColor: trackColor, opacity: disabled ? 0.3 : 1 }]}
    >
      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.sliderThumb, { backgroundColor: thumbColor, transform: [{ translateX: pan }] }]}
      >
        <Text style={styles.thumbArrow}>❯</Text>
      </Animated.View>
      <Text style={[styles.sliderLabelText, { color: textColor }]}>
        {text}
      </Text>
    </TouchableOpacity>
  );
}

export default function App() {
  const [currentStage, setCurrentStage] = useState<'STAGE1' | 'STAGE2_IDLE' | 'STAGE2_TAKEOVER' | 'STAGE3' | 'LANDSCAPE_PAGING'>('STAGE1');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarActiveTab, setSidebarActiveTab] = useState<'NONE' | 'PROFILE' | 'HISTORY' | 'EARNINGS' | 'VEHICLE' | 'SETTINGS'>('NONE');

  const [tenantPayrollType, setTenantPayrollType] = useState<'PERCENTAGE_SPLIT' | 'FIXED_WAGE'>('PERCENTAGE_SPLIT');
  const [isAdminApprovalPending, setIsAdminApprovalPending] = useState(false);

  const [driverProfile, setDriverProfile] = useState({
    name: 'JOHN DOE',
    phone: '+44 7700 900077',
    address: 'Suite 42, Executive Quarters, Manchester M1'
  });

  const [compliance, setCompliance] = useState({ pristine: false, cabin: false, tyres: false, fuel: false });
  const [hasCameraPayload, setHasCameraPayload] = useState(false);
  const [odometerValue, setOdometerValue] = useState('');
  const [tripPhase, setTripPhase] = useState<1 | 2 | 3>(1);
  const [countdownSeconds, setCountdownSeconds] = useState(900);

  const [customTripExpenseName, setCustomTripExpenseName] = useState('');
  const [customTripExpenseAmount, setCustomTripExpenseAmount] = useState('');
  const [customVehicleExpenseName, setCustomVehicleExpenseName] = useState('');
  const [customVehicleExpenseAmount, setCustomVehicleExpenseAmount] = useState('');

  const [tripExpenses, setTripExpenses] = useState<{ [key: string]: Array<{ name: string; amount: string; timestamp: string }> }>({});
  const [vehicleExpenses, setVehicleExpenses] = useState<Array<{ id: number; name: string; amount: string; timestamp: string }>>([
    { id: 1, name: 'Fuel', amount: '£65.00', timestamp: '03 Jun 2026, 06:45' },
    { id: 2, name: 'Carwash', amount: '£15.00', timestamp: '03 Jun 2026, 11:20' }
  ]);

  const [faultReportText, setFaultReportText] = useState('');
  const [vehicleIssuesList, setVehicleIssuesList] = useState<Array<{ id: number; text: string; timestamp: string; fixed: boolean }>>([
    { id: 1, text: 'Nearside brake pad sensor alert active', timestamp: '02 Jun 2026, 14:10', fixed: true },
    { id: 2, text: 'Minor paint chip on rear bumper edge', timestamp: '03 Jun 2026, 07:15', fixed: false }
  ]);

  // Essential Variable Declaration Target
  const isGatekeeperUnlocked = compliance.pristine && compliance.cabin && compliance.tyres && compliance.fuel && hasCameraPayload && odometerValue.trim().length > 0;

  // Pulse Icon Telemetry Loop
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 1100, useNativeDriver: true })
      ])
    ).start();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentStage === 'STAGE3' && tripPhase === 2 && countdownSeconds > 0) {
      interval = setInterval(() => {
        setCountdownSeconds(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentStage, tripPhase, countdownSeconds]);

  const formatTimerString = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const requestAdminCancellationPrivilege = () => {
    Alert.alert(
      "Request Fleet Cancellation Override",
      "Are you sure you want to request an emergency cancellation from the admin desk?",
      [
        { text: "Dismiss Request", style: "cancel" },
        { 
          text: "Transmit Request", 
          style: "destructive",
          onPress: () => {
            setIsAdminApprovalPending(true);
            setTimeout(() => {
              Alert.alert(
                "Privilege Override Granted",
                "Back office has approved the cancellation ticket remotely. Manifest voided successfully.",
                [{
                  text: "Return to Radar Pool",
                  onPress: () => {
                    setIsAdminApprovalPending(false);
                    setTripPhase(1);
                    setCurrentStage('STAGE2_IDLE');
                  }
                }]
              );
            }, 3000);
          }
        }
      ]
    );
  };

  const handleAddTripExpense = (tripId: string, classificationName: string, directAmount?: string) => {
    const finalName = classificationName || customTripExpenseName;
    const finalAmount = directAmount || customTripExpenseAmount;
    if (!finalName || !finalAmount) return;
    const currentList = tripExpenses[tripId] || [];
    setTripExpenses({ ...tripExpenses, [tripId]: [...currentList, { name: finalName, amount: finalAmount.startsWith('£') ? finalAmount : '£' + finalAmount, timestamp: '03 Jun 2026, 22:00' }] });
    setCustomTripExpenseName('');
    setCustomTripExpenseAmount('');
  };

  const handleAddVehicleExpense = (classificationName: string, directAmount?: string) => {
    const finalName = classificationName || customVehicleExpenseName;
    const finalAmount = directAmount || customVehicleExpenseAmount;
    if (!finalName || !finalAmount) return;
    setVehicleExpenses([...vehicleExpenses, { id: Date.now(), name: finalName, amount: finalAmount.startsWith('£') ? finalAmount : '£' + finalAmount, timestamp: '03 Jun 2026, 22:00' }]);
    setCustomVehicleExpenseName('');
    setCustomVehicleExpenseAmount('');
  };

  if (currentStage === 'LANDSCAPE_PAGING') {
    return (
      <TouchableOpacity activeOpacity={1} style={styles.landscapeContainer} onPress={() => setCurrentStage('STAGE3')}>
        <StatusBar hidden />
        <Text style={styles.landscapePagingText}>MR. JOHN</Text>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#070708" />
      <View style={styles.mainWrapper}>

        {/* ADMIN DISPATCH INTERLOCK OVERLAY */}
        {isAdminApprovalPending && (
          <View style={styles.adminLockoutOverlaySurface}>
            <View style={styles.lockoutCardContainer}>
              <Text style={styles.lockoutPulsingText}>⏳   TRANSMITTING EMERGENCY OVERRIDE TICKET</Text>
              <Text style={styles.lockoutSubText}>Awaiting secure cancellation privilege approval from back-office tenant controllers...</Text>
              <TouchableOpacity style={styles.cancelRequestBtn} onPress={() => setIsAdminApprovalPending(false)}>
                <Text style={{ color: '#A5A5A7', fontWeight: '800', fontSize: 11 }}>WITHDRAW CANCELLATION TICKET</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STAGE 4: DRAWER ACCORDIONS */}
        {isSidebarOpen && (
          <View style={styles.sidebarDrawer}>
            <View style={styles.sidebarTopHeaderRow}>
              <TouchableOpacity style={styles.sidebarCloseButton} onPress={() => { setIsSidebarOpen(false); setSidebarActiveTab('NONE'); }}>
                <Text style={styles.closeBtnText}>✕  CLOSE</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity activeOpacity={0.9} style={styles.driverHeaderCardTrigger} onPress={() => setSidebarActiveTab(sidebarActiveTab === 'PROFILE' ? 'NONE' : 'PROFILE')}>
              <View style={styles.avatarPlaceholderLarge} />
              <View style={{ marginLeft: 16, flex: 1 }}>
                <Text style={styles.sidebarDriverName}>{driverProfile.name}</Text>
                <Text style={styles.sidebarDriverId}>CHAUFFEUR ID: AV-4092</Text>
                <Text style={styles.editProfileNoticeText}>⚙️  Tap to update profile details</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.shiftSummaryWidgetCard}>
              <Text style={styles.widgetHeader}>SHIFT NET REVENUE JOURNAL</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                <Text style={styles.widgetValue}>
                  {tenantPayrollType === 'PERCENTAGE_SPLIT' ? 'Net Earnings: £100.80' : 'Fixed Salaried Assignment'}
                </Text>
              </View>
            </View>

            <ScrollView style={styles.sidebarMenuScroller} contentContainerStyle={styles.sidebarScrollerContentContainer} showsVerticalScrollIndicator={false}>
              {sidebarActiveTab === 'PROFILE' && (
                <View style={styles.drawerSubContentCard}>
                  <Text style={styles.subCardTitle}>UPDATE ACCOUNT DETAILED RECORDS</Text>
                  <Text style={styles.inputLabelField}>NAME</Text>
                  <TextInput style={styles.drawerInput} value={driverProfile.name} onChangeText={(v) => setDriverProfile({...driverProfile, name: v.toUpperCase()})} />
                  <Text style={styles.inputLabelField}>MOBILE PHONE NUMBER</Text>
                  <TextInput style={styles.drawerInput} value={driverProfile.phone} onChangeText={(v) => setDriverProfile({...driverProfile, phone: v})} keyboardType="phone-pad" />
                  <Text style={styles.inputLabelField}>OPERATIONAL ADDRESS</Text>
                  <TextInput style={styles.drawerInput} value={driverProfile.address} onChangeText={(v) => setDriverProfile({...driverProfile, address: v})} multiline />
                  <TouchableOpacity style={styles.saveProfileButton} onPress={() => setSidebarActiveTab('NONE')}>
                    <Text style={styles.saveProfileBtnText}>[ SAVE UPDATED ACCOUNT DETAILED RECORDS ]</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity style={[styles.menuRowItem, sidebarActiveTab === 'HISTORY' && styles.menuRowActive]} onPress={() => setSidebarActiveTab(sidebarActiveTab === 'HISTORY' ? 'NONE' : 'HISTORY')}>
                <Text style={styles.menuRowLabelText}>📋   Trip History</Text>
                <Text style={styles.chevronIndicator}>{sidebarActiveTab === 'HISTORY' ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {sidebarActiveTab === 'HISTORY' && (
                <View style={styles.drawerSubContentCard}>
                  {[
                    { id: 'T1', net: '£80.00', car: 'Mercedes-Benz S-Class • Black • Reg: LN26 XAA', route: 'Manchester Piccadilly ➔ Airport T2' },
                    { id: 'T2', net: '£20.80', car: 'Range Rover Vogue • Dark Silver • Reg: V26 VELO', route: 'Spinningfields Core ➔ Wilmslow Manor' }
                  ].map((trip) => (
                    <View key={trip.id} style={styles.tripHistoryItemCard}>
                      <Text style={styles.tripVehicleTag}>{trip.car}</Text>
                      <Text style={styles.tripRouteString}>{trip.route}</Text>
                      <View style={styles.payrollCalculationBadge}>
                        <Text style={styles.payrollCalculationText}>
                          {tenantPayrollType === 'PERCENTAGE_SPLIT' ? `Net Earnings: ${trip.net}` : 'Salaried Contract Run'}
                        </Text>
                      </View>
                      {tripExpenses[trip.id] && tripExpenses[trip.id].map((exp, idx) => (
                        <View key={idx} style={styles.individualExpensePillRow}>
                          <View>
                            <Text style={styles.individualExpenseText}>• {exp.name}</Text>
                            <Text style={styles.microTimestampText}>{exp.timestamp}</Text>
                          </View>
                          <Text style={styles.individualExpenseValue}>{exp.amount}</Text>
                        </View>
                      ))}
                      <Text style={styles.expenseNestedHeader}>[ ADD TRIP LOGGED EXPENSE ]</Text>
                      <View style={styles.classificationPresetsRow}>
                        {['Parking', 'Tolls', 'Airport Fees'].map((p) => (
                          <TouchableOpacity key={p} style={styles.presetExpensePill} onPress={() => handleAddTripExpense(trip.id, p, '5.00')}>
                            <Text style={styles.presetText}>+ {p}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <TextInput style={styles.customFieldInputBox} placeholder="Or name your custom expense item..." placeholderTextColor="#3A3A3C" value={customTripExpenseName} onChangeText={setCustomTripExpenseName} />
                      <View style={{ flexDirection: 'row', marginTop: 6 }}>
                        <TextInput style={[styles.customFieldInputBox, { flex: 1, marginTop: 0 }]} placeholder="Amount (£)" placeholderTextColor="#3A3A3C" keyboardType="numeric" value={customTripExpenseAmount} onChangeText={setCustomTripExpenseAmount} />
                        <TouchableOpacity style={styles.inlineAddBtn} onPress={() => handleAddTripExpense(trip.id, customTripExpenseName, customTripExpenseAmount)}>
                          <Text style={styles.inlineAddBtnText}>COMMIT</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity style={[styles.menuRowItem, sidebarActiveTab === 'EARNINGS' && styles.menuRowActive]} onPress={() => setSidebarActiveTab(sidebarActiveTab === 'EARNINGS' ? 'NONE' : 'EARNINGS')}>
                <Text style={styles.menuRowLabelText}>📊   Ledger & Earnings</Text>
                <Text style={styles.chevronIndicator}>{sidebarActiveTab === 'EARNINGS' ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {sidebarActiveTab === 'EARNINGS' && (
                <View style={styles.drawerSubContentCard}>
                  <View style={styles.ledgerTotalizerRow}>
                    <Text style={styles.ledgerTotalizerLabel}>
                      {tenantPayrollType === 'PERCENTAGE_SPLIT' ? 'SHIFT NET EARNINGS' : 'SALARIED REGISTER'}
                    </Text>
                    <Text style={styles.ledgerTotalizerValue}>
                      {tenantPayrollType === 'PERCENTAGE_SPLIT' ? '£100.80' : 'Active Account'}
                    </Text>
                  </View>
                  <View style={styles.shiftMetricsGrid}>
                    <View style={styles.metricBlock}>
                      <Text style={styles.metricLabelText}>TIME SINCE START SHIFT</Text>
                      <Text style={styles.metricValueText}>05h 42m Active</Text>
                    </View>
                    <View style={styles.metricBlock}>
                      <Text style={styles.metricLabelText}>VEHICLE DRIVEN MILES</Text>
                      <Text style={styles.metricValueText}>{odometerValue ? (parseInt(odometerValue) + 94.2).toFixed(1) : '94.2'} Miles</Text>
                    </View>
                  </View>
                </View>
              )}

              <TouchableOpacity style={[styles.menuRowItem, sidebarActiveTab === 'SETTINGS' && styles.menuRowActive]} onPress={() => setSidebarActiveTab(sidebarActiveTab === 'SETTINGS' ? 'NONE' : 'SETTINGS')}>
                <Text style={styles.menuRowLabelText}>⚙️   App Settings</Text>
                <Text style={styles.chevronIndicator}>{sidebarActiveTab === 'SETTINGS' ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {sidebarActiveTab === 'SETTINGS' && (
                <View style={styles.drawerSubContentCard}>
                  <Text style={styles.inputLabelField}>BACK OFFICE PAYROLL CONFIG OVERRIDE</Text>
                  <View style={{ flexDirection: 'row', marginTop: 8 }}>
                    <TouchableOpacity style={[styles.inlineAddBtn, { flex: 1, backgroundColor: tenantPayrollType === 'PERCENTAGE_SPLIT' ? '#D4AF37' : '#1A1A1B' }]} onPress={() => setTenantPayrollType('PERCENTAGE_SPLIT')}>
                      <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '900' }}>PERCENTAGE (80/20)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.inlineAddBtn, { flex: 1, backgroundColor: tenantPayrollType === 'FIXED_WAGE' ? '#D4AF37' : '#1A1A1B' }]} onPress={() => setTenantPayrollType('FIXED_WAGE')}>
                      <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '900' }}>WAGE CONTRACT</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.sidebarSliderFixedFooter}>
              <VeloSwipeTrack text="SLIDE TO GO OFFLINE" trackColor="#1F1314" thumbColor="#FF3B30" textColor="#FF3B30" onComplete={() => { setIsSidebarOpen(false); setSidebarActiveTab('NONE'); setCurrentStage('STAGE1'); }} />
            </View>
          </View>
        )}

        {/* STAGE 1 LOGGED GATEKEEPER COMPLIANCE TIMELINE */}
        {currentStage === 'STAGE1' && (
          <View style={styles.fullTakeoverContainer}>
            <View style={styles.gatekeeperHeader}>
              <View style={styles.avatarPlaceholder} />
              <View style={{ marginLeft: 14 }}>
                <Text style={styles.chauffeurName}>{driverProfile.name}</Text>
                <Text style={styles.carMeta}>MERCEDES-BENZ S-CLASS{"\n"}BLACK - REG: LN26 XAA</Text>
              </View>
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {[
                { id: 'pristine', text: 'Pristine exterior body' },
                { id: 'cabin', text: 'Cabin vacuumed & prepped' },
                { id: 'tyres', text: 'Tyre pressure verified' },
                { id: 'fuel', text: 'Fuel/Battery > 75%' }
              ].map((item) => (
                <TouchableOpacity key={item.id} style={styles.complianceRowCard} onPress={() => setCompliance({ ...compliance, [item.id]: !compliance[item.id as keyof typeof compliance] })}>
                  <View style={[styles.checkboxToggle, compliance[item.id as keyof typeof compliance] && styles.checkboxChecked]}>
                    {compliance[item.id as keyof typeof compliance] && <Text style={styles.checkIcon}>✓</Text>}
                  </View>
                  <Text style={styles.complianceCardText}>{item.text}</Text>
                </TouchableOpacity>
              ))}

              <View style={styles.odometerInputWrapper}>
                <Text style={styles.odometerLabel}>CURRENT VEHICLE ODOMETER MILEAGE</Text>
                <TextInput style={styles.odometerTextInput} placeholder="Enter mileage..." placeholderTextColor="#3C3C3E" keyboardType="numeric" value={odometerValue} onChangeText={setOdometerValue} />
              </View>

              <TouchableOpacity style={styles.cameraWindowTarget} onPress={() => setHasCameraPayload(!hasCameraPayload)}>
                {hasCameraPayload ? (
                  <Text style={styles.cameraPayloadSuccessText}>✓ CABIN CAPTURED SUCCESSFUL</Text>
                ) : (
                  <Text style={styles.cameraPlaceholderText}>📷   TAP TO CAPTURE REAR CABIN PRESENTATION</Text>
                )}
              </TouchableOpacity>
            </ScrollView>

            <VeloSwipeTrack text="SLIDE RIGHT TO GO ONLINE >>>" trackColor="#131F17" thumbColor="#34C759" textColor="#34C759" disabled={!isGatekeeperUnlocked} onComplete={() => setCurrentStage('STAGE2_IDLE')} />
          </View>
        )}

        {/* WORKSPACE BASE LAYER RADAR VIEWS */}
        {currentStage !== 'STAGE1' && (
          <View style={styles.workspaceCanvas}>
            <View style={styles.topFloatingStatusBar}>
              <TouchableOpacity onPress={() => setIsSidebarOpen(true)} style={styles.burgerButton}>
                <Text style={styles.hamburgerLines}>☰</Text>
              </TouchableOpacity>
              <View style={styles.liveIndicatorContainer}>
                <Animated.Text style={[styles.trackingPill, { opacity: pulseAnim }]}>
                  📶   ONLINE & TRACKING
                </Animated.Text>
              </View>
              <View style={{ width: 24 }} />
            </View>

            {/* Completely centered mapping graphics view sheets */}
            <View style={styles.centeredMapViewportContainer}>
              <View style={styles.mapRoadwayLine} />
              <View style={[styles.mapRoadwayLine, { transform: [{ rotate: '115deg' }] }]} />
              <View style={styles.arrowheadVector} />
            </View>

            {/* STAGE 2_IDLE */}
            {currentStage === 'STAGE2_IDLE' && (
              <View style={styles.floatingBottomSheet}>
                <VeloSwipeTrack text="SLIDE RIGHT TO GO ON BREAK" trackColor="#1F1B13" thumbColor="#D4AF37" textColor="#D4AF37" onComplete={() => setCurrentStage('STAGE2_TAKEOVER')} />
                <TouchableOpacity style={styles.devTriggerButton} onPress={() => setCurrentStage('STAGE2_TAKEOVER')}>
                  <Text style={styles.devTriggerText}>[ Simulate Incoming Dispatch Allocation Trigger ]</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* STAGE 2 TAKEOVER */}
            {currentStage === 'STAGE2_TAKEOVER' && (
              <View style={styles.assignmentTakeoverModal}>
                <View style={styles.assignmentHeaderRow}>
                  <Text style={styles.pulsingWarningHeader}>TRIP REQUEST</Text>
                  <Text style={styles.tenantOriginatorLabel}>Elite Limos</Text>
                </View>

                <View style={styles.requestedTimeSolidBox}>
                  <Text style={styles.timeBoxLabel}>YOUR EXCLUSIVE NET SETTLEMENT PAYOUT</Text>
                  <Text style={[styles.timeBoxValueBold, { color: '#34C759' }]}>
                    {tenantPayrollType === 'PERCENTAGE_SPLIT' ? 'Net Payout: £80.00' : 'Fixed Wage Model Run'}
                  </Text>
                </View>

                <View style={styles.requestedTimeSolidBox}>
                  <Text style={styles.timeBoxLabel}>REQUESTED PICKUP TIME</Text>
                  <Text style={styles.timeBoxValueBold}>20:30 BST</Text>
                </View>

                <View style={styles.itineraryRouteCard}>
                  <View style={styles.routeNodeBlock}>
                    <View style={styles.routeRingNode} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.nodeLocation}>MANCHESTER PICCADILLY</Text>
                      <Text style={styles.nodeInlineMetrics}>En Route: 8 min (2.4 mi)</Text>
                    </View>
                  </View>
                  <View style={styles.routeDashedConnectorLine} />
                  <View style={styles.routeNodeBlock}>
                    <View style={[styles.routeRingNode, { borderColor: '#FF3B30' }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.nodeLocation}>MANCHESTER AIRPORT T2</Text>
                      <Text style={styles.nodeInlineMetrics}>In Transit: 28 min (11.4 mi)</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity style={styles.takeoverEmergencyCancelBtn} onPress={requestAdminCancellationPrivilege}>
                  <Text style={styles.emergencyCancelBtnText}>🛑   REQUEST EMERGENCY CANCELLATION</Text>
                </TouchableOpacity>

                <View style={{ height: 10 }} />

                <VeloSwipeTrack text="SLIDE RIGHT TO ACCEPT >>>" trackColor="#131F17" thumbColor="#34C759" textColor="#34C759" onComplete={() => { setCountdownSeconds(900); setCurrentStage('STAGE3'); setTripPhase(1); }} />
              </View>
            )}

            {/* STAGE 3: ACTIVE RIDE EXECUTION PANELS CONSOLES */}
            {currentStage === 'STAGE3' && (
              <View style={styles.activeRideExecutionSheet}>
                <View style={styles.passengerSplitRow}>
                  <View style={styles.monogramAssetBox}>
                    <Text style={styles.monogramText}>J</Text>
                  </View>
                  <View style={{ marginLeft: 14 }}>
                    <Text style={styles.passengerNameText}>MR. JOHN</Text>
                    <Text style={styles.passengerCorporateTag}>GOLDMAN SACHS</Text>
                  </View>
                </View>

                {/* --- ADDED FEATURE: EXCLUSIVE NET SETTLEMENT PAYOUT IN ACTIVE RIDE --- */}
                <View style={styles.requestedTimeSolidBox}>
                  <Text style={styles.timeBoxLabel}>YOUR EXCLUSIVE NET SETTLEMENT PAYOUT</Text>
                  <Text style={[styles.timeBoxValueBold, { color: '#34C759' }]}>
                    {tenantPayrollType === 'PERCENTAGE_SPLIT' ? 'Net Payout: £80.00' : 'Fixed Wage Model Run'}
                  </Text>
                </View>
                {/* ------------------------------------------------------------------- */}

                <View style={styles.infoContentBoxWrapper}>
                  <Text style={styles.infoBoxMicroHeader}>📍  PICKUP ADDRESS | NET ASSIGNED PAYOUT: £80.00</Text>
                  <Text style={styles.infoBoxValueText}>Manchester Piccadilly Station, Approach</Text>
                </View>

                <View style={styles.infoContentBoxWrapper}>
                  <Text style={styles.infoBoxMicroHeader}>🕒  PICKUP TIME REQUESTED</Text>
                  <Text style={styles.infoBoxValueTextBold}>20:30 BST</Text>
                </View>

                {tripPhase === 2 && (
                  <View style={[styles.infoContentBoxWrapper, { borderColor: countdownSeconds > 0 ? '#D4AF37' : '#FF3B30' }]}>
                    <Text style={[styles.infoBoxMicroHeader, { color: countdownSeconds > 0 ? '#D4AF37' : '#FF3B30' }]}>⏱️  PASSENGER GRACE period WINDOW</Text>
                    {countdownSeconds > 0 ? (
                      <Text style={styles.countdownValueDisplayText}>Grace Remaining: {formatTimerString(countdownSeconds)}</Text>
                    ) : (
                      <View style={{ marginTop: 4 }}>
                        <TouchableOpacity style={styles.independentCancelButton} onPress={() => {}}>
                          <Text style={styles.independentCancelButtonText}>🟥   EXECUTE NO-SHOW CANCELLATION</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}

                <View style={styles.privacyActionHubRowCentered}>
                  <TouchableOpacity style={styles.actionNodeButtonCentered}><Text style={styles.actionNodeIconText}>📞</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.actionNodeButtonCentered}><Text style={styles.actionNodeIconText}>💬</Text></TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.executionEmergencyCancelBtn} onPress={requestAdminCancellationPrivilege}>
                  <Text style={styles.emergencyCancelBtnText}>🛑   REQUEST EMERGENCY CANCELLATION (ADMIN VERIFIED)</Text>
                </TouchableOpacity>

                <View style={{ marginVertical: 10 }}>
                  {tripPhase === 1 && <VeloSwipeTrack text=">>>  I HAVE ARRIVED  >>>" trackColor="#131A24" thumbColor="#007AFF" textColor="#007AFF" onComplete={() => setTripPhase(2)} />}
                  {tripPhase === 2 && <VeloSwipeTrack text=">>>  START TRIP  >>>" trackColor="#131F17" thumbColor="#34C759" textColor="#34C759" onComplete={() => setTripPhase(3)} />}
                  {tripPhase === 3 && <VeloSwipeTrack text=">>>  END TRIP  >>>" trackColor="#1F1314" thumbColor="#FF3B30" textColor="#FF3B30" onComplete={() => { setTripPhase(1); setCurrentStage('STAGE2_IDLE'); }} />}
                </View>

                <TouchableOpacity style={styles.pagingCardShortcut} onPress={() => setCurrentStage('LANDSCAPE_PAGING')}>
                  <Text style={styles.pagingShortcutText}>☆   TAP TO LAUNCH DIGITAL PAGING BOARD</Text>
                </TouchableOpacity>
              </View>
            )}

          </View>
        )}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#070708' },
  mainWrapper: { flex: 1, backgroundColor: '#070708' },
  sliderContainer: { width: SLIDER_WIDTH, height: 54, borderRadius: 12, flexDirection: 'row', alignItems: 'center', padding: 4, position: 'relative', overflow: 'hidden' },
  sliderThumb: { width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: 8, justifyContent: 'center', alignItems: 'center', zIndex: 5 },
  thumbArrow: { color: '#070708', fontWeight: '900', fontSize: 16 },
  sliderLabelText: { position: 'absolute', left: 0, right: 0, textAlign: 'center', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, zIndex: 1 },
  fullTakeoverContainer: { flex: 1, backgroundColor: '#070708', padding: 20 },
  gatekeeperHeader: { flexDirection: 'row', alignItems: 'center', paddingBottom: 22, marginBottom: 22 },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#141416' },
  chauffeurName: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', letterSpacing: 1.5 },
  carMeta: { color: '#3C3C3E', fontSize: 11, marginTop: 4, fontWeight: '700', letterSpacing: 0.5, lineHeight: 14 },
  complianceRowCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111112', padding: 18, borderRadius: 12, marginBottom: 10 },
  complianceCardText: { color: '#EAEAEA', fontSize: 13, fontWeight: '700', marginLeft: 14, flex: 1 },
  checkboxToggle: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#3A3A3C', justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { borderColor: '#D4AF37' },
  checkIcon: { color: '#D4AF37', fontSize: 13, fontWeight: 'bold' },
  odometerInputWrapper: { backgroundColor: '#111112', padding: 16, borderRadius: 12, marginBottom: 10 },
  odometerLabel: { color: '#D4AF37', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  odometerTextInput: { backgroundColor: '#070708', height: 44, borderRadius: 8, borderColor: '#1C1C1E', borderWidth: 1, color: '#FFFFFF', paddingHorizontal: 14, fontSize: 14, fontWeight: '700' },
  cameraWindowTarget: { height: 60, borderRadius: 12, backgroundColor: '#111112', justifyContent: 'center', alignItems: 'center', marginTop: 5, marginBottom: 25 },
  cameraPlaceholderText: { color: '#D4AF37', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  cameraPayloadSuccessText: { color: '#D4AF37', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  workspaceCanvas: { flex: 1, position: 'relative' },
  topFloatingStatusBar: { position: 'absolute', top: 15, left: 15, right: 15, height: 52, backgroundColor: '#070708', borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, zIndex: 10, justifyContent: 'space-between' },
  burgerButton: { width: 30, justifyContent: 'center' },
  hamburgerLines: { color: '#FFFFFF', fontSize: 24 },
  liveIndicatorContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'center' },
  trackingPill: { color: '#34C759', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  
  // Centered Viewport layout parameters 
  centeredMapViewportContainer: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: '#0A0A0B', justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  mapRoadwayLine: { position: 'absolute', width: '150%', height: 1, backgroundColor: '#111113' },
  arrowheadVector: { width: 0, height: 0, borderLeftWidth: 8, borderRightWidth: 8, borderBottomWidth: 16, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#D4AF37', transform: [{ rotate: '35deg' }] },
  
  assignmentTakeoverModal: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '82%', backgroundColor: '#111112', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, zIndex: 20 },
  assignmentHeaderRow: { alignItems: 'flex-start', marginBottom: 14, paddingHorizontal: 4 },
  pulsingWarningHeader: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  tenantOriginatorLabel: { color: '#D4AF37', fontSize: 13, fontWeight: '800', marginTop: 2, letterSpacing: 0.5 },
  requestedTimeSolidBox: { backgroundColor: '#070708', borderRadius: 10, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#1F1F22' },
  timeBoxLabel: { color: '#4A4A4C', fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  timeBoxValueBold: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  itineraryRouteCard: { paddingHorizontal: 4, marginBottom: 15 },
  routeNodeBlock: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 4 },
  routeRingNode: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#FFFFFF', backgroundColor: 'transparent', marginTop: 4, marginRight: 16 },
  nodeLocation: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
  nodeInlineMetrics: { color: '#7E7F82', fontSize: 12, fontWeight: '700', marginTop: 3 },
  routeDashedConnectorLine: { width: 1, height: 22, backgroundColor: '#222225', marginLeft: 4, marginVertical: 2 },
  activeRideExecutionSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '82%', backgroundColor: '#111112', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, zIndex: 15 },
  infoContentBoxWrapper: { backgroundColor: '#070708', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#1C1C1E' },
  infoBoxMicroHeader: { color: '#4A4A4C', fontSize: 8, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  infoBoxValueText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', lineHeight: 18 },
  infoBoxValueTextBold: { color: '#D4AF37', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  infoBoxSubMetricText: { color: '#34C759', fontSize: 11, fontWeight: '700', marginTop: 2 },
  countdownValueDisplayText: { color: '#FF3B30', fontSize: 13, fontWeight: '900', marginTop: 2 },
  independentCancelButton: { backgroundColor: 'rgba(255,59,48,0.1)', height: 40, borderRadius: 6, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FF3B30', marginTop: 4 },
  independentCancelButtonText: { color: '#FF3B30', fontSize: 11, fontWeight: '900' },
  passengerSplitRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  monogramAssetBox: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#222225', justifyContent: 'center', alignItems: 'center' },
  monogramText: { color: '#D4AF37', fontWeight: '800', fontSize: 14 },
  passengerNameText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
  passengerCorporateTag: { color: '#3C3C3E', fontSize: 12, fontWeight: '700', marginTop: 2 },
  privacyActionHubRowCentered: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 10, width: '100%' },
  actionNodeButtonCentered: { width: 64, height: 48, backgroundColor: '#070708', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginHorizontal: 8, borderWidth: 1, borderColor: '#1C1C1E' },
  actionNodeIconText: { color: '#FFFFFF', fontSize: 18 },
  pagingCardShortcut: { marginTop: 6, paddingVertical: 8, alignItems: 'center' },
  pagingShortcutText: { color: '#3C3C3E', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  floatingBottomSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#111112', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, zIndex: 10 },
  devTriggerButton: { marginTop: 14, padding: 5, alignItems: 'center' },
  devTriggerText: { color: '#007AFF', fontSize: 10, fontWeight: '700' },
  landscapeContainer: { flex: 1, backgroundColor: '#070708', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  landscapePagingText: { color: '#FFFFFF', fontSize: 68, fontWeight: '900', letterSpacing: 6 },
  takeoverEmergencyCancelBtn: { backgroundColor: 'rgba(255,59,48,0.06)', height: 44, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,59,48,0.3)', justifyContent: 'center', alignItems: 'center' },
  executionEmergencyCancelBtn: { backgroundColor: 'rgba(255,59,48,0.06)', height: 44, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,59,48,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  emergencyCancelBtnText: { color: '#FF3B30', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  adminLockoutOverlaySurface: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(7,7,8,0.96)', zIndex: 999, justifyContent: 'center', alignItems: 'center', padding: 24 },
  lockoutCardContainer: { backgroundColor: '#111112', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#FF3B30', width: '100%', alignItems: 'center' },
  lockoutPulsingText: { color: '#FF3B30', fontSize: 13, fontWeight: '900', letterSpacing: 0.5, textAlign: 'center', marginBottom: 12 },
  lockoutSubText: { color: '#7E7F82', fontSize: 12, fontWeight: '600', textAlign: 'center', lineHeight: 18, marginBottom: 20 },
  cancelRequestBtn: { paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#070708', borderRadius: 8, borderWidth: 0.5, borderColor: '#222' },

  sidebarDrawer: { position: 'absolute', top: 0, bottom: 0, left: 0, width: '85%', backgroundColor: '#070708', borderRightWidth: 1.5, borderColor: '#1F1F22', zIndex: 100 },
  sidebarTopHeaderRow: { width: '100%', alignItems: 'flex-end', paddingHorizontal: 22, paddingTop: 22, marginBottom: 5 },
  sidebarCloseButton: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#111112', borderRadius: 8, borderWidth: 1, borderColor: '#222' },
  closeBtnText: { color: '#D4AF37', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  driverHeaderCardTrigger: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111112', padding: 18, borderRadius: 12, marginHorizontal: 22, marginVertical: 10 },
  avatarPlaceholderLarge: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1D1D1F', borderWidth: 1, borderColor: '#D4AF37' },
  sidebarDriverName: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', letterSpacing: 1.5 },
  sidebarDriverId: { color: '#7E7F82', fontSize: 12, marginTop: 4, fontWeight: '800' },
  editProfileNoticeText: { color: '#D4AF37', fontSize: 10, fontWeight: '700', marginTop: 4, letterSpacing: 0.5 },
  shiftSummaryWidgetCard: { backgroundColor: '#161619', padding: 14, borderRadius: 10, marginHorizontal: 22, marginBottom: 15, borderWidth: 1, borderColor: '#222' },
  widgetHeader: { color: '#4A4A4C', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  widgetValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', marginTop: 2 },
  sidebarMenuScroller: { flex: 1, paddingHorizontal: 22 },
  sidebarScrollerContentContainer: { paddingBottom: 120 },
  menuRowItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderColor: '#111112' },
  menuRowActive: { borderBottomColor: '#D4AF37' },
  menuRowLabelText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
  chevronIndicator: { color: '#D4AF37', fontSize: 14, fontWeight: 'bold' },
  drawerSubContentCard: { backgroundColor: '#111112', padding: 16, borderRadius: 12, marginTop: 6, marginBottom: 12, borderWidth: 1, borderColor: '#222' },
  subCardTitle: { color: '#D4AF37', fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 12 },
  inputLabelField: { color: '#4A4A4C', fontSize: 11, fontWeight: '800', marginTop: 10, letterSpacing: 0.5 },
  drawerInput: { backgroundColor: '#070708', borderRadius: 8, height: 44, borderColor: '#1C1C1E', borderWidth: 1, color: '#FFF', paddingHorizontal: 12, fontSize: 14, fontWeight: '700', marginTop: 6 },
  saveProfileButton: { backgroundColor: '#D4AF37', height: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  saveProfileBtnText: { color: '#070708', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  tripHistoryItemCard: { backgroundColor: '#070708', padding: 14, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: '#1A1A1C' },
  tripVehicleTag: { color: '#D4AF37', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  tripRouteString: { color: '#FFF', fontSize: 15, fontWeight: '800', marginTop: 6 },
  payrollCalculationBadge: { backgroundColor: '#141416', padding: 8, borderRadius: 6, marginTop: 6, borderWidth: 0.5, borderColor: '#222' },
  payrollCalculationText: { color: '#34C759', fontSize: 12, fontWeight: '800' },
  individualExpensePillRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#141416', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, marginTop: 6, borderWidth: 1, borderColor: '#1A1A1D' },
  individualExpenseText: { color: '#EAEAEA', fontSize: 13, fontWeight: '700' },
  microTimestampText: { color: '#4A4A4C', fontSize: 10, fontWeight: '600', marginTop: 2 },
  individualExpenseValue: { color: '#D4AF37', fontSize: 13, fontWeight: '900' },
  expenseNestedHeader: { color: '#4A4A4C', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginTop: 14, marginBottom: 6 },
  classificationPresetsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  classificationPresetsRowHorizontal: { flexDirection: 'row', width: '100%', marginBottom: 8 },
  presetExpensePill: { flex: 1, marginHorizontal: 2, backgroundColor: '#161619', height: 32, borderRadius: 6, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#2A2A2D' },
  presetExpensePillHalf: { flex: 1, marginRight: 8, backgroundColor: '#161619', height: 36, borderRadius: 6, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#2A2A2D' },
  presetText: { color: '#EAEAEA', fontSize: 12, fontWeight: '700' },
  customFieldInputBox: { backgroundColor: '#070708', height: 40, borderRadius: 6, borderWidth: 1, borderColor: '#1A1A1C', color: '#FFF', paddingHorizontal: 12, fontSize: 13, marginTop: 4, fontWeight: '600' },
  inlineAddBtn: { backgroundColor: '#D4AF37', width: 85, marginLeft: 8, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  inlineAddBtnText: { color: '#070708', fontSize: 11, fontWeight: '900' },
  ledgerTotalizerRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  ledgerTotalizerLabel: { color: '#7E7F82', fontSize: 13, fontWeight: '800' },
  ledgerTotalizerValue: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  shiftMetricsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, marginBottom: 4 },
  metricBlock: { width: '48%', backgroundColor: '#070708', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#1C1C1E' },
  metricLabelText: { color: '#4A4A4C', fontSize: 10, fontWeight: '800' },
  metricValueText: { color: '#FFF', fontSize: 15, fontWeight: '900', marginTop: 4 },
  itemizedHeader: { color: '#4A4A4C', fontSize: 11, fontWeight: '800', marginBottom: 8 },
  itemizedRow: { color: '#A5A5A7', fontSize: 13, fontWeight: '600', marginBottom: 6 },
  vehicleDataLine: { color: '#EAEAEA', fontSize: 14, fontWeight: '700', marginBottom: 6 },
  dividerLine: { height: 1, backgroundColor: '#1F1F22', marginVertical: 18 },
  sidebarSliderFixedFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#070708', paddingHorizontal: 20, paddingBottom: 25, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#111112' }
});
