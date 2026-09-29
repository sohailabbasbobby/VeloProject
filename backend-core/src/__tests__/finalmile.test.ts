/**
 * FINAL-MILE INTEGRATION TESTS — run against the live local PostgreSQL (port 5433 test container).
 *
 * Covers the new final-mile paths end to end:
 *   - audit log write + tenant-scoped query
 *   - command metrics aggregation
 *   - vehicle defect report + issue list (driver + tenant views)
 *   - driver trip queues shape (upcoming/history)
 *   - push registration (fail-open: registers without FCM creds, deliveryConfigured=false)
 *   - Stripe Connect status + onboarding 503-class fail-open without STRIPE_SECRET_KEY
 *   - driver-side ledger endpoint (GET /api/payroll/my/ledger)
 *   - trip expense logging → driver_ledgers DEBIT row
 *   - platform clearing ledger + platform escrow (backoffice views)
 *
 * Every path is real data or an honest unconfigured state — no fabricated responses.
 */
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://velo_admin:testpass@127.0.0.1:5433/velo_network';
process.env.JWT_SECRET = 'test-secret-key-for-velo-selfhosted-auth-0123456789';
delete process.env.STRIPE_SECRET_KEY; // force the honest unconfigured paths

import { Pool } from 'pg';
import { db as servicePool } from '../config/db';
import { writeAuditLog, listAuditLogs } from '../controllers/finalmile.controller';
import { getStripeConnectStatus, startStripeConnectOnboardingAdmin } from '../controllers/finalmile.controller';
import { reportVehicleDefect, listVehicleIssues, driverTripQueues } from '../controllers/finalmile.controller';
import { commandMetrics } from '../controllers/finalmile.controller';
import { platformClearingLedger, platformEscrowList } from '../controllers/analytics.controller';
import { getMyLedger } from '../controllers/payroll.controller';
import { logTripExpense } from '../controllers/trips.controller';

const TEST_TENANT = '00000000-0000-0000-0000-000000000001';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * Builds a minimal Express-like req/res pair for the asyncHandler controllers.
 * The response resolves the pending controller run on first json()/send() —
 * Express handlers finish by responding, not by calling next() on success.
 */
const mockRes = (onDone: () => void) => {
    const res: any = {};
    let settled = false;
    const settle = () => { if (!settled) { settled = true; onDone(); } };
    res.statusCode = 200;
    res.status = (c: number) => { res.statusCode = c; return res; };
    res.setHeader = () => res;
    res.json = (payload: any) => { res.payload = payload; settle(); return res; };
    res.send = (body: any) => { res.body = body; settle(); return res; };
    return res;
};

const runController = (handler: any, req: any): Promise<any> =>
    new Promise((resolve) => {
        const res = mockRes(() => resolve(res));
        const next = (err?: any) => {
            // Mirror Express: an HttpError reaching next() becomes the response.
            if (err) {
                res.statusCode = err.status || 500;
                res.payload = { success: false, error: err.message, code: err.code };
            }
            resolve(res);
        };
        handler(req, res, next);
    });

/**
 * Builds a minimal request object with the auth context properties that
 * getAuthContext() reads (normally populated by the resolveAuth middleware):
 * tenantId + authDriverId / authClientId on the request object itself.
 */
const authedReq = (claims: any, extra: any = {}) => ({
    params: {},
    query: {},
    body: {},
    headers: {},
    ...extra,
    tenantId: claims.tenantId,
    ...(claims.driverId ? { authDriverId: claims.driverId } : {}),
    ...(claims.clientId ? { authClientId: claims.clientId } : {}),
    ...(claims.adminKey ? { isAdmin: true } : {}),
});

let createdVehicleId: string | null = null;
let createdDriverId: string | null = null;

beforeAll(async () => {
    // Seed one vehicle + driver to exercise defect/queue/ledger paths tenant-scoped.
    const v = await pool.query(
        `INSERT INTO vehicles (tenant_id, reference_code, make, model, plate_number)
         VALUES ($1, $2, 'Test Marque', 'Model X', 'TST-001') RETURNING id`,
        [TEST_TENANT, `VLO-T${Date.now()}`]
    );
    createdVehicleId = v.rows[0].id;
    const d = await pool.query(
        `INSERT INTO drivers (tenant_id, reference_code, first_name, last_name)
         VALUES ($1, $2, 'Test', 'Driver') RETURNING id`,
        [TEST_TENANT, `#V-T${Date.now()}`]
    );
    createdDriverId = d.rows[0].id;
});

