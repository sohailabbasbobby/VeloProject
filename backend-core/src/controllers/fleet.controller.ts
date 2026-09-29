import { Request, Response } from 'express';
import { db, withTransaction } from '../config/db';
import { asyncHandler, badRequest, notFound, forbidden } from '../utils/httpError';
import { getAuthContext } from '../middleware/tenant.middleware';

/**
 * FLEET ASSET MANAGEMENT (§2) — vehicles CRUD with VLO-XXXX reference codes,
 * driver assignments, maintenance logs (Issue/ReportedDate/ReportedBy/Status/Actions),
 * lease-progress tracking, MOT/PCO compliance, expenses and odometer intake.
 */

const round2 = (n: number): number => Math.round(n * 100) / 100;

const nextReferenceCode = async (client: any, prefix: string, table: string): Promise<string> => {
    const res = await client.query(
        `SELECT COALESCE(MAX(NULLIF(regexp_replace(reference_code, '\D', 'g'), '')::int), 0) + 1 AS next
         FROM ${table} WHERE reference_code LIKE $1`,
        [`${prefix}-%`]
    );
    let n = res.rows[0]?.next || 1;
    // Guarantee uniqueness even after manual/deleted rows
    for (let i = 0; i < 100; i++) {
        const code = `${prefix}-${String(n).padStart(4, '0')}`;
        const dup = await client.query(`SELECT 1 FROM ${table} WHERE reference_code = $1`, [code]);
        if (dup.rows.length === 0) return code;
        n++;
    }
    throw new Error('Unable to allocate a unique reference code.');
};

export const listVehicles = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const { rows } = await db.query(
        `SELECT v.*,
                d.first_name || ' ' || d.last_name AS assigned_driver_name,
                d.reference_code AS assigned_driver_code,
                ROUND(COALESCE(v.lease_paid_to_date / NULLIF(v.lease_total_cost, 0), 0) * 100, 1) AS lease_progress_pct,
                LEAST(v.mot_expiry, v.phv_expiry, v.insurance_expiry) AS next_compliance_expiry
         FROM vehicles v
         LEFT JOIN vehicle_assignments va ON va.vehicle_id = v.id AND va.is_primary = TRUE AND va.assigned_to IS NULL
         LEFT JOIN drivers d ON d.id = va.driver_id
         WHERE v.tenant_id = $1
         ORDER BY v.created_at DESC`,
        [tenantId]
    );
    res.json({ success: true, data: rows });
});

export const getVehicle = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const { rows } = await db.query(`SELECT * FROM vehicles WHERE id = $1 AND tenant_id = $2`, [req.params.id, tenantId]);
    if (rows.length === 0) throw notFound('Vehicle not found.');
    const maintenance = await db.query(
        `SELECT m.*, s.first_name || ' ' || s.last_name AS reported_by_staff, d.reference_code AS reported_by_driver_code
         FROM maintenance_logs m
         LEFT JOIN staff s ON s.id = m.reported_by_staff_id
         LEFT JOIN drivers d ON d.id = m.reported_by_driver_id
         WHERE m.vehicle_id = $1 ORDER BY m.reported_date DESC`,
        [req.params.id]
    );
    const expenses = await db.query(
        `SELECT * FROM fleet_general_expenses WHERE vehicle_id = $1 ORDER BY logged_at DESC LIMIT 100`,
        [req.params.id]
    );
    res.json({ success: true, data: { ...rows[0], maintenanceLogs: maintenance.rows, expenses: expenses.rows } });
});

