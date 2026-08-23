import { Request, Response, NextFunction } from 'express';
import { db } from '../config/db';
import { z } from 'zod';

const odometerSchema = z.object({
    vehicleId: z.string().uuid(),
    reading: z.number().int().positive(),
    eventType: z.string().optional()
});

/**
 * POST /api/fleet/odometer
 * Validates and logs odometer preflight checks enforcing the Unidirectional Safety Rule.
 */
export const logOdometer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;
        const driverId = req.headers['x-driver-id'] as string;
        
        if (!tenantId || !driverId) {
            return res.status(401).json({ error: 'Unauthorized: Missing execution identity headers.' });
        }

        const validation = odometerSchema.safeParse({
            vehicleId: req.body.vehicleId,
            reading: parseInt(req.body.reading, 10),
            eventType: req.body.eventType
        });

        if (!validation.success) {
            return res.status(400).json({ error: 'Validation Error', details: validation.error.issues });
        }

        const { vehicleId, reading: newReading, eventType } = validation.data;

        const vehicleRes = await db.query(
            'SELECT current_odometer FROM vehicles WHERE id = $1 AND tenant_id = $2', 
            [vehicleId, tenantId]
        );
        
        if (vehicleRes.rowCount === 0) {
            return res.status(404).json({ error: 'Asset Error: Vehicle not found or belongs to another tenant.' });
        }
        
        const currentOdometer = vehicleRes.rows[0].current_odometer;

        // 1. UNIDIRECTIONAL SAFETY RULE
        if (newReading < currentOdometer) {
            console.error(`[FLEET SAFETY ENGINE] Rejected odometer submission from Driver ${driverId}. Submitted: ${newReading}, Existing: ${currentOdometer}`);
            return res.status(403).json({ 
                error: `VELO SAFETY VIOLATION: Odometer reading cannot decrease. Existing logged reading is ${currentOdometer} miles. Contact Dispatch.` 
            });
        }

        // 2. Execute Updates
        const client = await db.connect();
        let logRes;
        try {
            await client.query('BEGIN');
            
            await client.query(
                'UPDATE vehicles SET current_odometer = $1 WHERE id = $2 AND tenant_id = $3',
                [newReading, vehicleId, tenantId]
            );
            
            logRes = await client.query(`
                INSERT INTO odometer_logs (vehicle_id, driver_id, tenant_id, reading, event_type)
                VALUES ($1, $2, $3, $4, $5) RETURNING *
            `, [vehicleId, driverId, tenantId, newReading, eventType || 'START_SHIFT']);
            
            await client.query('COMMIT');
        } catch (txError) {
            await client.query('ROLLBACK');
            throw txError;
        } finally {
            client.release();
        }

        console.log(`[FLEET ENGINE] Odometer synchronized for Vehicle ${vehicleId}. New baseline: ${newReading} miles.`);

        return res.status(200).json({ success: true, log: logRes.rows[0] });

    } catch (error) {
        console.error('Fleet Engine Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * POST /api/fleet/issues
 * Logs a new maintenance defect for a vehicle.
 */
export const reportIssue = async (req: Request, res: Response, next: import('express').NextFunction) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;
        const driverId = req.headers['x-driver-id'] as string;
        
        if (!tenantId || !driverId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { vehicleId, description, severity } = req.body;

        const vehicleRes = await db.query(
            'SELECT id FROM vehicles WHERE id = $1 AND tenant_id = $2', 
            [vehicleId, tenantId]
        );

        if (vehicleRes.rowCount === 0) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }

        const issueRes = await db.query(`
            INSERT INTO vehicle_issues (vehicle_id, driver_id, tenant_id, description, severity, status)
            VALUES ($1, $2, $3, $4, $5, 'OPEN') RETURNING *
        `, [vehicleId, driverId, tenantId, description, severity]);

        console.log(`[FLEET ENGINE] Defect logged for Vehicle ${vehicleId} | Severity: ${severity}`);

        return res.status(201).json({ success: true, issue: issueRes.rows[0] });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/fleet/booking-expenses
 * Logs ride-linked expenses (Tolls, Parking, etc).
 */
export const logBookingExpense = async (req: Request, res: Response, next: import('express').NextFunction) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;
        const driverId = req.headers['x-driver-id'] as string;
        
        if (!tenantId || !driverId) return res.status(401).json({ error: 'Unauthorized' });

        const { bookingId, expenseType, amountPence, customLabel, receiptUrl } = req.body;

        const expRes = await db.query(`
            INSERT INTO booking_expenses (booking_id, driver_id, tenant_id, expense_type, amount_pence, custom_label, receipt_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
        `, [bookingId, driverId, tenantId, expenseType, amountPence, customLabel || null, receiptUrl || null]);

        console.log(`[FINANCE ENGINE] Booking Expense £${(amountPence/100).toFixed(2)} logged for Job ${bookingId}`);

        return res.status(201).json({ success: true, expense: expRes.rows[0] });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/fleet/general-expenses
 * Logs shift-linked expenses (Fuel, Carwash).
 */
export const logGeneralExpense = async (req: Request, res: Response, next: import('express').NextFunction) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;
        const driverId = req.headers['x-driver-id'] as string;
        
        if (!tenantId || !driverId) return res.status(401).json({ error: 'Unauthorized' });

        const { vehicleId, expenseType, amountPence, description, receiptUrl } = req.body;

        const expRes = await db.query(`
            INSERT INTO fleet_general_expenses (vehicle_id, driver_id, tenant_id, expense_type, amount_pence, description, receipt_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
        `, [vehicleId, driverId, tenantId, expenseType, amountPence, description || null, receiptUrl || null]);

        console.log(`[FINANCE ENGINE] General Shift Expense £${(amountPence/100).toFixed(2)} logged for Vehicle ${vehicleId}`);

        return res.status(201).json({ success: true, expense: expRes.rows[0] });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/fleet/issues/:id/resolve
 * Marks a defect as fixed.
 */
export const resolveIssue = async (req: Request, res: Response, next: import('express').NextFunction) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;
        const { id } = req.params;

        const issueRes = await db.query(`
            UPDATE vehicle_issues SET status = 'FIXED', resolved_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND tenant_id = $2 RETURNING *
        `, [id, tenantId]);

        if (issueRes.rowCount === 0) {
            return res.status(404).json({ error: 'Issue not found' });
        }
        
        console.log(`[FLEET ENGINE] Issue ${id} resolved.`);
        return res.status(200).json({ success: true, issue: issueRes.rows[0] });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/fleet/vehicles
 * Returns all vehicles and open issues for the Tenant ERP dashboard.
 */
export const getTenantFleet = async (req: Request, res: Response, next: import('express').NextFunction) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;
        
        const vRes = await db.query('SELECT * FROM vehicles WHERE tenant_id = $1', [tenantId]);
        const iRes = await db.query("SELECT * FROM vehicle_issues WHERE tenant_id = $1 AND status = 'OPEN'", [tenantId]);

        return res.status(200).json({ vehicles: vRes.rows, openIssues: iRes.rows });
    } catch (error) {
        next(error);
    }
};
