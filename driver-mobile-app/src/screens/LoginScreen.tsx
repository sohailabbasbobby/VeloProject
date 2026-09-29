import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLOURS } from '../constants/theme';
import { signIn, requestOtp, verifyOtp } from '../api/auth';

type LoginMode = 'PASSWORD' | 'OTP_REQUEST' | 'OTP_VERIFY';

export function LoginScreen({ onSignedIn }: { onSignedIn: () => void }) {
  const [mode, setMode] = useState<LoginMode>('PASSWORD');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpNotice, setOtpNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitPassword = async () => {
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
      setError(err?.message || 'Sign-in failed.');
    } finally {
      setBusy(false);
    }
  };

  const submitOtpRequest = async () => {
    setError(null);
    if (!phone) {
      setError('Enter the mobile number registered with your operator.');
      return;
    }
    setBusy(true);
    try {
      const result = await requestOtp(phone);
      setMode('OTP_VERIFY');
      setOtpNotice(
        result.sent
          ? `Code sent to ${phone}. It expires in ${Math.round(result.expiresInSeconds / 60)} minutes.`
          : 'SMS delivery is not configured on this deployment — ask dispatch for the current verification code.'
      );
    } catch (err: any) {
      setError(err?.message || 'Could not send the verification code.');
    } finally {
      setBusy(false);
    }
  };

  const submitOtpVerify = async () => {
    setError(null);
    if (!otp) {
      setError('Enter the 6-digit verification code.');
      return;
    }
    setBusy(true);
    try {
      await verifyOtp(phone, otp);
      onSignedIn();
    } catch (err: any) {
      setError(err?.message || 'Verification failed.');
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

      {mode === 'PASSWORD' && (
        <>
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
          <TouchableOpacity style={[styles.button, busy && { opacity: 0.6 }]} onPress={submitPassword} disabled={busy}>
            {busy ? <ActivityIndicator color="#0B0B0C" /> : <Text style={styles.buttonText}>SIGN IN</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setMode('OTP_REQUEST'); setError(null); }}>
            <Text style={styles.link}>SIGN IN WITH PHONE NUMBER →</Text>
          </TouchableOpacity>
        </>
      )}

      {mode === 'OTP_REQUEST' && (
        <>
          <Text style={styles.label}>MOBILE NUMBER</Text>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            keyboardType="phone-pad"
            placeholder="+447700900123"
            placeholderTextColor="#555"
            value={phone}
            onChangeText={setPhone}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity style={[styles.button, busy && { opacity: 0.6 }]} onPress={submitOtpRequest} disabled={busy}>
            {busy ? <ActivityIndicator color="#0B0B0C" /> : <Text style={styles.buttonText}>SEND VERIFICATION CODE</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setMode('PASSWORD'); setError(null); }}>
            <Text style={styles.link}>← USE EMAIL AND PASSWORD</Text>
          </TouchableOpacity>
        </>
      )}

      {mode === 'OTP_VERIFY' && (
        <>
          {otpNotice ? <Text style={styles.notice}>{otpNotice}</Text> : null}
          <Text style={styles.label}>VERIFICATION CODE</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="000000"
            placeholderTextColor="#555"
            value={otp}
            onChangeText={setOtp}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity style={[styles.button, busy && { opacity: 0.6 }]} onPress={submitOtpVerify} disabled={busy}>
            {busy ? <ActivityIndicator color="#0B0B0C" /> : <Text style={styles.buttonText}>VERIFY AND SIGN IN</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setMode('OTP_REQUEST'); setError(null); }}>
            <Text style={styles.link}>← RESEND CODE</Text>
          </TouchableOpacity>
        </>
      )}

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
  notice: { color: '#D4AF37', fontSize: 12, marginBottom: 10 },
  button: { backgroundColor: '#D4AF37', borderRadius: 8, padding: 15, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#0B0B0C', fontWeight: '900', letterSpacing: 2 },
  link: { color: '#8A8A8E', fontSize: 11, letterSpacing: 2, textAlign: 'center', marginTop: 18 },
  footer: { color: '#555', fontSize: 9, letterSpacing: 1.5, textAlign: 'center', marginTop: 30 },
});
