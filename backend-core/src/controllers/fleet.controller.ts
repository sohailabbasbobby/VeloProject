import { Request, Response } from 'express';

// Simulated In-Memory Database for scaffolding
let mockVehicles = [
    {
        id: 'VEH-1111-2222',
        tenant_id: 'TENANT-CORP-001',
        plate_number: 'LDN 77X',
        phv_expiry: '2027-01-01',
        insurance_expiry: '2026-06-15',
        current_odometer: 15400
    }
];

let mockOdometerLogs: any[] = [];
let mockVehicleIssues: any[] = [];
let mockBookingExpenses: any[] = [];
let mockGeneralExpenses: any[] = [];

/**
 * POST /api/fleet/odometer
 * Validates and logs odometer preflight checks enforcing the Unidirectional Safety Rule.
 */
export const logOdometer = async (req: Request, res: Response) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;
        const driverId = req.headers['x-driver-id'] as string;
        
        if (!tenantId || !driverId) {
            return res.status(401).json({ error: 'Unauthorized: Missing execution identity headers.' });
        }

        const { vehicleId, reading, eventType } = req.body;
        const newReading = parseInt(reading, 10);

        if (isNaN(newReading)) {
            return res.status(400).json({ error: 'Validation Error: Reading must be an integer.' });
        }

        const vehicle = mockVehicles.find(v => v.id === vehicleId && v.tenant_id === tenantId);
        
        if (!vehicle) {
            return res.status(404).json({ error: 'Asset Error: Vehicle not found or belongs to another tenant.' });
        }

        // 1. UNIDIRECTIONAL SAFETY RULE
        if (newReading < vehicle.current_odometer) {
            console.error(`[FLEET SAFETY ENGINE] Rejected odometer submission from Driver ${driverId}. Submitted: ${newReading}, Existing: ${vehicle.current_odometer}`);
            return res.status(403).json({ 
                error: `VELO SAFETY VIOLATION: Odometer reading cannot decrease. Existing logged reading is ${vehicle.current_odometer} miles. Contact Dispatch.` 
            });
        }

        // 2. Execute Updates
        vehicle.current_odometer = newReading;
        
        const logEntry = {
            id: mockOdometerLogs.length + 1,
            vehicle_id: vehicleId,
            driver_id: driverId,
            tenant_id: tenantId,
            reading: newReading,
            event_type: eventType || 'START_SHIFT',
            logged_at: new Date().toISOString()
        };
        
        mockOdometerLogs.push(logEntry);

        console.log(`[FLEET ENGINE] Odometer synchronized for Vehicle ${vehicleId}. New baseline: ${newReading} miles.`);

        return res.status(200).json({ success: true, log: logEntry });

    } catch (error) {
        console.error('Fleet Engine Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * POST /api/fleet/issues
 * Logs a new maintenance defect for a vehicle.
 */
export const reportIssue = async (req: Request, res: Response) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;
        const driverId = req.headers['x-driver-id'] as string;
        
        if (!tenantId || !driverId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { vehicleId, description, severity } = req.body;

        const vehicle = mockVehicles.find(v => v.id === vehicleId && v.tenant_id === tenantId);
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }

        const newIssue = {
            id: mockVehicleIssues.length + 1,
            vehicle_id: vehicleId,
            driver_id: driverId,
            tenant_id: tenantId,
            description,
            severity,
            status: 'OPEN',
            reported_at: new Date().toISOString()
        };

        mockVehicleIssues.push(newIssue);
        console.log(`[FLEET ENGINE] Defect logged for Vehicle ${vehicleId} | Severity: ${severity}`);

        return res.status(201).json({ success: true, issue: newIssue });
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * POST /api/fleet/booking-expenses
 * Logs ride-linked expenses (Tolls, Parking, etc).
 */
export const logBookingExpense = async (req: Request, res: Response) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;
        const driverId = req.headers['x-driver-id'] as string;
        
        if (!tenantId || !driverId) return res.status(401).json({ error: 'Unauthorized' });

        const { bookingId, expenseType, amountPence, customLabel, receiptUrl } = req.body;

        const expense = {
            id: mockBookingExpenses.length + 1,
            booking_id: bookingId,
            driver_id: driverId,
            tenant_id: tenantId,
            expense_type: expenseType,
            amount_pence: amountPence,
            custom_label: customLabel || null,
            receipt_url: receiptUrl || null,
            logged_at: new Date().toISOString()
        };

        mockBookingExpenses.push(expense);
        console.log(`[FINANCE ENGINE] Booking Expense £${(amountPence/100).toFixed(2)} logged for Job ${bookingId}`);

        return res.status(201).json({ success: true, expense });
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * POST /api/fleet/general-expenses
 * Logs shift-linked expenses (Fuel, Carwash).
 */
export const logGeneralExpense = async (req: Request, res: Response) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;
        const driverId = req.headers['x-driver-id'] as string;
        
        if (!tenantId || !driverId) return res.status(401).json({ error: 'Unauthorized' });

        const { vehicleId, expenseType, amountPence, description, receiptUrl } = req.body;

        const expense = {
            id: mockGeneralExpenses.length + 1,
            vehicle_id: vehicleId,
            driver_id: driverId,
            tenant_id: tenantId,
            expense_type: expenseType,
            amount_pence: amountPence,
            description: description || null,
            receipt_url: receiptUrl || null,
            logged_at: new Date().toISOString()
        };

        mockGeneralExpenses.push(expense);
        console.log(`[FINANCE ENGINE] General Shift Expense £${(amountPence/100).toFixed(2)} logged for Vehicle ${vehicleId}`);

        return res.status(201).json({ success: true, expense });
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * POST /api/fleet/issues/:id/resolve
 * Marks a defect as fixed.
 */
export const resolveIssue = async (req: Request, res: Response) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;
        const { id } = req.params;

        const issue = mockVehicleIssues.find(i => i.id.toString() === id && i.tenant_id === tenantId);
        if (!issue) {
            return res.status(404).json({ error: 'Issue not found' });
        }

        issue.status = 'FIXED';
        issue.resolved_at = new Date().toISOString();
        
        console.log(`[FLEET ENGINE] Issue ${id} resolved.`);
        return res.status(200).json({ success: true, issue });
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * GET /api/fleet/vehicles
 * Returns all vehicles and open issues for the Tenant ERP dashboard.
 */
export const getTenantFleet = async (req: Request, res: Response) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;
        
        const tenantVehicles = mockVehicles.filter(v => v.tenant_id === tenantId);
        const tenantIssues = mockVehicleIssues.filter(i => i.tenant_id === tenantId && i.status === 'OPEN');

        return res.status(200).json({ vehicles: tenantVehicles, openIssues: tenantIssues });
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
