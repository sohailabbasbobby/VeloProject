import { Request, Response } from 'express';
import { db, withTransaction } from '../config/db';
import { asyncHandler, badRequest, notFound, forbidden, conflict } from '../utils/httpError';
import { getAuthContext } from '../middleware/tenant.middleware';
import { NotificationService } from '../utils/notificationService';
import { PushService } from '../services/push.service';

/**
 * FINAL-MILE CONTROLLER — backend support for the final-mile pass:
 * audit-log query/write, live command-metrics, vehicle defects, driver trip
 * queues, push-token registration, Stripe Connect onboarding and the AI
 * Operator command endpoint. Every path is real data or an honest
 * unconfigured state — no fabricated responses.
 */

// ------------------------------------------------------------------ audit logs
export const listAuditLogs = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const { severity, search, limit = 200 } = req.query;

    const params: unknown[] = [tenantId];
    let where = 'tenant_id = $1';
    if (severity && ['info', 'warning', 'critical'].includes(String(severity))) {
        params.push(String(severity));
        where += ` AND severity = $${params.length}`;
    }
    if (search) {
        params.push(`%${String(search).toLowerCase()}%`);
        where += ` AND (LOWER(action) LIKE $${params.length} OR LOWER(actor) LIKE $${params.length})`;
    }
    params.push(Math.min(1000, Number(limit) || 200));

    const { rows } = await db.query(
        `SELECT * FROM audit_logs WHERE ${where} ORDER BY created_at DESC LIMIT $${params.length}`,
        params
    );
    res.json({ success: true, data: rows });
});

