/**
 * VELO CUSTOMER APP — Root Entry Point (LIVE, §6)
 *
 * Self-hosted authentication (no Firebase): password / OTP / Google / Apple all
 * end in OUR session tokens persisted on-device. The personal booking
 * experience is served by HomeScreen, which talks to backend-core over HTTP
 * with our access token attached (src/api/client.ts).
 */

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { HomeScreen } from './src/screens/HomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import './src/i18n';
import { restoreSession, signOut, onSessionExpired, type CurrentUser } from './src/api/auth';
import { registerPushToken } from './src/api/client';
import { Platform } from 'react-native';

const App = () => {
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    restoreSession()
      .then((session) => {
        setUser(session);
        setAuthReady(true);
      })
      .catch(() => {
        setUser(null);
        setAuthReady(true);
      });

    // Fatal 401 (refresh failed) bounces back to login.
    return onSessionExpired(() => setUser(null));
  }, []);

  // ── Push registration (final-mile §2): register this device once signed in ───
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const platform = Platform.OS === 'ios' ? 'APNS' : 'FCM';
        // Token provisioning needs the native FCM/APNs modules on-device. When the
        // messaging module is present we register the real token; otherwise this is
        // an honest no-op (the backend also no-ops delivery without provider keys).
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
          console.log('[push] No native FCM/APNs token on this build; device not registered.');
          return;
        }
        if (cancelled) return;
        const result = await registerPushToken(nativeToken, platform);
        console.log('[push] registered:', result?.registered, '| delivery configured:', result?.deliveryConfigured);
      } catch (e: any) {
        console.log('[push] registration failed (non-fatal):', e?.message);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

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
        <Text style={styles.sessionEmail}>{user.displayName || user.email || 'Velo Client'}</Text>
        <TouchableOpacity onPress={() => { signOut().then(() => setUser(null)); }}>
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
    paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#111111',
  },
  sessionEmail: { color: '#8A8A8E', fontSize: 12 },
  signOut: { color: '#D4AF37', fontSize: 11, letterSpacing: 1.5, fontWeight: '700' },
});

export default App;
