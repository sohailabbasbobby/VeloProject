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
     * Executes the strict VELO clearing matrix utilizing a custom manual platform fee per trip.
     */
    public static calculateClearance(
        bookingId: string, 
        originatingTenantId: string, 
        fulfillingTenantId: string,
        customPlatformFee: number
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
        // The admin specifies the exact custom platform fee to extract from the fulfiller.
        const fulfillerNet = customPlatformFee;
        const fulfillerVat = fulfillerNet * this.VAT_RATE;
        const fulfillerGross = fulfillerNet + fulfillerVat;

        return {
            bookingId, originatingTenantId, fulfillingTenantId,
            creatorFeeNet: 0, // Creator is not charged a fee
            creatorFeeVat: 0,
            creatorFeeGross: 0,
            fulfillerFeeNet: fulfillerNet,
            fulfillerFeeVat: fulfillerVat,
            fulfillerFeeGross: fulfillerGross,
            totalPlatformGrossRevenue: fulfillerGross,
            isNetworkTrade: true
        };
    }
}
