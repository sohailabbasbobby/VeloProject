/**
 * SELF-HOSTED AUTH (Jawa Ride pattern) — customer app client.
 *
 * Four sign-in methods, one session system, all issued by OUR backend
 * (/api/auth/*) as PRIVATE_CLIENT identities. Access + refresh tokens persist
 * in AsyncStorage; the API client rotates transparently on 401. No Firebase.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE, onSessionExpired } from './client';

export { onSessionExpired };

const ACCESS_KEY = 'velo.auth.accessToken';
const REFRESH_KEY = 'velo.auth.refreshToken';
const ACTOR_KEY = 'velo.auth.actor';

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
    await AsyncStorage.setItem(ACCESS_KEY, s.accessToken);
    await AsyncStorage.setItem(REFRESH_KEY, s.refreshToken);
    await AsyncStorage.setItem(ACTOR_KEY, JSON.stringify(s.actor));
};

export const clearSession = async (): Promise<void> => {
    await AsyncStorage.removeItem(ACCESS_KEY);
    await AsyncStorage.removeItem(REFRESH_KEY);
    await AsyncStorage.removeItem(ACTOR_KEY);
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

/** Session shape for the app root: truthy user means signed-in. */
export interface CurrentUser {
    email: string | null;
    displayName: string | null;
    actor: SessionActor;
}

const toUser = async (s: SessionPayload): Promise<CurrentUser> => ({
    email: s.actor.displayName ?? null,
    displayName: s.actor.displayName,
    actor: s.actor,
});

/** Restores a persisted session on app start; null when signed out. */
export const restoreSession = async (): Promise<CurrentUser | null> => {
    const access = await getAccessToken();
    const refresh = await getRefreshToken();
    if (!access || !refresh) {
        await clearSession();
        return null;
    }
    const actorRaw = await AsyncStorage.getItem(ACTOR_KEY);
    const actor: SessionActor = actorRaw ? JSON.parse(actorRaw) : { type: 'PRIVATE_CLIENT', id: '', tenantId: '', displayName: null };
    return { email: actor.displayName ?? null, displayName: actor.displayName, actor };
};

// ------------------------------------------------------------------ 1. email + password
export const signIn = async (email: string, password: string): Promise<CurrentUser> =>
    toUser(await postAuth('/api/auth/login', { actorType: 'PRIVATE_CLIENT', email: email.trim(), password }));

export const register = async (email: string, password: string, displayName?: string): Promise<CurrentUser> =>
    toUser(await postAuth('/api/auth/register', {
        actorType: 'PRIVATE_CLIENT',
        email: email.trim(),
        password,
        displayName,
        profile: { email: email.trim() },
    }));

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

export const verifyOtp = async (phone: string, code: string, displayName?: string): Promise<CurrentUser> =>
    toUser(await postAuth('/api/auth/otp/verify', {
        phone: phone.trim(), code, actorType: 'PRIVATE_CLIENT', autoProvision: true, displayName,
    }));

// ------------------------------------------------------------------ 3. Google (native SDK ID token)
export const signInWithGoogle = async (idToken: string): Promise<CurrentUser> =>
    toUser(await postAuth('/api/auth/google', { idToken, actorType: 'PRIVATE_CLIENT', autoProvision: true }));

// ------------------------------------------------------------------ 4. Apple (native identity token)
export const signInWithApple = async (identityToken: string, nonce?: string): Promise<CurrentUser> =>
    toUser(await postAuth('/api/auth/apple', { identityToken, nonce, actorType: 'PRIVATE_CLIENT', autoProvision: true }));

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
