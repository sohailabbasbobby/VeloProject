/**
 * AUTH + MAPS INTEGRATION TESTS — run against the live local PostgreSQL.
 *
 * These exercise the real self-hosted auth engine end to end:
 *   - password register/login (bcrypt in our own Postgres)
 *   - access token verify (valid, expired, tampered)
 *   - refresh rotation (single-use; reuse after rotation rejected)
 *   - OTP lifecycle (unknown code, wrong code attempt counting, correct verify,
 *     single-use consumption, request-rate cap)
 *   - Google/Apple unconfigured → explicit 503-class error (no fabricated login)
 *   - maps fail-open (no key → [] / null; never a fabricated result)
 *
 * OTP delivery is exercised with the honest no-op sender (Twilio creds absent),
 * which is itself one of the required failure paths.
 */
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://velo_admin:testpass@127.0.0.1:5433/velo_network';
process.env.JWT_SECRET = 'test-secret-key-for-velo-selfhosted-auth-0123456789';

import { Pool } from 'pg';
import { db as servicePool } from '../config/db';
import { AuthService } from '../services/auth.service';
import { MapsService } from '../utils/mapsService';
import { SmsService } from '../services/sms.service';

const TEST_TENANT = '00000000-0000-0000-0000-000000000001'; // seeded demo tenant
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const uniqueEmail = () => `auth-test-${Date.now()}-${Math.floor(Math.random() * 1e6)}@velo-test.local`;
const uniquePhone = () => `+4477009${String(Math.floor(Math.random() * 1e6)).padStart(6, '0')}`;

afterAll(async () => {
    await pool.end();
    await servicePool.end();
});

describe('password auth (bcrypt in our own Postgres)', () => {
    it('registers and logs in, issuing our own JWT + refresh session', async () => {
        const email = uniqueEmail();
        const reg = await AuthService.registerPassword({
            tenantId: TEST_TENANT,
            actorType: 'PRIVATE_CLIENT',
            email,
            password: 'Sup3rSecret!',
            displayName: 'Auth Test',
            profile: { email },
        });
        expect(reg.accessToken).toBeTruthy();
        expect(reg.refreshToken).toMatch(/^[0-9a-f]{96}$/);
        expect(reg.actor.tenantId).toBe(TEST_TENANT);
        expect(reg.actor.type).toBe('PRIVATE_CLIENT');

        const claims = AuthService.verifyAccessToken(reg.accessToken);
        expect(claims.actorId).toBe(reg.actor.id);
        expect(claims.tenantId).toBe(TEST_TENANT);

        const login = await AuthService.loginPassword({ actorType: 'PRIVATE_CLIENT', email, password: 'Sup3rSecret!' });
        expect(login.actor.id).toBe(reg.actor.id);
    });

    it('rejects a wrong password without leaking identity existence', async () => {
        const email = uniqueEmail();
        await AuthService.registerPassword({
            tenantId: TEST_TENANT, actorType: 'PRIVATE_CLIENT', email,
            password: 'CorrectHorse1', displayName: 'Auth Test', profile: { email },
        });
        await expect(AuthService.loginPassword({ actorType: 'PRIVATE_CLIENT', email, password: 'wrong-password' }))
            .rejects.toThrow(/Invalid email or password/);
    });

    it('rejects duplicate email registration', async () => {
        const email = uniqueEmail();
        await AuthService.registerPassword({
            tenantId: TEST_TENANT, actorType: 'PRIVATE_CLIENT', email,
            password: 'Sup3rSecret!', displayName: 'Auth Test', profile: { email },
        });
        await expect(AuthService.registerPassword({
            tenantId: TEST_TENANT, actorType: 'PRIVATE_CLIENT', email,
            password: 'Sup3rSecret!', displayName: 'Auth Test', profile: { email },
        })).rejects.toThrow(/already exists/);
    });

    it('rejects a tampered access token', () => {
        const token = AuthService.signAccessToken({
            id: '00000000-0000-0000-0000-00000000ffff', tenant_id: TEST_TENANT,
            actor_type: 'PRIVATE_CLIENT', actor_id: '00000000-0000-0000-0000-00000000ffff',
            provider: 'PASSWORD', subject: 'tamper@test.local', display_name: null,
        }, 60);
        expect(() => AuthService.verifyAccessToken(token + 'x')).toThrow(/Invalid session token/);
    });

    it('rejects an expired access token with a refresh hint', () => {
        const token = AuthService.signAccessToken({
            id: '00000000-0000-0000-0000-00000000fffe', tenant_id: TEST_TENANT,
            actor_type: 'PRIVATE_CLIENT', actor_id: '00000000-0000-0000-0000-00000000fffe',
            provider: 'PASSWORD', subject: 'expired@test.local', display_name: null,
        }, -10); // already expired
        expect(() => AuthService.verifyAccessToken(token)).toThrow(/Session expired/);
    });
});

