import { Request, Response } from 'express';
import { db, withTransaction } from '../config/db';
import { asyncHandler, badRequest, notFound } from '../utils/httpError';
import { SettingsService } from '../services/settings.service';
import { getAuthContext } from '../middleware/tenant.middleware';

/**
 * SYSTEM CONTROLLER (§2, §3 System Management) — global settings persisted via
 * platform_settings (never in-memory), Operational Staff Directory, Workforce
 * Roster & Scheduling (continuous 24h, 30-minute granularity), Brand Identity /
 * White-Labeling wizard, and the AI-ready diagnostic export for the Platform
 * Health Hub.
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

// ------------------------------------------------------------------------------------
// GLOBAL SETTINGS (DB-persisted — the §2 clearing fix, §4 Global Settings)
// ------------------------------------------------------------------------------------
export const getAllSettings = asyncHandler(async (req: Request, res: Response) => {
    const data = await SettingsService.getAll();
    res.json({ success: true, data });
});

export const updateSetting = asyncHandler(async (req: Request, res: Response) => {
    const { key } = req.params;
    if (!req.body || typeof req.body.value === 'undefined') throw badRequest('value is required.');
    const allowedKeys = ['fees', 'network_floors', 'negotiation', 'dispatch', 'payroll', 'subscription'];
    if (!allowedKeys.includes(String(key))) throw badRequest(`Unknown settings key '${key}'.`);
    await SettingsService.set(String(key), req.body.value, 'BACKOFFICE');
    const value = await SettingsService.get(String(key));
    res.json({ success: true, data: { key, value } });
});

// ------------------------------------------------------------------------------------
// OPERATIONAL STAFF DIRECTORY + OnboardStaffModal (real forms, §3)
// ------------------------------------------------------------------------------------
export const listStaff = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const { rows } = await db.query(
        `SELECT s.*, (SELECT COUNT(*) FROM staff_shifts ss WHERE ss.staff_id = s.id AND ss.shift_date >= CURRENT_DATE) AS upcoming_shifts
         FROM staff s WHERE s.tenant_id = $1 ORDER BY s.created_at DESC`,
        [tenantId]
    );
    res.json({ success: true, data: rows });
});

export const getStaffMember = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const staffRes = await db.query(`SELECT * FROM staff WHERE id = $1 AND tenant_id = $2`, [req.params.id, tenantId]);
    if (staffRes.rows.length === 0) throw notFound('Staff member not found.');
    const shifts = await db.query(
        `SELECT * FROM staff_shifts WHERE staff_id = $1 AND shift_date >= CURRENT_DATE - 7 ORDER BY shift_date, start_minute`,
        [req.params.id]
    );
    res.json({ success: true, data: { ...staffRes.rows[0], shifts: shifts.rows } });
});

export const createStaff = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const { firstName, lastName, email, phone, role = 'DISPATCHER', department, hireDate, salary, shiftAvailability = 'Flexible' } = req.body || {};
    if (!firstName || !lastName) throw badRequest('firstName and lastName are required.');

    const staffMember = await withTransaction(tenantId, async (client) => {
        const referenceCode = await nextReferenceCode(client, 'EMP', 'staff');
        const res2 = await client.query(
            `INSERT INTO staff (tenant_id, reference_code, first_name, last_name, email, phone, role, department, hire_date, salary, shift_availability)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
            [tenantId, referenceCode, firstName, lastName, email || null, phone || null, role, department || null,
             hireDate || null, salary ? Number(salary) : null, shiftAvailability]
        );
        return res2.rows[0];
    });
    res.status(201).json({ success: true, data: staffMember });
});

export const updateStaff = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const alias: Record<string, string> = {
        firstName: 'first_name', lastName: 'last_name', email: 'email', phone: 'phone', role: 'role',
        department: 'department', hireDate: 'hire_date', salary: 'salary', shiftAvailability: 'shift_availability',
        status: 'status', photoUrl: 'photo_url',
    };
    const updates: string[] = [];
    const params: unknown[] = [req.params.id, tenantId];
    let p = 3;
    for (const [camel, snake] of Object.entries(alias)) {
        if (req.body && (req.body as any)[camel] !== undefined) {
            updates.push(`${snake} = $${p++}`);
            params.push((req.body as any)[camel]);
        }
    }
    if (updates.length === 0) throw badRequest('No updatable fields supplied.');
    const { rows } = await db.query(
        `UPDATE staff SET ${updates.join(', ')} WHERE id = $1 AND tenant_id = $2 RETURNING *`,
        params
    );
    if (rows.length === 0) throw notFound('Staff member not found.');
    res.json({ success: true, data: rows[0] });
});

// ------------------------------------------------------------------------------------
// WORKFORCE ROSTER & SCHEDULING — continuous 24h grid, 30-min slots (§3)
// ------------------------------------------------------------------------------------
export const getRoster = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const date = String(req.query.date || new Date().toISOString().slice(0, 10));
    const { rows } = await db.query(
        `SELECT ss.*, s.first_name || ' ' || s.last_name AS staff_name, s.role, s.reference_code
         FROM staff_shifts ss JOIN staff s ON s.id = ss.staff_id
         WHERE ss.tenant_id = $1 AND ss.shift_date = $2
         ORDER BY ss.start_minute ASC`,
        [tenantId, date]
    );
    res.json({ success: true, data: { date, shifts: rows } });
});

export const createShiftSlot = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const { staffId, shiftDate, startMinute, durationMinutes = 30, roleAssignment, notes } = req.body || {};
    if (!staffId || !shiftDate || startMinute === undefined) throw badRequest('staffId, shiftDate and startMinute are required.');
    if (Number(startMinute) % 30 !== 0 || Number(startMinute) < 0 || Number(startMinute) > 1410) {
        throw badRequest('startMinute must be a 30-minute grid value between 0 and 1410.');
    }
    if (Number(durationMinutes) % 30 !== 0 || Number(durationMinutes) <= 0) {
        throw badRequest('durationMinutes must be a positive multiple of 30.');
    }
    const { rows } = await db.query(
        `INSERT INTO staff_shifts (tenant_id, staff_id, shift_date, start_minute, duration_minutes, role_assignment, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [tenantId, staffId, shiftDate, Number(startMinute), Number(durationMinutes), roleAssignment || null, notes || null]
    );
    res.status(201).json({ success: true, data: rows[0] });
});

export const updateShiftSlot = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const { startMinute, durationMinutes, roleAssignment, notes } = req.body || {};
    const { rows } = await db.query(
        `UPDATE staff_shifts SET
            start_minute = COALESCE($2, start_minute),
            duration_minutes = COALESCE($3, duration_minutes),
            role_assignment = COALESCE($4, role_assignment),
            notes = COALESCE($5, notes)
         WHERE id = $1 AND tenant_id = $6 RETURNING *`,
        [req.params.slotId, startMinute !== undefined ? Number(startMinute) : null,
         durationMinutes !== undefined ? Number(durationMinutes) : null, roleAssignment || null, notes || null, tenantId]
    );
    if (rows.length === 0) throw notFound('Shift slot not found.');
    res.json({ success: true, data: rows[0] });
});

export const deleteShiftSlot = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const { rows } = await db.query(`DELETE FROM staff_shifts WHERE id = $1 AND tenant_id = $2 RETURNING id`, [req.params.slotId, tenantId]);
    if (rows.length === 0) throw notFound('Shift slot not found.');
    res.json({ success: true, data: { deleted: rows[0].id } });
});

// ------------------------------------------------------------------------------------
// BRAND IDENTITY & WHITE-LABELING WIZARD (§3) — config consumed by the mobile apps
// ------------------------------------------------------------------------------------
export const getWhiteLabelConfig = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const { rows } = await db.query(`SELECT * FROM white_label_configs WHERE tenant_id = $1`, [tenantId]);
    res.json({ success: true, data: rows[0] || null });
});

export const updateWhiteLabelConfig = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const b = req.body || {};
    const { rows } = await db.query(
        `INSERT INTO white_label_configs
            (tenant_id, app_name, logo_url, splash_url, primary_color, background_color, panel_color, accent_color,
             custom_domain, firebase_google_app_id, firebase_ios_bundle, firebase_android_package, map_style_json, config, published)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         ON CONFLICT (tenant_id) DO UPDATE SET
            app_name = COALESCE($2, white_label_configs.app_name),
            logo_url = COALESCE($3, white_label_configs.logo_url),
            splash_url = COALESCE($4, white_label_configs.splash_url),
            primary_color = COALESCE($5, white_label_configs.primary_color),
            background_color = COALESCE($6, white_label_configs.background_color),
            panel_color = COALESCE($7, white_label_configs.panel_color),
            accent_color = COALESCE($8, white_label_configs.accent_color),
            custom_domain = COALESCE($9, white_label_configs.custom_domain),
            firebase_google_app_id = COALESCE($10, white_label_configs.firebase_google_app_id),
            firebase_ios_bundle = COALESCE($11, white_label_configs.firebase_ios_bundle),
            firebase_android_package = COALESCE($12, white_label_configs.firebase_android_package),
            map_style_json = COALESCE($13, white_label_configs.map_style_json),
            config = COALESCE($14, white_label_configs.config),
            published = COALESCE($15, white_label_configs.published),
            updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [tenantId, b.appName || null, b.logoUrl || null, b.splashUrl || null,
         b.primaryColor || null, b.backgroundColor || null, b.panelColor || null, b.accentColor || null,
         b.customDomain || null, b.firebaseGoogleAppId || null, b.firebaseIosBundle || null,
         b.firebaseAndroidPackage || null, b.mapStyleJson ? JSON.stringify(b.mapStyleJson) : null,
         b.config ? JSON.stringify(b.config) : null, typeof b.published === 'boolean' ? b.published : null]
    );
    res.json({ success: true, data: rows[0] });
});

// ------------------------------------------------------------------------------------
// AI-READY DIAGNOSTIC EXPORT (Platform Health Hub, §2 AI controller)
// ------------------------------------------------------------------------------------
export const exportDiagnostics = asyncHandler(async (req: Request, res: Response) => {
    const since = new Date(Date.now() - 24 * 3600e3);
    const [telemetry, poolHealth, dbStats] = await Promise.all([
        db.query(
            `SELECT event_type, COUNT(*) AS count
             FROM telemetry_events WHERE recorded_at >= $1 GROUP BY event_type`,
            [since]
        ),
        db.query(
            `SELECT state, COUNT(*) AS count FROM b2b_pool_jobs GROUP BY state`
        ),
        db.query(`SELECT pg_database_size(current_database()) AS db_size_bytes, (SELECT COUNT(*) FROM pg_stat_activity WHERE datname = current_database()) AS active_connections`),
    ]);

    const diagnostics = {
        generatedAt: new Date().toISOString(),
        remediation: [] as string[],
        sections: {
            telemetry24h: telemetry.rows,
            poolStates: poolHealth.rows,
            database: {
                sizeBytes: Number(dbStats.rows[0]?.db_size_bytes || 0),
                activeConnections: Number(dbStats.rows[0]?.active_connections || 0),
            },
            environment: {
                stripe: Boolean(process.env.STRIPE_SECRET_KEY),
                twilio: Boolean(process.env.TWILIO_ACCOUNT_SID),
                selfHostedAuth: Boolean(process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32),
                pushPipe: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_B64 || process.env.FIREBASE_SERVICE_ACCOUNT_JSON),
                googleSignIn: Boolean(process.env.GOOGLE_CLIENT_ID),
                appleSignIn: Boolean(process.env.APPLE_CLIENT_ID),
                googleMaps: Boolean(process.env.GOOGLE_MAPS_API_KEY),
                openaiVision: Boolean(process.env.OPENAI_API_KEY),
            },
        },
    };
    if (!diagnostics.sections.environment.googleMaps) diagnostics.remediation.push('Set GOOGLE_MAPS_API_KEY to enable live routing and PROVIDER_GOOGLE maps.');
    if (!diagnostics.sections.environment.stripe) diagnostics.remediation.push('Set STRIPE_SECRET_KEY and connect tenant Stripe accounts for escrow.');
    if (!diagnostics.sections.environment.selfHostedAuth) diagnostics.remediation.push('Set JWT_SECRET (min 32 chars) to enable self-hosted app sign-in.');
    if (!diagnostics.sections.environment.twilio) diagnostics.remediation.push('Set Twilio credentials for masked proxy contact and OTP SMS delivery.');

    res.json({ success: true, data: diagnostics });
});
