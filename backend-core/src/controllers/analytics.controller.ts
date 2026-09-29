import { Request, Response } from 'express';
import { db } from '../config/db';
import { asyncHandler, badRequest } from '../utils/httpError';
import { getAuthContext } from '../middleware/tenant.middleware';

/**
 * ANALYTICS CONTROLLER (§2) — every figure is a live aggregation against
 * PostgreSQL. No hardcoded chart data or revenue constants anywhere.
 */

export const operationsKpis = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const { rows } = await db.query(
        `SELECT
            COUNT(*) FILTER (WHERE state IN ('ASSIGNED','DRIVER_EN_ROUTE','ARRIVED','IN_PROGRESS')) AS active_trips,
            COUNT(*) FILTER (WHERE state IN ('PENDING_DISPATCH','OFFERING_OWN_FLEET','IN_POOL','NEGOTIATION')) AS unassigned,
            COUNT(*) FILTER (WHERE state IN ('ASSIGNED','DRIVER_EN_ROUTE','ARRIVED','IN_PROGRESS')
                             OR (state = 'PENDING_DISPATCH' AND booking_type = 'SCHEDULED')) AS upcoming,
            COUNT(*) FILTER (WHERE state = 'ASSIGNED') AS assigned,
            COUNT(*) FILTER (WHERE state = 'COMPLETED') AS completed,
            COUNT(*) FILTER (WHERE state = 'COMPLETED' AND completed_at >= CURRENT_DATE) AS completed_today,
            COALESCE(SUM(CASE WHEN state = 'COMPLETED' THEN COALESCE(final_price, custom_price) END), 0) AS completed_revenue,
            COALESCE(SUM(CASE WHEN state = 'COMPLETED' AND completed_at >= CURRENT_DATE THEN COALESCE(final_price, custom_price) END), 0) AS revenue_today
         FROM trips WHERE tenant_id = $1`,
        [tenantId]
    );
    res.json({ success: true, data: rows[0] });
});

export const listTrips = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const { state } = req.query;
    const { rows } = await db.query(
        `SELECT t.*,
                pc.reference_code AS private_client_code, pc.full_name AS private_client_name,
                ca.reference_code AS corporate_code, ca.company_name AS corporate_name,
                d.reference_code AS driver_code, (d.first_name || ' ' || d.last_name) AS driver_name,
                v.reference_code AS vehicle_code, (v.make || ' ' || v.model) AS vehicle_name,
                ft.name AS fulfilling_tenant_name
         FROM trips t
         LEFT JOIN private_clients pc ON pc.id = t.private_client_id
         LEFT JOIN corporate_accounts ca ON ca.id = t.corporate_account_id
         LEFT JOIN drivers d ON d.id = t.driver_id
         LEFT JOIN vehicles v ON v.id = t.vehicle_id
         LEFT JOIN tenants ft ON ft.id = t.fulfilling_tenant_id
         WHERE t.tenant_id = $1 AND ($2::text IS NULL OR t.state::text = $2)
         ORDER BY t.created_at DESC LIMIT 300`,
        [tenantId, (state as string) || null]
    );
    res.json({ success: true, data: rows });
});

export const revenueSeries = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const { rows } = await db.query(
        `SELECT d::date AS day,
                COALESCE(SUM(COALESCE(t.final_price, t.custom_price)) FILTER (WHERE t.state = 'COMPLETED'), 0) AS revenue,
                COUNT(t.id) FILTER (WHERE t.state = 'COMPLETED') AS trips
         FROM generate_series(CURRENT_DATE - INTERVAL '29 days', CURRENT_DATE, INTERVAL '1 day') d
         LEFT JOIN trips t ON t.tenant_id = $1 AND t.completed_at::date = d::date
         GROUP BY d ORDER BY d`,
        [tenantId]
    );
    res.json({ success: true, data: rows });
});

