import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Switch } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLOURS } from '../constants/theme';
import { VeloSwipeTrack } from './VeloSwipeTrack';
import { IconUpcoming, IconHistory, IconEarnings, IconOperators, IconSettings, IconExpenses } from './SidebarIcons';

type SidebarTab = 'NONE' | 'PROFILE' | 'EXPENSES' | 'UPCOMING' | 'HISTORY' | 'EARNINGS' | 'OPERATORS' | 'SETTINGS';

interface SidebarDrawerProps {
  driverProfile: { name: string; phone: string; address: string };
  setDriverProfile: (p: any) => void;
  tenantPayrollType: 'PERCENTAGE_SPLIT' | 'FIXED_WAGE';
  setTenantPayrollType: (t: 'PERCENTAGE_SPLIT' | 'FIXED_WAGE') => void;
  activeTab: SidebarTab;
  setActiveTab: (t: SidebarTab) => void;
  odometerValue: string;
  tripExpenses: { [key: string]: Array<{ name: string; amount: string; timestamp: string, receiptImageUrl?: string }> };
  globalExpenses: Array<{ id: string, name: string, amount: string, timestamp: string, receiptImageUrl?: string }>;
  onAddGlobalExpense: (name: string, amount: string, receiptImageUrl?: string) => void;
  customTripExpenseName: string;
  setCustomTripExpenseName: (v: string) => void;
  customTripExpenseAmount: string;
  setCustomTripExpenseAmount: (v: string) => void;
  onAddTripExpense: (tripId: string, name: string, amount?: string) => void;
  onClose: () => void;
  onGoOffline: () => void;
}

