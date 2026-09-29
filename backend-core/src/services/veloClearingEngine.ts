import { SettingsService, FeeSettings } from './settings.service';
import { db } from '../config/db';

/**
 * VELO CLEARING ENGINE — exact financial mathematics (§1.1–§1.2, §0 Rules 9 & 10)
 *
 * Invariants:
 * 1. CUSTOM TRIP PRICING — every trip's price is manually entered by the back-office
 *    admin per booking. There is NO flat/tiered platform fee schedule anywhere.
 * 2. VAT (20% UK standard) applies exclusively to the platform fee extracted from the
 *    DRIVER side. Customer-facing retail fares never carry a VAT line item.
 * 3. Cross-tenant (pool) trades settle: fulfiller owes platform fee; originating tenant
 *    earns its configurable finder's margin from the fulfiller's wholesale fare.
 * 4. In-house jobs (originator === fulfiller) carry zero platform fees.
 */

export interface ClearingResult {
    bookingId: string;
    originatingTenantId: string | null;
    fulfillingTenantId: string | null;
    wholesaleFare: number;
    platformFeeNet: number;
    platformFeeVat: number;
    platformFeeGross: number;
    finderMarginNet: number;
    finderMarginVat: number;
    finderMarginGross: number;
    driverEarnings: number;
    totalPlatformGrossRevenue: number;
    isNetworkTrade: boolean;
    driverLedgerEntries: Array<{ entryType: string; direction: 'CREDIT' | 'DEBIT'; amount: number; description: string }>;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

export const VeloClearingEngine = {
    /**
     * Settles a completed trip.
     * @param customPrice          the manually-entered retail fare for THIS trip (§1.2)
     * @param customPlatformFeeNet back-office-entered platform fee for THIS trip (driver-side fee)
     */
    async settleTrip(params: {
        bookingId: string;
        originatingTenantId: string;
        fulfillingTenantId: string | null;
        customPrice: number;
        customPlatformFeeNet: number;
        tip?: number;
    }): Promise<ClearingResult> {
        const { bookingId, originatingTenantId, fulfillingTenantId, customPrice, customPlatformFeeNet, tip = 0 } = params;
        const fees: FeeSettings = await SettingsService.getFees();
        const vatRate = fees.vatRate;

        const isNetworkTrade = Boolean(fulfillingTenantId) && fulfillingTenantId !== originatingTenantId;
        const wholesaleFare = customPrice; // pool trades settle at the negotiated/accepted wholesale fare

        // VAT applies ONLY to the driver-side platform fee (Rule 9)
        const platformFeeNet = round2(Math.max(0, customPlatformFeeNet));
        const platformFeeVat = round2(platformFeeNet * vatRate);
        const platformFeeGross = round2(platformFeeNet + platformFeeVat);

        // Finder's margin: originating tenant's cut on cross-tenant trades
        let finderMarginNet = 0;
        if (isNetworkTrade && fulfillingTenantId) {
            const tenantRes = await db.query(
                'SELECT finder_margin_rate FROM tenants WHERE id = $1',
                [originatingTenantId]
            );
            const rate = tenantRes.rows[0] ? Number(tenantRes.rows[0].finder_margin_rate) : 0.25;
            finderMarginNet = round2(wholesaleFare * rate);
        }
        const finderMarginVat = round2(finderMarginNet * vatRate);
        const finderMarginGross = round2(finderMarginNet + finderMarginVat);

        // Driver earnings: fare minus the platform fee (driver-side extraction). Tip always passes through.
        const driverEarnings = round2(Math.max(0, customPrice - platformFeeNet)) + round2(tip);

        const driverLedgerEntries: ClearingResult['driverLedgerEntries'] = [
            {
                entryType: 'TRIP_EARNINGS',
                direction: 'CREDIT',
                amount: driverEarnings,
                description: `Trip settlement: fare £${round2(customPrice).toFixed(2)} − platform fee £${platformFeeNet.toFixed(2)}` + (tip ? ` + tip £${round2(tip).toFixed(2)}` : ''),
            },
        ];

        return {
            bookingId,
            originatingTenantId,
            fulfillingTenantId,
            wholesaleFare: round2(wholesaleFare),
            platformFeeNet,
            platformFeeVat,
            platformFeeGross,
            finderMarginNet,
            finderMarginVat,
            finderMarginGross,
            driverEarnings,
            totalPlatformGrossRevenue: round2(platformFeeGross + finderMarginGross),
            isNetworkTrade,
            driverLedgerEntries,
        };
    },
};
