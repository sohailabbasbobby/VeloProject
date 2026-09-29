import { db } from '../config/db';
import { sendPush } from '../services/push.service';
import dotenv from 'dotenv';

dotenv.config();

/**
 * NOTIFICATION SERVICE — real dispatch through FCM (push), Twilio (SMS) and
 * database-persisted in-app records. Every dispatch also writes a `notifications`
 * row so dashboards and apps can render in-app history.
 */
export interface NotificationPayload {
    recipientType: 'DRIVER' | 'TENANT_ADMIN' | 'PASSENGER' | 'STAFF';
    recipientId: string | null;
    tenantId: string | null;
    title: string;
    body: string;
    channels: Array<'PUSH' | 'SMS' | 'EMAIL' | 'IN_APP'>;
    metadata?: Record<string, unknown>;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

export const NotificationService = {
    async dispatch(payload: NotificationPayload): Promise<void> {
        // 1. Persist in-app record (always)
        for (const channel of payload.channels) {
            await db.query(
                `INSERT INTO notifications (tenant_id, recipient_type, recipient_id, channel, title, body, metadata)
                 VALUES ($1,$2,$3,$4,$5,$6,$7)`,
                [payload.tenantId, payload.recipientType, payload.recipientId, channel, payload.title, payload.body,
                 JSON.stringify(payload.metadata || {})]
            );
        }

        // 2. Push via FCM when the recipient has a registered device token
        if (payload.channels.includes('PUSH') && payload.recipientType === 'DRIVER' && payload.recipientId) {
            const tokenRes = await db.query(
                `SELECT fcm_token FROM drivers WHERE id = $1 AND fcm_token IS NOT NULL`,
                [payload.recipientId]
            );
            const token = tokenRes.rows[0]?.fcm_token;
            if (token) {
                sendPush(token, payload.title, payload.body, {
                    tenantId: payload.tenantId || '',
                    ...(payload.metadata as Record<string, string> || {}),
                }).catch(() => undefined);
            }
        }

        // 3. SMS via Twilio when configured
        if (payload.channels.includes('SMS')) {
            await this.sendSms(payload).catch((err) =>
                console.error('[SMS] dispatch failed:', (err as Error).message)
            );
        }
    },

    async sendSms(payload: NotificationPayload): Promise<boolean> {
        const sid = process.env.TWILIO_ACCOUNT_SID;
        const token = process.env.TWILIO_AUTH_TOKEN;
        const from = process.env.TWILIO_FROM_NUMBER;
        if (!sid || !token || !from) {
            console.error('[SMS] Twilio not configured; SMS channel skipped.');
            return false;
        }

        let to: string | null = null;
        if (payload.recipientType === 'DRIVER' && payload.recipientId) {
            const r = await db.query('SELECT phone FROM drivers WHERE id = $1', [payload.recipientId]);
            to = r.rows[0]?.phone || null;
        } else if (payload.recipientType === 'PASSENGER' && payload.recipientId) {
            const r = await db.query('SELECT phone FROM private_clients WHERE id = $1', [payload.recipientId]);
            to = r.rows[0]?.phone || null;
        }
        if (!to) return false;

        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({ To: to, From: from, Body: payload.body }),
        });
        return res.ok;
    },

    // Convenience wrappers used across controllers ------------------------------

    async notifyDriverTripOffer(tenantId: string, driverId: string, taskId: string, pickup: string, expiresAt: Date): Promise<void> {
        await this.dispatch({
            recipientType: 'DRIVER', recipientId: driverId, tenantId,
            title: 'New Job Offer',
            body: `Job ${taskId}: pickup at ${pickup}. Offer expires ${expiresAt.toISOString()}.`,
            channels: ['PUSH', 'IN_APP'],
            metadata: { type: 'TRIP_OFFER', taskId },
        });
    },

    async notifyScheduleConflict(tenantId: string, driverId: string, taskIdA: string, taskIdB: string): Promise<void> {
        await this.dispatch({
            recipientType: 'DRIVER', recipientId: driverId, tenantId,
            title: 'Schedule Conflict Detected',
            body: `Trips ${taskIdA} and ${taskIdB} overlap. You must choose one; the other will be forfeited.`,
            channels: ['PUSH', 'IN_APP'],
            metadata: { type: 'SCHEDULE_CONFLICT', tripA: taskIdA, tripB: taskIdB },
        });
    },

    async notifyNegotiationUpdate(tenantId: string, jobId: string, message: string): Promise<void> {
        await this.dispatch({
            recipientType: 'TENANT_ADMIN', recipientId: null, tenantId,
            title: 'B2B Pool Negotiation',
            body: message,
            channels: ['IN_APP'],
            metadata: { type: 'POOL_NEGOTIATION', jobId },
        });
    },

    async notifyPayoutConfirmation(tenantId: string, driverId: string, amount: number): Promise<void> {
        await this.dispatch({
            recipientType: 'DRIVER', recipientId: driverId, tenantId,
            title: 'Payout Executed',
            body: `Your payout of £${round2(amount).toFixed(2)} has been executed and is on its way.`,
            channels: ['PUSH', 'IN_APP'],
            metadata: { type: 'PAYOUT', amount },
        });
    },

    async notifyComplianceExpiry(tenantId: string, driverId: string, documentType: string, expiryDate: string): Promise<void> {
        await this.dispatch({
            recipientType: 'DRIVER', recipientId: driverId, tenantId,
            title: 'Compliance Document Expiring',
            body: `Your ${documentType} expires on ${expiryDate}. Upload a renewal to stay compliant.`,
            channels: ['PUSH', 'EMAIL', 'IN_APP'],
            metadata: { type: 'COMPLIANCE_EXPIRY', documentType, expiryDate },
        });
    },

    /** Retained API used by pool acceptance flows (now DB/FCM-backed, previously console-only). */
    async sendClientConfirmation(phone: string, clientName: string, pickup: string, vehicle: string, tenantName: string): Promise<void> {
        await db.query(
            `INSERT INTO notifications (tenant_id, recipient_type, recipient_id, channel, title, body, metadata)
             VALUES (NULL,'PASSENGER',NULL,'SMS','Booking Confirmed',$1,$2)`,
            [`${clientName}: your chauffeur arrives at ${pickup} in a ${vehicle}, arranged by ${tenantName}.`,
             JSON.stringify({ phone })]
        );
    },

    async sendDriverAllocation(phone: string, pickupTime: string, route: string, protocol: string): Promise<void> {
        await db.query(
            `INSERT INTO notifications (tenant_id, recipient_type, recipient_id, channel, title, body, metadata)
             VALUES (NULL,'DRIVER',NULL,'SMS','Job Allocated',$1,$2)`,
            [`ASAP ${pickupTime}: ${route}. ${protocol}`, JSON.stringify({ phone })]
        );
    },
};