describe('refresh token rotation (single-use)', () => {
    it('rotates and invalidates the previous refresh token', async () => {
        const email = uniqueEmail();
        const first = await AuthService.registerPassword({
            tenantId: TEST_TENANT, actorType: 'PRIVATE_CLIENT', email,
            password: 'RotateMe123!', displayName: 'Rotate Test', profile: { email },
        });

        const second = await AuthService.refreshSession(first.refreshToken, {});
        expect(second.refreshToken).not.toBe(first.refreshToken);
        expect(second.actor.id).toBe(first.actor.id);

        // Replaying the consumed token must fail (rotated-away = revoked).
        await expect(AuthService.refreshSession(first.refreshToken, {})).rejects.toThrow(/revoked|Unknown session/);

        // The new token still works and revocation takes effect.
        const third = await AuthService.refreshSession(second.refreshToken, {});
        await AuthService.revokeSession(third.refreshToken);
        await expect(AuthService.refreshSession(third.refreshToken, {})).rejects.toThrow(/revoked|expired|Unknown/);
    });
});

describe('phone + OTP lifecycle', () => {
    it('honestly reports no-op delivery when Twilio is unconfigured', async () => {
        const phone = uniquePhone();
        const res = await AuthService.requestOtp({ phone });
        expect(res.sent).toBe(false);                 // honest — no fabricated "sent"
        expect(res.provider).toBe('NOOP_UNCONFIGURED');
        expect(res.expiresInSeconds).toBeGreaterThan(0);
    });

    it('rejects an unknown code and counts the attempt', async () => {
        const phone = uniquePhone();
        await AuthService.requestOtp({ phone });
        await expect(AuthService.verifyOtp({ phone, code: '000000', actorType: 'PRIVATE_CLIENT', tenantId: TEST_TENANT, autoProvision: true }))
            .rejects.toThrow(/Incorrect code/);

        const { rows } = await pool.query(
            `SELECT attempts FROM auth_otp_codes WHERE phone = $1 ORDER BY created_at DESC LIMIT 1`, [phone]);
        expect(rows[0].attempts).toBe(1);
    });

    it('verifies a correct code once (single-use), auto-provisioning the identity', async () => {
        const phone = uniquePhone();
        await AuthService.requestOtp({ phone });

        // Read the hashed code from the DB and compare candidates is impossible —
        // instead, compute the hash the service would have stored for a known code.
        // The service hashes with sha-256; we insert a known code for the test.
        const knownCode = '424242';
        await pool.query(
            `UPDATE auth_otp_codes SET code_hash = $1
             WHERE id = (SELECT id FROM auth_otp_codes WHERE phone = $2 ORDER BY created_at DESC LIMIT 1)`,
            [SmsService.hashToken(knownCode), phone]
        );

        const session = await AuthService.verifyOtp({
            phone, code: knownCode, actorType: 'PRIVATE_CLIENT', tenantId: TEST_TENANT,
            autoProvision: true, displayName: 'OTP Client',
        });
        expect(session.accessToken).toBeTruthy();
        expect(session.actor.type).toBe('PRIVATE_CLIENT');

        // The code is consumed — replaying it must fail.
        await expect(AuthService.verifyOtp({ phone, code: knownCode, actorType: 'PRIVATE_CLIENT', tenantId: TEST_TENANT, autoProvision: true }))
            .rejects.toThrow(/No active verification code/);
    });

    it('locks the challenge after the configured attempt cap', async () => {
        const phone = uniquePhone();
        await AuthService.requestOtp({ phone });
        for (let i = 0; i < 5; i++) {
            await expect(AuthService.verifyOtp({ phone, code: '111111', actorType: 'PRIVATE_CLIENT', tenantId: TEST_TENANT, autoProvision: true }))
                .rejects.toThrow();
        }
        // Even the CORRECT code is now rejected — challenge locked.
        const knownCode = '909090';
        await pool.query(
            `UPDATE auth_otp_codes SET code_hash = $1
             WHERE id = (SELECT id FROM auth_otp_codes WHERE phone = $2 ORDER BY created_at DESC LIMIT 1)`,
            [SmsService.hashToken(knownCode), phone]
        );
        await expect(AuthService.verifyOtp({ phone, code: knownCode, actorType: 'PRIVATE_CLIENT', tenantId: TEST_TENANT, autoProvision: true }))
            .rejects.toThrow(/Too many incorrect attempts/);
    });

    it('enforces the per-phone request-rate cap', async () => {
        const phone = uniquePhone();
        // Default cap is 5/hour; the first request in the lifecycle above may exist — use a fresh number.
        for (let i = 0; i < 5; i++) {
            await AuthService.requestOtp({ phone });
        }
        await expect(AuthService.requestOtp({ phone })).rejects.toThrow(/Too many verification codes/);
    });

    it('rejects a fresh OTP login when autoProvision is off and no identity exists', async () => {
        const phone = uniquePhone();
        await AuthService.requestOtp({ phone });
        const knownCode = '515151';
        await pool.query(
            `UPDATE auth_otp_codes SET code_hash = $1
             WHERE id = (SELECT id FROM auth_otp_codes WHERE phone = $2 ORDER BY created_at DESC LIMIT 1)`,
            [SmsService.hashToken(knownCode), phone]
        );
        await expect(AuthService.verifyOtp({ phone, code: knownCode, actorType: 'PRIVATE_CLIENT', autoProvision: false }))
            .rejects.toThrow(/No account exists/);
    });
});

