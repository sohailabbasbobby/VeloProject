import { Request, Response, NextFunction } from 'express';
import { asyncHandler, unauthorized, forbidden } from '../utils/httpError';
import { AuthService, ActorType } from '../services/auth.service';

/**
 * TENANT ISOLATION & AUTH MIDDLEWARE (production, self-hosted auth)
 *
 * - Driver/Passenger apps authenticate with OUR OWN JWT access token
 *   (Authorization: Bearer), issued by AuthService after one of the four
 *   sign-in methods (password / OTP / Google / Apple). The token's claims
 *   carry the identity → actor mapping directly; no third-party verifier.
 * - Dashboards are server-side sessions; until the ERP/backoffice session
 *   service lands they authenticate with `x-tenant-id` (session-scoped header).
 * - Platform-admin endpoints additionally require `x-admin-key`.
 *
 * Downstream controllers receive `tenantId`, plus optional `authDriverId` /
 * `authClientId` when the caller is an authenticated app user.
 */
interface AuthedRequest extends Request {
    tenantId?: string;
    authDriverId?: string;
    authClientId?: string;
    authIdentityId?: string;
    isAdmin?: boolean;
}

const extractBearer = (req: Request): string | null => {
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
        return header.slice(7);
    }
    return null;
};

const applyClaims = (req: Request, claims: { sub: string; actorType: ActorType; actorId: string; tenantId: string }): void => {
    const typed = req as AuthedRequest;
    typed.authIdentityId = claims.sub;
    typed.tenantId = claims.tenantId;
    if (claims.actorType === 'DRIVER') {
        typed.authDriverId = claims.actorId;
    } else {
        typed.authClientId = claims.actorId;
    }
};

export const resolveAuth = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const typed = req as AuthedRequest;
    const bearer = extractBearer(req);

    if (bearer) {
        // Verify OUR access token cryptographically (HS256, issuer velo-jawa).
        const claims = AuthService.verifyAccessToken(bearer);
        applyClaims(req, claims);
        return next();
    }

    // Dashboard fallback: trusted session-scoped tenant header.
    const tenantHeader = req.headers['x-tenant-id'];
    if (!tenantHeader || typeof tenantHeader !== 'string') {
        throw unauthorized('Unauthorized: missing bearer session token or tenant context.');
    }
    typed.tenantId = tenantHeader;
    next();
});

/** Lightweight verification for auth-controller routes mounted before resolveAuth (e.g. GET /api/auth/me). */
export const attachIdentityFromAccess = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    const bearer = extractBearer(req);
    if (!bearer) throw unauthorized('Authorization: Bearer access token required.');
    const claims = AuthService.verifyAccessToken(bearer);
    applyClaims(req, claims);
    (req as any).authIdentity = {
        id: claims.sub,
        actorType: claims.actorType,
        actorId: claims.actorId,
        tenantId: claims.tenantId,
    };
    next();
});

/** Requires an authenticated driver identity (self-hosted session). */
export const requireDriver = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const typed = req as AuthedRequest;
    if (!typed.authDriverId) {
        throw unauthorized('Driver authentication required.');
    }
    next();
});

/** Requires a valid x-admin-key for platform-admin operations (backoffice + system config). */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    const adminKey = req.headers['x-admin-key'];
    if (!process.env.ADMIN_KEY || adminKey !== process.env.ADMIN_KEY) {
        throw forbidden('Forbidden: valid platform admin key required.');
    }
    (req as AuthedRequest).isAdmin = true;
    next();
};

/** Requires both tenant context and platform admin key. */
export const requireTenantAdmin = [resolveAuth, requireAdmin];

export const getAuthContext = (req: Request): { tenantId: string | null; driverId: string | null; clientId: string | null; isAdmin: boolean } => {
    const typed = req as AuthedRequest;
    return {
        tenantId: typed.tenantId ?? null,
        driverId: typed.authDriverId ?? null,
        clientId: typed.authClientId ?? null,
        isAdmin: typed.isAdmin ?? false,
    };
};
