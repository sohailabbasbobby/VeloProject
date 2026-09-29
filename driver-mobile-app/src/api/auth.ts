/**
 * SELF-HOSTED AUTH (Jawa Ride pattern) — driver app client.
 *
 * Four sign-in methods, one session system, all issued by OUR backend
 * (/api/auth/*). Access + refresh tokens persist in AsyncStorage; the access
 * token is refreshed transparently by the API client on 401. No Firebase.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE, onSessionExpired } from './client';
export { onSessionExpired };

const ACCESS_KEY = 'velo.auth.accessToken';
const REFRESH_KEY = 'velo.auth.refreshToken';

export interface SessionActor {
    type: 'DRIVER' | 'PRIVATE_CLIENT';
    id: string;
    tenantId: string;
    displayName: string | null;
}

export interface SessionPayload {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresIn: number;
    actor: SessionActor;
}

export const getAccessToken = async (): Promise<string | null> => AsyncStorage.getItem(ACCESS_KEY);
export const getRefreshToken = async (): Promise<string | null> => AsyncStorage.getItem(REFRESH_KEY);

const storeSession = async (s: SessionPayload): Promise<void> => {
    // AsyncStorage v3 dropped the multi* APIs — write keys individually.
    await AsyncStorage.setItem(ACCESS_KEY, s.accessToken);
    await AsyncStorage.setItem(REFRESH_KEY, s.refreshToken);
};

export const clearSession = async (): Promise<void> => {
    await AsyncStorage.removeItem(ACCESS_KEY);
    await AsyncStorage.removeItem(REFRESH_KEY);
};

/** Exchange a stored refresh token for a fresh pair (used by the API client on 401). */
export const refreshSession = async (): Promise<string | null> => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return null;
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
        await clearSession();
        return null;
    }
    await storeSession(json.data as SessionPayload);
    return json.data.accessToken as string;
};

const postAuth = async (path: string, body: Record<string, unknown>): Promise<SessionPayload> => {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
        throw new Error(json?.error || `Authentication failed (${res.status})`);
    }
    await storeSession(json.data as SessionPayload);
    return json.data as SessionPayload;
};

/** Restores a persisted session on app start; null when signed out. */
export const restoreSession = async (): Promise<SessionPayload | null> => {
    const access = await getAccessToken();
    if (!access) return null;
    // Trust-then-verify: if the access token is stale the API client refreshes
    // on first 401; here we just re-assert the session shape.
    const refresh = await getRefreshToken();
    if (!refresh) {
        await clearSession();
        return null;
    }
    return { accessToken: access, refreshToken: refresh, accessTokenExpiresIn: 0, actor: { type: 'DRIVER', id: '', tenantId: '', displayName: null } };
};

// ------------------------------------------------------------------ 1. email + password
export const signIn = async (email: string, password: string): Promise<SessionPayload> =>
    postAuth('/api/auth/login', { actorType: 'DRIVER', email: email.trim(), password });

export const register = async (email: string, password: string, displayName?: string): Promise<SessionPayload> =>
    postAuth('/api/auth/register', {
        actorType: 'DRIVER',
        email: email.trim(),
        password,
        displayName,
        profile: { email: email.trim() },
    });

// ------------------------------------------------------------------ 2. phone + OTP
export const requestOtp = async (phone: string): Promise<{ sent: boolean; provider: string; expiresInSeconds: number }> => {
    const res = await fetch(`${API_BASE}/api/auth/otp/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) throw new Error(json?.error || 'Could not send the verification code.');
    return json.data;
};

export const verifyOtp = async (phone: string, code: string): Promise<SessionPayload> =>
    postAuth('/api/auth/otp/verify', {
        phone: phone.trim(),
        code,
        actorType: 'DRIVER',
        autoProvision: true,
    });

// ------------------------------------------------------------------ 3. Google (native SDK ID token)
export const signInWithGoogle = async (idToken: string): Promise<SessionPayload> =>
    postAuth('/api/auth/google', { idToken, actorType: 'DRIVER', autoProvision: true });

// ------------------------------------------------------------------ 4. Apple (native identity token)
export const signInWithApple = async (identityToken: string, nonce?: string): Promise<SessionPayload> =>
    postAuth('/api/auth/apple', { identityToken, nonce, actorType: 'DRIVER', autoProvision: true });

export const signOut = async (): Promise<void> => {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
        await fetch(`${API_BASE}/api/auth/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        }).catch(() => undefined);
    }
    await clearSession();
};