describe('social sign-in (Google / Apple) — unconfigured paths', () => {
    it('fails Google login with an explicit configuration error (no fabricated session)', async () => {
        const saved = process.env.GOOGLE_CLIENT_ID;
        delete process.env.GOOGLE_CLIENT_ID;
        try {
            await expect(AuthService.loginGoogle({
                idToken: 'some-google-id-token', actorType: 'PRIVATE_CLIENT', tenantId: TEST_TENANT, autoProvision: true,
            })).rejects.toThrow(/Google Sign-In is not configured/);
        } finally {
            process.env.GOOGLE_CLIENT_ID = saved;
        }
    });

    it('fails Apple login with an explicit configuration error', async () => {
        const saved = process.env.APPLE_CLIENT_ID;
        delete process.env.APPLE_CLIENT_ID;
        try {
            await expect(AuthService.loginApple({
                identityToken: 'some-apple-identity-token', actorType: 'PRIVATE_CLIENT', tenantId: TEST_TENANT, autoProvision: true,
            })).rejects.toThrow(/Apple Sign-In is not configured/);
        } finally {
            process.env.APPLE_CLIENT_ID = saved;
        }
    });
});

describe('JWT secret discipline', () => {
    it('refuses to sign when JWT_SECRET is missing (fail-closed)', async () => {
        const saved = process.env.JWT_SECRET;
        delete process.env.JWT_SECRET;
        try {
            expect(() => AuthService.signAccessToken({
                id: '00000000-0000-0000-0000-00000000fffd', tenant_id: TEST_TENANT,
                actor_type: 'PRIVATE_CLIENT', actor_id: '00000000-0000-0000-0000-00000000fffd',
                provider: 'PASSWORD', subject: 'nosecret@test.local', display_name: null,
            }, 60)).toThrow(/JWT_SECRET is not configured/);
        } finally {
            process.env.JWT_SECRET = saved;
        }
    });
});

describe('maps fail-open discipline (no API key)', () => {
    it('autocomplete returns [] when the key is absent', async () => {
        const saved = process.env.GOOGLE_MAPS_API_KEY;
        delete process.env.GOOGLE_MAPS_API_KEY;
        try {
            const suggestions = await MapsService.placesAutocomplete('10 Downing Street');
            expect(suggestions).toEqual([]);
            expect(MapsService.isConfigured()).toBe(false);
        } finally {
            process.env.GOOGLE_MAPS_API_KEY = saved;
        }
    });

    it('place details returns null when the key is absent', async () => {
        const saved = process.env.GOOGLE_MAPS_API_KEY;
        delete process.env.GOOGLE_MAPS_API_KEY;
        try {
            expect(await MapsService.placesDetails('ChIJtestplaceid')).toBeNull();
        } finally {
            process.env.GOOGLE_MAPS_API_KEY = saved;
        }
    });

    it('directions returns null (never fabricated) when the key is absent', async () => {
        const saved = process.env.GOOGLE_MAPS_API_KEY;
        delete process.env.GOOGLE_MAPS_API_KEY;
        try {
            expect(await MapsService.directionsRoute({ lat: 51.5, lng: -0.12 }, { lat: 51.51, lng: -0.1 })).toBeNull();
        } finally {
            process.env.GOOGLE_MAPS_API_KEY = saved;
        }
    });

    it('getRouteMetrics still throws (fail-closed) because floor pricing must not run on estimates', async () => {
        const saved = process.env.GOOGLE_MAPS_API_KEY;
        delete process.env.GOOGLE_MAPS_API_KEY;
        try {
            await expect(MapsService.getRouteMetrics({ lat: 51.5, lng: -0.12 }, { lat: 51.51, lng: -0.1 }))
                .rejects.toThrow(/GOOGLE_MAPS_API_KEY is not configured/);
        } finally {
            process.env.GOOGLE_MAPS_API_KEY = saved;
        }
    });
});
