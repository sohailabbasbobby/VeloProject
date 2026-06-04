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
  ActivityIndicator
} from 'react-native';

// --- Firebase Web SDK for React Native Auth & Sync ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, query, connectFirestoreEmulator, doc, setDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "MOCK-API-KEY-FOR-TESTING",
  authDomain: "velo-platform-2026-x1.firebaseapp.com",
  projectId: "velo-platform-2026-x1",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

// Connect to Local Emulators
connectAuthEmulator(auth, "http://127.0.0.1:9099");
connectFirestoreEmulator(db, '127.0.0.1', 8080);
connectFunctionsEmulator(functions, '127.0.0.1', 5001);

const API_BASE_URL = 'http://127.0.0.1:5001/velo-platform-2026-x1/us-central1/api/v1';

const App = () => {
  const [activeTenantId, setActiveTenantId] = useState('TENANT_123'); // Dynamic now
  
  // Branding & Live Preview State
  const [tenantBrand, setTenantBrand] = useState({
    primary: '#D4AF37',
    accent: '#007AFF',
    slogan: 'SECURE BOOKING ENGINE',
    logoUrl: ''
  });

  const [previewBrand, setPreviewBrand] = useState(tenantBrand);
  const [previewDevice, setPreviewDevice] = useState<'MOBILE' | 'TABLET'>('MOBILE');

  // App UI State
  const [user, setUser] = useState<any>(null);
  const [jwtToken, setJwtToken] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Login UI State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Routing State
  const [selectedRole, setSelectedRole] = useState<null | 'PERSONAL' | 'CORPORATE' | 'ADMIN'>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [flowState, setFlowState] = useState<'QUOTE' | 'PAYMENT' | 'SEARCHING' | 'ACTIVE_RIDE'>('QUOTE');
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [quotePrice, setQuotePrice] = useState<number | null>(null);
  const [liveManifest, setLiveManifest] = useState<any[]>([]);
  const [adminTab, setAdminTab] = useState<'MANIFEST' | 'AUDIT' | 'BRANDING'>('MANIFEST');
  const [buildStatus, setBuildStatus] = useState<any>(null);

  // B2B Partner Onboarding State
  const [isPartnerSignup, setIsPartnerSignup] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [chargingModel, setChargingModel] = useState('HYBRID');

  // ----------------------------------------------------
  // AUTHENTICATION LISTENER
  // ----------------------------------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const token = await currentUser.getIdToken();
          const tokenResult = await currentUser.getIdTokenResult();
          setJwtToken(token);
          setUserRole(tokenResult.claims.User_Role || 'customer_personal');
          
          if (tokenResult.claims.tenant_id) {
            setActiveTenantId(tokenResult.claims.tenant_id);
          }
        } catch (error) {
          console.error("Token error:", error);
        }
      } else {
        setUser(null);
        setJwtToken('');
        setUserRole('');
        setActiveTenantId('TENANT_123');
      }
      setIsAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // ----------------------------------------------------
  // ADMIN REAL-TIME FIRESTORE SYNC
  // ----------------------------------------------------
  useEffect(() => {
    if (selectedRole === 'ADMIN') {
      const q = query(collection(db, "Bookings"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const bookings: any[] = [];
        snapshot.forEach((doc) => {
          bookings.push({ id: doc.id, ...doc.data() });
        });
        setLiveManifest(bookings);
      });
      return unsubscribe;
    }
  }, [selectedRole]);

  // ----------------------------------------------------
  // TENANT BRANDING SYNC (Global)
  // ----------------------------------------------------
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "Tenants", activeTenantId), (snapshot) => {
      if (snapshot.exists() && snapshot.data().branding) {
        setTenantBrand(snapshot.data().branding);
        if (selectedRole !== 'ADMIN') setPreviewBrand(snapshot.data().branding);
        
        // First-Time Setup Redirect
        if (selectedRole === 'ADMIN' && snapshot.data().branding.primary === '#CCCCCC') {
          setAdminTab('BRANDING');
        }
      }
    });

    let unsubscribeBuild = () => {};
    if (selectedRole === 'ADMIN') {
      unsubscribeBuild = onSnapshot(doc(db, "Build_Status", activeTenantId), (snapshot) => {
        if (snapshot.exists()) {
          setBuildStatus(snapshot.data());
        }
      });
    }

    return () => {
      unsubscribe();
      unsubscribeBuild();
    };
  }, [activeTenantId, selectedRole]);

  const handleLogin = async (isSignup = false) => {
    setIsSubmitting(true);
    try {
      if (isSignup) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      Alert.alert('Auth Failed', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async () => {
    await handleLogin(true);
  };

  const handlePartnerSignup = async () => {
    setIsSubmitting(true);
    try {
      const provisionTenant = httpsCallable(functions, 'provisionTenant');
      const result = await provisionTenant({
        companyName,
        businessEmail: email,
        password,
        vatNumber,
        chargingModel
      });

      // Simulate the Welcome Email being dispatched
      Alert.alert(
        '📧 Welcome Email Dispatched', 
        `To: ${email}\nSubject: Welcome to VELO, ${companyName}!\n\nYour Admin Controller environment has been successfully provisioned. Tenant ID: ${(result.data as any).tenantId}\n\nPlease login to access your Dashboard and configure your White-Label theme.`
      );
      
      // Auto-login the new Admin Controller
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      Alert.alert('Provisioning Failed', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setSelectedRole(null);
  };

  // ----------------------------------------------------
  // SECURE API INTEGRATION (JWT INJECTED)
  // ----------------------------------------------------
  const secureFetch = async (endpoint: string, method = 'GET', body = null) => {
    const headers: any = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwtToken}`
    };
    const config: any = { method, headers };
    if (body) config.body = JSON.stringify(body);
    
    const res = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'API Request Failed');
    return data;
  };

  const getQuoteFromAPI = async () => {
    setIsSubmitting(true);
    try {
      const response = await secureFetch('/quotes', 'POST', { tenantId: activeTenantId, pickup, dropoff });
      setQuotePrice(response.quotePrice);
    } catch (err: any) {
      Alert.alert('Quote Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const dispatchBookingToAPI = async () => {
    setIsSubmitting(true);
    try {
      await secureFetch('/bookings', 'POST', {
        tenantId: activeTenantId,
        passengerId: user.uid,
        role: selectedRole,
        fare: quotePrice,
        itinerary: { pickup, dropoff }
      });
      setFlowState('SEARCHING');
      setPickup('');
      setDropoff('');
    } catch (err: any) {
      Alert.alert('Booking Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderAdminManifest = () => (
    <View style={styles.flowContainer}>
      <Text style={styles.sectionHeader}>LIVE RIDE MANIFEST (FIRESTORE SYNC)</Text>
      {liveManifest.map((trip) => {
        let accentColor = '#D4AF37'; 
        if (trip.role === 'customer_personal') accentColor = '#007AFF'; 
        if (trip.role === 'customer_corporate') accentColor = '#FF3B30'; 

        return (
          <View key={trip.id} style={[styles.inputCard, { borderColor: '#2A2A2D', marginBottom: 10 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 }}>
              <View>
                <Text style={{ color: accentColor, fontSize: 14, fontWeight: '800' }}>{trip.role || 'GUEST'}</Text>
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginTop: 4 }}>Passenger: {trip.passengerId}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: '#34C759', fontSize: 12, fontWeight: '700' }}>{trip.status}</Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );

  const renderAdminAudit = () => (
    <View style={styles.flowContainer}>
      <Text style={styles.sectionHeader}>LIVE FINANCIAL CHARGING MODULE</Text>
      <Text style={{ color: '#8A8A8E', textAlign: 'center', marginTop: 50 }}>Audit Log fetches from API via `/audit/:tenantId`. Use the Manifest tab to see real-time rides.</Text>
    </View>
  );

  const requestAppBuild = async () => {
    setIsSubmitting(true);
    try {
      const initiateTenantBuild = httpsCallable(functions, 'initiateTenantBuild');
      await initiateTenantBuild({ tenantId: activeTenantId, submitToStore: true });
    } catch (err: any) {
      Alert.alert('Build Request Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderAdminBranding = () => (
    <View style={styles.flowContainer}>
      <ScrollView contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeader}>PLATFORM THEME</Text>
        <TextInput style={[styles.inputField, { backgroundColor: '#131315', borderRadius: 8, marginBottom: 10 }]} value={previewBrand.primary} onChangeText={(v) => setPreviewBrand({...previewBrand, primary: v})} />
        <TextInput style={[styles.inputField, { backgroundColor: '#131315', borderRadius: 8, marginBottom: 10 }]} value={previewBrand.slogan} onChangeText={(v) => setPreviewBrand({...previewBrand, slogan: v})} />
        <TouchableOpacity style={[styles.primaryActionBtn, { backgroundColor: '#D4AF37' }]} onPress={handleMockUpload}><Text style={styles.primaryActionText}>Simulate Logo Upload</Text></TouchableOpacity>
        
        <View style={{ marginTop: 30, alignItems: 'center' }}>
          <Text style={{ color: '#8A8A8E', fontSize: 12, fontWeight: '700', marginBottom: 10, letterSpacing: 2 }}>DEVICE SIMULATOR</Text>
          <View style={{ flexDirection: 'row', marginBottom: 20 }}>
            <TouchableOpacity 
              style={{ padding: 10, borderWidth: 1, borderColor: previewDevice === 'MOBILE' ? previewBrand.primary : '#2A2A2D', borderRadius: 8, marginRight: 10, backgroundColor: previewDevice === 'MOBILE' ? '#1C1C1E' : 'transparent' }}
              onPress={() => setPreviewDevice('MOBILE')}>
              <Text style={{ color: previewDevice === 'MOBILE' ? previewBrand.primary : '#8A8A8E', fontWeight: 'bold' }}>📱 iPhone</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={{ padding: 10, borderWidth: 1, borderColor: previewDevice === 'TABLET' ? previewBrand.primary : '#2A2A2D', borderRadius: 8, backgroundColor: previewDevice === 'TABLET' ? '#1C1C1E' : 'transparent' }}
              onPress={() => setPreviewDevice('TABLET')}>
              <Text style={{ color: previewDevice === 'TABLET' ? previewBrand.primary : '#8A8A8E', fontWeight: 'bold' }}>💻 Tablet</Text>
            </TouchableOpacity>
          </View>

          <View style={[
            styles.quoteResultCard, 
            { 
              marginTop: 0, 
              backgroundColor: '#070708', 
              borderColor: previewBrand.primary,
              borderWidth: 4,
              width: previewDevice === 'MOBILE' ? 180 : 320,
              height: previewDevice === 'MOBILE' ? 350 : 220,
              borderRadius: previewDevice === 'MOBILE' ? 35 : 20,
              justifyContent: 'center'
            }
          ]}>
            {previewBrand.logoUrl ? (
              <Text style={{ color: previewBrand.primary, fontSize: 10, marginBottom: 10 }}>[LOGO MOCK]</Text>
            ) : null}
            <Text style={{ color: previewBrand.accent, fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 5 }}>LIVE VIEW</Text>
            <Text style={{ color: previewBrand.primary, fontSize: previewDevice === 'MOBILE' ? 24 : 32, fontWeight: '900', letterSpacing: 3, textAlign: 'center' }}>VELO APP</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '600', letterSpacing: 2, textAlign: 'center', marginTop: 5 }}>{previewBrand.slogan}</Text>
          </View>
        </View>

        <TouchableOpacity style={[styles.primaryActionBtn, { backgroundColor: '#34C759', marginTop: 40 }]} onPress={deployBranding}><Text style={styles.primaryActionText}>Deploy Branding to Fleet</Text></TouchableOpacity>
        
        {/* BUILD ORCHESTRATOR UI */}
        <View style={{ marginTop: 50, borderTopWidth: 1, borderTopColor: '#2A2A2D', paddingTop: 30 }}>
          <Text style={styles.sectionHeader}>APP STORE DEPLOYMENT</Text>
          <Text style={{ color: '#8A8A8E', marginBottom: 20 }}>Trigger the EAS CI/CD pipeline to compile your White-Label binaries and push them to App Store Connect and Google Play.</Text>
          
          <TouchableOpacity 
            style={[styles.primaryActionBtn, { backgroundColor: tenantBrand.accent, marginTop: 0 }]} 
            onPress={requestAppBuild}
            disabled={isSubmitting || (buildStatus && buildStatus.status !== 'LIVE')}>
            {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={[styles.primaryActionText, { color: '#FFFFFF' }]}>Request White-Label App Store Build</Text>}
          </TouchableOpacity>

          {buildStatus && (
            <View style={{ marginTop: 20, padding: 20, backgroundColor: '#131315', borderRadius: 12, borderWidth: 1, borderColor: buildStatus.status === 'LIVE' ? '#34C759' : '#FF9F0A' }}>
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>Status: {buildStatus.status.replace(/_/g, ' ')}</Text>
              <Text style={{ color: '#8A8A8E', marginTop: 5 }}>{buildStatus.message}</Text>
              
              <View style={{ height: 6, backgroundColor: '#2A2A2D', borderRadius: 3, marginTop: 15, overflow: 'hidden' }}>
                <View style={{ height: '100%', backgroundColor: buildStatus.status === 'LIVE' ? '#34C759' : '#FF9F0A', width: `${buildStatus.progress}%` }} />
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );

  const deployBranding = async () => {
    setIsSubmitting(true);
    try {
      await setDoc(doc(db, "Tenants", activeTenantId), { branding: previewBrand }, { merge: true });
      // Update is pushed to all clients via the onSnapshot listener automatically
      setAdminTab('MANIFEST');
    } catch (err: any) {
      Alert.alert('Deploy Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMockUpload = () => {
    setPreviewBrand({ ...previewBrand, logoUrl: 'https://via.placeholder.com/150/000000/FFFFFF/?text=VELO' });
    Alert.alert('Upload Simulated', 'Mock logo URL injected for Media Validator.');
  };

  // ----------------------------------------------------
  // UI RENDERERS
  // ----------------------------------------------------
  if (isAuthLoading) {
    return <SafeAreaView style={[styles.container, { justifyContent: 'center' }]}><ActivityIndicator size="large" color="#D4AF37" /></SafeAreaView>;
  }

  if (!user) {
    if (isPartnerSignup) {
      return (
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#070708" />
          <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
            <Text style={[styles.titleText, { color: tenantBrand.primary }]}>PARTNER PORTAL</Text>
            <Text style={[styles.subtitleText, { color: tenantBrand.accent }]}>PROVISION NEW TENANT INSTANCE</Text>
            
            <View style={[styles.inputCard, { marginTop: 40 }]}>
              <TextInput style={styles.inputField} placeholder="Company Name" placeholderTextColor="#8A8A8E" value={companyName} onChangeText={setCompanyName} />
              <View style={styles.inputDivider} />
              <TextInput style={styles.inputField} placeholder="Business Email" placeholderTextColor="#8A8A8E" autoCapitalize="none" value={email} onChangeText={setEmail} />
              <View style={styles.inputDivider} />
              <TextInput style={styles.inputField} placeholder="Admin Password" placeholderTextColor="#8A8A8E" secureTextEntry value={password} onChangeText={setPassword} />
              <View style={styles.inputDivider} />
              <TextInput style={styles.inputField} placeholder="VAT Number" placeholderTextColor="#8A8A8E" value={vatNumber} onChangeText={setVatNumber} />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 }}>
              <TouchableOpacity onPress={() => setChargingModel('FIXED')}><Text style={{ color: chargingModel === 'FIXED' ? tenantBrand.primary : '#8A8A8E', fontWeight: 'bold' }}>FIXED</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setChargingModel('PERCENTAGE')}><Text style={{ color: chargingModel === 'PERCENTAGE' ? tenantBrand.primary : '#8A8A8E', fontWeight: 'bold' }}>PERCENTAGE</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setChargingModel('HYBRID')}><Text style={{ color: chargingModel === 'HYBRID' ? tenantBrand.primary : '#8A8A8E', fontWeight: 'bold' }}>HYBRID</Text></TouchableOpacity>
            </View>
            
            <TouchableOpacity style={[styles.primaryActionBtn, { backgroundColor: tenantBrand.primary, marginTop: 30 }]} onPress={handlePartnerSignup}>
              {isSubmitting ? <ActivityIndicator color="#070708" /> : <Text style={styles.primaryActionText}>Create Tenant Instance</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 20 }} onPress={() => setIsPartnerSignup(false)}>
              <Text style={{ color: '#8A8A8E', textAlign: 'center', fontWeight: 'bold' }}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#070708" />
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
          <Text style={[styles.titleText, { color: tenantBrand.primary }]}>VELO PLATFORM</Text>
          <Text style={[styles.subtitleText, { color: tenantBrand.accent }]}>{tenantBrand.slogan}</Text>
          
          <View style={[styles.inputCard, { marginTop: 40 }]}>
            <TextInput style={styles.inputField} placeholder="Customer/Admin Email" placeholderTextColor="#8A8A8E" autoCapitalize="none" value={email} onChangeText={setEmail} />
            <View style={styles.inputDivider} />
            <TextInput style={styles.inputField} placeholder="Password" placeholderTextColor="#8A8A8E" secureTextEntry value={password} onChangeText={setPassword} />
          </View>
          
          <TouchableOpacity style={[styles.primaryActionBtn, { backgroundColor: tenantBrand.primary }]} onPress={() => handleLogin(false)}>
            {isSubmitting ? <ActivityIndicator color="#070708" /> : <Text style={styles.primaryActionText}>Login</Text>}
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
            <TouchableOpacity onPress={handleSignup}>
              <Text style={{ color: '#8A8A8E', fontWeight: 'bold' }}>New Customer</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsPartnerSignup(true)}>
              <Text style={{ color: tenantBrand.primary, fontWeight: 'bold' }}>Partner Signup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!selectedRole) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#070708" />
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 40 }}>
          <Text style={{ color: tenantBrand.primary, fontWeight: '800', letterSpacing: 2 }}>WELCOME BACK</Text>
          <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '700', marginTop: 5 }}>{user.email}</Text>
          
          <TouchableOpacity style={[styles.roleButton, { marginTop: 40 }]} onPress={() => setSelectedRole('PERSONAL')}>
            <Text style={styles.roleButtonTitle}>Personal Account</Text>
          </TouchableOpacity>

          {(userRole === 'customer_corporate' || userRole === 'admin_controller') && (
            <TouchableOpacity style={styles.roleButton} onPress={() => setSelectedRole('CORPORATE')}>
              <Text style={styles.roleButtonTitle}>Corporate Book-for-Guest</Text>
            </TouchableOpacity>
          )}

          {userRole === 'admin_controller' && (
            <TouchableOpacity style={[styles.roleButton, { borderColor: tenantBrand.primary }]} onPress={() => setSelectedRole('ADMIN')}>
              <Text style={[styles.roleButtonTitle, { color: tenantBrand.primary }]}>Administrative Controller</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={{ marginTop: 'auto', marginBottom: 40 }} onPress={handleLogout}>
            <Text style={styles.switchRoleText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#070708" />
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: tenantBrand.primary }]}>VELO {selectedRole}</Text>
        <TouchableOpacity onPress={() => setSelectedRole(null)}><Text style={styles.switchRoleText}>Exit</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.flowContainer}>
          {selectedRole === 'PERSONAL' && flowState === 'QUOTE' && (
            <>
              <Text style={styles.sectionHeader}>{tenantBrand.slogan}</Text>
              <View style={styles.inputCard}>
                <TextInput style={styles.inputField} placeholder="Pickup Location" placeholderTextColor="#8A8A8E" value={pickup} onChangeText={setPickup} />
                <View style={styles.inputDivider} />
                <TextInput style={styles.inputField} placeholder="Dropoff Destination" placeholderTextColor="#8A8A8E" value={dropoff} onChangeText={setDropoff} />
              </View>
              <TouchableOpacity style={[styles.primaryActionBtn, { backgroundColor: tenantBrand.primary }]} onPress={getQuoteFromAPI}>
                {isSubmitting ? <ActivityIndicator color="#070708" /> : <Text style={styles.primaryActionText}>Get Fixed Price Quote</Text>}
              </TouchableOpacity>
              {quotePrice && (
                <View style={[styles.quoteResultCard, { borderColor: tenantBrand.primary }]}>
                  <Text style={[styles.quoteValue, { color: tenantBrand.primary }]}>£{quotePrice}.00</Text>
                  <TouchableOpacity style={[styles.primaryActionBtn, { marginTop: 20, backgroundColor: tenantBrand.accent }]} onPress={() => setFlowState('PAYMENT')}><Text style={[styles.primaryActionText, { color: '#fff' }]}>Proceed to Payment</Text></TouchableOpacity>
                </View>
              )}
            </>
          )}
          {selectedRole === 'PERSONAL' && flowState === 'PAYMENT' && (
             <TouchableOpacity style={[styles.primaryActionBtn, { marginTop: 30, backgroundColor: tenantBrand.primary }]} onPress={dispatchBookingToAPI}>
             {isSubmitting ? <ActivityIndicator color="#070708" /> : <Text style={styles.primaryActionText}>Pay & Request Ride (JWT Secured)</Text>}
           </TouchableOpacity>
          )}
          {selectedRole === 'ADMIN' && (
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                <TouchableOpacity onPress={() => setAdminTab('MANIFEST')}><Text style={{ color: adminTab === 'MANIFEST' ? tenantBrand.primary : '#8A8A8E', fontWeight: 'bold' }}>MANIFEST</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setAdminTab('AUDIT')}><Text style={{ color: adminTab === 'AUDIT' ? tenantBrand.primary : '#8A8A8E', fontWeight: 'bold' }}>AUDIT LOGS</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setAdminTab('BRANDING')}><Text style={{ color: adminTab === 'BRANDING' ? tenantBrand.primary : '#8A8A8E', fontWeight: 'bold' }}>BRANDING</Text></TouchableOpacity>
              </View>
              {adminTab === 'MANIFEST' && renderAdminManifest()}
              {adminTab === 'AUDIT' && renderAdminAudit()}
              {adminTab === 'BRANDING' && renderAdminBranding()}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070708' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#1A1A1D' },
  headerTitle: { fontSize: 16, fontWeight: '800', letterSpacing: 2 },
  switchRoleText: { color: '#FF3B30', fontWeight: 'bold' },
  flowContainer: { flex: 1, padding: 24 },
  sectionHeader: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', letterSpacing: 3, marginBottom: 15 },
  inputCard: { backgroundColor: '#131315', borderRadius: 12, padding: 5, borderWidth: 1, borderColor: '#2A2A2D' },
  inputField: { color: '#FFFFFF', fontSize: 16, padding: 16 },
  inputDivider: { height: 1, backgroundColor: '#2A2A2D', marginHorizontal: 16 },
  primaryActionBtn: { padding: 18, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  primaryActionText: { color: '#070708', fontSize: 16, fontWeight: '700' },
  quoteResultCard: { marginTop: 30, backgroundColor: '#131315', padding: 24, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  quoteValue: { fontSize: 42, fontWeight: '900', letterSpacing: 2 },
  roleButton: { backgroundColor: '#131315', borderWidth: 1, borderColor: '#2A2A2D', borderRadius: 12, padding: 20, marginBottom: 16 },
  roleButtonTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 4 }
});

export default App;
