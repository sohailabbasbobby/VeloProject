import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch
} from 'react-native';

// --- Firebase Web SDK ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, query, where, connectFirestoreEmulator, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "MOCK-API-KEY-FOR-TESTING",
  authDomain: "velo-platform-2026-x1.firebaseapp.com",
  projectId: "velo-platform-2026-x1",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

connectAuthEmulator(auth, "http://127.0.0.1:9099");
connectFirestoreEmulator(db, '127.0.0.1', 8080);

const API_BASE_URL = 'http://127.0.0.1:5001/velo-platform-2026-x1/us-central1/api/v1';
const TENANT_ID = 'TENANT_123';

const App = () => {
  // Branding State
  const [tenantBrand, setTenantBrand] = useState({
    primary: '#D4AF37',
    accent: '#007AFF',
    slogan: 'SECURE AUTHENTICATION GATEWAY',
    logoUrl: ''
  });

  // Session State
  const [user, setUser] = useState<any>(null);
  const [jwtToken, setJwtToken] = useState<string>('');
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Auth UI
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // App UI State
  const [appState, setAppState] = useState<'COMPLIANCE' | 'OFFLINE' | 'AVAILABLE'>('COMPLIANCE');

  // Compliance Tunnel State
  const [extCheck, setExtCheck] = useState(false);
  const [cabinCheck, setCabinCheck] = useState(false);
  const [tyreCheck, setTyreCheck] = useState(false);

  // Incoming Dispatch State
  const [incomingDispatch, setIncomingDispatch] = useState<any>(null);

  // ----------------------------------------------------
  // AUTHENTICATION LISTENER
  // ----------------------------------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const tokenResult = await currentUser.getIdTokenResult(true);
        if (tokenResult.claims.User_Role !== 'driver') {
          Alert.alert("Unauthorized", "Your account is not provisioned for Driver access.");
          signOut(auth);
          return;
        }
        setJwtToken(tokenResult.token);
        setUser(currentUser);
      } else {
        setUser(null);
        setJwtToken('');
        setAppState('COMPLIANCE');
      }
      setIsAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // ----------------------------------------------------
  // DISPATCH LISTENER (FIRESTORE)
  // ----------------------------------------------------
  useEffect(() => {
    let unsubscribe: any = () => {};
    if (appState === 'AVAILABLE') {
      const q = query(collection(db, "Bookings"), where("status", "==", "PAID_PENDING_DISPATCH"));
      unsubscribe = onSnapshot(q, (snapshot) => {
        let newBooking = null;
        snapshot.forEach((doc) => {
          newBooking = { id: doc.id, ...doc.data() };
        });
        if (newBooking) {
          setIncomingDispatch(newBooking);
        } else {
          setIncomingDispatch(null);
        }
      });
    } else {
      setIncomingDispatch(null);
    }
    return () => unsubscribe();
  }, [appState]);

  const handleAuth = async (isSignUp: boolean) => {
    setIsSubmitting(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        Alert.alert('Success', 'Driver profile created. Custom claims syncing...');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      Alert.alert('Authentication Failed', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const secureFetch = async (endpoint: string, method = 'POST', body: any = null) => {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Server error');
    return data;
  };

  const submitComplianceLog = async () => {
    if (!extCheck || !cabinCheck || !tyreCheck) {
      Alert.alert('Compliance Incomplete', 'You must verify all pre-shift checks.');
      return;
    }
    setIsSubmitting(true);
    try {
      await secureFetch('/driver/compliance', 'POST', {
        exteriorPassed: extCheck,
        cabinPassed: cabinCheck,
        tyresPassed: tyreCheck
      });
      setAppState('OFFLINE');
    } catch (err: any) {
      Alert.alert('Compliance Error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleGoOnline = async () => {
    if (appState === 'AVAILABLE') {
      setAppState('OFFLINE'); // Going offline doesn't need strict API guard for UI mockup
      return;
    }

    setIsSubmitting(true);
    try {
      await secureFetch('/driver/status', 'POST', { targetStatus: 'AVAILABLE' });
      setAppState('AVAILABLE');
    } catch (err: any) {
      Alert.alert('Access Denied', err.message);
      // Snap UI back to offline
      setAppState('OFFLINE');
    } finally {
      setIsSubmitting(false);
    }
  };

  const acceptDispatch = async (bookingId: string) => {
    setIsSubmitting(true);
    try {
      await secureFetch('/driver/accept', 'POST', { bookingId });
      setIncomingDispatch(null);
      Alert.alert('Success', 'Ride accepted successfully!');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading) {
    return <SafeAreaView style={styles.container}><ActivityIndicator size="large" color={tenantBrand.primary} /></SafeAreaView>;
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#070708" />
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
          <Text style={[styles.titleText, { color: tenantBrand.primary }]}>VELO DRIVER</Text>
          <Text style={[styles.subtitleText, { color: tenantBrand.accent }]}>{tenantBrand.slogan}</Text>
          
          <View style={[styles.card, { marginTop: 40 }]}>
            <TextInput style={styles.input} placeholder="Driver Email (e.g. driver@velo.com)" placeholderTextColor="#8A8A8E" autoCapitalize="none" value={email} onChangeText={setEmail} />
            <View style={styles.divider} />
            <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#8A8A8E" secureTextEntry value={password} onChangeText={setPassword} />
          </View>
          
          <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: tenantBrand.primary }]} onPress={() => handleAuth(false)}>
            {isSubmitting ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Login</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={{ marginTop: 20 }} onPress={() => handleAuth(true)}>
            <Text style={{ color: '#8A8A8E', textAlign: 'center' }}>Register Driver Account</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#070708" />
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: tenantBrand.primary }]}>VELO DRIVER</Text>
        <TouchableOpacity onPress={() => signOut(auth)}><Text style={{ color: '#FF3B30', fontWeight: 'bold' }}>Sign Out</Text></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {appState === 'COMPLIANCE' && (
          <View>
            <Text style={styles.sectionHeader}>PRE-SHIFT COMPLIANCE TUNNEL</Text>
            <Text style={{ color: '#8A8A8E', marginBottom: 20 }}>You must verify the condition of your vehicle before accessing the dispatch network.</Text>
            
            <View style={styles.card}>
              <View style={styles.switchRow}>
                <Text style={styles.switchText}>Exterior is pristine & damage-free</Text>
                <Switch value={extCheck} onValueChange={setExtCheck} trackColor={{ true: '#34C759', false: '#2A2A2D' }} />
              </View>
              <View style={styles.divider} />
              <View style={styles.switchRow}>
                <Text style={styles.switchText}>Cabin is clean, vacuumed & fresh</Text>
                <Switch value={cabinCheck} onValueChange={setCabinCheck} trackColor={{ true: '#34C759', false: '#2A2A2D' }} />
              </View>
              <View style={styles.divider} />
              <View style={styles.switchRow}>
                <Text style={styles.switchText}>Tyres, fluids & fuel/charge adequate</Text>
                <Switch value={tyreCheck} onValueChange={setTyreCheck} trackColor={{ true: '#34C759', false: '#2A2A2D' }} />
              </View>
            </View>

            <TouchableOpacity style={[styles.btnPrimary, { marginTop: 30, backgroundColor: tenantBrand.primary }]} onPress={submitComplianceLog}>
              {isSubmitting ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Submit Compliance Log</Text>}
            </TouchableOpacity>
          </View>
        )}

        {(appState === 'OFFLINE' || appState === 'AVAILABLE') && (
          <View style={{ flex: 1 }}>
            <View style={[styles.card, { alignItems: 'center', paddingVertical: 30, borderColor: appState === 'AVAILABLE' ? tenantBrand.primary : '#2A2A2D' }]}>
              <Text style={{ color: appState === 'AVAILABLE' ? tenantBrand.primary : '#8A8A8E', fontSize: 24, fontWeight: '800', letterSpacing: 2 }}>
                {appState === 'AVAILABLE' ? 'ONLINE & LISTENING' : 'OFFLINE'}
              </Text>
              
              <TouchableOpacity style={[styles.goOnlineBtn, { backgroundColor: appState === 'AVAILABLE' ? '#FF3B30' : tenantBrand.primary }]} onPress={toggleGoOnline}>
                {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900' }}>{appState === 'AVAILABLE' ? 'GO OFFLINE' : 'GO ONLINE'}</Text>}
              </TouchableOpacity>
            </View>

            {appState === 'AVAILABLE' && !incomingDispatch && (
              <View style={[styles.card, { marginTop: 20, padding: 30, alignItems: 'center', backgroundColor: '#0A150D' }]}>
                <Text style={{ color: tenantBrand.primary, fontSize: 16, fontWeight: 'bold' }}>📡 Radar Active</Text>
                <Text style={{ color: '#8A8A8E', marginTop: 10, textAlign: 'center' }}>Awaiting executive dispatch requests based on your location.</Text>
              </View>
            )}

            {appState === 'AVAILABLE' && incomingDispatch && (
              <View style={[styles.card, { marginTop: 20, padding: 20, backgroundColor: '#1A0B05', borderColor: '#FF9F0A' }]}>
                <Text style={{ color: '#FF9F0A', fontSize: 20, fontWeight: '900', textAlign: 'center', letterSpacing: 2, marginBottom: 10 }}>⚠️ INCOMING DISPATCH</Text>
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>Pickup: {incomingDispatch.itinerary?.pickup}</Text>
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginTop: 5 }}>Dropoff: {incomingDispatch.itinerary?.dropoff}</Text>
                
                {/* STRICT NET-FIRST DISPLAY MODEL */}
                <Text style={{ color: '#8A8A8E', fontSize: 12, fontWeight: '700', marginTop: 25, textAlign: 'center', letterSpacing: 1 }}>TOTAL EARNINGS FOR THIS TRIP</Text>
                <Text style={{ color: tenantBrand.primary, fontSize: 32, fontWeight: '900', marginTop: 5, textAlign: 'center' }}>£{incomingDispatch.grossNetBreakdown?.netDriverPayout?.toFixed(2)}</Text>
                
                <TouchableOpacity 
                  style={[styles.btnPrimary, { backgroundColor: tenantBrand.primary, marginTop: 20 }]}
                  onPress={() => acceptDispatch(incomingDispatch.id)}>
                  {isSubmitting ? <ActivityIndicator color="#000" /> : <Text style={{ color: '#000', fontSize: 18, fontWeight: '900' }}>ACCEPT RIDE</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070708', justifyContent: 'center' },
  titleText: { fontSize: 48, fontWeight: '900', letterSpacing: 8, textAlign: 'center' },
  subtitleText: { fontSize: 12, fontWeight: '600', letterSpacing: 4, textAlign: 'center', marginTop: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#1A1A1D' },
  headerTitle: { fontSize: 16, fontWeight: '800', letterSpacing: 2 },
  sectionHeader: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', letterSpacing: 3, marginBottom: 15 },
  card: { backgroundColor: '#131315', borderRadius: 12, borderWidth: 1, borderColor: '#2A2A2D', overflow: 'hidden' },
  input: { color: '#FFFFFF', fontSize: 16, padding: 16 },
  divider: { height: 1, backgroundColor: '#2A2A2D' },
  btnPrimary: { padding: 18, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  btnText: { color: '#070708', fontSize: 16, fontWeight: '700' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  switchText: { color: '#FFFFFF', fontSize: 15, flex: 1, marginRight: 10 },
  goOnlineBtn: { marginTop: 30, paddingVertical: 20, paddingHorizontal: 40, borderRadius: 40 }
});

export default App;