/** Central audit writer — used by key mutation endpoints below AND importable by other controllers. */
export const writeAuditLog = async (
    tenantId: string | null,
    actor: string,
    action: string,
    severity: 'info' | 'warning' | 'critical' = 'info',
    entityType?: string,
    entityId?: string,
    requestId?: string,
    actorType: string = 'SYSTEM'
): Promise<void> => {
    // audit_logs.actor_type is NOT NULL — always supply it (SYSTEM covers internal
    // dispatcher/admin/AI actors; pass a specific type where the caller knows one).
    await db.query(
        `INSERT INTO audit_logs (actor_type, tenant_id, actor, action, severity, entity_type, entity_id, request_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [String(actorType).slice(0, 30), tenantId, actor.slice(0, 120), action.slice(0, 120), severity, entityType || null, entityId || null, requestId || null]
    );
};

// ------------------------------------------------------------------ live command metrics (MainHub / AI panel)
export const commandMetrics = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);

    const [driverRows, vehicleRows, tripRows, ledgerRows] = await Promise.all([
        db.query(
            `SELECT COUNT(*)::int AS total,
                    COUNT(*) FILTER (WHERE is_active AND onboarding_status = 'APPROVED')::int AS active,
                    COUNT(*) FILTER (WHERE is_active AND status = 'ON_TRIP')::int AS on_trip,
                    COUNT(*) FILTER (WHERE is_active AND status = 'ONLINE')::int AS waiting
             FROM drivers WHERE tenant_id = $1`, [tenantId]),
        db.query(
            `SELECT COUNT(*)::int AS total,
                    COUNT(*) FILTER (WHERE status IN ('ACTIVE','IN_SERVICE'))::int AS active,
                    COUNT(*) FILTER (WHERE status = 'IN_SERVICE')::int AS occupied
             FROM vehicles WHERE tenant_id = $1`, [tenantId]),
        db.query(
            `SELECT COUNT(*) FILTER (WHERE state IN ('ASSIGNED','DRIVER_EN_ROUTE','ARRIVED','IN_PROGRESS'))::int AS en_route,
                    COUNT(*) FILTER (WHERE state IN ('PENDING_DISPATCH','OFFERING_OWN_FLEET','IN_POOL','NEGOTIATION'))::int AS upcoming,
                    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::int AS created_today
             FROM trips WHERE tenant_id = $1`, [tenantId]),
        db.query(
            `SELECT COALESCE(SUM(platform_fee_net), 0) AS platform_fees_mtd
             FROM invoices
             WHERE tenant_id = $1 AND created_at >= date_trunc('month', CURRENT_DATE)`, [tenantId]),
    ]);

    const drivers = driverRows.rows[0];
    const vehicles = vehicleRows.rows[0];
    const trips = tripRows.rows[0];

    res.json({
        success: true,
        data: {
            driversInServicePct: drivers.total ? Math.round((drivers.active / drivers.total) * 100) : 0,
            drivers: { total: drivers.total, active: drivers.active, onTrip: drivers.on_trip, waiting: drivers.waiting },
            vehicleOccupancyPct: vehicles.total ? Math.round((vehicles.occupied / vehicles.total) * 100) : 0,
            vehicles: { total: vehicles.total, occupied: vehicles.occupied, available: vehicles.total - vehicles.occupied },
            trips: { enRoute: trips.en_route, upcoming: trips.upcoming, createdToday: trips.created_today },
            platformFeesMtd: Number(ledgerRows.rows[0].platform_fees_mtd),
        },
    });
});

// ------------------------------------------------------------------ vehicle defects (vehicle_issues)
export const reportVehicleDefect = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId, driverId } = getAuthContext(req);
    const vehicleId = String(req.params.id);
    const { description, severity = 'MINOR' } = req.body || {};
    if (!description) throw badRequest('description is required.');
    if (!['MINOR', 'MAJOR', 'CRITICAL'].includes(String(severity))) throw badRequest('severity must be MINOR, MAJOR or CRITICAL.');

    const vehicle = await db.query(`SELECT id, reference_code FROM vehicles WHERE id = $1 AND tenant_id = $2`, [vehicleId, tenantId]);
    if (vehicle.rows.length === 0) throw notFound('Vehicle not found.');

    const { rows } = await db.query(
        `INSERT INTO vehicle_issues (vehicle_id, driver_id, tenant_id, description, severity, status)
         VALUES ($1,$2,$3,$4,$5,'OPEN') RETURNING *`,
        [vehicleId, driverId || null, tenantId, String(description).slice(0, 2000), String(severity)]
    );

    await writeAuditLog(tenantId, driverId ? `Driver ${driverId}` : 'System', `Defect reported on ${vehicle.rows[0].reference_code}`,
        severity === 'CRITICAL' ? 'critical' : 'warning', 'VEHICLE', vehicleId);

    res.status(201).json({ success: true, data: rows[0] });
});

export const listVehicleIssues = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId, driverId } = getAuthContext(req);

    if (driverId) {
        // Driver view: defects on the vehicle assigned to them (or all their reports).
        const { rows } = await db.query(
            `SELECT vi.*, v.reference_code AS vehicle_code, v.plate_number
             FROM vehicle_issues vi
             JOIN vehicles v ON v.id = vi.vehicle_id
             WHERE vi.tenant_id = $1 AND (vi.driver_id = $2 OR v.id = (
                 SELECT va.vehicle_id FROM vehicle_assignments va
                 JOIN drivers d ON d.id = va.driver_id
                 WHERE va.driver_id = $2 AND va.is_primary = TRUE AND va.assigned_to IS NULL LIMIT 1))
             ORDER BY vi.reported_at DESC LIMIT 100`,
            [tenantId, driverId]
        );
        res.json({ success: true, data: rows });
        return;
    }

    const vehicleId = req.query.vehicleId ? String(req.query.vehicleId) : null;
    const params: unknown[] = [tenantId];
    let where = 'vi.tenant_id = $1';
    if (vehicleId) { params.push(vehicleId); where += ` AND vi.vehicle_id = $${params.length}`; }

    const { rows } = await db.query(
        `SELECT vi.*, v.reference_code AS vehicle_code, v.plate_number
         FROM vehicle_issues vi JOIN vehicles v ON v.id = vi.vehicle_id
         WHERE ${where} ORDER BY vi.reported_at DESC LIMIT 200`,
        params
    );
    res.json({ success: true, data: rows });
});

export const resolveVehicleIssue = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const { rows } = await db.query(
        `UPDATE vehicle_issues SET status = 'RESOLVED', resolved_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND tenant_id = $2 RETURNING *`,
        [req.params.issueId, tenantId]
    );
    if (rows.length === 0) throw notFound('Issue not found.');
    await writeAuditLog(tenantId, 'Dispatcher', `Vehicle issue resolved`, 'info', 'VEHICLE_ISSUE', String(req.params.issueId));
    res.json({ success: true, data: rows[0] });
});

// ------------------------------------------------------------------ driver trip queues (driver app sidebar)
export const driverTripQueues = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId, driverId } = getAuthContext(req);
    if (!driverId) throw forbidden('Driver authentication required.');

    const [upcoming, history] = await Promise.all([
        db.query(
            `SELECT t.id, t.task_id, t.state, t.scheduled_at, t.pickup_address, t.dropoff_address,
                    t.custom_price, t.requested_tier, t.passenger_name,
                    o.name AS tenant_name,
                    EXTRACT(EPOCH FROM (COALESCE(t.scheduled_at, t.created_at) - CURRENT_TIMESTAMP)) * 1000 AS ms_until_pickup
             FROM trips t LEFT JOIN tenants o ON o.id = t.originating_tenant_id
             WHERE t.tenant_id = $1 AND t.driver_id = $2
               AND t.state IN ('PENDING_DISPATCH','OFFERING_OWN_FLEET','ASSIGNED','DRIVER_EN_ROUTE')
               AND COALESCE(t.scheduled_at, t.created_at) > CURRENT_TIMESTAMP - INTERVAL '2 hours'
             ORDER BY COALESCE(t.scheduled_at, t.created_at) ASC LIMIT 50`,
            [tenantId, driverId]
        ),
        db.query(
            `SELECT t.id, t.task_id, t.state, t.completed_at, t.pickup_address, t.dropoff_address,
                    t.custom_price AS fare, t.driver_earnings, t.tip,
                    v.plate_number AS car, v.reference_code AS vehicle_code
             FROM trips t LEFT JOIN vehicles v ON v.id = t.vehicle_id
             WHERE t.tenant_id = $1 AND t.driver_id = $2 AND t.state IN ('COMPLETED','CANCELLED')
             ORDER BY COALESCE(t.completed_at, t.cancelled_at) DESC LIMIT 100`,
            [tenantId, driverId]
        ),
    ]);

    res.json({
        success: true,
        data: {
            upcoming: upcoming.rows.map((r) => ({
                id: r.id, taskId: r.task_id, tenant: r.tenant_name || 'VELO NETWORK',
                route: `${r.pickup_address} → ${r.dropoff_address}`, state: r.state,
                targetTime: r.ms_until_pickup ? Date.now() + Number(r.ms_until_pickup) : null,
            })),
            history: history.rows.map((r) => ({
                id: r.id, taskId: r.task_id, car: r.car || '—',
                route: `${r.pickup_address} → ${r.dropoff_address}`,
                net: r.driver_earnings != null ? `£${Number(r.driver_earnings).toFixed(2)}` : '—',
                completedAt: r.completed_at, tip: r.tip,
            })),
        },
    });
});

// ------------------------------------------------------------------ push token registration
export const registerPushToken = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId, driverId, clientId } = getAuthContext(req);
    const { token, platform } = req.body || {};
    if (!token) throw badRequest('device token is required.');

    if (driverId) {
        await db.query(`UPDATE drivers SET fcm_token = $1 WHERE id = $2 AND tenant_id = $3`, [String(token).slice(0, 512), driverId, tenantId]);
        res.json({ success: true, data: { registered: true, actorType: 'DRIVER', platform: platform || null, deliveryConfigured: PushService.isConfigured() } });
        return;
    }
    if (clientId) {
        await db.query(`UPDATE private_clients SET push_token = $1 WHERE id = $2 AND tenant_id = $3`, [String(token).slice(0, 512), clientId, tenantId]);
        res.json({ success: true, data: { registered: true, actorType: 'PRIVATE_CLIENT', platform: platform || null, deliveryConfigured: PushService.isConfigured() } });
        return;
    }
    throw forbidden('Driver or client authentication required.');
});

export const testPushDelivery = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId, driverId, clientId } = getAuthContext(req);
    const title = 'Velo Push Test';
    const body = 'This is a live delivery test from backend-core.';

    if (driverId) {
        const { rows } = await db.query(`SELECT fcm_token FROM drivers WHERE id = $1 AND tenant_id = $2`, [driverId, tenantId]);
        const token = rows[0]?.fcm_token;
        if (!token) throw notFound('No push token registered for this driver yet.');
        const result = await PushService.sendPush(token, title, body, { kind: 'TEST' });
        await NotificationService.dispatch({ recipientType: 'DRIVER', recipientId: driverId, tenantId, title, body, channels: ['IN_APP'], metadata: { kind: 'TEST' } });
        res.json({ success: true, data: result });
        return;
    }
    if (clientId) {
        const { rows } = await db.query(`SELECT push_token FROM private_clients WHERE id = $1 AND tenant_id = $2`, [clientId, tenantId]);
        const token = rows[0]?.push_token;
        if (!token) throw notFound('No push token registered for this client yet.');
        // PushService targets FCM tokens; APNs delivery is chosen by token shape at the provider.
        const result = await PushService.sendPush(token, title, body, { kind: 'TEST' });
        await NotificationService.dispatch({ recipientType: 'PASSENGER', recipientId: clientId, tenantId, title, body, channels: ['IN_APP'], metadata: { kind: 'TEST' } });
        res.json({ success: true, data: result });
        return;
    }
    throw forbidden('Driver or client authentication required.');
});

// ------------------------------------------------------------------ Stripe Connect tenant onboarding
const stripeKey = () => process.env.STRIPE_SECRET_KEY;

const stripeRequest = async (path: string, params: Record<string, string>): Promise<any> => {
    const res = await fetch(`https://api.stripe.com/v1/${path}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${stripeKey()}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(params).toString(),
    });
    const json: any = await res.json();
    if (!res.ok) throw conflict(`Stripe error: ${json?.error?.message || res.status}`);
    return json;
};

