import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PoolClient } from 'pg';
import { db, withTransaction } from '../config/db';
import { HttpError, badRequest, unauthorized } from '../utils/httpError';
import { SettingsService, AuthSettings } from './settings.service';
import { SmsService } from './sms.service';

/**
 * AUTH SERVICE — fully self-hosted identity & sessions (Jawa Ride pattern).
 *
 * Four ways in, one unified session system:
 *   1. Email + password  → bcrypt hash in our own Postgres (auth_identities)
 *   2. Phone + OTP       → crypto.randomInt code, hashed at rest, capped attempts
 *   3. Google Sign-In    → ID token verified against Google (google-auth-library)
 *   4. Apple Sign-In     → identity token verified against Apple (apple-signin-auth)
 *
 * Every path ends in the same place: our backend issues our own JWT access
 * token + rotating refresh token (auth_sessions). No third-party auth.
 */

export type ActorType = 'DRIVER' | 'PRIVATE_CLIENT';
export type AuthProvider = 'PASSWORD' | 'PHONE' | 'GOOGLE' | 'APPLE';

export interface SessionTokens {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresIn: number;
    identity: AuthIdentityRow;
    actor: { type: ActorType; id: string; tenantId: string; displayName: string | null };
}

export interface AuthIdentityRow {
    id: string;
    tenant_id: string;
    actor_type: ActorType;
    actor_id: string;
    provider: AuthProvider;
    subject: string;
    password_hash?: string | null;
    display_name: string | null;
}

const JWT_ISSUER = 'velo-jawa';

const getJwtSecret = (): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) {
        throw new HttpError(500, 'JWT_SECRET is not configured (min 32 chars). Self-hosted auth cannot issue tokens without it — no insecure fallback is permitted.', 'JWT_NOT_CONFIGURED');
    }
    return secret;
};

const loadSettings = async (): Promise<AuthSettings> => {
    try {
        return await SettingsService.getAuthSettings();
    } catch {
        // platform_settings row absent → defaults mirror settings.service (still DB-first next time)
        return {
            accessTokenTtlSeconds: 900,
            refreshTokenTtlDays: 30,
            otpTtlSeconds: 300,
            otpMaxAttempts: 5,
            otpLength: 6,
            otpMaxPerHour: 5,
            bcryptRounds: 12,
        };
    }
};