export function SidebarDrawer({
  driverProfile, setDriverProfile,
  tenantPayrollType, setTenantPayrollType,
  activeTab, setActiveTab,
  odometerValue,
  tripExpenses, globalExpenses, onAddGlobalExpense, customTripExpenseName, setCustomTripExpenseName,
  customTripExpenseAmount, setCustomTripExpenseAmount,
  onAddTripExpense, onClose, onGoOffline,
}: SidebarDrawerProps) {
  const { t, i18n } = useTranslation();

  // Upcoming Trips Timer State
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeTab === 'UPCOMING') {
      timer = setInterval(() => setNow(Date.now()), 1000);
    }
    return () => clearInterval(timer);
  }, [activeTab]);

  // Fake App Settings State
  const [autoAccept, setAutoAccept] = useState(false);
  const [voicePrompts, setVoicePrompts] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  // Data State
  const [trips, setTrips] = useState<any[]>([]);
  const [upcomingTrips, setUpcomingTrips] = useState<any[]>([]);

  useEffect(() => {
    // Fetch live queues from backend when opening the drawer
    const fetchTrips = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/driver/trips', {
           headers: { 'x-driver-id': 'current-driver-uuid', 'x-tenant-id': 'TENANT-01' }
        });
        if (response.ok) {
          const data = await response.json();
          setTrips(data.history || []);
          setUpcomingTrips(data.upcoming || []);
        }
      } catch (error) {
        console.error("Failed to load driver trips", error);
      }
    };
    if (activeTab === 'UPCOMING' || activeTab === 'HISTORY' || activeTab === 'EARNINGS') {
      fetchTrips();
    }
  }, [activeTab]);

  const formatCountdown = (targetTime: number) => {
    const diff = targetTime - now;
    if (diff <= 0) return 'IN 00:00:00';
    const hours = Math.floor(diff / 3600000);
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return `IN ${days} ${days === 1 ? 'DAY' : 'DAYS'}`;
    }
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `IN ${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isPercent = tenantPayrollType === 'PERCENTAGE_SPLIT';

  const [localProfile, setLocalProfile] = useState(driverProfile);
  const hasProfileChanges = localProfile.phone !== driverProfile.phone || localProfile.address !== driverProfile.address;

  useEffect(() => {
    if (activeTab === 'PROFILE') {
      setLocalProfile(driverProfile);
    }
  }, [activeTab, driverProfile]);

  // Expenses State
  const [expenseFilter, setExpenseFilter] = useState<'TODAY'|'WEEK'|'MONTH'|'YEAR'>('TODAY');
  const [globalExpenseType, setGlobalExpenseType] = useState('Fuel');
  const [globalExpenseCustom, setGlobalExpenseCustom] = useState('');
  const [globalExpenseAmount, setGlobalExpenseAmount] = useState('');
  const [globalExpensePhoto, setGlobalExpensePhoto] = useState(false); // Mock

  // --- Render Functions for Tabs ---

  const renderUpcoming = () => (
    <View style={styles.drawerSubContentCard}>
      {upcomingTrips.map(trip => (
        <View key={trip.id} style={styles.tripHistoryItemCard}>
          <Text style={styles.tripVehicleTag}>{trip.tenant}</Text>
          <Text style={styles.tripRouteString}>{trip.route}</Text>
          <View style={styles.countdownBadge}>
            <Text style={styles.countdownText}>{formatCountdown(trip.targetTime)}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderHistory = () => (
    <View style={styles.drawerSubContentCard}>
      {trips.map(trip => (
        <View key={trip.id} style={styles.tripHistoryItemCard}>
          <Text style={styles.tripVehicleTag}>{trip.car}</Text>
          <Text style={styles.tripRouteString}>{trip.route}</Text>
          <View style={styles.payrollCalculationBadge}>
            <Text style={styles.payrollCalculationText}>
              {isPercent ? `Net Earnings: ${trip.net}` : 'Salaried Contract Run'}
            </Text>
          </View>
          {(tripExpenses[trip.id] || []).map((exp, idx) => (
            <View key={idx} style={styles.individualExpensePillRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.individualExpenseText}>• {exp.name}</Text>
                <Text style={styles.microTimestampText}>{exp.timestamp}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.individualExpenseValue}>{exp.amount}</Text>
                {exp.receiptImageUrl && <Text style={{ fontSize: 10, color: COLOURS.blue, marginTop: 2 }}>{t('expenses.photo_added', '✓ Photo')}</Text>}
              </View>
            </View>
          ))}
          <Text style={styles.expenseNestedHeader}>[ ADD TRIP LOGGED EXPENSE ]</Text>
          <View style={styles.classificationPresetsRow}>
            {['Parking', 'Tolls', 'Airport'].map(p => (
              <TouchableOpacity key={p} style={styles.presetExpensePill} onPress={() => onAddTripExpense(trip.id, p, '5.00')}>
                <Text style={styles.presetText}>+ {p}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={styles.customFieldInputBox} placeholder="Custom expense name..." placeholderTextColor="#3A3A3C" value={customTripExpenseName} onChangeText={setCustomTripExpenseName} />
          <View style={{ flexDirection: 'row', marginTop: 6 }}>
            <TextInput style={[styles.customFieldInputBox, { flex: 1, marginTop: 0 }]} placeholder="Amount (£)" placeholderTextColor="#3A3A3C" keyboardType="numeric" value={customTripExpenseAmount} onChangeText={setCustomTripExpenseAmount} />
            <TouchableOpacity style={styles.inlineAddBtn} onPress={() => onAddTripExpense(trip.id, customTripExpenseName, customTripExpenseAmount)}>
              <Text style={styles.inlineAddBtnText}>COMMIT</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );

  const renderExpenses = () => {
    const expenseTypes = [t('expenses.type_fuel', 'Fuel'), t('expenses.type_charging', 'Charging'), t('expenses.type_parking', 'Parking'), t('expenses.type_toll', 'Toll'), t('expenses.type_wash', 'Car Wash'), t('expenses.type_cleaning', 'Cleaning'), t('expenses.type_maintenance', 'Maintenance'), t('expenses.type_repair', 'Repairs'), t('expenses.type_custom', 'Custom')];
    
    return (
      <View style={styles.drawerSubContentCard}>
        <Text style={styles.subCardTitle}>{t('expenses.add_expense', 'ADD EXPENSE')}</Text>
        
        {/* Type Selection */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
          {expenseTypes.map(type => (
            <TouchableOpacity key={type} onPress={() => setGlobalExpenseType(type)} style={[styles.presetExpensePill, { margin: 4, minWidth: '28%', backgroundColor: globalExpenseType === type ? 'rgba(212,175,55,0.1)' : '#161619', borderColor: globalExpenseType === type ? COLOURS.gold : '#2A2A2D' }]}>
              <Text style={{ color: globalExpenseType === type ? COLOURS.gold : '#EAEAEA', fontSize: 11, fontWeight: '700' }}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {globalExpenseType === t('expenses.type_custom', 'Custom') && (
          <TextInput style={styles.drawerInput} placeholder={t('expenses.custom_name_placeholder', 'Enter custom expense name...')} placeholderTextColor={COLOURS.textDim} value={globalExpenseCustom} onChangeText={setGlobalExpenseCustom} />
        )}
        
        <TextInput style={styles.drawerInput} placeholder={t('expenses.amount_placeholder', 'Amount (£)')} placeholderTextColor={COLOURS.textDim} keyboardType="numeric" value={globalExpenseAmount} onChangeText={setGlobalExpenseAmount} />

        {/* Mock Photo Button */}
        <TouchableOpacity style={[styles.saveProfileButton, { backgroundColor: globalExpensePhoto ? 'rgba(52, 199, 89, 0.1)' : '#1C1C1E', borderColor: globalExpensePhoto ? COLOURS.green : '#222', borderWidth: 1, marginTop: 12 }]} onPress={() => setGlobalExpensePhoto(true)}>
          <Text style={{ color: globalExpensePhoto ? COLOURS.green : COLOURS.textDim, fontSize: 12, fontWeight: '900' }}>
            {globalExpensePhoto ? t('expenses.photo_added', '✓ Photo Captured') : t('expenses.add_photo', '📷 Add Photo (Optional)')}
          </Text>
        </TouchableOpacity>

        {/* Submit */}
        <TouchableOpacity style={styles.saveProfileButton} onPress={() => {
          const name = globalExpenseType === t('expenses.type_custom', 'Custom') ? globalExpenseCustom : globalExpenseType;
          if (!name || !globalExpenseAmount) return;
          onAddGlobalExpense(name, globalExpenseAmount.startsWith('£') ? globalExpenseAmount : '£' + globalExpenseAmount, globalExpensePhoto ? 'mock_url' : undefined);
          setGlobalExpenseAmount('');
          setGlobalExpenseCustom('');
          setGlobalExpensePhoto(false);
        }}>
          <Text style={styles.saveProfileBtnText}>{t('expenses.submit', 'SUBMIT EXPENSE')}</Text>
        </TouchableOpacity>

        {/* Report Section */}
        <Text style={[styles.subCardTitle, { marginTop: 32 }]}>{t('expenses.expense_report', 'EXPENSE REPORT')}</Text>
        
        {/* Filters */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          {['TODAY', 'WEEK', 'MONTH', 'YEAR'].map(filter => (
            <TouchableOpacity key={filter} onPress={() => setExpenseFilter(filter as any)} style={{ paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 2, borderBottomColor: expenseFilter === filter ? COLOURS.gold : 'transparent' }}>
              <Text style={{ color: expenseFilter === filter ? COLOURS.gold : COLOURS.textDim, fontSize: 11, fontWeight: '800' }}>
                {t(`expenses.filter_${filter.toLowerCase()}`, filter)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* List */}
        {globalExpenses.length === 0 ? (
          <Text style={{ color: COLOURS.textMuted, fontSize: 12, textAlign: 'center', paddingVertical: 20 }}>{t('expenses.empty_state', 'No expenses logged for this period.')}</Text>
        ) : (
          globalExpenses.map(exp => (
            <View key={exp.id} style={styles.individualExpensePillRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.individualExpenseText}>• {exp.name}</Text>
                <Text style={styles.microTimestampText}>{exp.timestamp}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.individualExpenseValue}>{exp.amount}</Text>
                {exp.receiptImageUrl && <Text style={{ fontSize: 10, color: COLOURS.blue, marginTop: 2 }}>{t('expenses.photo_added', '✓ Photo')}</Text>}
              </View>
            </View>
          ))
        )}

        {/* Exports */}
        <View style={{ flexDirection: 'row', marginTop: 16 }}>
          <TouchableOpacity style={[styles.saveProfileButton, { flex: 1, backgroundColor: '#1A1A1C', marginTop: 0, marginRight: 6 }]} onPress={() => {}}>
            <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '800' }}>{t('expenses.export_csv', 'Export CSV')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.saveProfileButton, { flex: 1, backgroundColor: '#1A1A1C', marginTop: 0, marginLeft: 6 }]} onPress={() => {}}>
            <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '800' }}>{t('expenses.export_pdf', 'Export PDF')}</Text>
          </TouchableOpacity>
        </View>

      </View>
    );
  };

  const renderOperators = () => (
    <View style={styles.drawerSubContentCard}>
      <Text style={styles.subCardTitle}>MULTI-TENANT DISPATCH CHANNELS</Text>
      {['Elite Limos', 'Blacklane UK', 'Velo Private Aviation'].map((operator, index) => (
        <View key={index} style={styles.tripHistoryItemCard}>
          <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '800' }}>{operator}</Text>
          <Text style={{ color: COLOURS.green, fontSize: 11, fontWeight: '700', marginTop: 4 }}>• ACTIVE & RECEIVING DISPATCHES</Text>
        </View>
      ))}
    </View>
  );

  const renderEarnings = () => (
    <View style={styles.drawerSubContentCard}>
      <View style={styles.shiftMetricsGrid}>
        <View style={[styles.metricBlock, { borderColor: COLOURS.gold }]}>
          <Text style={styles.metricLabelText}>{isPercent ? 'SHIFT NET EARNINGS' : 'SALARIED REGISTER'}</Text>
          <Text style={styles.metricValueText}>{isPercent ? '£100.80' : 'Active Account'}</Text>
        </View>
        <View style={[styles.metricBlock, { borderColor: COLOURS.green }]}>
          <Text style={styles.metricLabelText}>TIPS RECEIVED</Text>
          <Text style={[styles.metricValueText, { color: COLOURS.green }]}>£15.00</Text>
        </View>
      </View>

      <Text style={[styles.subCardTitle, { marginTop: 16 }]}>ITEMISED SHIFT INCOME</Text>
      {trips.map(trip => (
        <View key={trip.id} style={styles.tripHistoryItemCard}>
          <Text style={styles.tripRouteString}>{trip.route}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
            <Text style={{ color: COLOURS.textMuted, fontSize: 12, fontWeight: '800' }}>Trip Net Income</Text>
            <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '900' }}>{isPercent ? trip.net : '--'}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
            <Text style={{ color: COLOURS.textMuted, fontSize: 12, fontWeight: '800' }}>Gratuity Tip</Text>
            <Text style={{ color: COLOURS.green, fontSize: 13, fontWeight: '900' }}>{trip.tip}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderSettings = () => (
    <View style={styles.drawerSubContentCard}>
      <Text style={styles.inputLabelField}>PERSONALISATION TOGGLES</Text>
      
      <View style={styles.settingToggleRow}>
        <Text style={styles.settingToggleLabel}>Auto-Accept Radar Dispatches</Text>
        <Switch value={autoAccept} onValueChange={setAutoAccept} trackColor={{ false: '#3A3A3C', true: COLOURS.gold }} />
      </View>
      <View style={styles.settingToggleRow}>
        <Text style={styles.settingToggleLabel}>Force Map Dark Mode</Text>
        <Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ false: '#3A3A3C', true: COLOURS.gold }} />
      </View>

      <Text style={[styles.inputLabelField, { marginTop: 24 }]}>APP LANGUAGE</Text>
      <Text style={{ color: COLOURS.textDim, fontSize: 10, fontWeight: '700', marginBottom: 10 }}>Change the interface language. Supports RTL layouts.</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {[
          { id: 'en', label: 'English' },
          { id: 'fr', label: 'Français' },
          { id: 'es', label: 'Español' },
          { id: 'ur', label: 'اردو' },
          { id: 'ar', label: 'العربية' },
          { id: 'so', label: 'Soomaali' },
          { id: 'bn', label: 'বাংলা' },
          { id: 'tr', label: 'Türkçe' },
          { id: 'ro', label: 'Română' },
          { id: 'pl', label: 'Polski' }
        ].map(lang => (
          <TouchableOpacity 
            key={lang.id}
            style={{ width: '48%', alignItems: 'center', padding: 10, borderWidth: 1, borderColor: i18n?.language === lang.id ? COLOURS.gold : '#2A2A2D', borderRadius: 8, margin: '1%', backgroundColor: i18n?.language === lang.id ? 'rgba(212,175,55,0.1)' : 'transparent' }}
            onPress={() => {
              if (i18n) i18n.changeLanguage(lang.id);
            }}
          >
            <Text style={{ color: i18n?.language === lang.id ? COLOURS.gold : '#8A8A8E', fontWeight: 'bold', fontSize: 12 }}>
              {lang.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.inputLabelField, { marginTop: 24 }]}>BACK OFFICE PAYROLL CONFIG OVERRIDE</Text>
      <View style={{ flexDirection: 'row', marginTop: 8 }}>
        <TouchableOpacity style={[styles.inlineAddBtn, { flex: 1, marginLeft: 0, backgroundColor: isPercent ? COLOURS.gold : '#1A1A1B' }]} onPress={() => setTenantPayrollType('PERCENTAGE_SPLIT')}>
          <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '900' }}>PERCENTAGE (80/20)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.inlineAddBtn, { flex: 1, backgroundColor: !isPercent ? COLOURS.gold : '#1A1A1B' }]} onPress={() => setTenantPayrollType('FIXED_WAGE')}>
          <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '900' }}>WAGE CONTRACT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMenuRows = () => {
    if (activeTab === 'PROFILE') return null;

    const TABS = [
      { id: 'EXPENSES', label: t('sidebar.expenses', 'Expenses'), icon: IconExpenses, content: renderExpenses() },
      { id: 'UPCOMING', label: t('sidebar.upcoming_bookings'), icon: IconUpcoming, content: renderUpcoming() },
      { id: 'HISTORY', label: t('sidebar.trip_history'), icon: IconHistory, content: renderHistory() },
      { id: 'OPERATORS', label: t('sidebar.operators', 'Operators'), icon: IconOperators, content: renderOperators() },
      { id: 'EARNINGS', label: t('sidebar.ledger_earnings'), icon: IconEarnings, content: renderEarnings() },
      { id: 'SETTINGS', label: t('sidebar.fleet_settings', 'App Settings'), icon: IconSettings, content: renderSettings() },
    ];

    return TABS.map(tab => {
      // Hide other tabs when one is active
      if (activeTab !== 'NONE' && activeTab !== tab.id) return null;
      
      return (
        <View key={tab.id}>
          <TouchableOpacity style={[styles.menuRowItem, activeTab === tab.id && styles.menuRowActive]} onPress={() => setActiveTab(activeTab === tab.id ? 'NONE' : tab.id as SidebarTab)}>
            <View style={styles.menuRowLabelWrapper}>
              <View style={styles.iconCircleWrapper}>
                <tab.icon color={COLOURS.gold} size={14} />
              </View>
              <Text style={styles.menuRowLabelText}>{tab.label}</Text>
            </View>
            <Text style={styles.chevronIndicator}>{activeTab === tab.id ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {activeTab === tab.id && tab.content}
        </View>
      );
    });
  };

  return (
    <View style={styles.sidebarDrawer}>
      <View style={styles.sidebarTopHeaderRow}>
        <TouchableOpacity style={styles.sidebarCloseButton} onPress={onClose}>
          <Text style={styles.closeBtnText}>{t('sidebar.close')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.sidebarMenuScroller} contentContainerStyle={{ paddingBottom: 20, paddingTop: 10 }} showsVerticalScrollIndicator={false}>

        {/* Top Header Cards - ONLY visible when nothing else is active! */}
        {activeTab === 'NONE' && (
          <>
            <TouchableOpacity activeOpacity={0.9} style={styles.driverHeaderCardTrigger} onPress={() => setActiveTab('PROFILE')}>
              <View style={styles.avatarPlaceholderLarge} />
              <View style={{ marginLeft: 16, flex: 1 }}>
                <Text style={styles.sidebarDriverName}>{driverProfile.name}</Text>
                <Text style={styles.sidebarDriverId}>{t('profile.chauffeur_id')}AV-4092</Text>
                <Text style={styles.editProfileNoticeText}>{t('sidebar.update_profile')}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.9} style={styles.shiftSummaryWidgetCard} onPress={() => setActiveTab('EARNINGS')}>
              <Text style={styles.widgetHeader}>SHIFT NET REVENUE JOURNAL</Text>
              <Text style={styles.widgetValue}>
                {isPercent ? 'Net Earnings: £100.80' : 'Fixed Salaried Assignment'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Profile editor */}
        {activeTab === 'PROFILE' && (
          <View style={styles.drawerSubContentCard}>
            <TouchableOpacity style={{ alignSelf: 'flex-start', marginBottom: 20 }} onPress={() => setActiveTab('NONE')}>
              <Text style={{ color: COLOURS.gold, fontSize: 13, fontWeight: '900', letterSpacing: 0.5 }}>{t('profile.back')}</Text>
            </TouchableOpacity>

            <Text style={styles.subCardTitle}>{t('profile.account_details')}</Text>
            
            <View style={styles.avatarUpdateSection}>
              <View style={[styles.avatarPlaceholderLarge, { width: 64, height: 64, borderRadius: 32 }]} />
              <TouchableOpacity style={styles.updatePhotoBtn}>
                <Text style={styles.updatePhotoBtnText}>{t('profile.update_photo')}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabelField}>{t('profile.name')}</Text>
            <TextInput style={[styles.drawerInput, { color: COLOURS.textDim, backgroundColor: '#141416' }]} value={driverProfile.name} editable={false} />
            
            <View style={styles.labelRow}>
              <Text style={styles.inputLabelFieldInline}>{t('profile.phone')}</Text>
              <TouchableOpacity><Text style={styles.inlineUpdateLink}>[ UPDATE ]</Text></TouchableOpacity>
            </View>
            <TextInput style={styles.drawerInput} value={localProfile.phone} onChangeText={v => setLocalProfile({ ...localProfile, phone: v })} keyboardType="phone-pad" />
            
            <View style={styles.labelRow}>
              <Text style={styles.inputLabelFieldInline}>{t('profile.address')}</Text>
              <TouchableOpacity><Text style={styles.inlineUpdateLink}>[ UPDATE ]</Text></TouchableOpacity>
            </View>
            <TextInput style={styles.drawerInput} value={localProfile.address} onChangeText={v => setLocalProfile({ ...localProfile, address: v })} multiline />
            
            {hasProfileChanges && (
              <TouchableOpacity style={styles.saveProfileButton} onPress={() => { setDriverProfile(localProfile); setActiveTab('NONE'); }}>
                <Text style={styles.saveProfileBtnText}>{t('profile.save')}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {renderMenuRows()}

      </ScrollView>

      {/* Go Offline footer */}
      <View style={styles.sidebarSliderFixedFooter}>
        <VeloSwipeTrack text="SLIDE TO GO OFFLINE" trackColor="#1F1314" thumbColor={COLOURS.red} textColor={COLOURS.red} onComplete={onGoOffline} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebarDrawer:              { position: 'absolute', top: 0, bottom: 0, left: 0, width: '85%', backgroundColor: COLOURS.bg, borderRightWidth: 1.5, borderColor: COLOURS.gold, zIndex: 100 },
  sidebarTopHeaderRow:        { width: '100%', alignItems: 'flex-end', paddingHorizontal: 22, paddingTop: 50, marginBottom: 5 },
  sidebarCloseButton:         { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: COLOURS.surface, borderRadius: 8, borderWidth: 1, borderColor: '#222' },
  closeBtnText:               { color: COLOURS.gold, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  driverHeaderCardTrigger:    { flexDirection: 'row', alignItems: 'center', backgroundColor: COLOURS.surface, padding: 18, borderRadius: 12, marginVertical: 10, borderWidth: 1, borderColor: COLOURS.gold },
  avatarPlaceholderLarge:     { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1D1D1F', borderWidth: 1, borderColor: COLOURS.gold },
  sidebarDriverName:          { color: COLOURS.textPrimary, fontSize: 18, fontWeight: '900', letterSpacing: 1.5 },
  sidebarDriverId:            { color: COLOURS.textMuted, fontSize: 12, marginTop: 4, fontWeight: '800' },
  editProfileNoticeText:      { color: COLOURS.gold, fontSize: 10, fontWeight: '700', marginTop: 4, letterSpacing: 0.5 },
  shiftSummaryWidgetCard:     { backgroundColor: COLOURS.surface2, padding: 14, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: COLOURS.gold },
  widgetHeader:               { color: COLOURS.textDim, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  widgetValue:                { color: COLOURS.textPrimary, fontSize: 14, fontWeight: '800', marginTop: 2 },
  sidebarMenuScroller:        { flex: 1, paddingHorizontal: 22 },
  
  menuRowItem:                { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderWidth: 1, borderColor: COLOURS.gold, borderRadius: 12, marginBottom: 10, backgroundColor: COLOURS.surface },
  menuRowActive:              { backgroundColor: '#1A1A1D' },
  menuRowLabelWrapper:        { flexDirection: 'row', alignItems: 'center' },
  iconCircleWrapper:          { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: COLOURS.gold, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  menuRowLabelText:           { color: COLOURS.gold, fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
  chevronIndicator:           { color: COLOURS.gold, fontSize: 14, fontWeight: 'bold' },
  
  drawerSubContentCard:       { backgroundColor: COLOURS.surface, padding: 16, borderRadius: 12, marginTop: 6, marginBottom: 12, borderWidth: 1, borderColor: '#222' },
  subCardTitle:               { color: COLOURS.gold, fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 12 },
  
  avatarUpdateSection:        { alignItems: 'center', marginVertical: 10 },
  updatePhotoBtn:             { marginTop: 10 },
  updatePhotoBtnText:         { color: COLOURS.gold, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  
  labelRow:                   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  inputLabelField:            { color: COLOURS.textDim, fontSize: 11, fontWeight: '800', marginTop: 12, letterSpacing: 0.5 },
  inputLabelFieldInline:      { color: COLOURS.textDim, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  inlineUpdateLink:           { color: COLOURS.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  drawerInput:                { backgroundColor: COLOURS.bg, borderRadius: 8, height: 44, borderColor: '#1C1C1E', borderWidth: 1, color: '#FFF', paddingHorizontal: 12, fontSize: 14, fontWeight: '700', marginTop: 6 },
  saveProfileButton:          { backgroundColor: COLOURS.gold, height: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  saveProfileBtnText:         { color: COLOURS.bg, fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  
  tripHistoryItemCard:        { backgroundColor: COLOURS.bg, padding: 14, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: '#1A1A1C' },
  tripVehicleTag:             { color: COLOURS.gold, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  tripRouteString:            { color: '#FFF', fontSize: 15, fontWeight: '800', marginTop: 6 },
  payrollCalculationBadge:    { backgroundColor: '#141416', padding: 8, borderRadius: 6, marginTop: 6, borderWidth: 0.5, borderColor: '#222' },
  payrollCalculationText:     { color: COLOURS.green, fontSize: 12, fontWeight: '800' },
  
  countdownBadge:             { backgroundColor: 'rgba(212,175,55,0.1)', padding: 10, borderRadius: 6, marginTop: 10, borderWidth: 1, borderColor: COLOURS.gold },
  countdownText:              { color: COLOURS.gold, fontSize: 14, fontWeight: '900', textAlign: 'center', letterSpacing: 1 },
  
  individualExpensePillRow:   { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#141416', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, marginTop: 6, borderWidth: 1, borderColor: '#1A1A1D' },
  individualExpenseText:      { color: '#EAEAEA', fontSize: 13, fontWeight: '700' },
  microTimestampText:         { color: COLOURS.textDim, fontSize: 10, fontWeight: '600', marginTop: 2 },
  individualExpenseValue:     { color: COLOURS.gold, fontSize: 13, fontWeight: '900' },
  expenseNestedHeader:        { color: COLOURS.textDim, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginTop: 14, marginBottom: 6 },
  classificationPresetsRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  presetExpensePill:          { flex: 1, marginHorizontal: 2, backgroundColor: '#161619', height: 32, borderRadius: 6, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#2A2A2D' },
  presetText:                 { color: '#EAEAEA', fontSize: 12, fontWeight: '700' },
  customFieldInputBox:        { backgroundColor: COLOURS.bg, height: 40, borderRadius: 6, borderWidth: 1, borderColor: '#1A1A1C', color: '#FFF', paddingHorizontal: 12, fontSize: 13, marginTop: 4, fontWeight: '600' },
  inlineAddBtn:               { backgroundColor: COLOURS.gold, width: 85, marginLeft: 8, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  inlineAddBtnText:           { color: COLOURS.bg, fontSize: 11, fontWeight: '900' },
  
  shiftMetricsGrid:           { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, marginBottom: 4 },
  metricBlock:                { width: '48%', backgroundColor: COLOURS.bg, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#1C1C1E' },
  metricLabelText:            { color: COLOURS.textDim, fontSize: 10, fontWeight: '800' },
  metricValueText:            { color: '#FFF', fontSize: 15, fontWeight: '900', marginTop: 4 },
  
  settingToggleRow:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#1A1A1C' },
  settingToggleLabel:         { color: '#FFF', fontSize: 14, fontWeight: '700' },
  
  sidebarSliderFixedFooter:   { backgroundColor: COLOURS.bg, paddingHorizontal: 20, paddingBottom: 25, paddingTop: 15, borderTopWidth: 1, borderTopColor: COLOURS.surface },
});
