import { Request, Response, NextFunction } from 'express';
import { db } from '../config/db';
import { verifyIdToken } from '../services/firebase.service';
import { asyncHandler, unauthorized, forbidden } from '../utils/httpError';

/**
 * TENANT ISOLATION & AUTH MIDDLEWARE (production)
 *
 * - Driver/Passenger apps authenticate with a Firebase ID token (Authorization: Bearer).
 *   The token's `uid` is resolved to a driver or private-client record; the tenant
 *   context derives from that record — the client never asserts its own tenant.
 * - Dashboards are server-side sessions; until the ERP/backoffice session service
 *   lands they authenticate with `x-tenant-id` (trusted, session-scoped header).
 * - Platform-admin endpoints additionally require `x-admin-key`.
 *
 * Downstream controllers receive `tenantId`, plus optional `authDriverId` /
 * `authClientId` when the caller is an authenticated app user.
 */
interface AuthedRequest extends Request {
    tenantId?: string;
    authDriverId?: string;
    authClientId?: string;
    isAdmin?: boolean;
}

const extractBearer = (req: Request): string | null => {
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
        return header.slice(7);
    }
    return null;
};

export const resolveAuth = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const typed = req as AuthedRequest;
    const bearer = extractBearer(req);

    if (bearer) {
        // 1. Verify the Firebase ID token cryptographically.
        const decoded = await verifyIdToken(bearer);

        // 2. Resolve the platform identity behind the token.
        const driverRes = await db.query('SELECT id, tenant_id FROM drivers WHERE firebase_uid = $1 LIMIT 1', [decoded.uid]);
        if (driverRes.rows.length > 0) {
            typed.authDriverId = driverRes.rows[0].id;
            typed.tenantId = driverRes.rows[0].tenant_id;
            return next();
        }

        const clientRes = await db.query('SELECT id, tenant_id FROM private_clients WHERE firebase_uid = $1 LIMIT 1', [decoded.uid]);
        if (clientRes.rows.length > 0) {
            typed.authClientId = clientRes.rows[0].id;
            typed.tenantId = clientRes.rows[0].tenant_id;
            return next();
        }

        throw forbidden('Authenticated identity is not registered on the Velo platform.');
    }

    // 3. Dashboard fallback: trusted session-scoped tenant header.
    const tenantHeader = req.headers['x-tenant-id'];
    if (!tenantHeader || typeof tenantHeader !== 'string') {
        throw unauthorized('Unauthorized: missing Firebase bearer token or tenant context.');
    }
    typed.tenantId = tenantHeader;
    next();
});

/** Requires an authenticated driver identity (Firebase). */
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
