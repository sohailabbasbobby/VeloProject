import dotenv from 'dotenv';

dotenv.config();

/**
 * TWILIO MASKED PROXY SERVICE (§1.3 Ghost Fulfilment)
 *
 * Passenger and driver phone numbers must never be exposed to each other.
 * All call/SMS contact flows through Twilio proxy numbers. Raw numbers are
 * never persisted side-by-side; only proxy assignments are logged.
 *
 * Requires env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PROXY_SERVICE_SID.
 * When Twilio env credentials are absent the service surfaces a configuration
 * error instead of silently leaking real numbers — masking is mandatory.
 */
export interface ProxyAssignment {
    driverProxyNumber: string | null;
    passengerProxyNumber: string | null;
    serviceSid: string | null;
}

export const TwilioProxyService = {
    isConfigured(): boolean {
        return Boolean(
            process.env.TWILIO_ACCOUNT_SID &&
            process.env.TWILIO_AUTH_TOKEN &&
            process.env.TWILIO_PROXY_SERVICE_SID
        );
    },

    /**
     * Creates (or reuses) a Twilio Proxy session for a trip and returns the two
     * proxy numbers each party dials. Implemented against Twilio Proxy REST API
     * using fetch (no SDK dependency).
     */
    async createProxySession(tripId: string, driverPhone: string, passengerPhone: string): Promise<ProxyAssignment> {
        if (!this.isConfigured()) {
            throw new Error(
                'Twilio Proxy is not configured (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_PROXY_SERVICE_SID). Ghost Fulfilment masking cannot proceed.'
            );
        }

        const sid = process.env.TWILIO_ACCOUNT_SID as string;
        const token = process.env.TWILIO_AUTH_TOKEN as string;
        const serviceSid = process.env.TWILIO_PROXY_SERVICE_SID as string;
        const auth = Buffer.from(`${sid}:${token}`).toString('base64');

        const headers = {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        };
        const base = `https://proxy.twilio.com/v1/Services/${serviceSid}`;

        // 1. Create a proxy session bound to this trip
        const sessionRes = await fetch(base + '/Sessions', {
            method: 'POST',
            headers,
            body: new URLSearchParams({ UniqueName: `trip-${tripId}` }),
        });
        const session: any = await sessionRes.json();
        if (!sessionRes.ok) {
            throw new Error(`Twilio session creation failed: ${session.message || sessionRes.status}`);
        }

        // 2. Add driver + passenger participants
        const participantNumbers: string[] = [];
        for (const identifier of [driverPhone, passengerPhone]) {
            const pRes = await fetch(`${base}/Sessions/${session.sid}/Participants`, {
                method: 'POST',
                headers,
                body: new URLSearchParams({ Identifier: identifier }),
            });
            const participant: any = await pRes.json();
            if (!pRes.ok) {
                throw new Error(`Twilio participant binding failed: ${participant.message || pRes.status}`);
            }
            participantNumbers.push(participant.proxy_identifier);
        }

        return {
            driverProxyNumber: participantNumbers[0] || null,
            passengerProxyNumber: participantNumbers[1] || null,
            serviceSid,
        };
    },
};
