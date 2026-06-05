import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Text, SafeAreaView, StatusBar, TouchableOpacity, Modal } from 'react-native';
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





const Header = ({ onOpenDrawer, currentRole, onOpenAccountSwitcher }) => {
  const roleDisplay = currentRole === 'CORPORATE' ? 'Acme Corp Ltd' : 'Personal Account';
  return (
    <View style={[styles.glassHeaderContainer, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 }]}>
      <TouchableOpacity onPress={onOpenDrawer} style={{ padding: 10, paddingLeft: 0 }}>
        <Text style={{ color: '#FFFFFF', fontSize: 28, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 2 }}>☰</Text>
      </TouchableOpacity>
      
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ alignItems: 'flex-end', marginRight: 15 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginBottom: 5, marginRight: 10, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 2 }}>John Doe</Text>
          
          <TouchableOpacity 
            onPress={onOpenAccountSwitcher} 
            style={styles.dropdownBtn}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' }}>
              {roleDisplay} ▼
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#D4AF37', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#000000', fontSize: 16, fontWeight: '900' }}>JD</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const HomeScreen = () => {
  const [activeScreen, setActiveScreen] = useState('HOME');
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isAccountModalVisible, setAccountModalVisible] = useState(false);
  const [currentRole, setCurrentRole] = useState('PERSONAL');
  const [stops, setStops] = useState([
    { id: '1', address: '', latitude: 51.5074, longitude: -0.1278 },
    { id: '2', address: '', latitude: 51.5174, longitude: -0.1178 }
  ]);
  const [instructions, setInstructions] = useState('');
  const [isSummaryVisible, setSummaryVisible] = useState(false);
  const [pickupTimeType, setPickupTimeType] = useState('ASAP');
  const [scheduledTime, setScheduledTime] = useState('');
  
  const [isVehicleModalVisible, setVehicleModalVisible] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  
  const [tripStatus, setTripStatus] = useState('NONE'); // NONE, SEARCHING, ASSIGNED, ON_THE_WAY, ARRIVED
  const [liveEta, setLiveEta] = useState('Calculating...');
  
  const mockDriver = {
    name: 'Michael S.',
    rating: 4.9,
    vehicle: 'Mercedes-Benz S-Class',
    plate: 'LDN 1234',
    photo: 'https://randomuser.me/api/portraits/men/32.jpg'
  };

  const paymentMethods = [
    { id: '1', name: '•••• 4242', type: 'Visa' },
    { id: '2', name: '•••• 1234', type: 'Mastercard' },
    { id: '3', name: 'Apple Pay', type: 'ApplePay' }
  ];
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(paymentMethods[0]);
  const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);

  const handleMarkerDragEnd = (id, coordinate) => {
    setStops(stops.map(s => s.id === id ? { ...s, latitude: coordinate.latitude, longitude: coordinate.longitude } : s));
  };

  const handleQuoteRequest = () => {
    // Validate stops are not empty
    const validStops = stops.filter(s => s.address.trim() !== '');
    if (validStops.length < 2) {
      alert("Please enter a valid pickup and dropoff location.");
      return;
    }
    setSummaryVisible(true);
  };

  const handleConfirmBooking = () => {
    setSummaryVisible(false);
    if (currentRole === 'CORPORATE') {
      alert("Sent to Admin for Approval. Awaiting Dispatch.");
      return;
    } 
    
    // Trigger Live Tracking Mock State Machine
    setTripStatus('SEARCHING');
    setLiveEta('Calculating...');
    
    setTimeout(() => {
      setTripStatus('ASSIGNED');
      setLiveEta('5 mins');
    }, 3000);
    
    setTimeout(() => {
      setTripStatus('ON_THE_WAY');
      setLiveEta('2 mins');
    }, 8000);
    
    setTimeout(() => {
      setTripStatus('ARRIVED');
      setLiveEta('0 mins');
    }, 13000);
    
    setTimeout(() => {
      setTripStatus('WAITING_OUTSIDE');
    }, 18000);
    
    setTimeout(() => {
      setTripStatus('WAITING_TIME_ENDS_SOON');
    }, 23000);
  };

  const handleCancelTrip = () => {
    setTripStatus('NONE');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Background Full-Screen MapLayer */}
      {activeScreen === 'HOME' && <InteractiveMap stops={stops.filter(s => s.address.trim() !== '')} onMarkerDragEnd={handleMarkerDragEnd} tripStatus={tripStatus} />}

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Header 
          onOpenDrawer={() => setDrawerOpen(true)} 
          currentRole={currentRole} 
          onOpenAccountSwitcher={() => setAccountModalVisible(true)} 
        />

        {activeScreen === 'LEDGER' && <TravelLedgerScreen onClose={() => { setActiveScreen('HOME'); setDrawerOpen(true); }} />}
        {activeScreen === 'VAULT' && <MessagingVaultScreen onClose={() => { setActiveScreen('HOME'); setDrawerOpen(true); }} />}
        {activeScreen === 'SETTINGS' && <SettingsScreen onClose={() => { setActiveScreen('HOME'); setDrawerOpen(true); }} />}
        {activeScreen === 'UPCOMING_BOOKINGS' && <UpcomingBookingsScreen onClose={() => { setActiveScreen('HOME'); setDrawerOpen(true); }} />}
        {activeScreen === 'SAVED_ADDRESSES' && <SavedAddressesScreen onClose={() => { setActiveScreen('HOME'); setDrawerOpen(true); }} />}
        {activeScreen === 'TRIP_HISTORY' && <TripHistoryScreen onClose={() => { setActiveScreen('HOME'); setDrawerOpen(true); }} />}
        {activeScreen === 'PAYMENT_METHOD' && <PaymentMethodScreen onClose={() => { setActiveScreen('HOME'); setDrawerOpen(true); }} />}
        {activeScreen === 'PROFILE' && <ProfileScreen onClose={() => { setActiveScreen('HOME'); setDrawerOpen(true); }} />}
      </ScrollView>

      {/* Floating Booking Engine or Active Trip */}
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
              onQuoteRequest={handleQuoteRequest}
              bookingDetails={bookingDetails}
              onOpenVehicleSelection={() => setVehicleModalVisible(true)}
            />
          ) : (
            <ActiveTripCard 
              tripStatus={tripStatus}
              eta={liveEta}
              driver={mockDriver}
              pickupAddress={stops[0]?.address}
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
        onNavigate={setActiveScreen}
      />

      {/* SUMMARY MODAL OVERLAY */}
      <Modal visible={isSummaryVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>TRIP ITINERARY SUMMARY</Text>
            
            <View style={{ marginBottom: 15, padding: 15, backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)' }}>
              {stops.filter(s => s.address.trim() !== '').map((s, idx) => (
                <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: idx === 0 ? '#34C759' : idx === stops.length - 1 ? '#FF3B30' : '#D4AF37', marginRight: 10 }} />
                  <Text style={[styles.modalText, { marginBottom: 0, fontSize: 14 }]}>{idx === 0 ? "Pickup" : idx === stops.length - 1 ? "Dropoff" : "Stop"}: {s.address}</Text>
                </View>
              ))}
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <Text style={styles.modalPriceLabel}>PICKUP TIME</Text>
              <Text style={styles.modalPriceLabel}>ESTIMATED ETA</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>{pickupTimeType === 'ASAP' ? 'ASAP' : scheduledTime || 'Scheduled'}</Text>
              <Text style={{ color: '#D4AF37', fontSize: 16, fontWeight: 'bold' }}>25 mins</Text>
            </View>
            
            <View style={styles.modalDivider} />
            <Text style={styles.modalPriceLabel}>TOTAL FIXED QUOTE</Text>
            <Text style={styles.modalPrice}>£85.00</Text>
            
            {/* Payment Method Selector */}
            {currentRole !== 'CORPORATE' && (
              <View style={{ zIndex: 100, marginBottom: 15 }}>
                <Text style={[styles.modalPriceLabel, { marginBottom: 5 }]}>PAYMENT METHOD</Text>
                <TouchableOpacity 
                  style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: showPaymentDropdown ? '#D4AF37' : 'rgba(255, 255, 255, 0.1)' }}
                  onPress={() => setShowPaymentDropdown(!showPaymentDropdown)}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>{selectedPaymentMethod.type} {selectedPaymentMethod.name}</Text>
                  <Text style={{ color: '#8A8A8E', fontSize: 12 }}>▼</Text>
                </TouchableOpacity>

                {showPaymentDropdown && (
                  <View style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, backgroundColor: '#1C1C1E', borderRadius: 8, borderWidth: 1, borderColor: '#3A3A3C', overflow: 'hidden', marginBottom: 5 }}>
                    {paymentMethods.map((method, idx) => (
                      <TouchableOpacity 
                        key={method.id}
                        style={{ padding: 12, borderBottomWidth: idx === paymentMethods.length - 1 ? 0 : 1, borderColor: '#3A3A3C' }}
                        onPress={() => {
                          setSelectedPaymentMethod(method);
                          setShowPaymentDropdown(false);
                        }}
                      >
                        <Text style={{ color: '#FFFFFF', fontSize: 14 }}>{method.type} {method.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
            
            <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleConfirmBooking}>
              <Text style={styles.modalConfirmText}>
                {currentRole === 'CORPORATE' ? 'Submit for Admin Approval' : 'Confirm Ride'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={{ marginTop: 15 }} onPress={() => setSummaryVisible(false)}>
              <Text style={{ color: '#8A8A8E', textAlign: 'center', fontWeight: 'bold' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <VehicleSelectionModal 
        visible={isVehicleModalVisible}
        onClose={() => setVehicleModalVisible(false)}
        initialData={bookingDetails}
        onConfirm={(details) => setBookingDetails(details)}
      />

      {/* ACCOUNT SWITCHER MODAL */}
      <Modal visible={isAccountModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>SELECT ACCOUNT</Text>
            
            <TouchableOpacity 
              style={[styles.accountOption, currentRole === 'PERSONAL' && styles.accountOptionActive]}
              onPress={() => { setCurrentRole('PERSONAL'); setAccountModalVisible(false); }}
            >
              <Text style={styles.accountIcon}>👤</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.accountName}>Personal Account</Text>
                <Text style={styles.accountSub}>Pay via Credit/Debit Card</Text>
              </View>
              {currentRole === 'PERSONAL' && <Text style={styles.activeCheck}>✓</Text>}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.accountOption, currentRole === 'CORPORATE' && styles.accountOptionActive]}
              onPress={() => { setCurrentRole('CORPORATE'); setAccountModalVisible(false); }}
            >
              <Text style={styles.accountIcon}>🏢</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.accountName}>Acme Corp Ltd</Text>
                <Text style={styles.accountSub}>Corporate Billing (Admin Approved)</Text>
              </View>
              {currentRole === 'CORPORATE' && <Text style={styles.activeCheck}>✓</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={{ marginTop: 20 }} onPress={() => setAccountModalVisible(false)}>
              <Text style={{ color: '#8A8A8E', textAlign: 'center', fontWeight: 'bold' }}>Cancel</Text>
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
  moduleContainer: { marginBottom: 30 },
  moduleHeader: { color: '#FFFFFF', fontSize: 12, fontWeight: '800', letterSpacing: 2, marginBottom: 12 },
  primaryBtn: { padding: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 15 },
  primaryBtnText: { color: '#000000', fontSize: 16, fontWeight: '800' },
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
  activeCheck: { color: '#D4AF37', fontSize: 20, fontWeight: 'bold', marginLeft: 'auto' }
});
