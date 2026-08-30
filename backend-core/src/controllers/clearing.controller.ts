import { Request, Response, NextFunction } from 'express';
import { VeloClearingEngine, FeeSettings } from '../utils/veloClearingEngine';
import { db } from '../config/db';
import { z } from 'zod';

const settlementSchema = z.object({
    bookingId: z.string().min(1),
    fulfillingTenantId: z.string().min(1),
    customPlatformFee: z.number().min(0)
});

/**
 * VELO CORE ENDPOINT
 * Evaluates completed bookings, enforcing dynamic platform fees and VAT calculations.
 */
export const processNetworkSettlement = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const originatingTenantId = (req as any).tenantId; 

        // Validate payload
        const validation = settlementSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: "VELO API: Invalid parameters for network clearing.", details: validation.error.issues });
        }
        const { bookingId, fulfillingTenantId, customPlatformFee } = validation.data;

        // 1. Execute Pure VELO Clearing Math
        const clearanceResult = VeloClearingEngine.calculateClearance(
            bookingId, 
            originatingTenantId, 
            fulfillingTenantId,
            Number(customPlatformFee)
        );

        // 2. Database/Stripe Ledger Actions
        console.log(`\n[NETWORK CLEARING INITIATED] Booking: ${bookingId} (Custom Platform Fee: £${Number(customPlatformFee).toFixed(2)})`);
        
        if (clearanceResult.isNetworkTrade) {
            console.log(`[TRADE TYPE] Cross-Network B2B Fulfillment detected.`);
            console.log(`[FULFILLER FEE] Net: £${clearanceResult.fulfillerFeeNet.toFixed(2)} | VAT: £${clearanceResult.fulfillerFeeVat.toFixed(2)} | GROSS EXTRACTION: £${clearanceResult.fulfillerFeeGross.toFixed(2)}`);
            
            console.log(`[SQL EXECUTION STREAM] -> network_clearing_ledger`);
            
            const client = await db.connect();
            try {
                await client.query('BEGIN');
                await client.query(`
                    INSERT INTO network_clearing_ledger 
                    (booking_id, originating_tenant_id, fulfilling_tenant_id, creator_fee_net, creator_fee_vat, creator_fee_gross, fulfiller_fee_net, fulfiller_fee_vat, fulfiller_fee_gross)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                `, [
                    bookingId, originatingTenantId, fulfillingTenantId, 
                    clearanceResult.creatorFeeNet, clearanceResult.creatorFeeVat, clearanceResult.creatorFeeGross, 
                    clearanceResult.fulfillerFeeNet, clearanceResult.fulfillerFeeVat, clearanceResult.fulfillerFeeGross
                ]);
                await client.query('COMMIT');
            } catch (txError) {
                await client.query('ROLLBACK');
                throw txError;
            } finally {
                client.release();
            }
            
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
        next(error);
    }
};

/**
 * VELO CORE ENDPOINT (BACK-OFFICE MASTER TOWER)
 * Allows administrators to dynamically manipulate global fee configurations.
 */
export const updateGlobalFeeConfig = async (req: Request, res: Response, next: import('express').NextFunction) => {
    try {
        const adminKey = req.headers['x-admin-key'];
        if (adminKey !== process.env.ADMIN_KEY) {
            return res.status(403).json({ error: 'Forbidden: Valid Master Admin Key Required' });
        }

        const newSettings = req.body as Partial<FeeSettings>;
        
        const settingsRes = await db.query('SELECT * FROM global_fee_settings ORDER BY id DESC LIMIT 1');
        const dbSettings = settingsRes.rows[0];
        
        const merged = {
            creatorFeeMode: newSettings.creatorFeeMode || (dbSettings ? dbSettings.creator_fee_mode : 'FLAT'),
            creatorFlatValue: newSettings.creatorFlatValue !== undefined ? newSettings.creatorFlatValue : (dbSettings ? parseFloat(dbSettings.creator_flat_value) : 1.00),
            creatorPercentageValue: newSettings.creatorPercentageValue !== undefined ? newSettings.creatorPercentageValue : (dbSettings ? parseFloat(dbSettings.creator_percentage_value) : 0.00),
            fulfillerFeeMode: newSettings.fulfillerFeeMode || (dbSettings ? dbSettings.fulfiller_fee_mode : 'FLAT'),
            fulfillerFlatValue: newSettings.fulfillerFlatValue !== undefined ? newSettings.fulfillerFlatValue : (dbSettings ? parseFloat(dbSettings.fulfiller_flat_value) : 1.00),
            fulfillerPercentageValue: newSettings.fulfillerPercentageValue !== undefined ? newSettings.fulfillerPercentageValue : (dbSettings ? parseFloat(dbSettings.fulfiller_percentage_value) : 0.00)
        };

        const client = await db.connect();
        try {
            await client.query('BEGIN');
            await client.query(`
                INSERT INTO global_fee_settings (
                    creator_fee_mode, creator_flat_value, creator_percentage_value,
                    fulfiller_fee_mode, fulfiller_flat_value, fulfiller_percentage_value
                ) VALUES ($1, $2, $3, $4, $5, $6)
            `, [
                merged.creatorFeeMode, merged.creatorFlatValue, merged.creatorPercentageValue,
                merged.fulfillerFeeMode, merged.fulfillerFlatValue, merged.fulfillerPercentageValue
            ]);
            await client.query('COMMIT');
        } catch (txError) {
            await client.query('ROLLBACK');
            throw txError;
        } finally {
            client.release();
        }

        console.log(`\n[BACK-OFFICE TOWER] Master Configuration overriding global_fee_settings...`);
        console.log(JSON.stringify(merged, null, 2));
        console.log(`-----------------------------------------------------\n`);

        return res.status(200).json({
            success: true,
            message: "Global Fee Configuration successfully updated.",
            active_settings: merged
        });

    } catch (error) {
        next(error);
    }
};
