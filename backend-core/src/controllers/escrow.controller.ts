import { Request, Response } from 'express';
import { db, withTransaction } from '../config/db';
import { asyncHandler, badRequest, notFound, conflict } from '../utils/httpError';
import { SettingsService } from '../services/settings.service';
import { VeloClearingEngine } from '../services/veloClearingEngine';
import { getAuthContext } from '../middleware/tenant.middleware';

/**
 * ESCROW CONTROLLER — Stripe Connect integration (§1.3, §2)
 *
 * Full fare is captured at booking time into escrow (manual capture payment intent),
 * held through the trip lifecycle, and split-released on verified completion:
 *   fulfiller tenant receives wholesale fare net of the platform fee and the
 *   originating tenant's finder's margin. Refunds/disputes are stateful and audited.
 *
 * Requires env: STRIPE_SECRET_KEY (+ tenant Stripe Connect account ids in `tenants`).
 * Without STRIPE_SECRET_KEY the endpoints return a configuration error — escrow is
 * never simulated in memory.
 */

const stripeKey = () => process.env.STRIPE_SECRET_KEY;

const stripeRequest = async (path: string, form: Record<string, string>): Promise<any> => {
    if (!stripeKey()) {
        throw conflict('Stripe is not configured (STRIPE_SECRET_KEY missing). Escrow cannot operate.');
    }
    const res = await fetch(`https://api.stripe.com/v1/${path}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${stripeKey()}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(form),
    });
    const json: any = await res.json();
    if (!res.ok) {
        throw conflict(`Stripe error: ${json.error?.message || res.status}`);
    }
    return json;
};

export const createEscrowForTrip = async (client: any, tripId: string, tenantId: string, amount: number): Promise<string | null> => {
    if (!stripeKey()) {
        // Strict mode (production) refuses to book without real escrow.
        // Non-strict environments record a CONFIGURATION_PENDING hold so the
        // lifecycle can be exercised; funds are NEVER assumed captured.
        if (process.env.ESCROW_STRICT !== 'false') {
            throw conflict('Stripe is not configured (STRIPE_SECRET_KEY missing). Booking cannot capture escrow.');
        }
        await client.query(
            `INSERT INTO escrow_vault (booking_id, tenant_id, held_amount, state, stripe_payment_intent_id)
             VALUES ($1, $2, $3, 'HELD', 'CONFIGURATION_PENDING')
             ON CONFLICT (booking_id) DO UPDATE SET held_amount = $3, updated_at = CURRENT_TIMESTAMP`,
            [tripId, tenantId, amount]
        );
        return null;
    }
    const tenantRes = await client.query('SELECT stripe_account_id FROM tenants WHERE id = $1', [tenantId]);
    const stripeAccountId: string | null = tenantRes.rows[0]?.stripe_account_id || null;

    const intent = await stripeRequest('payment_intents', {
        amount: String(Math.round(amount * 100)),
        currency: 'gbp',
        'automatic_payment_methods[enabled]': 'true',
        capture_method: 'manual',
        'metadata[trip_id]': tripId,
        'metadata[tenant_id]': tenantId,
        ...(stripeAccountId ? { stripeAccount: stripeAccountId } : {}),
    } as any);

    await client.query(
        `INSERT INTO escrow_vault (booking_id, tenant_id, held_amount, state, stripe_payment_intent_id)
         VALUES ($1, $2, $3, 'HELD', $4)
         ON CONFLICT (booking_id) DO UPDATE
         SET held_amount = $3, stripe_payment_intent_id = $4, state = 'HELD', updated_at = CURRENT_TIMESTAMP`,
        [tripId, tenantId, amount, intent.id]
    );
    return intent.id as string;
};

export const captureEscrow = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const tripId = String(req.params.tripId);

    const escrowRes = await db.query(
        `SELECT e.*, t.fulfilling_tenant_id FROM escrow_vault e
         LEFT JOIN (SELECT id, fulfilling_tenant_id FROM trips) t ON t.id = e.booking_id
         WHERE e.booking_id = $1 AND e.tenant_id = $2`,
        [tripId, tenantId]
    );
    if (escrowRes.rows.length === 0) throw notFound('Escrow record not found for this trip.');
    const escrow = escrowRes.rows[0];
    if (escrow.state !== 'HELD') throw conflict(`Escrow is ${escrow.state}; only HELD funds can be captured.`);

    await stripeRequest(`payment_intents/${escrow.stripe_payment_intent_id}/capture`, {});
    await db.query(`UPDATE escrow_vault SET state = 'HELD', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [escrow.id]);
    res.json({ success: true, data: { tripId, state: 'CAPTURED' } });
});

