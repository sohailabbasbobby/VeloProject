import { Request, Response } from 'express';
import { db } from '../config/db';
import { asyncHandler, badRequest } from '../utils/httpError';
import { getAuthContext } from '../middleware/tenant.middleware';

/**
 * MESSAGING CONTROLLER (§2, §5 in-app messaging) — driver↔dispatcher threads,
 * masked passenger channel and client engagement threads, all persisted.
 */
export const listMessages = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const threadType = String(req.query.threadType || 'DRIVER_DISPATCH');
    const threadKey = req.query.threadKey ? String(req.query.threadKey) : null;
    const limit = Math.min(300, Number(req.query.limit || 100));

    const { rows } = await db.query(
        `SELECT * FROM messages
         WHERE tenant_id = $1 AND thread_type = $2 AND ($3::text IS NULL OR thread_key = $3)
         ORDER BY created_at DESC LIMIT $4`,
        [tenantId, threadType, threadKey, limit]
    );
    res.json({ success: true, data: rows });
});

export const postMessage = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId, driverId } = getAuthContext(req);
    const { threadType = 'DRIVER_DISPATCH', threadKey, senderType, body, tripId } = req.body || {};
    if (!threadKey || !body) throw badRequest('threadKey and body are required.');

    const effectiveSenderType = senderType || (driverId ? 'DRIVER' : 'DISPATCHER');
    const { rows } = await db.query(
        `INSERT INTO messages (tenant_id, thread_type, thread_key, trip_id, sender_type, sender_id, body)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [tenantId, threadType, threadKey, tripId || null, effectiveSenderType, driverId || null, String(body)]
    );
    res.status(201).json({ success: true, data: rows[0] });
});

/** Threads for the authenticated driver's sidebar messaging. */
export const myThreads = asyncHandler(async (req: Request, res: Response) => {
    const { driverId, tenantId } = getAuthContext(req);
    if (!driverId) throw badRequest('Driver authentication required.');
    const { rows } = await db.query(
        `SELECT DISTINCT ON (thread_key) thread_key, thread_type, body, sender_type, created_at
         FROM messages WHERE tenant_id = $1 AND thread_type = 'DRIVER_DISPATCH'
           AND (thread_key = $2 OR thread_key LIKE 'trip-%')
         ORDER BY thread_key, created_at DESC`,
        [tenantId, String(driverId)]
    );
    res.json({ success: true, data: rows });
});
