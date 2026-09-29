import { Request, Response } from 'express';
import { asyncHandler, badRequest } from '../utils/httpError';
import { VeloClearingEngine } from '../services/veloClearingEngine';
import { db } from '../config/db';
import { getAuthContext } from '../middleware/tenant.middleware';

/**
 * CLEARING CONTROLLER (§1.1–§1.2, §2) — computes trip clearance with the custom
 * per-trip price and a back-office-entered platform fee. Global fee configuration
 * lives in platform_settings via SettingsService — never in an in-memory variable.
 */

export const computeTripClearing = asyncHandler(async (req: Request, res: Response) => {
    const { tripId, customPlatformFeeNet } = req.body || {};
    if (!tripId) throw badRequest('tripId is required.');

    const tripRes = await db.query(
        `SELECT id, custom_price, final_price, tip, originating_tenant_id, fulfilling_tenant_id
         FROM trips WHERE id = $1`,
        [tripId]
    );
    if (tripRes.rows.length === 0) throw badRequest('Trip not found.');
    const trip = tripRes.rows[0];

    const settlement = await VeloClearingEngine.settleTrip({
        bookingId: trip.id,
        originatingTenantId: trip.originating_tenant_id,
        fulfillingTenantId: trip.fulfilling_tenant_id,
        customPrice: Number(trip.final_price || trip.custom_price),
        customPlatformFeeNet: customPlatformFeeNet !== undefined ? Number(customPlatformFeeNet) : Number(trip.tip ? 0 : 0),
        tip: Number(trip.tip || 0),
    });
    res.json({ success: true, data: settlement });
});

/** Persists the per-trip platform fee (custom-entered, §1.2) onto the trip. */
export const setTripFeeConfig = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const { tripId, platformFeeNet, finderMarginNet } = req.body || {};
    if (!tripId) throw badRequest('tripId is required.');

    const { rows } = await db.query(
        `UPDATE trips SET
            platform_fee_net = COALESCE($2, platform_fee_net),
            finder_margin_net = COALESCE($3, finder_margin_net),
            updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND tenant_id = $4 RETURNING id, platform_fee_net, finder_margin_net`,
        [tripId, platformFeeNet !== undefined ? Number(platformFeeNet) : null,
         finderMarginNet !== undefined ? Number(finderMarginNet) : null, tenantId]
    );
    if (rows.length === 0) throw badRequest('Trip not found for this tenant.');
    res.json({ success: true, data: rows[0] });
});
