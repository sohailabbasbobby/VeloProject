import { Request, Response } from 'express';
import { db, withTransaction } from '../config/db';
import { asyncHandler, badRequest, notFound, forbidden, conflict } from '../utils/httpError';
import { getAuthContext } from '../middleware/tenant.middleware';

/**
 * CHAUFFEUR PERSONNEL HUB (§2) — driver CRUD (#V-XXXX reference codes), onboarding
 * workflow with real document verification (AI controller), §1.1 pay framework
 * assignment with model-conditional fields, multi-tenant memberships (§1.3),
 * Pre-Shift Gatekeeper intake and roster reads (§5).
 */

const nextReferenceCode = async (client: any, prefix: string, table: string): Promise<string> => {
    const res = await client.query(
        `SELECT COALESCE(MAX(NULLIF(regexp_replace(reference_code, '\\D', '', 'g'), '')::int), 0) + 1 AS next
         FROM ${table} WHERE reference_code LIKE $1`,
        [`${prefix}-%`]
    );
    let n = res.rows[0]?.next || 1;
    for (let i = 0; i < 100; i++) {
        const code = `${prefix}-${String(n).padStart(4, '0')}`;
        const dup = await client.query(`SELECT 1 FROM ${table} WHERE reference_code = $1`, [code]);
        if (dup.rows.length === 0) return code;
        n++;
    }
    throw new Error('Unable to allocate a unique reference code.');
};

export const listDrivers = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const { rows } = await db.query(
        `SELECT d.*,
                (d.first_name || ' ' || d.last_name) AS full_name,
                v.plate_number AS assigned_vehicle_plate, v.reference_code AS assigned_vehicle_code,
                (SELECT COUNT(*) FROM trips t WHERE t.driver_id = d.id AND t.state = 'COMPLETED') AS completed_trips
         FROM drivers d
         LEFT JOIN vehicle_assignments va ON va.driver_id = d.id AND va.is_primary = TRUE AND va.assigned_to IS NULL
         LEFT JOIN vehicles v ON v.id = va.vehicle_id
         WHERE d.tenant_id = $1 AND d.is_active = TRUE
         ORDER BY d.created_at DESC`,
        [tenantId]
    );
    res.json({ success: true, data: rows });
});

export const getDriver = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const driverRes = await db.query(`SELECT *, (first_name || ' ' || last_name) AS full_name FROM drivers WHERE id = $1`, [req.params.id]);
    if (driverRes.rows.length === 0) throw notFound('Chauffeur not found.');

    const driver = driverRes.rows[0];
    const [shifts, ledger, memberships, docs] = await Promise.all([
        db.query(`SELECT * FROM driver_shifts WHERE driver_id = $1 ORDER BY clock_in DESC LIMIT 50`, [req.params.id]),
        db.query(`SELECT * FROM driver_ledgers WHERE driver_id = $1 ORDER BY created_at DESC LIMIT 100`, [req.params.id]),
        db.query(
            `SELECT m.*, t.name AS tenant_name, t.code AS tenant_code FROM driver_operator_memberships m
             JOIN tenants t ON t.id = m.tenant_id WHERE m.driver_id = $1`,
            [req.params.id]
        ),
        db.query(
            `SELECT id, document_type, ai_verification_status, ai_confidence, expires_at, created_at
             FROM compliance_documents WHERE entity_type = 'DRIVER' AND entity_id = $1 ORDER BY created_at DESC`,
            [req.params.id]
        ),
    ]);

    // Engagement/communication threads (real messages, no mock injection)
    const threads = await db.query(
        `SELECT id, thread_type, thread_key, body, sender_type, created_at FROM messages
         WHERE tenant_id = $2 AND thread_type = 'DRIVER_DISPATCH' AND sender_id = $1
         ORDER BY created_at DESC LIMIT 50`,
        [req.params.id, tenantId]
    );

    res.json({ success: true, data: { ...driver, shifts: shifts.rows, ledger: ledger.rows, memberships: memberships.rows, documents: docs.rows, messages: threads.rows } });
});