afterAll(async () => {
    // Children first (ledger/trips/issues reference drivers+vehicles)
    await pool.query(`DELETE FROM driver_ledgers WHERE tenant_id = $1 AND driver_id = $2`, [TEST_TENANT, createdDriverId]);
    await pool.query(`DELETE FROM trips WHERE tenant_id = $1 AND driver_id = $2`, [TEST_TENANT, createdDriverId]);
    await pool.query(`DELETE FROM vehicle_issues WHERE tenant_id = $1 AND vehicle_id = $2`, [TEST_TENANT, createdVehicleId]);
    await pool.query(`DELETE FROM audit_logs WHERE tenant_id = $1 AND action LIKE 'final-mile test%'`, [TEST_TENANT]);
    if (createdDriverId) await pool.query(`DELETE FROM drivers WHERE id = $1`, [createdDriverId]);
    if (createdVehicleId) await pool.query(`DELETE FROM vehicles WHERE id = $1`, [createdVehicleId]);
    await pool.end();
    await servicePool.end();
});

describe('audit logs (final-mile)', () => {
    it('writes and lists a tenant-scoped audit entry', async () => {
        await writeAuditLog(TEST_TENANT, 'Test Actor', 'final-mile test action', 'warning', 'TEST', 'entity-1');
        const res = await runController(listAuditLogs, authedReq({ tenantId: TEST_TENANT }));
        expect(res.payload.success).toBe(true);
        const rows = res.payload.data;
        expect(Array.isArray(rows)).toBe(true);
        expect(rows.some((r: any) => r.action === 'final-mile test action' && r.severity === 'warning')).toBe(true);
    });
});

describe('command metrics', () => {
    it('returns the live aggregate shape', async () => {
        const res = await runController(commandMetrics, authedReq({ tenantId: TEST_TENANT }));
        expect(res.payload.success).toBe(true);
        const d = res.payload.data;
        expect(d.drivers).toHaveProperty('total');
        expect(d.vehicles).toHaveProperty('total');
        expect(d.trips).toHaveProperty('enRoute');
        expect(typeof d.platformFeesMtd).toBe('number');
    });
});

describe('vehicle defects (vehicle_issues)', () => {
    it('rejects a defect without description', async () => {
        const res = await runController(reportVehicleDefect, authedReq(
            { tenantId: TEST_TENANT, driverId: createdDriverId },
            { params: { id: createdVehicleId }, body: { severity: 'MAJOR' } }
        ));
        expect(res.statusCode).toBe(400);
    });

    it('reports a defect, lists it in the driver view, and audit-logs CRITICAL', async () => {
        const report = await runController(reportVehicleDefect, authedReq(
            { tenantId: TEST_TENANT, driverId: createdDriverId },
            { params: { id: createdVehicleId }, body: { description: 'Test brake wear warning', severity: 'CRITICAL' } }
        ));
        expect(report.statusCode).toBe(201);
        expect(report.payload.data.status).toBe('OPEN');

        const list = await runController(listVehicleIssues, authedReq({ tenantId: TEST_TENANT, driverId: createdDriverId }));
        expect(list.payload.success).toBe(true);
        expect(list.payload.data.some((i: any) => i.id === report.payload.data.id)).toBe(true);

        const audits = await pool.query(
            `SELECT 1 FROM audit_logs WHERE entity_type = 'VEHICLE' AND entity_id = $1 AND severity = 'critical'`,
            [createdVehicleId]
        );
        expect(audits.rows.length).toBeGreaterThan(0);
    });

    it('rejects a defect from an unknown vehicle', async () => {
        const res = await runController(reportVehicleDefect, authedReq(
            { tenantId: TEST_TENANT, driverId: createdDriverId },
            { params: { id: '00000000-0000-0000-0000-00000000dead' }, body: { description: 'ghost', severity: 'MINOR' } }
        ));
        expect(res.statusCode).toBe(404);
    });

    it('rejects an invalid severity', async () => {
        const res = await runController(reportVehicleDefect, authedReq(
            { tenantId: TEST_TENANT, driverId: createdDriverId },
            { params: { id: createdVehicleId }, body: { description: 'x', severity: 'COSMIC' } }
        ));
        expect(res.statusCode).toBe(400);
    });
});

describe('driver trip queues', () => {
    it('requires driver auth', async () => {
        const res = await runController(driverTripQueues, authedReq({ tenantId: TEST_TENANT }));
        expect(res.statusCode).toBe(403);
    });

    it('returns upcoming + history arrays for an authenticated driver', async () => {
        const res = await runController(driverTripQueues, authedReq({ tenantId: TEST_TENANT, driverId: createdDriverId }));
        expect(res.payload.success).toBe(true);
        expect(Array.isArray(res.payload.data.upcoming)).toBe(true);
        expect(Array.isArray(res.payload.data.history)).toBe(true);
    });
});