export const getStripeConnectStatus = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const { rows } = await db.query(
        `SELECT stripe_account_id, stripe_payouts_enabled FROM tenants WHERE id = $1`, [tenantId]
    );
    const t = rows[0];
    res.json({
        success: true,
        data: {
            configured: Boolean(stripeKey()),
            connected: Boolean(t?.stripe_account_id),
            stripeAccountId: t?.stripe_account_id || null,
            payoutsEnabled: Boolean(t?.stripe_payouts_enabled),
        },
    });
});

/** Shared Stripe Connect account-link builder (tenant-facing + backoffice admin flows). */
export const buildConnectOnboarding = async (
    tenantId: string,
    origin: string,
    refreshUrl?: string,
    returnUrl?: string
): Promise<{ accountId: string; onboardingUrl: string }> => {
    if (!stripeKey()) {
        throw conflict('STRIPE_NOT_CONFIGURED');
    }
    const tRes = await db.query(`SELECT id, name, stripe_account_id FROM tenants WHERE id = $1`, [tenantId]);
    if (tRes.rows.length === 0) throw notFound('Tenant not found.');

    let accountId: string | null = tRes.rows[0].stripe_account_id;
    if (!accountId) {
        const account = await stripeRequest('accounts', {
            'type': 'express',
            'business_profile[name]': String(tRes.rows[0].name).slice(0, 80),
            'capabilities[transfers][requested]': 'true',
            'capabilities[card_payments][requested]': 'true',
        });
        accountId = String(account.id);
        await db.query(`UPDATE tenants SET stripe_account_id = $1 WHERE id = $2`, [accountId, tenantId]);
    }

    const link = await stripeRequest('account_links', {
        'account': accountId,
        'refresh_url': String(refreshUrl || `${origin}/stripe/refresh`),
        'return_url': String(returnUrl || `${origin}/stripe/return`),
        'type': 'account_onboarding',
    });
    return { accountId: String(accountId), onboardingUrl: String(link.url) };
};