export const driverPerformance = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const { rows } = await db.query(
        `SELECT d.id, d.reference_code, (d.first_name || ' ' || d.last_name) AS name, d.average_rating,
                COUNT(t.id) FILTER (WHERE t.state = 'COMPLETED') AS completed_trips,
                COALESCE(SUM(COALESCE(t.final_price, t.custom_price)) FILTER (WHERE t.state = 'COMPLETED'), 0) AS revenue_generated,
                COALESCE(SUM(t.driver_earnings) FILTER (WHERE t.state = 'COMPLETED'), 0) AS earnings,
                d.status
         FROM drivers d LEFT JOIN trips t ON t.driver_id = d.id
         WHERE d.tenant_id = $1 AND d.is_active = TRUE
         GROUP BY d.id ORDER BY completed_trips DESC`,
        [tenantId]
    );
    res.json({ success: true, data: rows });
});

export const fleetUtilization = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const { rows } = await db.query(
        `SELECT v.id, v.reference_code, (v.make || ' ' || v.model) AS name, v.status, v.tier,
                COUNT(t.id) FILTER (WHERE t.state = 'COMPLETED') AS trips_30d,
                COALESCE(SUM(t.distance_miles) FILTER (WHERE t.state = 'COMPLETED'), 0) AS miles_30d,
                ROUND(COALESCE(v.lease_paid_to_date / NULLIF(v.lease_total_cost, 0), 0) * 100, 1) AS lease_progress_pct
         FROM vehicles v LEFT JOIN trips t ON t.vehicle_id = v.id AND t.completed_at >= CURRENT_DATE - 30
         WHERE v.tenant_id = $1
         GROUP BY v.id ORDER BY trips_30d DESC`,
        [tenantId]
    );
    res.json({ success: true, data: rows });
});

/** Master Ledger tab data (§3 Financial Intelligence & Command Center). */
export const masterLedger = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const [ledger, invoices, payouts, escrow] = await Promise.all([
        db.query(
            `SELECT dl.*, d.reference_code AS driver_code, (d.first_name || ' ' || d.last_name) AS driver_name,
                    t.task_id
             FROM driver_ledgers dl
             LEFT JOIN drivers d ON d.id = dl.driver_id
             LEFT JOIN trips t ON t.id = dl.trip_id
             WHERE dl.tenant_id = $1 ORDER BY dl.created_at DESC LIMIT 500`,
            [tenantId]
        ),
        db.query(`SELECT * FROM invoices WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 200`, [tenantId]),
        db.query(`SELECT * FROM payouts WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 200`, [tenantId]),
        db.query(`SELECT * FROM escrow_vault WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 200`, [tenantId]),
    ]);
    const totals = await db.query(
        `SELECT
            COALESCE(SUM(platform_fee_gross), 0) AS platform_fee_gross_total,
            COALESCE(SUM(finder_margin_net), 0) AS finder_margin_total
         FROM network_clearing_ledger WHERE originating_tenant_id = $1 OR fulfilling_tenant_id = $1`,
        [tenantId]
    );
    res.json({
        success: true,
        data: {
            ledger: ledger.rows, invoices: invoices.rows, payouts: payouts.rows, escrow: escrow.rows,
            networkTotals: totals.rows[0],
        },
    });
});

/** VAT reporting: platform fee VAT only — never on customer retail fares (Rule 9). */
export const vatReport = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const { rows } = await db.query(
        `SELECT
            DATE_TRUNC('month', created_at) AS period,
            COALESCE(SUM(platform_fee_net), 0) AS fee_net,
            COALESCE(SUM(platform_fee_vat), 0) AS fee_vat,
            COALESCE(SUM(platform_fee_gross), 0) AS fee_gross
         FROM network_clearing_ledger
         WHERE originating_tenant_id = $1 OR fulfilling_tenant_id = $1
         GROUP BY 1 ORDER BY 1 DESC LIMIT 24`,
        [tenantId]
    );
    res.json({ success: true, data: rows });
});

