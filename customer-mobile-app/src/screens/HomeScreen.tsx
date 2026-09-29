import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Text, SafeAreaView, StatusBar, TouchableOpacity, Modal, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SideMenuDrawer } from '../components/SideMenuDrawer';
import { SecureBookingEngine } from '../components/SecureBookingEngine';
import { ActiveTripCard } from '../components/ActiveTripCard';
import { InteractiveMap } from '../components/InteractiveMap';
import { TravelLedgerScreen } from './TravelLedgerScreen';
import { MessagingVaultScreen } from './MessagingVaultScreen';
import { SettingsScreen } from './SettingsScreen';
import { SavedAddressesScreen } from './SavedAddressesScreen';
import { UpcomingBookingsScreen } from './UpcomingBookingsScreen';
import { TripHistoryScreen } from './TripHistoryScreen';
import { PaymentMethodScreen } from './PaymentMethodScreen';
import { ProfileScreen } from './ProfileScreen';
import { VehicleSelectionModal } from '../components/VehicleSelectionModal';
import * as Api from '../api/client';

const Header = ({ onOpenDrawer, currentRole, onOpenAccountSwitcher, passengerName, photoUrl, onGoHome }) => {
  const { t } = useTranslation();
  const roleDisplay = currentRole === 'CORPORATE' ? t('sidebar.corporate_account') : t('sidebar.personal_account');
  const initials = (passengerName || 'V')
    .split(' ')
    .map((p) => p.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <View style={[styles.glassHeaderContainer, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 }]}>
      <TouchableOpacity onPress={onOpenDrawer} style={{ padding: 10, paddingLeft: 0 }}>
        <Text style={{ color: '#FFFFFF', fontSize: 28, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>☰</Text>
      </TouchableOpacity>

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ alignItems: 'flex-end', marginRight: 15 }}>
          {/* Name right-aligned; profile photo to the RIGHT of the name (§6 UI corrections) */}
          <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginBottom: 5, marginRight: 10, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>
            {passengerName || 'Guest'}
          </Text>
          <TouchableOpacity onPress={onGoHome} style={styles.dropdownBtn}>
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' }}>{roleDisplay} ▼</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#D4AF37', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={{ width: 44, height: 44 }} />
          ) : (
            <Text style={{ color: '#000000', fontSize: 16, fontWeight: '900' }}>{initials}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

import { Image } from 'react-native';

const STATE_TO_STATUS: Record<string, string> = {
  PENDING_DISPATCH: 'SEARCHING',
  OFFERING_OWN_FLEET: 'SEARCHING',
  IN_POOL: 'SEARCHING',
  NEGOTIATION: 'SEARCHING',
  ASSIGNED: 'ASSIGNED',
  DRIVER_EN_ROUTE: 'ON_THE_WAY',
  ARRIVED: 'ARRIVED',
  IN_PROGRESS: 'WAITING_OUTSIDE',
};

export const HomeScreen = () => {
  const { t } = useTranslation();
  const [activeScreen, setActiveScreen] = useState('HOME');
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isAccountModalVisible, setAccountModalVisible] = useState(false);
  const [currentRole, setCurrentRole] = useState('PERSONAL');
  const [stops, setStops] = useState([
    { id: '1', address: '', latitude: 51.5074, longitude: -0.1278 },
    { id: '2', address: '', latitude: 51.5174, longitude: -0.1178 },
  ]);
  const [instructions, setInstructions] = useState('');
  const [isSummaryVisible, setSummaryVisible] = useState(false);
  const [pickupTimeType, setPickupTimeType] = useState('ASAP');
  const [scheduledTime, setScheduledTime] = useState('');

  const [isVehicleModalVisible, setVehicleModalVisible] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  // LIVE trip state — polled from the backend, never simulated
  const [liveTrip, setLiveTrip] = useState<any>(null);
  const [vehicleClasses, setVehicleClasses] = useState<any[]>([]);
  const [quote, setQuote] = useState<{ quote: number; distanceMiles: number; durationMinutes: number } | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [passenger, setPassenger] = useState<{ name: string; photoUrl?: string } | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const loadLive = useCallback(async () => {
    try {
      const trips = await Api.fetchUpcomingTrips();
      const active = (trips || []).find((tr: any) => !['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(tr.state));
      setLiveTrip(active || null);
      setApiError(null);
    } catch (err: any) {
      setApiError(err.message);
    }
  }, []);

  useEffect(() => {
    loadLive();
    const t = setInterval(loadLive, 10000);
    return () => clearInterval(t);
  }, [loadLive]);

  useEffect(() => {
    Api.fetchVehicleClasses()
      .then(setVehicleClasses)
      .catch(() => setVehicleClasses([]));
    Api.fetchMyProfile()
      .then((clients: any) => {
        const me = Array.isArray(clients) ? clients[0] : clients;
        if (me) setPassenger({ name: me.full_name, photoUrl: me.photo_url });
      })
      .catch(() => undefined);
  }, []);

  const tripStatus = liveTrip ? (STATE_TO_STATUS[liveTrip.state] || 'SEARCHING') : 'NONE';

  const handleMarkerDragEnd = (id: string, coordinate: any) => {
    setStops(stops.map((s) => (s.id === id ? { ...s, latitude: coordinate.latitude, longitude: coordinate.longitude } : s)));
  };

  const handleQuoteRequest = async () => {
    const validStops = stops.filter((s) => s.address.trim() !== '');
    if (validStops.length < 2) {
      Alert.alert('Invalid route', 'Please enter a valid pickup and dropoff location.');
      return;
    }
    if (!bookingDetails?.carType) {
      Alert.alert('Select a vehicle class', 'Choose your vehicle class before requesting a quote.');
      setVehicleModalVisible(true);
      return;
    }
    setQuoteLoading(true);
    try {
      const data = await Api.requestQuote({
        pickupLat: stops[0].latitude,
        pickupLng: stops[0].longitude,
        dropoffLat: stops[stops.length - 1].latitude,
        dropoffLng: stops[stops.length - 1].longitude,
        tier: bookingDetails.carType || 'EXECUTIVE',
      });
      setQuote(data);
      setSummaryVisible(true);
    } catch (err: any) {
      Alert.alert('Quote Failed', err.message);
    } finally {
      setQuoteLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    setSummaryVisible(false);
    if (!quote) return;
    // Real capacity validation against the vehicle database (§6)
    const cls = vehicleClasses.find((c) => c.tier === (bookingDetails?.carType || 'EXECUTIVE'));
    const pax = Number(bookingDetails?.passengers || 1);
    const bags = Number(bookingDetails?.bags || 0);
    if (cls && pax > cls.capacity.max) {
      Alert.alert('Capacity exceeded', `This class carries at most ${cls.capacity.max} passengers. Choose a larger class.`);
      return;
    }
    if (cls && bags > cls.maxBags) {
      Alert.alert('Baggage exceeded', `This class carries at most ${cls.maxBags} bags. Choose a larger class.`);
      return;
    }

    setBookingLoading(true);
    try {
      await Api.createBooking({
        pickupAddress: stops[0].address,
        pickupLat: stops[0].latitude,
        pickupLng: stops[0].longitude,
        dropoffAddress: stops[stops.length - 1].address,
        dropoffLat: stops[stops.length - 1].latitude,
        dropoffLng: stops[stops.length - 1].longitude,
        customPrice: quote.quote,
        bookingType: pickupTimeType === 'ASAP' ? 'ASAP' : 'SCHEDULED',
        scheduledAt: pickupTimeType === 'SCHEDULED' ? scheduledTime : undefined,
        passengerName: passenger?.name || 'Passenger',
        passengerCount: pax,
        baggageCount: bags,
        requestedTier: bookingDetails?.carType || 'EXECUTIVE',
      });
      setStops(stops.map((s) => ({ ...s, address: '' })));
      setQuote(null);
      await loadLive();
      Alert.alert('Booking confirmed', 'Your chauffeur request is live. You will be notified when a driver is assigned.');
    } catch (err: any) {
      Alert.alert('Booking Failed', err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelTrip = async () => {
    if (!liveTrip) return;
    try {
      await Api.cancelMyTrip(liveTrip.id, 'PASSENGER_CANCELLED');
      await loadLive();
    } catch (err: any) {
      Alert.alert('Cancellation failed', err.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {activeScreen === 'HOME' && <InteractiveMap stops={stops.filter((s) => s.address.trim() !== '')} onMarkerDragEnd={handleMarkerDragEnd} tripStatus={tripStatus} />}

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Header
          onOpenDrawer={() => setDrawerOpen(true)}
          currentRole={currentRole}
          onOpenAccountSwitcher={() => setAccountModalVisible(true)}
          passengerName={passenger?.name}
          photoUrl={passenger?.photoUrl}
          onGoHome={() => setActiveScreen('HOME')}
        />

        {apiError && (
          <TouchableOpacity onPress={() => setApiError(null)} style={{ backgroundColor: '#5a1e1e', padding: 8, borderRadius: 6, marginBottom: 6 }}>
            <Text style={{ color: '#ffb4b4', fontSize: 10, textAlign: 'center' }}>LIVE LINK ERROR: {apiError}</Text>
          </TouchableOpacity>
        )}

        {activeScreen === 'LEDGER' && <TravelLedgerScreen onClose={() => { setActiveScreen('HOME'); setDrawerOpen(true); }} />}
        {activeScreen === 'VAULT' && <MessagingVaultScreen onClose={() => { setActiveScreen('HOME'); setDrawerOpen(true); }} />}
        {activeScreen === 'SETTINGS' && <SettingsScreen onClose={() => { setActiveScreen('HOME'); setDrawerOpen(true); }} />}
        {activeScreen === 'UPCOMING_BOOKINGS' && <UpcomingBookingsScreen onClose={() => { setActiveScreen('HOME'); setDrawerOpen(true); }} />}
        {activeScreen === 'SAVED_ADDRESSES' && <SavedAddressesScreen onClose={() => { setActiveScreen('HOME'); setDrawerOpen(true); }} />}
        {activeScreen === 'TRIP_HISTORY' && <TripHistoryScreen onClose={() => { setActiveScreen('HOME'); setDrawerOpen(true); }} />}
        {activeScreen === 'PAYMENT_METHOD' && <PaymentMethodScreen onClose={() => { setActiveScreen('HOME'); setDrawerOpen(true); }} />}
        {activeScreen === 'PROFILE' && <ProfileScreen onClose={() => { setActiveScreen('HOME'); setDrawerOpen(true); }} />}
      </ScrollView>

      {/* Floating Booking Engine or LIVE Active Trip */}
      {activeScreen === 'HOME' && (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          {tripStatus === 'NONE' ? (
            <SecureBookingEngine
              stops={stops}
              setStops={setStops}
              instructions={instructions}
              setInstructions={setInstructions}
              pickupTimeType={pickupTimeType}
              setPickupTimeType={setPickupTimeType}
              scheduledTime={scheduledTime}
              setScheduledTime={setScheduledTime}
              onQuoteRequest={quoteLoading ? () => undefined : handleQuoteRequest}
              bookingDetails={bookingDetails}
              onOpenVehicleSelection={() => setVehicleModalVisible(true)}
            />
          ) : (
            <ActiveTripCard
              tripStatus={tripStatus}
              eta={liveTrip?.scheduled_at ? new Date(liveTrip.scheduled_at).toLocaleTimeString().slice(0, 5) : 'Being assigned'}
              driver={liveTrip?.driver_name ? { name: liveTrip.driver_name, rating: '', vehicle: '', plate: '', photo: '' } : null}
              pickupAddress={liveTrip?.pickup_address || stops[0]?.address}
              onCancel={handleCancelTrip}
            />
          )}
        </View>
      )}

      <SideMenuDrawer
        visible={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        currentRole={currentRole}
        onSelectRole={setCurrentRole}
        onNavigate={(screen: string) => { setActiveScreen(screen); setDrawerOpen(false); }}
      />

      {/* SUMMARY MODAL — shows the LIVE quote from the backend floor engine */}
      <Modal visible={isSummaryVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('home.trip_itinerary_summary')}</Text>

            <View style={{ marginBottom: 15, padding: 15, backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)' }}>
              {stops.filter((s) => s.address.trim() !== '').map((s, idx, arr) => (
                <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: idx === 0 ? '#34C759' : idx === arr.length - 1 ? '#FF3B30' : '#D4AF37', marginRight: 10 }} />
                  <Text style={[styles.modalText, { marginBottom: 0, fontSize: 14 }]}>
                    {idx === 0 ? 'Pickup' : idx === arr.length - 1 ? 'Dropoff' : 'Stop'}: {s.address}
                  </Text>
                </View>
              ))}
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <Text style={styles.modalPriceLabel}>{t('home.pickup_time')}</Text>
              <Text style={styles.modalPriceLabel}>{quote ? 'ROUTE' : 'ETA'}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>
                {pickupTimeType === 'ASAP' ? t('home.asap') : scheduledTime || t('home.schedule')}
              </Text>
              {quote && (
                <Text style={{ color: '#D4AF37', fontSize: 16, fontWeight: 'bold' }}>
                  {quote.distanceMiles} mi · ~{quote.durationMinutes} min
                </Text>
              )}
            </View>

            <View style={styles.modalDivider} />
            <Text style={styles.modalPriceLabel}>{t('home.total_fixed_quote')}</Text>
            {quote ? (
              <Text style={styles.modalPrice}>£{Number(quote.quote).toFixed(2)}</Text>
            ) : (
              <ActivityIndicator color="#D4AF37" style={{ marginTop: 10 }} />
            )}
            <Text style={{ color: '#666', fontSize: 10, marginTop: 4 }}>
              All-inclusive fixed fare — no VAT line is added to customer fares.
            </Text>

            {bookingLoading ? (
              <View style={[styles.modalConfirmBtn, { opacity: 0.7 }]}>
                <ActivityIndicator color="#000" />
              </View>
            ) : (
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleConfirmBooking} disabled={!quote}>
                <Text style={styles.modalConfirmText}>{currentRole === 'CORPORATE' ? t('home.submit_admin_approval') : t('home.confirm_ride')}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={{ marginTop: 15 }} onPress={() => setSummaryVisible(false)}>
              <Text style={{ color: '#8A8A8E', textAlign: 'center', fontWeight: 'bold' }}>{t('home.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <VehicleSelectionModal
        visible={isVehicleModalVisible}
        onClose={() => setVehicleModalVisible(false)}
        initialData={bookingDetails}
        onConfirm={(details: any) => setBookingDetails(details)}
      />

      {/* ACCOUNT SWITCHER MODAL */}
      <Modal visible={isAccountModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('home.select_account')}</Text>

            <TouchableOpacity
              style={[styles.accountOption, currentRole === 'PERSONAL' && styles.accountOptionActive]}
              onPress={() => { setCurrentRole('PERSONAL'); setAccountModalVisible(false); }}
            >
              <Text style={styles.accountIcon}>👤</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.accountName}>{t('sidebar.personal_account')}</Text>
                <Text style={styles.accountSub}>{t('sidebar.personal_sub')}</Text>
              </View>
              {currentRole === 'PERSONAL' && <Text style={styles.activeCheck}>✓</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.accountOption, currentRole === 'CORPORATE' && styles.accountOptionActive]}
              onPress={() => { setCurrentRole('CORPORATE'); setAccountModalVisible(false); }}
            >
              <Text style={styles.accountIcon}>🏢</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.accountName}>{t('sidebar.corporate_account')}</Text>
                <Text style={styles.accountSub}>{t('sidebar.corporate_sub')}</Text>
              </View>
              {currentRole === 'CORPORATE' && <Text style={styles.activeCheck}>✓</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={{ marginTop: 20 }} onPress={() => setAccountModalVisible(false)}>
              <Text style={{ color: '#8A8A8E', textAlign: 'center', fontWeight: 'bold' }}>{t('home.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  container: { paddingHorizontal: 20, paddingTop: 10, backgroundColor: 'transparent', paddingBottom: 0, zIndex: 10, flexGrow: 1 },
  glassHeaderContainer: {
    marginBottom: 10,
    backgroundColor: 'rgba(19, 19, 21, 0.85)',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  dropdownBtn: { backgroundColor: '#131315', padding: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#2A2A2D', alignSelf: 'flex-start' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#131315', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 30, paddingBottom: 50, borderWidth: 1, borderColor: '#2A2A2D' },
  modalTitle: { color: '#D4AF37', fontSize: 14, fontWeight: '900', letterSpacing: 2, marginBottom: 20 },
  modalText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  modalDivider: { height: 1, backgroundColor: '#2A2A2D', marginVertical: 20 },
  modalPriceLabel: { color: '#8A8A8E', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  modalPrice: { color: '#34C759', fontSize: 48, fontWeight: '900', marginTop: 5 },
  modalConfirmBtn: { backgroundColor: '#D4AF37', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 30 },
  modalConfirmText: { color: '#000000', fontSize: 16, fontWeight: '900' },
  accountOption: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#131315', borderRadius: 12, borderWidth: 1, borderColor: '#2A2A2D', marginBottom: 10 },
  accountOptionActive: { borderColor: '#D4AF37', backgroundColor: 'rgba(212, 175, 55, 0.1)' },
  accountIcon: { fontSize: 24, marginRight: 15 },
  accountName: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  accountSub: { color: '#8A8A8E', fontSize: 12, marginTop: 2 },
  activeCheck: { color: '#D4AF37', fontSize: 20, fontWeight: 'bold', marginLeft: 'auto' },
});