export const startStripeConnectOnboarding = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId: tenantIdRaw } = getAuthContext(req);
    if (!tenantIdRaw) throw badRequest('Tenant context required.');
    const tenantId: string = tenantIdRaw;
    if (!stripeKey()) {
        // Honest unconfigured state — never a fake "connected".
        res.status(503).json({
            success: false,
            error: 'Stripe is not configured yet (STRIPE_SECRET_KEY missing). Connect onboarding is unavailable until platform keys are provisioned.',
            code: 'STRIPE_NOT_CONFIGURED',
        });
        return;
    }

    const { refreshUrl, returnUrl } = req.body || {};
    const origin = req.headers.origin || `http://localhost:${process.env.PORT || 8000}`;
    const { accountId, onboardingUrl } = await buildConnectOnboarding(tenantId, origin, refreshUrl, returnUrl);

    await writeAuditLog(tenantId, 'Tenant Admin', 'Stripe Connect onboarding started', 'info', 'TENANT', tenantId, String(req.headers['x-request-id'] || '') || undefined);
    res.json({ success: true, data: { accountId, onboardingUrl, configured: true } });
});

/** Backoffice admin variant: start Connect onboarding for an arbitrary tenant. */
export const startStripeConnectOnboardingAdmin = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = String(req.params.tenantId || '');
    if (!tenantId) throw badRequest('tenantId is required.');
    if (!stripeKey()) {
        res.status(503).json({
            success: false,
            error: 'Stripe is not configured yet (STRIPE_SECRET_KEY missing).',
            code: 'STRIPE_NOT_CONFIGURED',
        });
        return;
    }
    const { refreshUrl, returnUrl } = req.body || {};
    const origin = req.headers.origin || `http://localhost:${process.env.PORT || 8000}`;
    const { accountId, onboardingUrl } = await buildConnectOnboarding(tenantId, origin, refreshUrl, returnUrl);
    await writeAuditLog(tenantId, 'Platform Admin', 'Stripe Connect onboarding started (backoffice)', 'info', 'TENANT', tenantId);
    res.json({ success: true, data: { accountId, onboardingUrl, configured: true } });
});