// ------------------------------------------------------------------------------------
// PLATFORM-WIDE (backoffice) — admin-key gated at the router
// ------------------------------------------------------------------------------------
export const platformOverview = asyncHandler(async (req: Request, res: Response) => {
    const { rows: tenantRows } = await db.query(
        `SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE activation_status = 'ACTIVE') AS active,
                COUNT(*) FILTER (WHERE activation_status = 'SUSPENDED') AS suspended
         FROM tenants`
    );
    const { rows: tripRows } = await db.query(
        `SELECT COUNT(*) AS total,
                COUNT(*) FILTER (WHERE state = 'IN_POOL') AS in_pool,
                COUNT(*) FILTER (WHERE state = 'NEGOTIATION') AS negotiating,
                COUNT(*) FILTER (WHERE state = 'COMPLETED') AS completed
         FROM trips`
    );
    const { rows: revenueRows } = await db.query(
        `SELECT COALESCE(SUM(fulfiller_fee_gross), 0) AS platform_fee_gross,
                COALESCE(SUM(fulfiller_fee_net), 0) AS platform_fee_net,
                COALESCE(SUM(fulfiller_fee_vat), 0) AS vat_collected,
                COALESCE(SUM(finder_margin_net), 0) AS finder_margins
         FROM network_clearing_ledger`
    );
    const { rows: volumeRows } = await db.query(
        `SELECT d::date AS day,
                COALESCE(SUM(COALESCE(t.final_price, t.custom_price)) FILTER (WHERE t.state = 'COMPLETED'), 0) AS gmv,
                COALESCE(SUM(l.fulfiller_fee_gross), 0) AS fee_revenue,
                COUNT(DISTINCT t.id) AS trips
         FROM generate_series(CURRENT_DATE - INTERVAL '29 days', CURRENT_DATE, INTERVAL '1 day') d
         LEFT JOIN trips t ON t.completed_at::date = d::date
         LEFT JOIN network_clearing_ledger l ON l.booking_id = t.id
         GROUP BY d ORDER BY d`
    );
    res.json({ success: true, data: { tenants: tenantRows[0], trips: tripRows[0], revenue: revenueRows[0], volume: volumeRows } });
});

export const listTenantsAdmin = asyncHandler(async (req: Request, res: Response) => {
    const { rows } = await db.query(
        `SELECT t.*, wlc.app_name, wlc.primary_color, wlc.published AS whitelabel_published,
                (SELECT COUNT(*) FROM drivers d WHERE d.tenant_id = t.id AND d.is_active) AS driver_count,
                (SELECT COUNT(*) FROM vehicles v WHERE v.tenant_id = t.id) AS vehicle_count,
                (SELECT COUNT(*) FROM trips tr WHERE tr.tenant_id = t.id) AS trip_count
         FROM tenants t LEFT JOIN white_label_configs wlc ON wlc.tenant_id = t.id
         ORDER BY t.created_at DESC`
    );
    res.json({ success: true, data: rows });
});

export const upsertTenantAdmin = asyncHandler(async (req: Request, res: Response) => {
    const { id, code, name, activationStatus, plan, vatRegistered, vatNumber, finderMarginRate,
        poolAcceptEnabled, poolMinPrice, poolVehicleClasses, contactEmail, contactPhone } = req.body || {};
    if (!name) throw badRequest('name is required.');

    if (id) {
        const { rows } = await db.query(
            `UPDATE tenants SET name = $2, activation_status = $3, plan = $4, vat_registered = $5, vat_number = $6,
                finder_margin_rate = $7, pool_accept_enabled = $8, pool_min_price = $9,
                pool_vehicle_classes = $10::text[], contact_email = $11, contact_phone = $12, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 RETURNING *`,
            [id, name, activationStatus || 'ACTIVE', plan || 'STANDARD', Boolean(vatRegistered), vatNumber || null,
             finderMarginRate ?? 0.25, poolAcceptEnabled !== false, poolMinPrice || 0,
             poolVehicleClasses || [], contactEmail || null, contactPhone || null]
        );
        if (rows.length === 0) throw badRequest('Tenant not found.');
        return res.json({ success: true, data: rows[0] });
    }

    const { rows } = await db.query(
        `INSERT INTO tenants (code, name, activation_status, plan, vat_registered, vat_number, finder_margin_rate,
            pool_accept_enabled, pool_min_price, pool_vehicle_classes, contact_email, contact_phone)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::text[],$11,$12) RETURNING *`,
        [code || `T-${Date.now()}`, name, activationStatus || 'REGISTRATION', plan || 'STANDARD',
         Boolean(vatRegistered), vatNumber || null, finderMarginRate ?? 0.25,
         poolAcceptEnabled !== false, poolMinPrice || 0, poolVehicleClasses || [], contactEmail || null, contactPhone || null]
    );
    res.status(201).json({ success: true, data: rows[0] });
});

