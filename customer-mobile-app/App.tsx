/**
 * VELO CUSTOMER APP — Root Entry Point (LIVE, §6)
 *
 * Real Firebase Auth (native SDK, no emulators, no mock API keys). The personal
 * booking experience is served by HomeScreen, which talks to backend-core over
 * HTTP with the Firebase ID token attached (src/api/client.ts).
 */

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { HomeScreen } from './src/screens/HomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import './src/i18n';
import { watchAuth, signOut } from './src/api/auth';

const App = () => {
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = watchAuth((currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
    return unsubscribe;
  }, []);

  if (!authReady) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0B0B0C" />
        <LoginScreen onSignedIn={() => undefined} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0C" />
      <View style={styles.sessionBar}>
        <Text style={styles.sessionEmail}>{user.email}</Text>
        <TouchableOpacity onPress={() => signOut()}>
          <Text style={styles.signOut}>SIGN OUT</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flex: 1 }}>
        <HomeScreen />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B0C' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  sessionBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#131315',
    borderBottomWidth: 1, borderBottomColor: '#222',
  },
  sessionEmail: { color: '#8A8A8E', fontSize: 11 },
  signOut: { color: '#D4AF37', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
});

export default App;