export const refreshStripeConnectStatus = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId: tenantIdRaw } = getAuthContext(req);
    if (!tenantIdRaw) throw badRequest('Tenant context required.');
    const tenantId: string = tenantIdRaw;
    if (!stripeKey()) {
        res.status(503).json({ success: false, error: 'Stripe is not configured yet.', code: 'STRIPE_NOT_CONFIGURED' });
        return;
    }
    const { rows } = await db.query(`SELECT stripe_account_id FROM tenants WHERE id = $1`, [tenantId]);
    const accountId = rows[0]?.stripe_account_id;
    if (!accountId) throw notFound('No Stripe account linked to this tenant yet.');

    // GET account (no body params → querystring POST not needed; use fetch GET).
    const res2 = await fetch(`https://api.stripe.com/v1/accounts/${accountId}`, {
        headers: { 'Authorization': `Bearer ${stripeKey()}` },
    });
    const account: any = await res2.json();
    if (!res2.ok) throw conflict(`Stripe error: ${account?.error?.message || res2.status}`);
    const payoutsEnabled = Boolean(account.payouts_enabled);
    await db.query(`UPDATE tenants SET stripe_payouts_enabled = $1 WHERE id = $2`, [payoutsEnabled, tenantId]);
    await writeAuditLog(tenantId, 'Tenant Admin', `Stripe Connect status refreshed: payouts ${payoutsEnabled ? 'enabled' : 'disabled'}`, 'info', 'TENANT', tenantId, String(req.headers['x-request-id'] || '') || undefined);
    res.json({ success: true, data: { accountId, payoutsEnabled, detailsSubmitted: Boolean(account.details_submitted) } });
});