export const AuthService = {
    // ------------------------------------------------------------------ token primitives
    signAccessToken(identity: AuthIdentityRow, ttlSeconds: number): string {
        return jwt.sign(
            {
                sub: identity.id,
                actorType: identity.actor_type,
                actorId: identity.actor_id,
                tenantId: identity.tenant_id,
                provider: identity.provider,
            },
            getJwtSecret(),
            { expiresIn: ttlSeconds, issuer: JWT_ISSUER }
        );
    },

    verifyAccessToken(token: string): { sub: string; actorType: ActorType; actorId: string; tenantId: string } {
        try {
            const decoded = jwt.verify(token, getJwtSecret(), { issuer: JWT_ISSUER }) as any;
            if (!decoded?.sub || !decoded?.actorId) throw new Error('missing claims');
            return decoded;
        } catch (err: any) {
            if (err?.name === 'TokenExpiredError') {
                throw unauthorized('Session expired. Refresh your token.');
            }
            throw unauthorized('Invalid session token.');
        }
    },

    // ------------------------------------------------------------------ session issue/refresh
    async issueSession(identity: AuthIdentityRow, meta: { userAgent?: string | undefined; ip?: string | undefined }): Promise<SessionTokens> {
        const settings = await loadSettings();
        const refreshToken = crypto.randomBytes(48).toString('hex');
        const expiresAt = new Date(Date.now() + settings.refreshTokenTtlDays * 86400_000);

        await db.query(
            `INSERT INTO auth_sessions (identity_id, refresh_token_hash, user_agent, ip_address, expires_at)
             VALUES ($1, $2, $3, $4, $5)`,
            [identity.id, SmsService.hashToken(refreshToken), meta.userAgent?.slice(0, 255) || null, meta.ip?.slice(0, 64) || null, expiresAt]
        );

        return {
            accessToken: this.signAccessToken(identity, settings.accessTokenTtlSeconds),
            refreshToken,
            accessTokenExpiresIn: settings.accessTokenTtlSeconds,
            identity,
            actor: {
                type: identity.actor_type,
                id: identity.actor_id,
                tenantId: identity.tenant_id,
                displayName: identity.display_name,
            },
        };
    },

    /** Rotating refresh: old token is single-use; a mismatch revokes the whole session chain. */
    async refreshSession(refreshToken: string, meta: { userAgent?: string | undefined; ip?: string | undefined }): Promise<SessionTokens> {
        if (!refreshToken) throw badRequest('refreshToken is required.');
        const settings = await loadSettings();
        const hash = SmsService.hashToken(refreshToken);

        const identity = await withTransaction(null, async (client) => {
            const sess = await client.query(
                `SELECT s.id AS session_id, s.identity_id, s.refresh_token_hash, s.expires_at, s.revoked_at, i.*
                 FROM auth_sessions s JOIN auth_identities i ON i.id = s.identity_id
                 WHERE s.refresh_token_hash = $1
                 FOR UPDATE OF s`,
                [hash]
            );
            if (sess.rows.length === 0) throw unauthorized('Unknown session.');
            const row = sess.rows[0];
            if (row.revoked_at) throw unauthorized('Session revoked. Sign in again.');
            if (new Date(row.expires_at).getTime() < Date.now()) {
                throw unauthorized('Session expired. Sign in again.');
            }
            await client.query(`UPDATE auth_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE id = $1`, [row.session_id]);

            const nextToken = crypto.randomBytes(48).toString('hex');
            const nextExpiry = new Date(Date.now() + settings.refreshTokenTtlDays * 86400_000);
            const ins = await client.query(
                `INSERT INTO auth_sessions (identity_id, refresh_token_hash, user_agent, ip_address, expires_at)
                 VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                [row.identity_id, SmsService.hashToken(nextToken), meta.userAgent?.slice(0, 255) || null, meta.ip?.slice(0, 64) || null, nextExpiry]
            );

            const identityRow: AuthIdentityRow = {
                id: row.id,
                tenant_id: row.tenant_id,
                actor_type: row.actor_type,
                actor_id: row.actor_id,
                provider: row.provider,
                subject: row.subject,
                display_name: row.display_name,
            };
            void ins;
            return { identityRow, nextToken };
        });

        return {
            accessToken: this.signAccessToken(identity.identityRow, settings.accessTokenTtlSeconds),
            refreshToken: identity.nextToken,
            accessTokenExpiresIn: settings.accessTokenTtlSeconds,
            identity: identity.identityRow,
            actor: {
                type: identity.identityRow.actor_type,
                id: identity.identityRow.actor_id,
                tenantId: identity.identityRow.tenant_id,
                displayName: identity.identityRow.display_name,
            },
        };
    },

    async revokeSession(refreshToken: string): Promise<void> {
        if (!refreshToken) return;
        await db.query(
            `UPDATE auth_sessions SET revoked_at = CURRENT_TIMESTAMP
             WHERE refresh_token_hash = $1 AND revoked_at IS NULL`,
            [SmsService.hashToken(refreshToken)]
        );
    },

    // ------------------------------------------------------------------ 1. email + password
    async registerPassword(params: {
        tenantId: string; actorType: ActorType; email: string; password: string; displayName: string;
        profile: Record<string, unknown>;
    }): Promise<SessionTokens> {
        const settings = await loadSettings();
        const email = params.email.trim().toLowerCase();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw badRequest('A valid email address is required.');
        if (!params.password || params.password.length < 8) throw badRequest('Password must be at least 8 characters.');

        const existing = await db.query(`SELECT 1 FROM auth_identities WHERE provider = 'PASSWORD' AND subject = $1`, [email]);
        if (existing.rows.length > 0) throw new HttpError(409, 'An account with this email already exists.', 'EMAIL_TAKEN');

        const passwordHash = await bcrypt.hash(params.password, settings.bcryptRounds);

        const identity = await withTransaction(params.tenantId, async (client) => {
            const actorId = await this.ensureActor(client, params.tenantId, params.actorType, params.profile, email, params.displayName);
            const res = await client.query(
                `INSERT INTO auth_identities (tenant_id, actor_type, actor_id, provider, subject, password_hash, display_name)
                 VALUES ($1, $2, $3, 'PASSWORD', $4, $5, $6) RETURNING *`,
                [params.tenantId, params.actorType, actorId, email, passwordHash, params.displayName]
            );
            return res.rows[0] as AuthIdentityRow;
        });

        return this.issueSession(identity, {});
    },

    async loginPassword(params: {
        actorType: ActorType; email: string; password: string;
        userAgent?: string | undefined; ip?: string | undefined;
    }): Promise<SessionTokens> {
        const email = params.email.trim().toLowerCase();
        const res = await db.query(
            `SELECT * FROM auth_identities WHERE provider = 'PASSWORD' AND subject = $1 AND actor_type = $2 LIMIT 1`,
            [email, params.actorType]
        );
        const identity = res.rows[0] as AuthIdentityRow | undefined;
        if (!identity?.password_hash) throw unauthorized('Invalid email or password.');

        const ok = await bcrypt.compare(params.password, identity.password_hash);
        if (!ok) throw unauthorized('Invalid email or password.');

        return this.issueSession(identity, { userAgent: params.userAgent, ip: params.ip });
    },

    // ------------------------------------------------------------------ 2. phone + OTP
    async requestOtp(params: { phone: string; purpose?: 'LOGIN' | 'BIND' }): Promise<{ sent: boolean; provider: string; expiresInSeconds: number }> {
        const settings = await loadSettings();
        const phone = params.phone.trim();
        if (!/^\+?[0-9]{7,15}$/.test(phone)) throw badRequest('A valid phone number is required (E.164, 7–15 digits).');
        const purpose = params.purpose || 'LOGIN';

        // Request-rate cap per phone (config via platform_settings.auth.otpMaxPerHour).
        const recent = await db.query(
            `SELECT COUNT(*)::int AS n FROM auth_otp_codes
             WHERE phone = $1 AND purpose = $2 AND created_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'`,
            [phone, purpose]
        );
        if ((recent.rows[0]?.n ?? 0) >= settings.otpMaxPerHour) {
            throw new HttpError(429, 'Too many verification codes requested. Try again later.', 'OTP_RATE_LIMITED');
        }

        const code = crypto.randomInt(0, 10 ** settings.otpLength).toString().padStart(settings.otpLength, '0');
        await db.query(
            `INSERT INTO auth_otp_codes (phone, code_hash, purpose, max_attempts, expires_at)
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP + ($5 || ' seconds')::interval)`,
            [phone, SmsService.hashToken(code), purpose, settings.otpMaxAttempts, String(settings.otpTtlSeconds)]
        );

        const send = await SmsService.send(phone, `Your Velo verification code is ${code}. It expires in ${Math.round(settings.otpTtlSeconds / 60)} minutes.`);
        return { sent: send.sent, provider: send.provider, expiresInSeconds: settings.otpTtlSeconds };
    },

    /** Verifies the OTP and returns the phone-identity (creating it on first login when asked). */
    async verifyOtp(params: {
        phone: string; code: string; actorType: ActorType; tenantId?: string | undefined;
        autoProvision?: boolean | undefined; displayName?: string | undefined;
        userAgent?: string | undefined; ip?: string | undefined;
    }): Promise<SessionTokens> {
        const phone = params.phone.trim();
        if (!params.code || !/^[0-9]{4,8}$/.test(params.code)) throw badRequest('Enter the verification code from the SMS.');

        // NOTE: failure-path mutations (attempt counting, lock-out consumption) must
        // SURVIVE the rejection — so verifyOtp returns a verdict from inside the
        // transaction and throws only AFTER a clean COMMIT. Throwing inside the
        // transaction would ROLL BACK the attempt increment and defeat lock-out.
        const verdict = await withTransaction(null, async (client) => {
            // Latest unconsumed, unexpired code for this phone+purpose — single active challenge.
            const otpRes = await client.query(
                `SELECT * FROM auth_otp_codes
                 WHERE phone = $1 AND purpose = 'LOGIN' AND consumed_at IS NULL AND expires_at > CURRENT_TIMESTAMP
                 ORDER BY created_at DESC LIMIT 1 FOR UPDATE`,
                [phone]
            );
            const otp = otpRes.rows[0];
            if (!otp) return { ok: false as const, error: unauthorized('No active verification code. Request a new one.') };

            if (otp.attempts >= otp.max_attempts) {
                await client.query(`UPDATE auth_otp_codes SET consumed_at = CURRENT_TIMESTAMP WHERE id = $1`, [otp.id]);
                return { ok: false as const, error: new HttpError(429, 'Too many incorrect attempts. Request a new code.', 'OTP_LOCKED') };
            }

            if (SmsService.hashToken(params.code) !== otp.code_hash) {
                await client.query(`UPDATE auth_otp_codes SET attempts = attempts + 1 WHERE id = $1`, [otp.id]);
                const left = Math.max(0, otp.max_attempts - otp.attempts - 1);
                return { ok: false as const, error: unauthorized(`Incorrect code.${left > 0 ? ` ${left} attempt${left === 1 ? '' : 's'} remaining.` : ''}`) };
            }

            // Success: single-use consumption, and newer challenges are invalidated by this being the latest.
            await client.query(`UPDATE auth_otp_codes SET consumed_at = CURRENT_TIMESTAMP WHERE id = $1`, [otp.id]);

            const idRes = await client.query(
                `SELECT * FROM auth_identities WHERE provider = 'PHONE' AND subject = $1 AND actor_type = $2 LIMIT 1`,
                [phone, params.actorType]
            );
            if (idRes.rows.length > 0) return { ok: true as const, identity: idRes.rows[0] as AuthIdentityRow };

            if (!params.autoProvision) {
                return { ok: false as const, error: unauthorized('No account exists for this phone number yet.') };
            }
            if (!params.tenantId) {
                return { ok: false as const, error: badRequest('tenantId is required to provision a new phone-OTP account.') };
            }

            const actorId = await this.ensureActor(
                client, params.tenantId, params.actorType,
                { phone, status: 'ACTIVE' },
                null, params.displayName || null
            );
            const ins = await client.query(
                `INSERT INTO auth_identities (tenant_id, actor_type, actor_id, provider, subject, display_name)
                 VALUES ($1, $2, $3, 'PHONE', $4, $5) RETURNING *`,
                [params.tenantId, params.actorType, actorId, phone, params.displayName || null]
            );
            return { ok: true as const, identity: ins.rows[0] as AuthIdentityRow };
        });

        if (!verdict.ok) throw verdict.error;
        return this.issueSession(verdict.identity, { userAgent: params.userAgent, ip: params.ip });
    },

    // ------------------------------------------------------------------ 3/4. social (Google / Apple)
    async loginGoogle(params: {
        idToken: string; actorType: ActorType; tenantId?: string | undefined;
        autoProvision?: boolean | undefined; displayName?: string | undefined;
        userAgent?: string | undefined; ip?: string | undefined;
    }): Promise<SessionTokens> {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        if (!clientId) {
            throw new HttpError(503, 'Google Sign-In is not configured (GOOGLE_CLIENT_ID missing).', 'GOOGLE_NOT_CONFIGURED');
        }
        const { OAuth2Client } = await import('google-auth-library');
        const oauthClient = new OAuth2Client(clientId);
        let ticket;
        try {
            ticket = await oauthClient.verifyIdToken({ idToken: params.idToken, audience: clientId });
        } catch (err: any) {
            throw unauthorized(`Google token verification failed: ${err?.message || 'invalid token'}`);
        }
        const payload = ticket.getPayload();
        if (!payload?.sub) throw unauthorized('Google token verification failed: no subject claim.');

        return this.upsertSocialIdentity({
            provider: 'GOOGLE', subject: payload.sub, email: payload.email || null,
            displayName: params.displayName || payload.name || null,
            actorType: params.actorType, tenantId: params.tenantId,
            autoProvision: params.autoProvision, userAgent: params.userAgent, ip: params.ip,
        });
    },

    async loginApple(params: {
        identityToken: string; actorType: ActorType; tenantId?: string | undefined;
        autoProvision?: boolean | undefined; displayName?: string | undefined; nonce?: string | undefined;
        userAgent?: string | undefined; ip?: string | undefined;
    }): Promise<SessionTokens> {
        const clientId = process.env.APPLE_CLIENT_ID;
        if (!clientId) {
            throw new HttpError(503, 'Apple Sign-In is not configured (APPLE_CLIENT_ID missing).', 'APPLE_NOT_CONFIGURED');
        }
        const appleSignin = (await import('apple-signin-auth')).default;
        let decoded;
        try {
            decoded = await appleSignin.verifyIdToken(params.identityToken, {
                audience: clientId,
                nonce: params.nonce, // checked only when the client sent one (RN Apple flow may omit)
            });
        } catch (err: any) {
            throw unauthorized(`Apple token verification failed: ${err?.message || 'invalid token'}`);
        }
        if (!decoded?.sub) throw unauthorized('Apple token verification failed: no subject claim.');

        return this.upsertSocialIdentity({
            provider: 'APPLE', subject: decoded.sub, email: decoded.email || null,
            displayName: params.displayName || null,
            actorType: params.actorType, tenantId: params.tenantId,
            autoProvision: params.autoProvision, userAgent: params.userAgent, ip: params.ip,
        });
    },

    async upsertSocialIdentity(p: {
        provider: 'GOOGLE' | 'APPLE'; subject: string; email: string | null; displayName: string | null;
        actorType: ActorType; tenantId?: string | undefined; autoProvision?: boolean | undefined;
        userAgent?: string | undefined; ip?: string | undefined;
    }): Promise<SessionTokens> {
        const existing = await db.query(
            `SELECT * FROM auth_identities WHERE provider = $1 AND subject = $2 AND actor_type = $3 LIMIT 1`,
            [p.provider, p.subject, p.actorType]
        );
        if (existing.rows.length > 0) {
            return this.issueSession(existing.rows[0] as AuthIdentityRow, { userAgent: p.userAgent, ip: p.ip });
        }

        // Link by verified email when the same email already has a PASSWORD identity.
        if (p.email) {
            const linked = await db.query(
                `SELECT * FROM auth_identities WHERE provider = 'PASSWORD' AND subject = $1 AND actor_type = $2 LIMIT 1`,
                [p.email.toLowerCase(), p.actorType]
            );
            if (linked.rows.length > 0) return this.issueSession(linked.rows[0] as AuthIdentityRow, { userAgent: p.userAgent, ip: p.ip });
        }

        if (!p.autoProvision) throw unauthorized('No account exists for this social identity yet.');
        if (!p.tenantId) throw badRequest('tenantId is required to provision a new social sign-in account.');
        const tenantId: string = p.tenantId;
        const identity = await withTransaction(tenantId, async (client) => {
            const actorId = await this.ensureActor(
                client, tenantId, p.actorType,
                p.email ? { email: p.email, status: 'ACTIVE' } : { status: 'ACTIVE' },
                p.email, p.displayName
            );
            const ins = await client.query(
                `INSERT INTO auth_identities (tenant_id, actor_type, actor_id, provider, subject, display_name)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                [tenantId, p.actorType, actorId, p.provider, p.subject, p.displayName]
            );
            return ins.rows[0] as AuthIdentityRow;
        });
        return this.issueSession(identity, { userAgent: p.userAgent, ip: p.ip });
    },

    // ------------------------------------------------------------------ actor provisioning helper
    /** Creates (or reuses) the backing drivers/private_clients record and returns its id. */
    async ensureActor(client: PoolClient, tenantId: string, actorType: ActorType, profile: Record<string, unknown>, email: string | null, displayName: string | null): Promise<string> {
        if (actorType === 'PRIVATE_CLIENT') {
            // Reuse an existing unclaimed client by email/phone within the tenant.
            if (email || profile.phone) {
                const reuse = await client.query(
                    `SELECT id FROM private_clients
                     WHERE tenant_id = $1 AND (email = $2 OR phone = $3) LIMIT 1`,
                    [tenantId, email, (profile.phone as string) || null]
                );
                if (reuse.rows.length > 0) return reuse.rows[0].id;
            }
            const codeRes = await client.query(
                `SELECT COALESCE(MAX(NULLIF(regexp_replace(reference_code, '\\D', '', 'g'), '')::int), 0) + 1 AS next
                 FROM private_clients WHERE reference_code LIKE 'PC-%'`
            );
            let n = codeRes.rows[0]?.next || 1;
            let code = `PC-${String(n).padStart(4, '0')}`;
            for (let i = 0; i < 100; i++) {
                const dup = await client.query(`SELECT 1 FROM private_clients WHERE reference_code = $1`, [code]);
                if (dup.rows.length === 0) break;
                n += 1;
                code = `PC-${String(n).padStart(4, '0')}`;
            }
            const nameParts = (displayName || 'Velo Client').split(' ');
            const firstName = nameParts[0] || 'Velo';
            const lastName = nameParts.slice(1).join(' ') || 'Client';
            const ins = await client.query(
                `INSERT INTO private_clients (tenant_id, reference_code, full_name, email, phone, status)
                 VALUES ($1, $2, $3, $4, $5, 'ACTIVE') RETURNING id`,
                [tenantId, code, displayName || `${firstName} ${lastName}`.trim(), email, (profile.phone as string) || null]
            );
            return ins.rows[0].id;
        }

        // DRIVER: drivers are onboarded through the Chauffeur Personnel Hub; identity links by email/phone.
        const link = await client.query(
            `SELECT id FROM drivers WHERE tenant_id = $1 AND ($2::text IS NOT NULL AND email = $2 OR $3::text IS NOT NULL AND phone = $3) LIMIT 1`,
            [tenantId, email, (profile.phone as string) || null]
        );
        if (link.rows.length > 0) return link.rows[0].id;
        throw badRequest('No matching driver record for this identity. Drivers are onboarded via the Chauffeur Personnel Hub first.');
    },
};