/** Cross-tenant compliance oversight (§4). */
export const platformCompliance = asyncHandler(async (req: Request, res: Response) => {
    const drivers = await db.query(
        `SELECT t.name AS tenant_name, d.reference_code, (d.first_name || ' ' || d.last_name) AS driver_name,
                d.license_expiry, d.pco_badge_expiry, d.compliance_status,
                LEAST(d.license_expiry, d.pco_badge_expiry) AS next_expiry
         FROM drivers d JOIN tenants t ON t.id = d.tenant_id
         WHERE d.is_active AND LEAST(d.license_expiry, d.pco_badge_expiry) < CURRENT_DATE + 60
         ORDER BY next_expiry ASC NULLS LAST LIMIT 200`
    );
    const vehicles = await db.query(
        `SELECT t.name AS tenant_name, v.reference_code, (v.make || ' ' || v.model) AS vehicle_name, v.plate_number,
                v.mot_expiry, v.phv_expiry, v.insurance_expiry,
                LEAST(v.mot_expiry, v.phv_expiry, v.insurance_expiry) AS next_expiry
         FROM vehicles v JOIN tenants t ON t.id = v.tenant_id
         WHERE LEAST(v.mot_expiry, v.phv_expiry, v.insurance_expiry) < CURRENT_DATE + 60
         ORDER BY next_expiry ASC NULLS LAST LIMIT 200`
    );
    res.json({ success: true, data: { drivers: drivers.rows, vehicles: vehicles.rows } });
});

/** Pool oversight: every job platform-wide plus dispute/override tools (§4). */
export const platformPoolOversight = asyncHandler(async (req: Request, res: Response) => {
    const { rows } = await db.query(
        `SELECT pj.*, t.task_id, o.name AS originating_tenant_name, c.name AS countering_tenant_name
         FROM b2b_pool_jobs pj
         JOIN trips t ON t.id = pj.trip_id
         JOIN tenants o ON o.id = pj.originating_tenant_id
         LEFT JOIN tenants c ON c.id = pj.countering_tenant_id
         ORDER BY pj.published_at DESC LIMIT 500`
    );
    res.json({ success: true, data: rows });
});

export const overridePoolJob = asyncHandler(async (req: Request, res: Response) => {
    const jobId = String(req.params.jobId);
    const { action } = req.body || {}; // 'FORCE_OPEN' | 'FORCE_ALLOCATE' | 'WITHDRAW'
    if (!['FORCE_OPEN', 'FORCE_ALLOCATE', 'WITHDRAW'].includes(action)) {
        throw badRequest("action must be FORCE_OPEN, FORCE_ALLOCATE or WITHDRAW.");
    }
    const stateMap: Record<string, string> = { FORCE_OPEN: 'OPEN', FORCE_ALLOCATE: 'ALLOCATED', WITHDRAW: 'WITHDRAWN' };
    const { rows } = await db.query(
        `UPDATE b2b_pool_jobs SET state = $2::pool_job_state, negotiation_deadline = NULL, countering_tenant_id = CASE WHEN $2 = 'FORCE_OPEN' THEN NULL ELSE countering_tenant_id END
         WHERE id = $1 RETURNING *`,
        [jobId, stateMap[action]]
    );
    if (rows.length === 0) throw badRequest('Pool job not found.');
    if (action === 'WITHDRAW') {
        await db.query(`UPDATE trips SET state = 'PENDING_DISPATCH', channel = 'OWN_APP', updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND state = 'IN_POOL'`, [rows[0].trip_id]);
    }
    res.json({ success: true, data: rows[0] });
});
