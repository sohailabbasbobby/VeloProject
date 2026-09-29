import { db } from '../config/db';
import { HttpError, notFound } from '../utils/httpError';

/**
 * PLATFORM SETTINGS SERVICE — the single persisted source of truth for all
 * operational configuration (§2 clearing fix + §4 Global Settings).
 *
 * RULE: no operational setting may ever live in an in-memory module variable.
 * Reads go straight to PostgreSQL; writes are transactional upserts.
 */

export interface FloorTier {
    base: number;
    perMile: number;
    perHour: number;
    minHours: number;
}

export type NetworkFloors = Record<string, FloorTier>;

export interface FeeSettings {
    mode: 'CUSTOM_TRIP';
    vatRate: number;
    creatorFeeNet: number;
    fulfillerFeeDefaultNet: number;
}

export interface DispatchSettings {
    ownFleetAsapTimeoutSeconds: number;
    ownFleetScheduledTimeoutMinutes: number;
    nearbyDriverRadiusMeters: number;
}

export interface AuthSettings {
    accessTokenTtlSeconds: number;
    refreshTokenTtlDays: number;
    otpTtlSeconds: number;
    otpMaxAttempts: number;
    otpLength: number;
    otpMaxPerHour: number;
    bcryptRounds: number;
}

export interface PayrollSettings {
    pensionRateDefault: number;
    studentLoanRateDefault: number;
    simplifiedNetPayDeductionRate: number;
}

const asObject = <T>(rowValue: unknown, fallback: T): T => ({ ...fallback, ...(rowValue as object) });

export const SettingsService = {
    async get<T>(key: string): Promise<T> {
        const { rows } = await db.query<{ value: T }>(
            'SELECT value FROM platform_settings WHERE key = $1',
            [key]
        );
        if (!rows[0]) {
            throw notFound(`Setting '${key}' is not configured in platform_settings.`);
        }
        return rows[0].value;
    },

    async set(key: string, value: unknown, updatedBy: string): Promise<void> {
        await db.query(
            `INSERT INTO platform_settings (key, value, updated_by, updated_at)
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
             ON CONFLICT (key) DO UPDATE
             SET value = $2, updated_by = $3, updated_at = CURRENT_TIMESTAMP`,
            [key, JSON.stringify(value), updatedBy]
        );
    },

    async getAll(): Promise<Record<string, unknown>> {
        const { rows } = await db.query<{ key: string; value: unknown; description: string | null; updated_at: Date; updated_by: string | null }>(
            'SELECT key, value, description, updated_by, updated_at FROM platform_settings ORDER BY key'
        );
        const out: Record<string, unknown> = {};
        for (const r of rows) {
            out[r.key] = { value: r.value, description: r.description, updated_by: r.updated_by, updated_at: r.updated_at };
        }
        return out;
    },

    async getFees(): Promise<FeeSettings> {
        return asObject<FeeSettings>(await this.get('fees'), {
            mode: 'CUSTOM_TRIP', vatRate: 0.2, creatorFeeNet: 0, fulfillerFeeDefaultNet: 0,
        });
    },

    async getNetworkFloors(): Promise<NetworkFloors> {
        return asObject<NetworkFloors>(await this.get('network_floors'), {
            EXECUTIVE: { base: 35.0, perMile: 2.1, perHour: 32.0, minHours: 2 },
            PREMIUM_MPV: { base: 85.0, perMile: 2.8, perHour: 45.0, minHours: 3 },
            FIRST_CLASS: { base: 85.0, perMile: 3.15, perHour: 56.0, minHours: 3 },
            ULTRA_LUXURY: { base: 175.0, perMile: 5.6, perHour: 105.0, minHours: 4 },
        });
    },

    async getNegotiationSettings(): Promise<{ timeoutMinutes: number }> {
        return asObject<{ timeoutMinutes: number }>(await this.get('negotiation'), { timeoutMinutes: 10 });
    },

    async getDispatchSettings(): Promise<DispatchSettings> {
        return asObject<DispatchSettings>(await this.get('dispatch'), {
            ownFleetAsapTimeoutSeconds: 60,
            ownFleetScheduledTimeoutMinutes: 10,
            nearbyDriverRadiusMeters: 5000,
        });
    },

    async getPayrollSettings(): Promise<PayrollSettings> {
        return asObject<PayrollSettings>(await this.get('payroll'), {
            pensionRateDefault: 0.05,
            studentLoanRateDefault: 0.09,
            simplifiedNetPayDeductionRate: 0.25,
        });
    },

    async getSubscriptionSettings(): Promise<{ weeklyFee: number }> {
        return asObject<{ weeklyFee: number }>(await this.get('subscription'), { weeklyFee: 50.0 });
    },

    /** Self-hosted auth tuning (Jawa Ride pattern) — all persisted, none hardcoded. */
    async getAuthSettings(): Promise<AuthSettings> {
        return asObject<AuthSettings>(await this.get('auth'), {
            accessTokenTtlSeconds: 900,             // 15 min access tokens
            refreshTokenTtlDays: 30,
            otpTtlSeconds: 300,                     // 5-minute OTP window
            otpMaxAttempts: 5,
            otpLength: 6,
            otpMaxPerHour: 5,                       // request-rate cap per phone
            bcryptRounds: 12,
        });
    },

    /** Computes the network floor price for a route/tier: base + perMile*miles + perHour*max(miles/speed, minHours). */
    async computeFloorPrice(tier: string, distanceMiles: number): Promise<{ floor: number; tier: FloorTier }> {
        const floors = await this.getNetworkFloors();
        const t = floors[tier];
        if (!t) {
            throw new HttpError(400, `Unknown vehicle tier '${tier}'.`, 'UNKNOWN_TIER');
        }
        const assumedMph = 30;
        const estimatedHours = Math.max(t.minHours, distanceMiles / assumedMph);
        const floor = t.base + t.perMile * distanceMiles + t.perHour * estimatedHours;
        return { floor: Math.round(floor * 100) / 100, tier: t };
    },
};