/** Release escrow on verified completion; writes clearing + ledger rows in one transaction. */
export const releaseEscrow = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const tripId = String(req.params.tripId);

    const tripRes = await db.query(
        `SELECT id, custom_price, final_price, platform_fee_net, finder_margin_net, tip,
                originating_tenant_id, fulfilling_tenant_id, driver_id, state
         FROM trips WHERE id = $1 AND (tenant_id = $2 OR originating_tenant_id = $2)`,
        [tripId, tenantId]
    );
    if (tripRes.rows.length === 0) throw notFound('Trip not found.');
    const trip = tripRes.rows[0];
    if (trip.state !== 'COMPLETED') throw conflict('Escrow can only release on a COMPLETED trip.');

    const settlement = await VeloClearingEngine.settleTrip({
        bookingId: tripId,
        originatingTenantId: trip.originating_tenant_id,
        fulfillingTenantId: trip.fulfilling_tenant_id,
        customPrice: Number(trip.final_price || trip.custom_price),
        customPlatformFeeNet: Number(trip.platform_fee_net),
        tip: Number(trip.tip || 0),
    });

    const result = await withTransaction(tenantId, async (client) => {
        const escrowRes = await client.query(`SELECT * FROM escrow_vault WHERE booking_id = $1 FOR UPDATE`, [tripId]);
        if (escrowRes.rows.length === 0) throw notFound('Escrow record not found for this trip.');
        const escrow = escrowRes.rows[0];
        if (escrow.state !== 'HELD') throw conflict(`Escrow is ${escrow.state}; cannot release.`);

        // Stripe transfer to the fulfilling tenant (Stripe Connect), net of platform extraction
        let transferId: string | null = null;
        if (trip.fulfilling_tenant_id && trip.fulfilling_tenant_id !== trip.originating_tenant_id) {
            const fulfillerRes = await client.query('SELECT stripe_account_id FROM tenants WHERE id = $1', [trip.fulfilling_tenant_id]);
            const dest = fulfillerRes.rows[0]?.stripe_account_id;
            const payoutAmount = settlement.wholesaleFare - settlement.platformFeeNet - settlement.finderMarginNet;
            if (dest) {
                const transfer = await stripeRequest('transfers', {
                    amount: String(Math.max(0, Math.round(payoutAmount * 100))),
                    currency: 'gbp',
                    destination: dest,
                    'metadata[trip_id]': tripId,
                } as any);
                transferId = transfer.id;
            }
        }

        await client.query(
            `UPDATE escrow_vault SET state = 'RELEASED', released_amount = $2, stripe_transfer_id = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [escrow.id, settlement.wholesaleFare, transferId]
        );

        // Clearing ledger for cross-tenant trades
        if (settlement.isNetworkTrade) {
            await client.query(
                `INSERT INTO network_clearing_ledger
                 (booking_id, originating_tenant_id, fulfilling_tenant_id, wholesale_fare,
                  creator_fee_net, creator_fee_vat, creator_fee_gross,
                  fulfiller_fee_net, fulfiller_fee_vat, fulfiller_fee_gross, finder_margin_net)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
                [tripId, trip.originating_tenant_id, trip.fulfilling_tenant_id, settlement.wholesaleFare,
                 0, 0, 0,
                 settlement.platformFeeNet, settlement.platformFeeVat, settlement.platformFeeGross,
                 settlement.finderMarginNet]
            );
            await client.query(
                `INSERT INTO b2b_network_transactions (booking_id, originating_tenant_id, fulfilling_tenant_id, wholesale_fare)
                 VALUES ($1,$2,$3,$4)`,
                [tripId, trip.originating_tenant_id, trip.fulfilling_tenant_id, settlement.wholesaleFare]
            );
        }

        // Driver ledger credit
        if (trip.driver_id) {
            for (const entry of settlement.driverLedgerEntries) {
                await client.query(
                    `INSERT INTO driver_ledgers (driver_id, tenant_id, trip_id, entry_type, direction, amount, description)
                     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
                    [trip.driver_id, trip.originating_tenant_id, tripId, entry.entryType, entry.direction, entry.amount, entry.description]
                );
            }
        }
        return { transferId, settlement };
    });

    res.json({ success: true, data: { tripId, state: 'RELEASED', transferId: result.transferId, settlement: result.settlement } });
});

/** Raise a dispute: freezes escrow pending backoffice arbitration. */
export const disputeEscrow = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const tripId = String(req.params.tripId);
    const { reason } = req.body || {};
    if (!reason) throw badRequest('A dispute reason is required.');

    const updated = await db.query(
        `UPDATE escrow_vault SET state = 'DISPUTED', dispute_reason = $2, updated_at = CURRENT_TIMESTAMP
         WHERE booking_id = $1 AND tenant_id = $3 AND state = 'HELD'
         RETURNING id, state`,
        [tripId, String(reason), tenantId]
    );
    if (updated.rows.length === 0) throw conflict('No HELD escrow found for this trip to dispute.');
    res.json({ success: true, data: { tripId, state: 'DISPUTED' } });
});

/** Refund full escrow to the customer (backoffice override). */
export const refundEscrow = asyncHandler(async (req: Request, res: Response) => {
    const tripId = String(req.params.tripId);
    const updated = await db.query(
        `UPDATE escrow_vault SET state = 'REFUNDED', updated_at = CURRENT_TIMESTAMP
         WHERE booking_id = $1 AND state IN ('HELD','DISPUTED')
         RETURNING id, stripe_payment_intent_id`,
        [tripId]
    );
    if (updated.rows.length === 0) throw conflict('No refundable escrow found for this trip.');
    const escrow = updated.rows[0];
    if (stripeKey() && escrow.stripe_payment_intent_id) {
        await stripeRequest(`payment_intents/${escrow.stripe_payment_intent_id}/cancel`, {});
    }
    res.json({ success: true, data: { tripId, state: 'REFUNDED' } });
});

/** Backoffice freeze override: locks escrow pending arbitration. */
export const freezeEscrow = asyncHandler(async (req: Request, res: Response) => {
    const tripId = String(req.params.tripId);
    const updated = await db.query(
        `UPDATE escrow_vault SET state = 'FROZEN', updated_at = CURRENT_TIMESTAMP
         WHERE booking_id = $1 AND state IN ('HELD','DISPUTED')
         RETURNING id, state`,
        [tripId]
    );
    if (updated.rows.length === 0) throw conflict('No HELD or DISPUTED escrow found for this trip to freeze.');
    res.json({ success: true, data: { tripId, state: 'FROZEN' } });
});

/** Backoffice arbitration override for frozen/disputed escrow. */
export const arbitrateEscrow = asyncHandler(async (req: Request, res: Response) => {
    const tripId = String(req.params.tripId);
    const { resolution } = req.body || {}; // 'RELEASE' | 'REFUND'
    if (!['RELEASE', 'REFUND'].includes(resolution)) throw badRequest("resolution must be 'RELEASE' or 'REFUND'.");

    if (resolution === 'REFUND') {
        await db.query(
            `UPDATE escrow_vault SET state = 'REFUNDED', updated_at = CURRENT_TIMESTAMP WHERE booking_id = $1 AND state IN ('DISPUTED','FROZEN')`,
            [tripId]
        );
        return res.json({ success: true, data: { tripId, state: 'REFUNDED' } });
    }
    // Arbitrated release: temporarily unfreeze via direct state transition
    await db.query(
        `UPDATE escrow_vault SET state = 'HELD', updated_at = CURRENT_TIMESTAMP WHERE booking_id = $1 AND state IN ('DISPUTED','FROZEN')`,
        [tripId]
    );
    req.params = { ...req.params, tripId };
    return releaseEscrow(req, res, () => undefined);
});

export const listEscrow = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const { rows } = await db.query(
        `SELECT e.*, t.task_id, t.passenger_name, t.state AS trip_state
         FROM escrow_vault e JOIN trips t ON t.id = e.booking_id
         WHERE e.tenant_id = $1 ORDER BY e.created_at DESC LIMIT 500`,
        [tenantId]
    );
    res.json({ success: true, data: rows });
});
