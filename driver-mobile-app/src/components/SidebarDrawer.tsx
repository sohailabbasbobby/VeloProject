import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Switch, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLOURS } from '../constants/theme';
import { VeloSwipeTrack } from './VeloSwipeTrack';
import { IconUpcoming, IconHistory, IconEarnings, IconOperators, IconSettings, IconExpenses } from './SidebarIcons';
import * as Api from '../api/client';

type SidebarTab = 'NONE' | 'PROFILE' | 'EXPENSES' | 'UPCOMING' | 'HISTORY' | 'EARNINGS' | 'OPERATORS' | 'ROSTER' | 'ISSUES' | 'SETTINGS';

interface SidebarDrawerProps {
  driverProfile: { name: string; phone: string; address: string };
  setDriverProfile: (p: any) => void;
  tenantPayrollType: 'PERCENTAGE_SPLIT' | 'FIXED_WAGE';
  setTenantPayrollType: (t: 'PERCENTAGE_SPLIT' | 'FIXED_WAGE') => void;
  activeTab: SidebarTab;
  setActiveTab: (t: SidebarTab) => void;
  odometerValue: string;
  onClose: () => void;
  onGoOffline: () => void;
}

const fmtGbp = (n: any) => `£${Number(n || 0).toFixed(2)}`;

