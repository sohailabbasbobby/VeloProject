declare module '@react-native-firebase/auth' {
  export interface FirebaseUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    getIdToken: (forceRefresh?: boolean) => Promise<string>;
  }

  const auth: any;
  export default auth;
  export const getAuth: (app?: any) => any;
  export const onAuthStateChanged: (authInstance: any, cb: (user: FirebaseUser | null) => void) => () => void;
  export const signInWithEmailAndPassword: (authInstance: any, email: string, password: string) => Promise<{ user: FirebaseUser }>;
  export const createUserWithEmailAndPassword: (authInstance: any, email: string, password: string) => Promise<{ user: FirebaseUser }>;
  export const signOut: (authInstance: any) => Promise<void>;
}
