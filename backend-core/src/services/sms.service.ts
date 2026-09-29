import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

/**
 * SMS SERVICE — pluggable sender for auth OTP codes (Jawa Ride pattern).
 *
 * Transport: Twilio's plain REST API via `fetch` — no vendor SDK. When
 * TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER are not fully
 * configured the sender is an HONEST no-op: it logs a warning and reports
 * `sent: false` so callers know the code was generated but NOT delivered.
 * It never fabricates a successful send.
 */
export interface SmsSendResult {
    sent: boolean;
    provider: 'TWILIO' | 'NOOP_UNCONFIGURED';
    providerMessageId?: string;
    error?: string;
}

const isTwilioConfigured = (): boolean =>
    Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER);

export const SmsService = {
    isConfigured: isTwilioConfigured,

    async send(to: string, body: string): Promise<SmsSendResult> {
        if (!isTwilioConfigured()) {
            console.warn(
                `[SMS] Twilio not configured (TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_FROM_NUMBER). ` +
                `Message to ${to} was NOT delivered: "${body}"`
            );
            return { sent: false, provider: 'NOOP_UNCONFIGURED', error: 'SMS provider not configured' };
        }

        const sid = process.env.TWILIO_ACCOUNT_SID as string;
        const token = process.env.TWILIO_AUTH_TOKEN as string;
        const from = process.env.TWILIO_FROM_NUMBER as string;

        try {
            const basic = Buffer.from(`${sid}:${token}`).toString('base64');
            const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${basic}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
            });
            const json: any = await res.json();
            if (!res.ok) {
                return { sent: false, provider: 'TWILIO', error: json?.message || `Twilio HTTP ${res.status}` };
            }
            return { sent: true, provider: 'TWILIO', providerMessageId: json?.sid };
        } catch (err: any) {
            return { sent: false, provider: 'TWILIO', error: err?.message || 'Twilio request failed' };
        }
    },

    /** Uniform hashing for OTP codes and refresh tokens (never store the raw value). */
    hashToken(value: string): string {
        return crypto.createHash('sha256').update(value).digest('hex');
    },
};