// ------------------------------------------------------------------ AI Operator command endpoint
export const aiOperatorCommand = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const { command } = req.body || {};
    if (!command || !String(command).trim()) throw badRequest('command is required.');

    // Build a real, live context packet from the tenant's operational data.
    const [kpis, alerts, poolJobs] = await Promise.all([
        db.query(
            `SELECT (SELECT COUNT(*) FROM trips WHERE tenant_id = $1 AND state IN ('ASSIGNED','DRIVER_EN_ROUTE','ARRIVED','IN_PROGRESS'))::int AS active_trips,
                    (SELECT COUNT(*) FROM trips WHERE tenant_id = $1 AND state IN ('PENDING_DISPATCH','OFFERING_OWN_FLEET','IN_POOL','NEGOTIATION'))::int AS pending,
                    (SELECT COUNT(*) FROM drivers WHERE tenant_id = $1 AND is_active)::int AS active_drivers,
                    (SELECT COUNT(*) FROM vehicles WHERE tenant_id = $1 AND status IN ('ACTIVE','IN_SERVICE'))::int AS active_vehicles`,
            [tenantId]
        ),
        db.query(
            `SELECT title, body, sent_at FROM notifications
             WHERE tenant_id = $1 AND recipient_type = 'TENANT_ADMIN'
             ORDER BY sent_at DESC LIMIT 5`, [tenantId]
        ),
        db.query(
            `SELECT COUNT(*)::int AS open_pool FROM trips WHERE tenant_id = $1 AND state = 'IN_POOL'`, [tenantId]
        ),
    ]);

    const key = process.env.OPENAI_API_KEY;
    if (!key) {
        // Fail-open with an honest unconfigured state + the live context we CAN report.
        res.json({
            success: true,
            data: {
                mode: 'UNCONFIGURED',
                reply: 'AI features need a provider key (OPENAI_API_KEY). No LLM response is available — the command was NOT answered by an AI. Live operational snapshot: ' +
                    `${kpis.rows[0].active_trips} active trips, ${kpis.rows[0].pending} pending, ` +
                    `${kpis.rows[0].active_drivers} active drivers, ${kpis.rows[0].active_vehicles} active vehicles, ` +
                    `${poolJobs.rows[0].open_pool} jobs in the B2B pool.`,
                context: { kpis: kpis.rows[0], recentAlerts: alerts.rows, openPool: poolJobs.rows[0].open_pool },
            },
        });
        return;
    }

    const systemPrompt =
        'You are the Velo AI Operator for an executive chauffeur dispatch ERP. Answer concisely (max 120 words) ' +
        'using ONLY the live operational context provided. If the answer is not derivable from the context, say so honestly.';

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Live context: ${JSON.stringify({ kpis: kpis.rows[0], recentAlerts: alerts.rows, openPool: poolJobs.rows[0].open_pool })}\n\nOperator command: ${String(command).slice(0, 500)}` },
            ],
            max_tokens: 300,
            temperature: 0.2,
        }),
    });
    const json: any = await openaiRes.json().catch(() => null);
    if (!openaiRes.ok || !json?.choices?.length) {
        // Provider error → honest failure, never a fabricated answer.
        res.status(502).json({
            success: false,
            error: `AI provider error: ${json?.error?.message || openaiRes.status}. Live snapshot instead: ${kpis.rows[0].active_trips} active trips, ${kpis.rows[0].pending} pending, ${poolJobs.rows[0].open_pool} pool jobs.`,
            code: 'AI_PROVIDER_ERROR',
        });
        return;
    }

    await writeAuditLog(tenantId, 'AI Operator', `Command executed: ${String(command).slice(0, 90)}`, 'info');
    res.json({
        success: true,
        data: {
            mode: 'LIVE',
            reply: json.choices[0].message.content,
            context: { kpis: kpis.rows[0], recentAlerts: alerts.rows, openPool: poolJobs.rows[0].open_pool },
        },
    });
});

// ------------------------------------------------------------------ corporate roster (authorized users, fleet-wide for the CRM screens)
export const listAllAuthorizedUsers = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const { rows } = await db.query(
        `SELECT u.*, a.company_name, a.reference_code AS account_code
         FROM corporate_authorized_users u
         JOIN corporate_accounts a ON a.id = u.corporate_account_id
         WHERE a.tenant_id = $1
         ORDER BY a.company_name, u.full_name`,
        [tenantId]
    );
    res.json({ success: true, data: rows });
});

// ------------------------------------------------------------------ CSV export for Reporting & Taxation
export const exportVatCsv = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const { rows } = await db.query(
        `SELECT i.invoice_number, i.created_at, i.customer_retail_fare, i.platform_fee_net,
                i.platform_fee_vat, i.driver_net_payout, i.status,
                a.company_name AS corporate_account
         FROM invoices i
         LEFT JOIN corporate_accounts a ON a.id = i.corporate_account_id
         WHERE i.tenant_id = $1
         ORDER BY i.created_at DESC LIMIT 10000`,
        [tenantId]
    );

    const header = 'invoice_number,created_at,corporate_account,customer_retail_fare,platform_fee_net,platform_fee_vat,driver_net_payout,status';
    const lines = rows.map((r) =>
        [r.invoice_number, r.created_at ? new Date(r.created_at).toISOString() : '', r.corporate_account || 'B2C',
         r.customer_retail_fare ?? '', r.platform_fee_net ?? '', r.platform_fee_vat ?? '', r.driver_net_payout ?? '', r.status]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')
    );
    const csv = [header, ...lines].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="velo-vat-export-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csv);
});
