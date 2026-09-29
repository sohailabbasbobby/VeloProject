import { Request, Response } from 'express';
import { db } from '../config/db';
import { asyncHandler, badRequest } from '../utils/httpError';
import { NotificationService } from '../utils/notificationService';
import { getAuthContext } from '../middleware/tenant.middleware';

/**
 * NOTIFICATION CONTROLLER (§2) — real in-app feed plus dispatch through
 * FCM push / Twilio SMS. Job offers, negotiation timers, compliance warnings,
 * payout confirmations and schedule conflicts all land here.
 */

export const listNotifications = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId, driverId } = getAuthContext(req);
    const { unreadOnly, limit = 100 } = req.query;

    let rows: any[] = [];
    if (driverId) {
        ({ rows } = await db.query(
            `SELECT * FROM notifications
             WHERE recipient_type = 'DRIVER' AND recipient_id = $1 AND ($2::bool IS NULL OR read_at IS NULL)
             ORDER BY sent_at DESC LIMIT $3`,
            [driverId, unreadOnly === 'true', Math.min(500, Number(limit))]
        ));
    } else if (tenantId) {
        ({ rows } = await db.query(
            `SELECT * FROM notifications
             WHERE tenant_id = $1 AND recipient_type = 'TENANT_ADMIN' AND ($2::bool IS NULL OR read_at IS NULL)
             ORDER BY sent_at DESC LIMIT $3`,
            [tenantId, unreadOnly === 'true', Math.min(500, Number(limit))]
        ));
    } else {
        throw badRequest('Authentication context required.');
    }
    res.json({ success: true, data: rows });
});

export const unreadCount = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId, driverId } = getAuthContext(req);
    let count = 0;
    if (driverId) {
        const { rows } = await db.query(
            `SELECT COUNT(*) AS n FROM notifications WHERE recipient_type = 'DRIVER' AND recipient_id = $1 AND read_at IS NULL`,
            [driverId]
        );
        count = Number(rows[0].n);
    } else if (tenantId) {
        const { rows } = await db.query(
            `SELECT COUNT(*) AS n FROM notifications WHERE tenant_id = $1 AND recipient_type = 'TENANT_ADMIN' AND read_at IS NULL`,
            [tenantId]
        );
        count = Number(rows[0].n);
    }
    res.json({ success: true, data: { count } });
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId, driverId } = getAuthContext(req);
    const ids: string[] = Array.isArray(req.body?.ids) ? req.body.ids : [String(req.params.id)];
    if (driverId) {
        await db.query(`UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE id = ANY($1::uuid[]) AND recipient_id = $2`, [ids, driverId]);
    } else if (tenantId) {
        await db.query(`UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE id = ANY($1::uuid[]) AND tenant_id = $2`, [ids, tenantId]);
    } else {
        throw badRequest('Authentication context required.');
    }
    res.json({ success: true, data: { markedRead: ids.length } });
});

export const dispatchNotification = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const { recipientType, recipientId, title, body, channels } = req.body || {};
    if (!recipientType || !title || !body) throw badRequest('recipientType, title and body are required.');

    await NotificationService.dispatch({
        recipientType, recipientId: recipientId || null, tenantId: tenantId || null,
        title, body, channels: Array.isArray(channels) && channels.length ? channels : ['IN_APP'],
        metadata: { dispatchedBy: 'API' },
    });
    res.status(201).json({ success: true, data: { dispatched: true } });
});