export const createDriver = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const {
        firstName, lastName, email, phone, preferredLanguage = 'en',
        paymentModel = 'COMMISSION', commissionRate, hourlyRate, tripBonus, customPayConfig,
        licenseNumber, licenseExpiry, pcoBadgeNumber, pcoBadgeExpiry,
        tenureStartDate, notes,
    } = req.body || {};

    if (!firstName || !lastName) throw badRequest('firstName and lastName are required.');

    // §1.1: validate only the fields relevant to the selected pay model
    const model = String(paymentModel).toUpperCase();
    if (!['COMMISSION', 'SALARIED', 'CUSTOM', 'SUBSCRIPTION'].includes(model)) {
        throw badRequest("paymentModel must be COMMISSION, SALARIED, CUSTOM or SUBSCRIPTION.");
    }
    if (model === 'COMMISSION' && (commissionRate === undefined || Number(commissionRate) <= 0 || Number(commissionRate) > 100)) {
        throw badRequest('COMMISSION requires commissionRate between 0 and 100 (driver keeps e.g. 80%).');
    }
    if (model === 'SALARIED' && (hourlyRate === undefined || Number(hourlyRate) <= 0)) {
        throw badRequest('SALARIED requires hourlyRate.');
    }
    if (model === 'CUSTOM' && (customPayConfig === undefined || typeof customPayConfig !== 'object')) {
        throw badRequest('CUSTOM requires a customPayConfig object defining the bespoke pay structure.');
    }

    const driver = await withTransaction(tenantId, async (client) => {
        const referenceCode = await nextReferenceCode(client, 'V', 'drivers');
        const res2 = await client.query(
            `INSERT INTO drivers
                (tenant_id, reference_code, first_name, last_name, email, phone, preferred_language,
                 payment_model, commission_rate, hourly_rate, trip_bonus, custom_pay_config,
                 subscription_status, weekly_subscription_fee,
                 license_number, license_expiry, pco_badge_number, pco_badge_expiry,
                 tenure_start_date, notes, onboarding_status)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'NONE',50.00,$13,$14,$15,$16,$17,$18,'STARTED')
             RETURNING *`,
            [tenantId, referenceCode, firstName, lastName, email || null, phone || null, preferredLanguage,
             model, commissionRate ?? null, hourlyRate ?? null, tripBonus ?? null,
             customPayConfig ? JSON.stringify(customPayConfig) : null,
             licenseNumber || null, licenseExpiry || null, pcoBadgeNumber || null, pcoBadgeExpiry || null,
             tenureStartDate || null, notes || null]
        );
        const driverRow = res2.rows[0];
        // Primary membership under the onboarding tenant (§1.3 multi-tenant engine)
        await client.query(
            `INSERT INTO driver_operator_memberships (driver_id, tenant_id, status, payment_model, commission_rate, hourly_rate, trip_bonus, custom_pay_config)
             VALUES ($1,$2,'ACTIVE',$3,$4,$5,$6,$7)`,
            [driverRow.id, tenantId, model, commissionRate ?? null, hourlyRate ?? null, tripBonus ?? null,
             customPayConfig ? JSON.stringify(customPayConfig) : null]
        );
        return driverRow;
    });
    res.status(201).json({ success: true, data: driver });
});

export const updateDriver = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const allowed = ['first_name','last_name','email','phone','photo_url','preferred_language','payment_model',
        'commission_rate','hourly_rate','trip_bonus','custom_pay_config','subscription_status',
        'license_number','license_expiry','pco_badge_number','pco_badge_expiry','compliance_status',
        'onboarding_status','status','notes','fcm_token'];
    const updates: string[] = [];
    const params: unknown[] = [req.params.id, tenantId];
    let p = 3;
    for (const key of allowed) {
        if (req.body && req.body[key] !== undefined) {
            updates.push(`${key} = $${p++}`);
            params.push(typeof req.body[key] === 'object' ? JSON.stringify(req.body[key]) : req.body[key]);
        }
    }
    // camelCase aliases from the ERP forms
    const alias: Record<string, string> = {
        firstName: 'first_name', lastName: 'last_name', paymentModel: 'payment_model',
        commissionRate: 'commission_rate', hourlyRate: 'hourly_rate', tripBonus: 'trip_bonus',
        customPayConfig: 'custom_pay_config', licenseNumber: 'license_number', licenseExpiry: 'license_expiry',
        pcoBadgeNumber: 'pco_badge_number', pcoBadgeExpiry: 'pco_badge_expiry', preferredLanguage: 'preferred_language',
    };
    for (const [camel, snake] of Object.entries(alias)) {
        if (req.body && req.body[camel] !== undefined) {
            updates.push(`${snake} = $${p++}`);
            params.push(typeof req.body[camel] === 'object' ? JSON.stringify(req.body[camel]) : req.body[camel]);
        }
    }
    if (updates.length === 0) throw badRequest('No updatable fields supplied.');

    const { rows } = await db.query(
        `UPDATE drivers SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND tenant_id = $2 RETURNING *`,
        params
    );
    if (rows.length === 0) throw notFound('Chauffeur not found.');
    res.json({ success: true, data: rows[0] });
});

/** Deactivation (never hard-delete: financial history must remain). */
export const deactivateDriver = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const { rows } = await db.query(
        `UPDATE drivers SET is_active = FALSE, status = 'OFFLINE', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND tenant_id = $2 RETURNING id`,
        [req.params.id, tenantId]
    );
    if (rows.length === 0) throw notFound('Chauffeur not found.');
    await db.query(`UPDATE driver_operator_memberships SET status = 'LEFT' WHERE driver_id = $1 AND tenant_id = $2`, [req.params.id, tenantId]);
    res.json({ success: true, data: { deactivated: rows[0].id } });
});

