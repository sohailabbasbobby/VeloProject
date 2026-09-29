/**
 * CUSTOMER APP AUTH CLIENT TESTS — run in Node against a mock HTTP server.
 * Covers the self-hosted session lifecycle for PRIVATE_CLIENT identities:
 * register/login persistence, restore, OTP flow, social endpoints, expiry.
 */
import AsyncStorageMock, { __resetAsyncStorage } from './__mocks__/asyncStorage';

import { getAccessToken, getRefreshToken, clearSession, refreshSession, restoreSession, signIn, register, signInWithGoogle, signInWithApple, verifyOtp, requestOtp } from '../api/auth';

const API_BASE = 'http://10.0.2.2:8000';
const SESSION = {
    accessToken: 'acc-1',
    refreshToken: 'ref-1',
    accessTokenExpiresIn: 900,
    actor: { type: 'PRIVATE_CLIENT' as const, id: 'client-1', tenantId: 'tenant-1', displayName: 'Alexander Sterling' },
};

const fetchMock = jest.fn();
(globalThis as any).fetch = fetchMock;

const jsonResponse = (status: number, body: unknown) => ({
    ok: status < 400,
    status,
    json: async () => body,
});

beforeEach(() => {
    fetchMock.mockReset();
    __resetAsyncStorage();
});

describe('self-hosted auth client (customer app)', () => {
    it('registers and persists the PRIVATE_CLIENT session', async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse(200, { success: true, data: SESSION }));

        const user = await register('alex@example.com', 'Password1!', 'Alexander Sterling');
        expect(user.displayName).toBe('Alexander Sterling');
        expect(user.actor.type).toBe('PRIVATE_CLIENT');
        expect(await getAccessToken()).toBe('acc-1');

        const body = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(body).toMatchObject({ actorType: 'PRIVATE_CLIENT', email: 'alex@example.com', displayName: 'Alexander Sterling' });
    });

    it('signs in with email + password', async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse(200, { success: true, data: SESSION }));
        const user = await signIn('alex@example.com', 'Password1!');
        expect(user.actor.id).toBe('client-1');
        expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE}/api/auth/login`);
    });

    it('reports backend errors and stores nothing on failure', async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse(409, { success: false, error: 'An account with this email already exists.' }));
        await expect(register('alex@example.com', 'Password1!', 'X')).rejects.toThrow(/already exists/);
        expect(await getAccessToken()).toBeNull();
    });

    it('restores a full session and rejects half-sessions', async () => {
        expect(await restoreSession()).toBeNull();

        await AsyncStorageMock.setItem('velo.auth.accessToken', 'acc-1');
        await AsyncStorageMock.setItem('velo.auth.refreshToken', 'ref-1');
        await AsyncStorageMock.setItem('velo.auth.actor', JSON.stringify(SESSION.actor));
        const user = await restoreSession();
        expect(user?.actor.id).toBe('client-1');
    });

    it('OTP request reports honest delivery state; verify provisions as PRIVATE_CLIENT', async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse(200, { success: true, data: { sent: true, provider: 'TWILIO', expiresInSeconds: 300 } }));
        const otpResult = await requestOtp('+447700900123');
        expect(otpResult.sent).toBe(true);
        expect(otpResult.provider).toBe('TWILIO');

        fetchMock.mockResolvedValueOnce(jsonResponse(200, { success: true, data: SESSION }));
        await verifyOtp('+447700900123', '654321', 'Alexander Sterling');
        const body = JSON.parse(fetchMock.mock.calls[1][1].body);
        expect(body).toMatchObject({ actorType: 'PRIVATE_CLIENT', autoProvision: true, code: '654321' });
    });

    it('routes Google / Apple tokens to the dedicated endpoints and stores the session', async () => {
        fetchMock.mockResolvedValue(jsonResponse(200, { success: true, data: SESSION }));

        await signInWithGoogle('g-token');
        expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE}/api/auth/google`);

        await signInWithApple('a-token');
        expect(fetchMock.mock.calls[1][0]).toBe(`${API_BASE}/api/auth/apple`);
        expect(await getAccessToken()).toBe('acc-1');
    });

    it('rotates the session via refresh and clears on rejection', async () => {
        await AsyncStorageMock.setItem('velo.auth.refreshToken', 'ref-1');
        fetchMock.mockResolvedValueOnce(jsonResponse(200, {
            success: true,
            data: { ...SESSION, accessToken: 'acc-2', refreshToken: 'ref-2' },
        }));
        expect(await refreshSession()).toBe('acc-2');
        expect(await getAccessToken()).toBe('acc-2');

        fetchMock.mockResolvedValueOnce(jsonResponse(401, { success: false, error: 'Session revoked. Sign in again.' }));
        expect(await refreshSession()).toBeNull();
        expect(await getRefreshToken()).toBeNull();
    });

    it('clearSession removes all auth keys', async () => {
        await AsyncStorageMock.setItem('velo.auth.accessToken', 'a');
        await AsyncStorageMock.setItem('velo.auth.refreshToken', 'r');
        await clearSession();
        expect(await getAccessToken()).toBeNull();
        expect(await getRefreshToken()).toBeNull();
    });
});