export const createVehicle = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const {
        make, model, year, color, tier = 'EXECUTIVE', plateNumber,
        passengerCapacity = 4, baggageCapacity = 2, status = 'ACTIVE',
        motExpiry, phvExpiry, insuranceExpiry, roadTaxExpiry,
        leaseProvider, leaseStartDate, leaseEndDate, leaseTotalCost,
        monthlyFinanceCostPence = 0, monthlyInsuranceCostPence = 0, photoUrl,
    } = req.body || {};

    if (!make || !model || !plateNumber) throw badRequest('make, model and plateNumber are required.');

    const vehicle = await withTransaction(tenantId, async (client) => {
        const referenceCode = await nextReferenceCode(client, 'VLO', 'vehicles');
        const res2 = await client.query(
            `INSERT INTO vehicles
                (tenant_id, reference_code, make, model, year, color, tier, plate_number,
                 passenger_capacity, baggage_capacity, status,
                 mot_expiry, phv_expiry, insurance_expiry, road_tax_expiry, photo_url,
                 lease_provider, lease_start_date, lease_end_date, lease_total_cost,
                 monthly_finance_cost_pence, monthly_insurance_cost_pence)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
             RETURNING *`,
            [tenantId, referenceCode, make, model, year || null, color || null, tier, plateNumber,
             passengerCapacity, baggageCapacity, status,
             motExpiry || null, phvExpiry || null, insuranceExpiry || null, roadTaxExpiry || null, photoUrl || null,
             leaseProvider || null, leaseStartDate || null, leaseEndDate || null, leaseTotalCost ? Number(leaseTotalCost) : null,
             monthlyFinanceCostPence, monthlyInsuranceCostPence]
        );
        return res2.rows[0];
    });
    res.status(201).json({ success: true, data: vehicle });
});

export const updateVehicle = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const allowed = ['make','model','year','color','tier','plate_number','passenger_capacity','baggage_capacity',
        'status','mot_expiry','phv_expiry','insurance_expiry','road_tax_expiry','photo_url','current_odometer',
        'lease_provider','lease_start_date','lease_end_date','lease_total_cost','lease_paid_to_date',
        'monthly_finance_cost_pence','monthly_insurance_cost_pence','mot_document_url','insurance_document_url'];
    const updates: string[] = [];
    const params: unknown[] = [req.params.id, tenantId];
    let p = 3;
    for (const key of allowed) {
        if (req.body && req.body[key] !== undefined) {
            updates.push(`${key} = $${p++}`);
            params.push(req.body[key]);
        }
    }
    if (updates.length === 0) throw badRequest('No updatable fields supplied.');

    const camelToSnake: Record<string, string> = {
        make: 'make', model: 'model', year: 'year', color: 'color', tier: 'tier', plateNumber: 'plate_number',
    };
    for (const [camel, snake] of Object.entries(camelToSnake)) {
        if (req.body && req.body[camel] !== undefined) {
            updates.push(`${snake} = $${p++}`);
            params.push(req.body[camel]);
        }
    }

    const { rows } = await db.query(
        `UPDATE vehicles SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND tenant_id = $2 RETURNING *`,
        params
    );
    if (rows.length === 0) throw notFound('Vehicle not found.');
    res.json({ success: true, data: rows[0] });
});

export const assignVehicle = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const { driverId, isPrimary = true } = req.body || {};
    if (!driverId) throw badRequest('driverId is required.');

    const assignment = await withTransaction(tenantId, async (client) => {
        const veh = await client.query(`SELECT 1 FROM vehicles WHERE id = $1 AND tenant_id = $2`, [req.params.id, tenantId]);
        if (veh.rows.length === 0) throw notFound('Vehicle not found.');
        const drv = await client.query(`SELECT 1 FROM drivers WHERE id = $1`, [driverId]);
        if (drv.rows.length === 0) throw notFound('Driver not found.');

        if (isPrimary) {
            await client.query(
                `UPDATE vehicle_assignments SET is_primary = FALSE WHERE vehicle_id = $1 AND tenant_id = $2`,
                [req.params.id, tenantId]
            );
        }
        const res2 = await client.query(
            `INSERT INTO vehicle_assignments (tenant_id, vehicle_id, driver_id, is_primary)
             VALUES ($1,$2,$3,$4) RETURNING *`,
            [tenantId, req.params.id, driverId, isPrimary]
        );
        return res2.rows[0];
    });
    res.status(201).json({ success: true, data: assignment });
});

export const unassignVehicle = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const { rows } = await db.query(
        `UPDATE vehicle_assignments SET assigned_to = CURRENT_TIMESTAMP
         WHERE vehicle_id = $1 AND tenant_id = $2 AND assigned_to IS NULL RETURNING id`,
        [req.params.id, tenantId]
    );
    if (rows.length === 0) throw notFound('No active assignment for this vehicle.');
    res.json({ success: true, data: { unassigned: rows.length } });
});

