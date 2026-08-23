/**
 * VELO PLATFORM - CORE CLEARING ENGINE & VAT CALCULATOR
 * 
 * Dynamic Financial Model:
 * 1. In-House Dispatch (Originator === Fulfiller) = £0.00 Platform Fees.
 * 2. Cross-Network Trade (Originator !== Fulfiller) = Fees calculated based on global config mode.
 * 3. Standard VAT (20%) is applied strictly on top of the calculated Net fee to produce Gross.
 */

export interface FeeSettings {
    creatorFeeMode: 'FLAT' | 'PERCENTAGE' | 'HYBRID';
    creatorFlatValue: number;
    creatorPercentageValue: number;
    fulfillerFeeMode: 'FLAT' | 'PERCENTAGE' | 'HYBRID';
    fulfillerFlatValue: number;
    fulfillerPercentageValue: number;
}

export interface ClearingResult {
    bookingId: string;
    originatingTenantId: string;
    fulfillingTenantId: string;
    creatorFeeNet: number;
    creatorFeeVat: number;
    creatorFeeGross: number;
    fulfillerFeeNet: number;
    fulfillerFeeVat: number;
    fulfillerFeeGross: number;
    totalPlatformGrossRevenue: number;
    isNetworkTrade: boolean;
}

export class VeloClearingEngine {
    
    // Standard UK VAT Rate (20%)
    private static readonly VAT_RATE = 0.20;

    /**
     * Executes the strict VELO clearing matrix utilizing active fee configurations.
     */
    public static calculateClearance(
        bookingId: string, 
        originatingTenantId: string, 
        fulfillingTenantId: string,
        wholesaleFare: number,
        settings: FeeSettings,
        creatorIsSubscribed: boolean = false,
        fulfillerIsSubscribed: boolean = false
    ): ClearingResult {
        
        // 1. In-House Job Evaluation
        if (originatingTenantId === fulfillingTenantId) {
            return {
                bookingId, originatingTenantId, fulfillingTenantId,
                creatorFeeNet: 0, creatorFeeVat: 0, creatorFeeGross: 0,
                fulfillerFeeNet: 0, fulfillerFeeVat: 0, fulfillerFeeGross: 0,
                totalPlatformGrossRevenue: 0, isNetworkTrade: false
            };
        }

        // 2. Cross-Network B2B Trade Evaluation
        // Exact Pricing Rule: 50p for trips < £7.00, £1.00 for trips >= £7.00
        const calcNetFee = (isSubscribed: boolean, baseFare: number) => {
            if (isSubscribed) return 0; // Subscription model pays 0% commission/transaction fee
            return baseFare < 7.00 ? 0.50 : 1.00;
        };

        const creatorNet = calcNetFee(creatorIsSubscribed, wholesaleFare);
        const fulfillerNet = calcNetFee(fulfillerIsSubscribed, wholesaleFare);

        const creatorVat = creatorNet * this.VAT_RATE;
        const fulfillerVat = fulfillerNet * this.VAT_RATE;

        const creatorGross = creatorNet + creatorVat;
        const fulfillerGross = fulfillerNet + fulfillerVat;

        return {
            bookingId, originatingTenantId, fulfillingTenantId,
            creatorFeeNet: creatorNet,
            creatorFeeVat: creatorVat,
            creatorFeeGross: creatorGross,
            fulfillerFeeNet: fulfillerNet,
            fulfillerFeeVat: fulfillerVat,
            fulfillerFeeGross: fulfillerGross,
            totalPlatformGrossRevenue: creatorGross + fulfillerGross,
            isNetworkTrade: true
        };
    }
}
