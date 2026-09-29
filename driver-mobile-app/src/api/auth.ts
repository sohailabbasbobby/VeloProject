import auth, { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as fbSignOut, type FirebaseUser } from '@react-native-firebase/auth';

/**
 * REAL FIREBASE AUTHENTICATION (§5, §7.3)
 * The previous bypassed/mock session is removed. Login uses Firebase Auth; the
 * backend resolves the signed-in uid to the driver record (drivers.firebase_uid).
 */

export const signIn = async (email: string, password: string): Promise<FirebaseUser> => {
  const cred = await signInWithEmailAndPassword(getAuth(), email.trim(), password);
  return cred.user;
};

export const register = async (email: string, password: string): Promise<FirebaseUser> => {
  const cred = await createUserWithEmailAndPassword(getAuth(), email.trim(), password);
  return cred.user;
};

export const signOut = async (): Promise<void> => {
  await fbSignOut(getAuth());
};

export const watchAuth = (cb: (user: FirebaseUser | null) => void): (() => void) =>
  onAuthStateChanged(getAuth(), cb);

export const getCurrentIdToken = async (): Promise<string | null> => {
  const user = auth().currentUser;
  if (!user) return null;
  return user.getIdToken();
};
