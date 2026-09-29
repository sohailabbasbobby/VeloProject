import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLOURS } from '../constants/theme';
import { signIn } from '../api/auth';

export function LoginScreen({ onSignedIn }: { onSignedIn: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!email || !password) {
      setError('Enter your operator-issued email and password.');
      return;
    }
    setBusy(true);
    try {
      await signIn(email, password);
      onSignedIn();
    } catch (err: any) {
      setError(err?.message?.replace('Firebase: ', '') || 'Sign-in failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.logoBlock}>
        <Text style={styles.brand}>VELO</Text>
        <Text style={styles.brandSub}>EXECUTIVE · CHAUFFEUR PORTAL</Text>
      </View>

      <Text style={styles.label}>EMAIL</Text>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="driver@operator.co.uk"
        placeholderTextColor="#555"
        value={email}
        onChangeText={setEmail}
      />
      <Text style={styles.label}>PASSWORD</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        placeholder="••••••••"
        placeholderTextColor="#555"
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={[styles.button, busy && { opacity: 0.6 }]} onPress={submit} disabled={busy}>
        {busy ? <ActivityIndicator color="#0B0B0C" /> : <Text style={styles.buttonText}>SIGN IN</Text>}
      </TouchableOpacity>

      <Text style={styles.footer}>Verified by Velo AI Security Protocol</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B0C', justifyContent: 'center', padding: 28 },
  logoBlock: { alignItems: 'center', marginBottom: 42 },
  brand: { color: '#D4AF37', fontSize: 40, fontWeight: '900', letterSpacing: 12 },
  brandSub: { color: '#777', fontSize: 10, letterSpacing: 3, marginTop: 6 },
  label: { color: '#888', fontSize: 10, letterSpacing: 2, marginBottom: 6 },
  input: {
    backgroundColor: '#1A1A1B', borderColor: '#2a2a2c', borderWidth: 1, borderRadius: 8,
    color: '#fff', padding: 13, marginBottom: 14, fontSize: 15,
  },
  error: { color: '#ff6b6b', fontSize: 12, marginBottom: 10 },
  button: { backgroundColor: '#D4AF37', borderRadius: 8, padding: 15, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#0B0B0C', fontWeight: '900', letterSpacing: 2 },
  footer: { color: '#555', fontSize: 9, letterSpacing: 1.5, textAlign: 'center', marginTop: 30 },
});