export const createMaintenanceLog = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const { issueDescription, severity = 'LOW', reportedByDriverId, reportedByStaffId } = req.body || {};
    if (!issueDescription) throw badRequest('issueDescription is required.');

    const log = await withTransaction(tenantId, async (client) => {
        const veh = await client.query(`SELECT 1 FROM vehicles WHERE id = $1 AND tenant_id = $2`, [req.params.id, tenantId]);
        if (veh.rows.length === 0) throw notFound('Vehicle not found.');
        const res2 = await client.query(
            `INSERT INTO maintenance_logs (tenant_id, vehicle_id, reported_by_driver_id, reported_by_staff_id, issue_description, severity)
             VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
            [tenantId, req.params.id, reportedByDriverId || null, reportedByStaffId || null, issueDescription, severity]
        );
        return res2.rows[0];
    });
    res.status(201).json({ success: true, data: log });
});

export const updateMaintenanceLog = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const { status, resolutionNotes, resolutionAmount, resolutionVatInclusive = false } = req.body || {};
    if (status && !['OPEN', 'IN_PROGRESS', 'RESOLVED'].includes(status)) throw badRequest('Invalid maintenance status.');

    const { rows } = await db.query(
        `UPDATE maintenance_logs
         SET status = COALESCE($2, status),
             resolution_notes = COALESCE($3, resolution_notes),
             resolution_amount = COALESCE($4, resolution_amount),
             resolution_vat_inclusive = COALESCE($5, resolution_vat_inclusive),
             resolved_at = CASE WHEN $2 = 'RESOLVED' THEN CURRENT_TIMESTAMP ELSE resolved_at END
         WHERE id = $6 AND tenant_id = $7 RETURNING *`,
        [status || null, resolutionNotes || null, resolutionAmount ? Number(resolutionAmount) : null,
         Boolean(resolutionVatInclusive), req.params.logId, tenantId]
    );
    if (rows.length === 0) throw notFound('Maintenance log not found.');
    res.json({ success: true, data: rows[0] });
});

export const addFleetExpense = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const { expenseType, amount, description, receiptUrl, driverId } = req.body || {};
    if (!expenseType || !amount) throw badRequest('expenseType and amount are required.');

    const { rows } = await db.query(
        `INSERT INTO fleet_general_expenses (tenant_id, vehicle_id, driver_id, expense_type, amount, description, receipt_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [tenantId, req.params.id, driverId || null, expenseType, round2(Number(amount)), description || null, receiptUrl || null]
    );
    res.status(201).json({ success: true, data: rows[0] });
});

/** Driver-side odometer intake wired from the mobile app (§5). */
export const logOdometer = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId, driverId } = getAuthContext(req);
    if (!driverId) throw forbidden('Driver authentication required.');
    const vehicleId = String(req.params.id);
    const { reading, eventType = 'MANUAL' } = req.body || {};
    if (reading === undefined || Number(reading) < 0) throw badRequest('A valid odometer reading is required.');

    const rows = await withTransaction(tenantId, async (client) => {
        const r = await client.query(
            `INSERT INTO odometer_logs (vehicle_id, driver_id, tenant_id, reading, event_type)
             VALUES ($1,$2,$3,$4,$5) RETURNING *`,
            [vehicleId, driverId, tenantId, Number(reading), eventType]
        );
        await client.query(`UPDATE vehicles SET current_odometer = GREATEST(current_odometer, $2) WHERE id = $1`, [vehicleId, Number(reading)]);
        return r.rows[0];
    });
    res.status(201).json({ success: true, data: rows });
});

export const getFleetCompliance = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const { rows } = await db.query(
        `SELECT id, reference_code, make, model, plate_number,
                mot_expiry, phv_expiry, insurance_expiry, road_tax_expiry,
                mot_expiry - CURRENT_DATE AS mot_days_left,
                phv_expiry - CURRENT_DATE AS phv_days_left,
                insurance_expiry - CURRENT_DATE AS insurance_days_left,
                CASE WHEN LEAST(mot_expiry, phv_expiry, insurance_expiry) < CURRENT_DATE THEN 'EXPIRED'
                     WHEN LEAST(mot_expiry, phv_expiry, insurance_expiry) < CURRENT_DATE + 30 THEN 'EXPIRING'
                     ELSE 'VALID' END AS compliance_status
         FROM vehicles WHERE tenant_id = $1
         ORDER BY LEAST(mot_expiry, phv_expiry, insurance_expiry) ASC NULLS LAST`,
        [tenantId]
    );
    res.json({ success: true, data: rows });
});
