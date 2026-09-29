import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as fbSignOut, onAuthStateChanged } from '@react-native-firebase/auth';

/**
 * REAL FIREBASE AUTHENTICATION (§6, §7.3) — the mock "MOCK-API-KEY" web-SDK
 * session with emulators is replaced by the native Firebase Auth SDK.
 */
export const signIn = async (email: string, password: string) => {
  const cred = await signInWithEmailAndPassword(getAuth(), email.trim(), password);
  return cred.user;
};

export const register = async (email: string, password: string, displayName?: string) => {
  void displayName; // profile name is stored on the private_clients record server-side
  const cred = await createUserWithEmailAndPassword(getAuth(), email.trim(), password);
  return cred.user;
};

export const signOut = async (): Promise<void> => {
  await fbSignOut(getAuth());
};

export const watchAuth = (cb: (user: any | null) => void): (() => void) =>
  onAuthStateChanged(getAuth(), cb);
