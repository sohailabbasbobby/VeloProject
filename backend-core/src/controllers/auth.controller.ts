import { Request, Response } from 'express';
import { asyncHandler, badRequest, forbidden } from '../utils/httpError';
import { AuthService, ActorType, AuthProvider } from '../services/auth.service';

/**
 * AUTH CONTROLLER — self-hosted authentication endpoints (Jawa Ride pattern).
 *
 * Mounted at /api/auth — BEFORE the global resolveAuth middleware (see app.ts):
 * these endpoints themselves issue the session that resolveAuth later verifies.
 * All endpoints return the unified session shape from AuthService: our own
 * access + rotating refresh tokens, never a third-party credential.
 *
 * Platform rule: the mobile apps are driver/passenger clients. Dashboards do
 * not use this controller (they authenticate via x-tenant-id + x-admin-key).
 */

const parseActorType = (value: unknown): ActorType => {
    const v = String(value || '').toUpperCase();
    if (v === 'DRIVER' || v === 'PRIVATE_CLIENT') return v;
    throw badRequest('actorType must be DRIVER or PRIVATE_CLIENT.');
};

const sessionMeta = (req: Request) => ({
    userAgent: String(req.headers['user-agent'] || ''),
    ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || undefined,
});

// POST /api/auth/register — email + password (bcrypt in our own Postgres)
export const register = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId, actorType, email, password, displayName, profile } = req.body || {};
    if (!tenantId || !email || !password) {
        throw badRequest('tenantId, email and password are required.');
    }
    const tokens = await AuthService.registerPassword({
        tenantId: String(tenantId),
        actorType: parseActorType(actorType || 'PRIVATE_CLIENT'),
        email: String(email),
        password: String(password),
        displayName: String(displayName || email.split('@')[0]),
        profile: (profile as Record<string, unknown>) || {},
    });
    res.status(201).json({ success: true, data: tokens });
});

// POST /api/auth/login — email + password
export const login = asyncHandler(async (req: Request, res: Response) => {
    const { actorType, email, password } = req.body || {};
    if (!email || !password) throw badRequest('email and password are required.');
    const tokens = await AuthService.loginPassword({
        actorType: parseActorType(actorType || 'PRIVATE_CLIENT'),
        email: String(email),
        password: String(password),
        ...sessionMeta(req),
    });
    res.json({ success: true, data: tokens });
});

// POST /api/auth/otp/request — generate + send (or honestly no-op) a 6-digit code
export const requestOtp = asyncHandler(async (req: Request, res: Response) => {
    const { phone, purpose } = req.body || {};
    if (!phone) throw badRequest('phone is required.');
    const result = await AuthService.requestOtp({ phone: String(phone), purpose: purpose === 'BIND' ? 'BIND' : 'LOGIN' });
    // `sent: false` is reported honestly when the SMS provider is unconfigured.
    res.json({ success: true, data: result });
});

// POST /api/auth/otp/verify — consume the code, get a session
export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
    const { phone, code, actorType, tenantId, autoProvision, displayName } = req.body || {};
    if (!phone || !code) throw badRequest('phone and code are required.');
    const tokens = await AuthService.verifyOtp({
        phone: String(phone),
        code: String(code),
        actorType: parseActorType(actorType || 'PRIVATE_CLIENT'),
        tenantId: tenantId ? String(tenantId) : undefined,
        autoProvision: Boolean(autoProvision),
        displayName: displayName ? String(displayName) : undefined,
        ...sessionMeta(req),
    });
    res.json({ success: true, data: tokens });
});

// POST /api/auth/google — native Google Sign-In ID token
export const loginGoogle = asyncHandler(async (req: Request, res: Response) => {
    const { idToken, actorType, tenantId, autoProvision, displayName } = req.body || {};
    if (!idToken) throw badRequest('idToken from the native Google Sign-In SDK is required.');
    const tokens = await AuthService.loginGoogle({
        idToken: String(idToken),
        actorType: parseActorType(actorType || 'PRIVATE_CLIENT'),
        tenantId: tenantId ? String(tenantId) : undefined,
        autoProvision: Boolean(autoProvision),
        displayName: displayName ? String(displayName) : undefined,
        ...sessionMeta(req),
    });
    res.json({ success: true, data: tokens });
});

// POST /api/auth/apple — native Sign in with Apple identity token
export const loginApple = asyncHandler(async (req: Request, res: Response) => {
    const { identityToken, actorType, tenantId, autoProvision, displayName, nonce } = req.body || {};
    if (!identityToken) throw badRequest('identityToken from Sign in with Apple is required.');
    const tokens = await AuthService.loginApple({
        identityToken: String(identityToken),
        actorType: parseActorType(actorType || 'PRIVATE_CLIENT'),
        tenantId: tenantId ? String(tenantId) : undefined,
        autoProvision: Boolean(autoProvision),
        displayName: displayName ? String(displayName) : undefined,
        nonce: nonce ? String(nonce) : undefined,
        ...sessionMeta(req),
    });
    res.json({ success: true, data: tokens });
});

// POST /api/auth/refresh — rotate the refresh token, mint a fresh access token
export const refresh = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body || {};
    const tokens = await AuthService.refreshSession(String(refreshToken || ''), sessionMeta(req));
    res.json({ success: true, data: tokens });
});

// POST /api/auth/logout — revoke the presented refresh token
export const logout = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body || {};
    await AuthService.revokeSession(String(refreshToken || ''));
    res.json({ success: true, data: { revoked: true } });
});

// GET /api/auth/providers — which sign-in methods are actually configured (honest capability report)
export const providers = asyncHandler(async (_req: Request, res: Response) => {
    res.json({
        success: true,
        data: {
            password: true,
            phoneOtp: true,
            google: Boolean(process.env.GOOGLE_CLIENT_ID),
            apple: Boolean(process.env.APPLE_CLIENT_ID),
            smsDelivery: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER),
        },
    });
});

/** Identity self-inspection — used by the apps after sign-in to load "me". */
export const me = asyncHandler(async (req: Request, res: Response) => {
    const auth = (req as any).authIdentity as { id: string; provider: AuthProvider; actorType: ActorType; actorId: string; tenantId: string } | undefined;
    if (!auth) throw forbidden('Authenticated identity required.');
    res.json({ success: true, data: auth });
});
