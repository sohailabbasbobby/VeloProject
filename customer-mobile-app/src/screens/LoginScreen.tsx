import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { register, signIn, requestOtp, verifyOtp } from '../api/auth';

type LoginMode = 'LOGIN' | 'SIGNUP' | 'OTP_REQUEST' | 'OTP_VERIFY';

export function LoginScreen({ onSignedIn }: { onSignedIn: () => void }) {
  const [mode, setMode] = useState<LoginMode>('LOGIN');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpNotice, setOtpNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!email || !password || (mode === 'SIGNUP' && !fullName)) {
      setError('Please complete all fields.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'SIGNUP') {
        await register(email, password, fullName);
      } else {
        await signIn(email, password);
      }
      onSignedIn();
    } catch (err: any) {
      setError(err?.message || 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  };

  const submitOtpRequest = async () => {
    setError(null);
    if (!phone) {
      setError('Enter your mobile number to continue.');
      return;
    }
    setBusy(true);
    try {
      const result = await requestOtp(phone);
      setMode('OTP_VERIFY');
      setOtpNotice(
        result.sent
          ? `Code sent to ${phone}. It expires in ${Math.round(result.expiresInSeconds / 60)} minutes.`
          : 'SMS delivery is not configured on this deployment — contact your concierge for the current verification code.'
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
      await verifyOtp(phone, otp, fullName || undefined);
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
        <Text style={styles.brandSub}>EXECUTIVE CHAUFFEURS</Text>
      </View>

      {mode === 'SIGNUP' && (
        <>
          <Text style={styles.label}>FULL NAME</Text>
          <TextInput style={styles.input} placeholder="Alexander Sterling" placeholderTextColor="#555" value={fullName} onChangeText={setFullName} />
        </>
      )}

      {(mode === 'LOGIN' || mode === 'SIGNUP') && (
        <>
          <Text style={styles.label}>EMAIL</Text>
          <TextInput style={styles.input} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" placeholderTextColor="#555" value={email} onChangeText={setEmail} />
          <Text style={styles.label}>PASSWORD</Text>
          <TextInput style={styles.input} secureTextEntry placeholder="••••••••" placeholderTextColor="#555" value={password} onChangeText={setPassword} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity style={[styles.button, busy && { opacity: 0.6 }]} onPress={submit} disabled={busy}>
            {busy ? <ActivityIndicator color="#0B0B0C" /> : <Text style={styles.buttonText}>{mode === 'LOGIN' ? 'SIGN IN' : 'CREATE ACCOUNT'}</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMode(mode === 'LOGIN' ? 'SIGNUP' : 'LOGIN')} style={{ marginTop: 14 }}>
            <Text style={styles.switchText}>
              {mode === 'LOGIN' ? 'New to Velo? Create an account' : 'Already registered? Sign in'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setMode('OTP_REQUEST'); setError(null); }}>
            <Text style={styles.switchText}>Continue with your phone number →</Text>
          </TouchableOpacity>
        </>
      )}

      {mode === 'OTP_REQUEST' && (
        <>
          <Text style={styles.label}>MOBILE NUMBER</Text>
          <TextInput style={styles.input} autoCapitalize="none" keyboardType="phone-pad" placeholder="+447700900123" placeholderTextColor="#555" value={phone} onChangeText={setPhone} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity style={[styles.button, busy && { opacity: 0.6 }]} onPress={submitOtpRequest} disabled={busy}>
            {busy ? <ActivityIndicator color="#0B0B0C" /> : <Text style={styles.buttonText}>SEND VERIFICATION CODE</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setMode('LOGIN'); setError(null); }}>
            <Text style={styles.switchText}>← Use email and password</Text>
          </TouchableOpacity>
        </>
      )}

      {mode === 'OTP_VERIFY' && (
        <>
          {otpNotice ? <Text style={styles.notice}>{otpNotice}</Text> : null}
          <Text style={styles.label}>VERIFICATION CODE</Text>
          <TextInput style={styles.input} keyboardType="number-pad" maxLength={6} placeholder="000000" placeholderTextColor="#555" value={otp} onChangeText={setOtp} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity style={[styles.button, busy && { opacity: 0.6 }]} onPress={submitOtpVerify} disabled={busy}>
            {busy ? <ActivityIndicator color="#0B0B0C" /> : <Text style={styles.buttonText}>VERIFY AND CONTINUE</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setMode('OTP_REQUEST'); setError(null); }}>
            <Text style={styles.switchText}>← Resend code</Text>
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
  input: { backgroundColor: '#1A1A1B', borderColor: '#2a2a2c', borderWidth: 1, borderRadius: 8, color: '#fff', padding: 13, marginBottom: 14, fontSize: 15 },
  error: { color: '#ff6b6b', fontSize: 12, marginBottom: 10 },
  notice: { color: '#D4AF37', fontSize: 12, marginBottom: 10 },
  button: { backgroundColor: '#D4AF37', borderRadius: 8, padding: 15, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#0B0B0C', fontWeight: '900', letterSpacing: 2 },
  switchText: { color: '#888', textAlign: 'center', fontSize: 13, marginTop: 10 },
  footer: { color: '#555', fontSize: 9, letterSpacing: 1.5, textAlign: 'center', marginTop: 30 },
});