/** Add this driver under another operator (multi-tenant §1.3). */
export const addDriverMembership = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const driverId = String(req.params.id);
    const { targetTenantId, paymentModel, commissionRate, hourlyRate, tripBonus, customPayConfig } = req.body || {};
    if (!targetTenantId) throw badRequest('targetTenantId is required.');

    const { rows } = await db.query(
        `INSERT INTO driver_operator_memberships (driver_id, tenant_id, status, payment_model, commission_rate, hourly_rate, trip_bonus, custom_pay_config)
         VALUES ($1,$2,'ACTIVE',$3,$4,$5,$6,$7)
         ON CONFLICT (driver_id, tenant_id) DO UPDATE SET status = 'ACTIVE', payment_model = $3
         RETURNING *`,
        [driverId, targetTenantId, paymentModel || 'COMMISSION', commissionRate ?? null, hourlyRate ?? null, tripBonus ?? null,
         customPayConfig ? JSON.stringify(customPayConfig) : null]
    );
    res.status(201).json({ success: true, data: rows[0] });
});

// ------------------------------------------------------------------------------------
// PRE-SHIFT GATEKEEPER (§5)
// ------------------------------------------------------------------------------------
export const submitGatekeeperCheck = asyncHandler(async (req: Request, res: Response) => {
    const { driverId, tenantId } = getAuthContext(req);
    if (!driverId) throw forbidden('Driver authentication required.');
    const { vehicleId, cleanliness, tyres, fuelBattery, rearCabinPhotoUrl } = req.body || {};
    if (!vehicleId) throw badRequest('vehicleId is required.');
    if (!rearCabinPhotoUrl) throw badRequest('A real rear-cabin camera capture is required before going Online — no placeholder is accepted.');

    const passed = Boolean(cleanliness && tyres && fuelBattery && rearCabinPhotoUrl);
    const rows = await withTransaction(tenantId, async (client) => {
        const r = await client.query(
            `INSERT INTO gatekeeper_checks
                (driver_id, vehicle_id, tenant_id, cleanliness_confirmed, tyres_confirmed, fuel_battery_confirmed, rear_cabin_photo_url, passed)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
             ON CONFLICT (driver_id, vehicle_id, check_date) DO UPDATE SET
                cleanliness_confirmed = $4, tyres_confirmed = $5, fuel_battery_confirmed = $6,
                rear_cabin_photo_url = $7, passed = $8, created_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [driverId, vehicleId, tenantId, Boolean(cleanliness), Boolean(tyres), Boolean(fuelBattery), rearCabinPhotoUrl, passed]
        );
        if (passed) {
            await client.query(`UPDATE drivers SET status = 'ONLINE', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [driverId]);
            await client.query(
                `INSERT INTO driver_locations (driver_id, tenant_id, is_online) VALUES ($1,$2,TRUE)
                 ON CONFLICT (driver_id) DO UPDATE SET is_online = TRUE, updated_at = CURRENT_TIMESTAMP`,
                [driverId, tenantId]
            );
        }
        return r.rows[0];
    });
    if (!passed) throw conflict('Gatekeeper checklist incomplete — driver remains Offline.');
    res.status(201).json({ success: true, data: rows });
});

/** Swipe-to-go-offline. */
export const goOffline = asyncHandler(async (req: Request, res: Response) => {
    const { driverId, tenantId } = getAuthContext(req);
    if (!driverId) throw forbidden('Driver authentication required.');
    await db.query(`UPDATE drivers SET status = 'OFFLINE', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [driverId]);
    await db.query(`UPDATE driver_locations SET is_online = FALSE, updated_at = CURRENT_TIMESTAMP WHERE driver_id = $1`, [driverId]);
    res.json({ success: true, data: { status: 'OFFLINE' } });
});

/** My Roster screen (§5) — reads the Workforce Scheduler data. */
export const getMyRoster = asyncHandler(async (req: Request, res: Response) => {
    const { driverId } = getAuthContext(req);
    if (!driverId) throw forbidden('Driver authentication required.');
    const { rows } = await db.query(
        `SELECT cs.id, cs.shift_type, cs.start_time, cs.end_time, v.plate_number, v.reference_code
         FROM chauffeur_shifts cs LEFT JOIN vehicles v ON v.id = cs.vehicle_id
         WHERE cs.driver_id = $1 AND cs.end_time >= CURRENT_DATE
         ORDER BY cs.start_time ASC LIMIT 60`,
        [driverId]
    );
    res.json({ success: true, data: rows });
});

/** Registered Operators list (§1.3 sidebar). */
export const getMyOperators = asyncHandler(async (req: Request, res: Response) => {
    const { driverId } = getAuthContext(req);
    if (!driverId) throw forbidden('Driver authentication required.');
    const { rows } = await db.query(
        `SELECT t.id, t.name, t.code, wlc.logo_url, wlc.primary_color, m.status AS membership_status, m.joined_at
         FROM driver_operator_memberships m
         JOIN tenants t ON t.id = m.tenant_id
         LEFT JOIN white_label_configs wlc ON wlc.tenant_id = t.id
         WHERE m.driver_id = $1 ORDER BY m.joined_at ASC`,
        [driverId]
    );
    res.json({ success: true, data: rows });
});
