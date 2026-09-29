import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

/**
 * PUSH SERVICE — device-push delivery pipe (APNs / FCM at the OS level).
 *
 * Self-hosted auth swap note: Firebase Admin is GONE from the dependency tree.
 * Auth, sessions, chat and notification records are ours (PostgreSQL). What
 * remains here is only the unavoidable OS-level delivery pipe for native push,
 * implemented as a pluggable sender:
 *
 *   - FCM HTTP v1 via a raw service-account (FIREBASE_SERVICE_ACCOUNT_JSON /
 *     FIREBASE_SERVICE_ACCOUNT_B64) + google-auth-library → OAuth2 access
 *     token. Plain REST; no firebase-admin SDK.
 *   - If unconfigured, `sendPush` is an HONEST no-op: logs and reports
 *     delivered=false. In-app notification records are unaffected (they are
 *     written upstream by NotificationService).
 */
export interface PushResult {
    delivered: boolean;
    provider: 'FCM_HTTP_V1' | 'NOOP_UNCONFIGURED';
    error?: string;
}

const serviceAccountFromEnv = (): Record<string, any> | null => {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        try {
            return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        } catch {
            console.error('[Push] FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.');
            return null;
        }
    }
    if (process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
        try {
            return JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf-8'));
        } catch {
            console.error('[Push] FIREBASE_SERVICE_ACCOUNT_B64 is not valid base64 JSON.');
            return null;
        }
    }
    return null;
};

// Minimal OAuth2 token cache (FCM HTTP v1 requires a bearer access token).
let cachedAccessToken: { token: string; expiresAtMs: number } | null = null;

const getAccessToken = async (serviceAccount: Record<string, any>): Promise<string> => {
    if (cachedAccessToken && cachedAccessToken.expiresAtMs > Date.now() + 30_000) {
        return cachedAccessToken.token;
    }
    const { GoogleAuth } = await import('google-auth-library');
    const auth = new GoogleAuth({
        credentials: {
            client_email: serviceAccount.client_email,
            private_key: serviceAccount.private_key,
        },
        // FCM scope
        scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
    });
    const client = await auth.getClient();
    const { token } = await client.getAccessToken();
    if (!token) throw new Error('Failed to obtain FCM OAuth2 access token.');
    cachedAccessToken = { token, expiresAtMs: Date.now() + 55 * 60_000 };
    return token;
};

export const PushService = {
    isConfigured(): boolean {
        return serviceAccountFromEnv() !== null;
    },

    async sendPush(deviceToken: string, title: string, body: string, data?: Record<string, string>): Promise<PushResult> {
        const serviceAccount = serviceAccountFromEnv();
        if (!serviceAccount || !serviceAccount.project_id) {
            console.warn(`[Push] FCM not configured — push to ${deviceToken.slice(0, 8)}… NOT delivered: "${title}"`);
            return { delivered: false, provider: 'NOOP_UNCONFIGURED', error: 'Push provider not configured (in-app record persisted upstream).' };
        }

        try {
            const accessToken = await getAccessToken(serviceAccount);
            const res = await fetch(`https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: {
                        token: deviceToken,
                        notification: { title, body },
                        data: data || {},
                        android: { priority: 'HIGH' },
                    },
                }),
            });
            const json: any = await res.json().catch(() => null);
            if (!res.ok) {
                return { delivered: false, provider: 'FCM_HTTP_V1', error: json?.error?.message || `FCM HTTP ${res.status}` };
            }
            return { delivered: true, provider: 'FCM_HTTP_V1' };
        } catch (err: any) {
            return { delivered: false, provider: 'FCM_HTTP_V1', error: err?.message || 'FCM request failed' };
        }
    },
};

// Retained export name so the notification service keeps its call shape.
export const sendPush = PushService.sendPush;
void crypto;