export function SidebarDrawer({
  driverProfile, setDriverProfile,
  tenantPayrollType, setTenantPayrollType,
  activeTab, setActiveTab,
  odometerValue,
  onClose, onGoOffline,
}: SidebarDrawerProps) {
  const { t, i18n } = useTranslation();

  // Upcoming-trip countdown ticker
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (activeTab === 'UPCOMING') {
      timer = setInterval(() => setNow(Date.now()), 1000);
    }
    return () => clearInterval(timer);
  }, [activeTab]);

  // Device-local personalisation toggles (clearly local-only; not presented as server state)
  const [autoAccept, setAutoAccept] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  // Live data
  const [queues, setQueues] = useState<{ upcoming: any[]; history: any[] }>({ upcoming: [], history: [] });
  const [queuesError, setQueuesError] = useState<string | null>(null);
  const [ledger, setLedger] = useState<any>(null);
  const [ledgerError, setLedgerError] = useState<string | null>(null);
  const [operators, setOperators] = useState<any[]>([]);
  const [operatorsError, setOperatorsError] = useState<string | null>(null);
  const [roster, setRoster] = useState<any[]>([]);
  const [rosterError, setRosterError] = useState<string | null>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const [issuesError, setIssuesError] = useState<string | null>(null);

  const loadQueues = useCallback(() => {
    Api.fetchDriverQueues()
      .then((d: any) => { setQueues({ upcoming: d?.upcoming || [], history: d?.history || [] }); setQueuesError(null); })
      .catch((e: any) => setQueuesError(e?.message || 'Failed to load trips.'));
  }, []);
  const loadLedger = useCallback(() => {
    Api.fetchMyLedger()
      .then((d: any) => { setLedger(d); setLedgerError(null); })
      .catch((e: any) => setLedgerError(e?.message || 'Failed to load ledger.'));
  }, []);
  const loadOperators = useCallback(() => {
    Api.fetchMyOperators()
      .then((d: any) => { setOperators(d || []); setOperatorsError(null); })
      .catch((e: any) => setOperatorsError(e?.message || 'Failed to load operators.'));
  }, []);
  const loadRoster = useCallback(() => {
    Api.fetchMyRoster()
      .then((d: any) => { setRoster(d || []); setRosterError(null); })
      .catch((e: any) => setRosterError(e?.message || 'Failed to load roster.'));
  }, []);
  const loadIssues = useCallback(() => {
    Api.fetchVehicleIssues()
      .then((d: any) => { setIssues(d || []); setIssuesError(null); })
      .catch((e: any) => setIssuesError(e?.message || 'Failed to load fault log.'));
  }, []);

  useEffect(() => {
    if (['UPCOMING', 'HISTORY', 'EARNINGS'].includes(activeTab)) loadQueues();
    if (activeTab === 'EARNINGS') loadLedger();
    if (activeTab === 'OPERATORS') loadOperators();
    if (activeTab === 'ROSTER') loadRoster();
    if (activeTab === 'ISSUES') loadIssues();
  }, [activeTab, loadQueues, loadLedger, loadOperators, loadRoster, loadIssues]);

  // Expenses State
  const [expenseFilter, setExpenseFilter] = useState<'TODAY'|'WEEK'|'MONTH'|'YEAR'>('TODAY');

  const formatCountdown = (targetTime: number) => {
    const diff = targetTime - now;
    if (diff <= 0) return 'NOW';
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
  const hasProfileChanges = localProfile.phone !== driverProfile.phone;

  useEffect(() => {
    if (activeTab === 'PROFILE') {
      setLocalProfile(driverProfile);
    }
  }, [activeTab, driverProfile]);

  const saveProfile = async () => {
    try {
      if (!(driverProfile as any).id) {
        Alert.alert('Profile', 'Profile record not loaded yet — cannot save.');
        return;
      }
      await Api.updateDriver((driverProfile as any).id, { phone: localProfile.phone });
      setDriverProfile({ ...driverProfile, phone: localProfile.phone });
      setActiveTab('NONE');
    } catch (e: any) {
      Alert.alert('Save failed', e?.message || 'Unable to update profile.');
    }
  };

  const selectLanguage = (langId: string) => {
    if (i18n) i18n.changeLanguage(langId);
    // Best-effort persistence of the preference on the driver record (no local-only fake state).
    if ((driverProfile as any).id) {
      Api.updateDriver((driverProfile as any).id, { preferredLanguage: langId }).catch(() => undefined);
    }
  };

  // --- Render Functions for Tabs ---

  const renderUpcoming = () => (
    <View style={styles.drawerSubContentCard}>
      {queuesError ? <Text style={styles.tabErrorText}>{queuesError}</Text> : null}
      {queues.upcoming.map((trip: any) => (
        <View key={trip.id} style={styles.tripHistoryItemCard}>
          <Text style={styles.tripVehicleTag}>{trip.tenant}</Text>
          <Text style={styles.tripRouteString}>{trip.route}</Text>
          <View style={styles.countdownBadge}>
            <Text style={styles.countdownText}>{trip.targetTime ? formatCountdown(trip.targetTime) : 'ASAP'}</Text>
          </View>
        </View>
      ))}
      {queues.upcoming.length === 0 && !queuesError ? (
        <Text style={styles.emptyTabText}>No upcoming assignments — new dispatches appear here live.</Text>
      ) : null}
    </View>
  );

  const renderHistory = () => (
    <View style={styles.drawerSubContentCard}>
      {queuesError ? <Text style={styles.tabErrorText}>{queuesError}</Text> : null}
      {queues.history.map((trip: any) => (
        <View key={trip.id} style={styles.tripHistoryItemCard}>
          <Text style={styles.tripVehicleTag}>{trip.car}</Text>
          <Text style={styles.tripRouteString}>{trip.route}</Text>
          <View style={styles.payrollCalculationBadge}>
            <Text style={styles.payrollCalculationText}>
              {isPercent ? `Net Earnings: ${trip.net}` : 'Salaried Contract Run'}
            </Text>
          </View>
        </View>
      ))}
      {queues.history.length === 0 && !queuesError ? (
        <Text style={styles.emptyTabText}>No completed trips yet.</Text>
      ) : null}
    </View>
  );

  const renderExpenses = () => (
    <View style={styles.drawerSubContentCard}>
      <Text style={styles.subCardTitle}>{t('expenses.expense_report', 'EXPENSE REPORT')}</Text>
      {ledgerError ? <Text style={styles.tabErrorText}>{ledgerError}</Text> : null}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
        {(['TODAY', 'WEEK', 'MONTH', 'YEAR'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setExpenseFilter(f)}
            style={{ paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 2, borderBottomColor: expenseFilter === f ? COLOURS.gold : 'transparent' }}
          >
            <Text style={{ color: expenseFilter === f ? COLOURS.gold : COLOURS.textDim, fontSize: 11, fontWeight: '800' }}>
              {t(`expenses.filter_${f.toLowerCase()}`, f)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {(ledger?.entries || [])
        .filter((e: any) => e.entry_type.startsWith('EXPENSE_'))
        .slice(0, 30)
        .map((e: any) => (
          <View key={e.id} style={styles.individualExpensePillRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.individualExpenseText}>• {e.description || e.entry_type.replace(/_/g, ' ')}</Text>
              <Text style={styles.microTimestampText}>{new Date(e.created_at).toLocaleString()}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.individualExpenseValue}>{fmtGbp(e.amount)}</Text>
            </View>
          </View>
        ))}
      {ledger && (ledger.entries || []).filter((e: any) => e.entry_type.startsWith('EXPENSE_')).length === 0 && !ledgerError ? (
        <Text style={styles.emptyTabText}>No expenses logged yet — add one from a completed trip.</Text>
      ) : null}
      {ledger?.summary ? (
        <View style={[styles.payrollCalculationBadge, { marginTop: 12 }]}>
          <Text style={styles.payrollCalculationText}>TOTAL: {fmtGbp(ledger.summary.expensesMtd)}</Text>
        </View>
      ) : null}
    </View>
  );

  const renderEarnings = () => {
    const s = ledger?.summary;
    return (
      <View style={styles.drawerSubContentCard}>
        {ledgerError ? <Text style={styles.tabErrorText}>{ledgerError}</Text> : null}
        <View style={styles.shiftMetricsGrid}>
          <View style={[styles.metricBlock, { borderColor: COLOURS.gold }]}>
            <Text style={styles.metricLabelText}>{isPercent ? 'NET (MTD)' : 'SALARIED REGISTER'}</Text>
            <Text style={styles.metricValueText}>{s ? fmtGbp(s.shiftNet) : '—'}</Text>
          </View>
          <View style={[styles.metricBlock, { borderColor: COLOURS.green }]}>
            <Text style={styles.metricLabelText}>TIPS (MTD)</Text>
            <Text style={[styles.metricValueText, { color: COLOURS.green }]}>{s ? fmtGbp(s.tipsMtd) : '—'}</Text>
          </View>
        </View>
        <View style={styles.shiftMetricsGrid}>
          <View style={styles.metricBlock}>
            <Text style={styles.metricLabelText}>EXPENSES (MTD)</Text>
            <Text style={styles.metricValueText}>{s ? fmtGbp(s.expensesMtd) : '—'}</Text>
          </View>
          <View style={styles.metricBlock}>
            <Text style={styles.metricLabelText}>OUTSTANDING</Text>
            <Text style={styles.metricValueText}>{s ? fmtGbp(s.outstanding) : '—'}</Text>
          </View>
        </View>

        <Text style={[styles.subCardTitle, { marginTop: 16 }]}>ITEMISED LEDGER ENTRIES</Text>
        {(ledger?.entries || []).slice(0, 20).map((e: any) => (
          <View key={e.id} style={styles.tripHistoryItemCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '800', flex: 1 }}>{e.description || e.entry_type}</Text>
              <Text style={{ color: e.direction === 'CREDIT' ? COLOURS.green : '#FF6B60', fontSize: 13, fontWeight: '900' }}>
                {e.direction === 'CREDIT' ? '+' : '−'}{fmtGbp(e.amount)}
              </Text>
            </View>
            <Text style={{ color: COLOURS.textDim, fontSize: 10, fontWeight: '600', marginTop: 4 }}>
              {String(e.entry_type).replace(/_/g, ' ')} · {new Date(e.created_at).toLocaleString()}
            </Text>
          </View>
        ))}
        {ledger && (ledger.entries || []).length === 0 && !ledgerError ? (
          <Text style={styles.emptyTabText}>No ledger entries yet.</Text>
        ) : null}
      </View>
    );
  };

  const renderOperators = () => (
    <View style={styles.drawerSubContentCard}>
      <Text style={styles.subCardTitle}>MULTI-TENANT DISPATCH CHANNELS</Text>
      {operatorsError ? <Text style={styles.tabErrorText}>{operatorsError}</Text> : null}
      {operators.map((op: any) => (
        <View key={op.id} style={styles.tripHistoryItemCard}>
          <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '800' }}>{op.name}</Text>
          <Text style={{ color: op.membership_status === 'ACTIVE' ? COLOURS.green : COLOURS.textMuted, fontSize: 11, fontWeight: '700', marginTop: 4 }}>
            • {String(op.membership_status || 'MEMBER').toUpperCase()}
            {op.membership_status === 'ACTIVE' ? ' & RECEIVING DISPATCHES' : ''}
          </Text>
        </View>
      ))}
      {operators.length === 0 && !operatorsError ? (
        <Text style={styles.emptyTabText}>No operator memberships on file.</Text>
      ) : null}
    </View>
  );

  const renderRoster = () => (
    <View style={styles.drawerSubContentCard}>
      <Text style={styles.subCardTitle}>MY SHIFTS</Text>
      {rosterError ? <Text style={styles.tabErrorText}>{rosterError}</Text> : null}
      {roster.map((s: any) => (
        <View key={s.id} style={styles.tripHistoryItemCard}>
          <Text style={{ color: COLOURS.gold, fontSize: 12, fontWeight: '800' }}>
            {new Date(s.start_time).toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase()}
          </Text>
          <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800', marginTop: 4 }}>
            {new Date(s.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(s.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <Text style={{ color: COLOURS.textDim, fontSize: 11, fontWeight: '700', marginTop: 4 }}>
            {String(s.shift_type || 'SHIFT').replace(/_/g, ' ')}{s.plate_number ? ` · Vehicle ${s.plate_number}` : ''}
          </Text>
        </View>
      ))}
      {roster.length === 0 && !rosterError ? (
        <Text style={styles.emptyTabText}>No shifts scheduled — your rota is empty.</Text>
      ) : null}
    </View>
  );

  const renderIssues = () => (
    <View style={styles.drawerSubContentCard}>
      <Text style={styles.subCardTitle}>VEHICLE FAULT LOG</Text>
      {issuesError ? <Text style={styles.tabErrorText}>{issuesError}</Text> : null}
      {issues.map((i: any) => (
        <View key={i.id} style={styles.tripHistoryItemCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '800', flex: 1 }}>{i.description}</Text>
            <Text style={{ color: i.severity === 'CRITICAL' ? COLOURS.red : i.severity === 'MAJOR' ? COLOURS.gold : COLOURS.textDim, fontSize: 11, fontWeight: '900' }}>
              {i.severity}
            </Text>
          </View>
          <Text style={{ color: COLOURS.textDim, fontSize: 10, fontWeight: '600', marginTop: 4 }}>
            {i.vehicle_code ? `${i.vehicle_code} · ` : ''}{i.status} · {new Date(i.reported_at).toLocaleDateString()}
          </Text>
        </View>
      ))}
      {issues.length === 0 && !issuesError ? (
        <Text style={styles.emptyTabText}>No defects on your vehicle — clean fault log.</Text>
      ) : null}
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
            onPress={() => selectLanguage(lang.id)}
          >
            <Text style={{ color: i18n?.language === lang.id ? COLOURS.gold : '#8A8A8E', fontWeight: 'bold', fontSize: 12 }}>
              {lang.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.inputLabelField, { marginTop: 24 }]}>PAY MODEL (SET BY BACK OFFICE)</Text>
      <View style={{ flexDirection: 'row', marginTop: 8 }}>
        <View style={[styles.payModelPill, { backgroundColor: isPercent ? COLOURS.gold : '#1A1A1B' }]}>
          <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '900' }}>PERCENTAGE (80/20)</Text>
        </View>
        <View style={[styles.payModelPill, { backgroundColor: !isPercent ? COLOURS.gold : '#1A1A1B' }]}>
          <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '900' }}>WAGE CONTRACT</Text>
        </View>
      </View>
    </View>
  );

  const renderMenuRows = () => {
    if (activeTab === 'PROFILE') return null;

    const TABS: Array<{ id: SidebarTab; label: string; icon: React.ComponentType<{ color: string; size: number }>; content: React.ReactNode }> = [
      { id: 'EXPENSES', label: t('sidebar.expenses', 'Expenses'), icon: IconExpenses, content: renderExpenses() },
      { id: 'UPCOMING', label: t('sidebar.upcoming_bookings'), icon: IconUpcoming, content: renderUpcoming() },
      { id: 'HISTORY', label: t('sidebar.trip_history'), icon: IconHistory, content: renderHistory() },
      { id: 'OPERATORS', label: t('sidebar.operators', 'Operators'), icon: IconOperators, content: renderOperators() },
      { id: 'ROSTER', label: 'My Roster', icon: IconUpcoming, content: renderRoster() },
      { id: 'ISSUES', label: 'Vehicle Faults', icon: IconHistory, content: renderIssues() },
      { id: 'EARNINGS', label: t('sidebar.ledger_earnings'), icon: IconEarnings, content: renderEarnings() },
      { id: 'SETTINGS', label: t('sidebar.fleet_settings', 'App Settings'), icon: IconSettings, content: renderSettings() },
    ];

    return TABS.map(tab => {
      if (activeTab !== 'NONE' && activeTab !== tab.id) return null;

      return (
        <View key={tab.id}>
          <TouchableOpacity
            style={[styles.menuRowItem, activeTab === tab.id && styles.menuRowActive]}
            onPress={() => setActiveTab(activeTab === tab.id ? 'NONE' : tab.id)}
          >
            <View style={styles.menuRowLabelWrapper}>
              <View style={styles.iconCircleWrapper}>
                <tab.icon color={COLOURS.gold} size={14} />
              </View>
              <Text style={styles.menuRowLabelText}>{tab.label}</Text>
            </View>
            <Text style={styles.chevronIndicator}>{activeTab === tab.id ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {activeTab === tab.id ? tab.content : null}
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

        {activeTab === 'NONE' ? (
          <>
            <TouchableOpacity activeOpacity={0.9} style={styles.driverHeaderCardTrigger} onPress={() => setActiveTab('PROFILE')}>
              <View style={styles.avatarPlaceholderLarge} />
              <View style={{ marginLeft: 16, flex: 1 }}>
                <Text style={styles.sidebarDriverName}>{driverProfile.name}</Text>
                <Text style={styles.sidebarDriverId}>{t('profile.chauffeur_id')}{(driverProfile as any).referenceCode || '—'}</Text>
                <Text style={styles.editProfileNoticeText}>{t('sidebar.update_profile')}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.9} style={styles.shiftSummaryWidgetCard} onPress={() => setActiveTab('EARNINGS')}>
              <Text style={styles.widgetHeader}>SHIFT NET REVENUE JOURNAL</Text>
              <Text style={styles.widgetValue}>
                {ledger?.summary
                  ? `${isPercent ? 'Net (MTD)' : 'Register'}: ${fmtGbp(ledger.summary.shiftNet)}`
                  : 'Tap to load your live ledger'}
              </Text>
            </TouchableOpacity>
          </>
        ) : null}

        {/* Profile editor — saves phone via live PUT /api/onboarding/drivers/:id */}
        {activeTab === 'PROFILE' ? (
          <View style={styles.drawerSubContentCard}>
            <TouchableOpacity style={{ alignSelf: 'flex-start', marginBottom: 20 }} onPress={() => setActiveTab('NONE')}>
              <Text style={{ color: COLOURS.gold, fontSize: 13, fontWeight: '900', letterSpacing: 0.5 }}>{t('profile.back')}</Text>
            </TouchableOpacity>

            <Text style={styles.subCardTitle}>{t('profile.account_details')}</Text>

            <View style={styles.avatarUpdateSection}>
              <View style={[styles.avatarPlaceholderLarge, { width: 64, height: 64, borderRadius: 32 }]} />
            </View>

            <Text style={styles.inputLabelField}>{t('profile.name')}</Text>
            <TextInput style={[styles.drawerInput, { color: COLOURS.textDim, backgroundColor: '#141416' }]} value={driverProfile.name} editable={false} />

            <View style={styles.labelRow}>
              <Text style={styles.inputLabelFieldInline}>{t('profile.phone')}</Text>
            </View>
            <TextInput style={styles.drawerInput} value={localProfile.phone} onChangeText={v => setLocalProfile({ ...localProfile, phone: v })} keyboardType="phone-pad" />

            {hasProfileChanges ? (
              <TouchableOpacity style={styles.saveProfileButton} onPress={saveProfile}>
                <Text style={styles.saveProfileBtnText}>{t('profile.save')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

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

  labelRow:                   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  inputLabelField:            { color: COLOURS.textDim, fontSize: 11, fontWeight: '800', marginTop: 12, letterSpacing: 0.5 },
  inputLabelFieldInline:      { color: COLOURS.textDim, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
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

  shiftMetricsGrid:           { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, marginBottom: 4 },
  metricBlock:                { width: '48%', backgroundColor: COLOURS.bg, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#1C1C1E' },
  metricLabelText:            { color: COLOURS.textDim, fontSize: 10, fontWeight: '800' },
  metricValueText:            { color: '#FFF', fontSize: 15, fontWeight: '900', marginTop: 4 },

  settingToggleRow:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#1A1A1C' },
  settingToggleLabel:         { color: '#FFF', fontSize: 14, fontWeight: '700' },

  tabErrorText:               { color: '#FF6B60', fontSize: 11, fontWeight: '700', marginBottom: 8 },
  emptyTabText:               { color: COLOURS.textMuted, fontSize: 12, textAlign: 'center', paddingVertical: 20 },

  sidebarSliderFixedFooter:   { backgroundColor: COLOURS.bg, paddingHorizontal: 20, paddingBottom: 25, paddingTop: 15, borderTopWidth: 1, borderTopColor: COLOURS.surface },
  payModelPill:               { flex: 1, marginHorizontal: 4, paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