describe('push registration (fail-open)', () => {
    it('registers a driver device token without FCM credentials and reports deliveryConfigured=false', async () => {
        const { registerPushToken } = await import('../controllers/finalmile.controller');
        const res = await runController(registerPushToken, authedReq(
            { tenantId: TEST_TENANT, driverId: createdDriverId },
            { body: { token: 'test-fcm-token-abc123', platform: 'FCM' } }
        ));
        expect(res.statusCode).toBe(200);
        expect(res.payload.data.registered).toBe(true);
        expect(res.payload.data.actorType).toBe('DRIVER');
        expect(res.payload.data.deliveryConfigured).toBe(false);

        const stored = await pool.query(`SELECT fcm_token FROM drivers WHERE id = $1`, [createdDriverId]);
        expect(stored.rows[0].fcm_token).toBe('test-fcm-token-abc123');
    });

    it('rejects a registration without a token', async () => {
        const { registerPushToken } = await import('../controllers/finalmile.controller');
        const res = await runController(registerPushToken, authedReq(
            { tenantId: TEST_TENANT, driverId: createdDriverId },
            { body: {} }
        ));
        expect(res.statusCode).toBe(400);
    });
});

describe('Stripe Connect fail-open (no STRIPE_SECRET_KEY)', () => {
    it('status reports configured=false and connected=false honestly', async () => {
        const res = await runController(getStripeConnectStatus, authedReq({ tenantId: TEST_TENANT }));
        expect(res.payload.success).toBe(true);
        expect(res.payload.data.configured).toBe(false);
        expect(res.payload.data.connected).toBe(false);
        expect(res.payload.data.payoutsEnabled).toBe(false);
    });

    it('admin onboarding returns the 503-class honest unconfigured error', async () => {
        const res = await runController(startStripeConnectOnboardingAdmin, authedReq(
            { tenantId: TEST_TENANT },
            { params: { tenantId: TEST_TENANT }, body: {} }
        ));
        expect(res.statusCode).toBe(503);
        expect(res.payload.code).toBe('STRIPE_NOT_CONFIGURED');
    });
});

describe('driver ledger endpoint', () => {
    it('requires driver auth', async () => {
        const res = await runController(getMyLedger, authedReq({ tenantId: TEST_TENANT }));
        expect(res.statusCode).toBe(403);
    });

    it('logs a trip expense and reflects it in the ledger summary', async () => {
        // Seed a completed trip owned by the driver.
        const trip = await pool.query(
            `INSERT INTO trips (task_id, tenant_id, originating_tenant_id, state, custom_price,
                                pickup_address, dropoff_address, passenger_name, driver_id, completed_at)
             VALUES ($1, $2, $2, 'COMPLETED', 120.00, 'A', 'B', 'Test Passenger', $3, CURRENT_TIMESTAMP)
             RETURNING id`,
            [`VLT-T${Date.now()}`, TEST_TENANT, createdDriverId]
        );
        const tripId = trip.rows[0].id;

        const exp = await runController(logTripExpense, authedReq(
            { tenantId: TEST_TENANT, driverId: createdDriverId },
            { params: { tripId }, body: { expenseType: 'EXPENSE_PARKING', amount: 8.5 } }
        ));
        expect(exp.statusCode).toBe(201);
        expect(exp.payload.data.direction).toBe('DEBIT');

        const ledger = await runController(getMyLedger, authedReq({ tenantId: TEST_TENANT, driverId: createdDriverId }));
        expect(ledger.payload.success).toBe(true);
        expect(ledger.payload.data.entries.some((e: any) => e.id === exp.payload.data.id)).toBe(true);
        expect(Number(ledger.payload.data.summary.expensesMtd)).toBeGreaterThanOrEqual(8.5);

        // Invalid expense type rejected
        const bad = await runController(logTripExpense, authedReq(
            { tenantId: TEST_TENANT, driverId: createdDriverId },
            { params: { tripId }, body: { expenseType: 'EXPENSE_LUXURY', amount: 5 } }
        ));
        expect(bad.statusCode).toBe(400);

        await pool.query(`DELETE FROM driver_ledgers WHERE trip_id = $1`, [tripId]);
        await pool.query(`DELETE FROM trips WHERE id = $1`, [tripId]);
    });
});

describe('backoffice platform views', () => {
    it('clearing ledger returns rows + totals', async () => {
        const res = await runController(platformClearingLedger, authedReq({ tenantId: TEST_TENANT }));
        expect(res.payload.success).toBe(true);
        expect(Array.isArray(res.payload.data.rows)).toBe(true);
        expect(res.payload.data.totals).toHaveProperty('total_wholesale');
    });

    it('platform escrow returns rows + state totals', async () => {
        const res = await runController(platformEscrowList, authedReq({ tenantId: TEST_TENANT }));
        expect(res.payload.success).toBe(true);
        expect(Array.isArray(res.payload.data.rows)).toBe(true);
        expect(res.payload.data.totals).toHaveProperty('held_total');
    });
});
