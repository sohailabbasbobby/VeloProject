/**
 * DRIVER APP AUTH CLIENT TESTS — run in Node against a mock HTTP server.
 * Covers the self-hosted session lifecycle exactly as the app runs it:
 * storage persistence, restore, transparent refresh, and signed-out state.
 */
import AsyncStorageMock, { __resetAsyncStorage } from './__mocks__/asyncStorage';

jest.mock('react-native', () => ({}), { virtual: true });

// The client module is plain TS; import after mocks are in place.
import { getAccessToken, getRefreshToken, clearSession, refreshSession, restoreSession, signIn, signInWithGoogle, signInWithApple, verifyOtp, requestOtp } from '../api/auth';

const API_BASE = 'http://10.0.2.2:8000';
const SESSION = {
    accessToken: 'acc-token-1',
    refreshToken: 'ref-token-1',
    accessTokenExpiresIn: 900,
    actor: { type: 'DRIVER' as const, id: 'driver-1', tenantId: 'tenant-1', displayName: 'Test Driver' },
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

describe('self-hosted auth client (driver app)', () => {
    it('persists the session after a successful password sign-in', async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse(200, { success: true, data: SESSION }));

        const result = await signIn('driver@operator.co.uk', 'Sup3rSecret!');
        expect(result.actor.id).toBe('driver-1');
        expect(await getAccessToken()).toBe('acc-token-1');
        expect(await getRefreshToken()).toBe('ref-token-1');
        expect(fetchMock).toHaveBeenCalledWith(
            `${API_BASE}/api/auth/login`,
            expect.objectContaining({ method: 'POST' })
        );
        const body = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(body).toMatchObject({ actorType: 'DRIVER', email: 'driver@operator.co.uk', password: 'Sup3rSecret!' });
    });

    it('surfaces backend errors without storing anything', async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse(401, { success: false, error: 'Invalid email or password.' }));
        await expect(signIn('driver@operator.co.uk', 'wrong')).rejects.toThrow('Invalid email or password.');
        expect(await getAccessToken()).toBeNull();
    });

    it('restores a persisted session on app start', async () => {
        await AsyncStorageMock.setItem('velo.auth.accessToken', 'acc-token-1');
        await AsyncStorageMock.setItem('velo.auth.refreshToken', 'ref-token-1');
        const session = await restoreSession();
        expect(session).not.toBeNull();
        expect(session!.accessToken).toBe('acc-token-1');
    });

    it('returns null (signed out) when tokens are missing or half-present', async () => {
        expect(await restoreSession()).toBeNull();
        await AsyncStorageMock.setItem('velo.auth.accessToken', 'orphan');
        expect(await restoreSession()).toBeNull();
        expect(await getAccessToken()).toBeNull(); // half-session was cleared
    });

    it('refreshes the session and stores the new token pair', async () => {
        await AsyncStorageMock.setItem('velo.auth.refreshToken', 'ref-token-1');
        fetchMock.mockResolvedValueOnce(jsonResponse(200, {
            success: true,
            data: { ...SESSION, accessToken: 'acc-token-2', refreshToken: 'ref-token-2' },
        }));

        const newToken = await refreshSession();
        expect(newToken).toBe('acc-token-2');
        expect(await getAccessToken()).toBe('acc-token-2');
        expect(await getRefreshToken()).toBe('ref-token-2');
    });

    it('clears storage when the refresh token is rejected (fatal 401 path)', async () => {
        await AsyncStorageMock.setItem('velo.auth.refreshToken', 'stale-token');
        fetchMock.mockResolvedValueOnce(jsonResponse(401, { success: false, error: 'Session expired. Sign in again.' }));

        expect(await refreshSession()).toBeNull();
        expect(await getRefreshToken()).toBeNull();
    });

    it('sends the OTP request honestly and verifies with actorType DRIVER', async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse(200, { success: true, data: { sent: false, provider: 'NOOP_UNCONFIGURED', expiresInSeconds: 300 } }));
        const otpResult = await requestOtp('+447700900123');
        expect(otpResult.sent).toBe(false);

        fetchMock.mockResolvedValueOnce(jsonResponse(200, { success: true, data: SESSION }));
        await verifyOtp('+447700900123', '123456');
        const body = JSON.parse(fetchMock.mock.calls[1][1].body);
        expect(body).toMatchObject({ actorType: 'DRIVER', autoProvision: true, code: '123456' });
    });

    it('routes Google and Apple tokens to the dedicated endpoints', async () => {
        fetchMock.mockResolvedValue(jsonResponse(200, { success: true, data: SESSION }));

        await signInWithGoogle('google-id-token');
        expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE}/api/auth/google`);

        await signInWithApple('apple-identity-token', 'nonce-1');
        const appleBody = JSON.parse(fetchMock.mock.calls[1][1].body);
        expect(appleBody).toMatchObject({ identityToken: 'apple-identity-token', nonce: 'nonce-1', actorType: 'DRIVER' });

        expect(await getAccessToken()).toBe('acc-token-1');
    });

    it('clearSession removes both tokens', async () => {
        await AsyncStorageMock.setItem('velo.auth.accessToken', 'a');
        await AsyncStorageMock.setItem('velo.auth.refreshToken', 'r');
        await clearSession();
        expect(await getAccessToken()).toBeNull();
        expect(await getRefreshToken()).toBeNull();
    });
});
