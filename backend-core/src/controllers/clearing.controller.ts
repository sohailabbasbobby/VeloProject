import { Request, Response } from 'express';
import { VeloClearingEngine, FeeSettings } from '../utils/veloClearingEngine';

// Simulated DB state representing `global_fee_settings`
let activeGlobalSettings: FeeSettings = {
    creatorFeeMode: 'FLAT',
    creatorFlatValue: 1.00,
    creatorPercentageValue: 0.00,
    fulfillerFeeMode: 'FLAT',
    fulfillerFlatValue: 1.00,
    fulfillerPercentageValue: 0.00
};

/**
 * VELO CORE ENDPOINT
 * Evaluates completed bookings, enforcing dynamic platform fees and VAT calculations.
 */
export const processNetworkSettlement = async (req: Request, res: Response) => {
    try {
        const originatingTenantId = (req as any).tenantId; 
        const { bookingId, fulfillingTenantId, wholesaleFare } = req.body;

        if (!bookingId || !fulfillingTenantId || wholesaleFare === undefined) {
            return res.status(400).json({ error: "VELO API: Missing required parameters for network clearing." });
        }

        // 1. Execute Pure VELO Clearing Math
        const clearanceResult = VeloClearingEngine.calculateClearance(
            bookingId, 
            originatingTenantId, 
            fulfillingTenantId,
            Number(wholesaleFare),
            activeGlobalSettings
        );

        // 2. Database/Stripe Ledger Actions (Execution Stubs)
        console.log(`\n[NETWORK CLEARING INITIATED] Booking: ${bookingId} (Wholesale Base: £${Number(wholesaleFare).toFixed(2)})`);
        
        if (clearanceResult.isNetworkTrade) {
            console.log(`[TRADE TYPE] Cross-Network B2B Fulfillment detected.`);
            console.log(`[CREATOR FEE] Net: £${clearanceResult.creatorFeeNet.toFixed(2)} | VAT: £${clearanceResult.creatorFeeVat.toFixed(2)} | GROSS EXTRACTION: £${clearanceResult.creatorFeeGross.toFixed(2)}`);
            console.log(`[FULFILLER FEE] Net: £${clearanceResult.fulfillerFeeNet.toFixed(2)} | VAT: £${clearanceResult.fulfillerFeeVat.toFixed(2)} | GROSS EXTRACTION: £${clearanceResult.fulfillerFeeGross.toFixed(2)}`);
            
            console.log(`[SQL EXECUTION STREAM] -> network_clearing_ledger`);
            console.log(`
                INSERT INTO network_clearing_ledger 
                (booking_id, originating_tenant_id, fulfilling_tenant_id, creator_fee_net, creator_fee_vat, creator_fee_gross, fulfiller_fee_net, fulfiller_fee_vat, fulfiller_fee_gross)
                VALUES ('${bookingId}', '${originatingTenantId}', '${fulfillingTenantId}', ${clearanceResult.creatorFeeNet}, ${clearanceResult.creatorFeeVat}, ${clearanceResult.creatorFeeGross}, ${clearanceResult.fulfillerFeeNet}, ${clearanceResult.fulfillerFeeVat}, ${clearanceResult.fulfillerFeeGross});
            `);
            
            console.log(`[BACK-OFFICE FEED] Traded transaction cleared. Total Platform Gross Revenue: £${clearanceResult.totalPlatformGrossRevenue.toFixed(2)}`);
        } else {
            console.log(`[TRADE TYPE] In-House Dispatch detected. Zero fees apply.`);
        }
        console.log(`-----------------------------------------------------\n`);

        return res.status(200).json({
            success: true,
            status: clearanceResult.isNetworkTrade ? 'NETWORK_FEES_EXTRACTED' : 'IN_HOUSE_CLEARED',
            clearing_data: clearanceResult
        });

    } catch (error) {
        console.error('CRITICAL [VELO CLEARING ENGINE FAILURE]:', error);
        return res.status(500).json({ error: 'VELO API: Internal Server Error during network settlement.' });
    }
};

/**
 * VELO CORE ENDPOINT (BACK-OFFICE MASTER TOWER)
 * Allows administrators to dynamically manipulate global fee configurations.
 */
export const updateGlobalFeeConfig = async (req: Request, res: Response) => {
    try {
        const adminKey = req.headers['x-admin-key'];
        if (adminKey !== 'super-secret-velo-admin-key-999') {
            return res.status(403).json({ error: 'Forbidden: Valid Master Admin Key Required' });
        }

        const newSettings = req.body as Partial<FeeSettings>;
        
        // Merge updates into the active memory state (Simulating a DB UPDATE)
        activeGlobalSettings = { ...activeGlobalSettings, ...newSettings };

        console.log(`\n[BACK-OFFICE TOWER] Master Configuration overriding global_fee_settings...`);
        console.log(JSON.stringify(activeGlobalSettings, null, 2));
        console.log(`-----------------------------------------------------\n`);

        return res.status(200).json({
            success: true,
            message: "Global Fee Configuration successfully updated.",
            active_settings: activeGlobalSettings
        });

    } catch (error) {
        console.error('CRITICAL [VELO CONFIG FAILURE]:', error);
        return res.status(500).json({ error: 'VELO API: Internal Server Error during config update.' });
    }
};
