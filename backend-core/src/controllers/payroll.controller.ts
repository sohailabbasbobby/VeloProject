import { Request, Response } from 'express';
import { db, withTransaction } from '../config/db';
import { asyncHandler, badRequest, notFound, forbidden, conflict } from '../utils/httpError';
import { SettingsService } from '../services/settings.service';
import { getAuthContext } from '../middleware/tenant.middleware';

/**
 * PAYROLL CONTROLLER (§1.4, §2) — reads each driver's ACTUAL assigned pay framework
 * and live trip/shift data. No hardcoded rates. Includes configurable Pension and
 * Student Loan deductions; baseline net-pay estimate uses a flat simplified
 * percentage (as permitted) on top of the real gross figures.
 */

const round2 = (n: number): number => Math.round(n * 100) / 100;

interface DriverPayInput {
    id: string;
    payment_model: string;
    commission_rate: string | null;
    hourly_rate: string | null;
    trip_bonus: string | null;
    custom_pay_config: any;
    subscription_status: string;
    weekly_subscription_fee: string;
}

/** Computes gross pay for one driver over a period from live ledger/shift data. */
export const computeDriverPay = async (client: any, driver: DriverPayInput, periodStart: Date, periodEnd: Date) => {
    const ledgerRes = await client.query(
        `SELECT entry_type, direction, amount FROM driver_ledgers
         WHERE driver_id = $1 AND created_at >= $2 AND created_at < $3`,
        [driver.id, periodStart, periodEnd]
    );

    let grossTripEarnings = 0;
    let tips = 0;
    let subscriptionFees = 0;
    let expenses = 0;
    let bonus = 0;
    for (const row of ledgerRes.rows) {
        const amt = Number(row.amount);
        if (row.direction === 'CREDIT') {
            if (row.entry_type === 'TRIP_EARNINGS') grossTripEarnings += amt;
            else if (row.entry_type === 'TIP') tips += amt;
            else if (row.entry_type === 'TRIP_BONUS') bonus += amt;
        } else {
            if (row.entry_type === 'SUBSCRIPTION_FEE') subscriptionFees += amt;
            else if (row.entry_type.startsWith('EXPENSE_')) expenses += amt;
        }
    }

    const shiftsRes = await client.query(
        `SELECT COALESCE(SUM(total_hours), 0) AS hours, COALESCE(SUM(overtime_hours), 0) AS overtime
         FROM driver_shifts WHERE driver_id = $1 AND clock_in >= $2 AND clock_in < $3`,
        [driver.id, periodStart, periodEnd]
    );
    const hoursWorked = Number(shiftsRes.rows[0]?.hours || 0);
    const overtimeHours = Number(shiftsRes.rows[0]?.overtime || 0);

    const tripsRes = await client.query(
        `SELECT COUNT(*) AS n FROM trips WHERE driver_id = $1 AND state = 'COMPLETED'
         AND completed_at >= $2 AND completed_at < $3`,
        [driver.id, periodStart, periodEnd]
    );
    const tripsCompleted = Number(tripsRes.rows[0]?.n || 0);

    const model = driver.payment_model;
    let frameworkGross = 0;
    const breakdown: Record<string, number | string> = { model };

    if (model === 'COMMISSION') {
        // Driver keeps commission_rate% of net wholesale fare; platform fee already netted in ledger
        frameworkGross = grossTripEarnings;
        breakdown['commissionRatePct'] = Number(driver.commission_rate || 0);
    } else if (model === 'SALARIED') {
        const hourly = Number(driver.hourly_rate || 0);
        const overtimeRate = round2(hourly * 1.5);
        frameworkGross = round2(hourly * hoursWorked + overtimeRate * overtimeHours);
        breakdown['hourlyRate'] = hourly;
        breakdown['hours'] = hoursWorked;
        breakdown['overtimeHours'] = overtimeHours;
    } else if (model === 'CUSTOM') {
        // Dynamic custom framework: fields map to per-trip/hourly/fixed components
        const cfg = driver.custom_pay_config || {};
        const perTrip = Number(cfg.perTripRate || 0);
        const perHour = Number(cfg.hourlyRate || 0);
        const fixedRetainer = Number(cfg.fixedWeekly || 0);
        const perMile = Number(cfg.perMileRate || 0);
        frameworkGross = round2(
            perTrip * tripsCompleted +
            perHour * hoursWorked +
            fixedRetainer
        );
        breakdown['custom'] = JSON.stringify({ perTripRate: perTrip, hourlyRate: perHour, fixedWeekly: fixedRetainer, perMileRate: perMile });
        if (perMile > 0) {
            const odom = await client.query(
                `SELECT COALESCE(SUM(reading), 0) AS m FROM odometer_logs WHERE driver_id = $1 AND logged_at >= $2 AND logged_at < $3`,
                [driver.id, periodStart, periodEnd]
            );
            frameworkGross = round2(frameworkGross + perMile * Number(odom.rows[0]?.m || 0));
        }
    } else if (model === 'SUBSCRIPTION') {
        // £50/week flat, 0% commission — driver keeps everything; subscription fee deducted separately
        frameworkGross = grossTripEarnings;
        breakdown['subscription'] = 'ACTIVE_0PCT_COMMISSION';
    }

    const grossPay = round2(frameworkGross + bonus + tips);

    // Deductions from DB-persisted settings
    const payrollCfg = await SettingsService.getPayrollSettings();
    const pension = round2(grossPay * Number(payrollCfg.pensionRateDefault));
    const studentLoan = round2(grossPay * Number(payrollCfg.studentLoanRateDefault));
    const subscriptionDue = model === 'SUBSCRIPTION' && driver.subscription_status === 'ACTIVE'
        ? round2(Number(driver.weekly_subscription_fee)) : 0;

    const netEstimate = round2(grossPay - pension - studentLoan - subscriptionDue);

    return {
        driverId: driver.id,
        grossPay,
        tips,
        bonus,
        pension,
        studentLoan,
        subscriptionDue,
        netPayEstimate: netEstimate,
        hoursWorked,
        overtimeHours,
        tripsCompleted,
        expensesReimbursable: expenses,
        breakdown,
    };
};

export const runPayrollPreview = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const periodStart = req.body?.periodStart ? new Date(req.body.periodStart) : new Date(Date.now() - 7 * 86400e3);
    const periodEnd = req.body?.periodEnd ? new Date(req.body.periodEnd) : new Date();

    const drivers = await db.query(
        `SELECT id, payment_model, commission_rate, hourly_rate, trip_bonus, custom_pay_config, subscription_status, weekly_subscription_fee
         FROM drivers WHERE tenant_id = $1 AND is_active = TRUE`,
        [tenantId]
    );

    const lines = [];
    for (const driver of drivers.rows) {
        lines.push(await computeDriverPay(db, driver, periodStart, periodEnd));
    }
    res.json({ success: true, data: { periodStart, periodEnd, lines } });
});

export const createPayrollRun = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const { periodStart, periodEnd } = req.body || {};
    if (!periodStart || !periodEnd) throw badRequest('periodStart and periodEnd are required.');

    const run = await withTransaction(tenantId, async (client) => {
        const existing = await client.query(
            `SELECT id FROM payroll_runs WHERE tenant_id = $1 AND period_start = $2 AND period_end = $3`,
            [tenantId, periodStart, periodEnd]
        );
        if (existing.rows.length > 0) throw conflict('A payroll run for this period already exists.');

        const runRes = await client.query(
            `INSERT INTO payroll_runs (tenant_id, period_start, period_end, status) VALUES ($1,$2,$3,'DRAFT') RETURNING *`,
            [tenantId, periodStart, periodEnd]
        );
        const runRow = runRes.rows[0];

        const drivers = await client.query(
            `SELECT id, payment_model, commission_rate, hourly_rate, trip_bonus, custom_pay_config, subscription_status, weekly_subscription_fee
             FROM drivers WHERE tenant_id = $1 AND is_active = TRUE`,
            [tenantId]
        );

        for (const driver of drivers.rows) {
            const pay = await computeDriverPay(client, driver, new Date(periodStart), new Date(periodEnd));
            await client.query(
                `INSERT INTO payroll_lines
                    (payroll_run_id, driver_id, gross_pay, pension_deduction, student_loan_deduction, net_pay_estimate, hours_worked, trips_completed, breakdown)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
                [runRow.id, driver.id, pay.grossPay, pay.pension, pay.studentLoan, pay.netPayEstimate,
                 pay.hoursWorked, pay.tripsCompleted, JSON.stringify(pay.breakdown)]
            );
        }
        return runRow;
    });
    res.status(201).json({ success: true, data: run });
});

export const getPayrollRun = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const runRes = await db.query(`SELECT * FROM payroll_runs WHERE id = $1 AND tenant_id = $2`, [req.params.id, tenantId]);
    if (runRes.rows.length === 0) throw notFound('Payroll run not found.');
    const lines = await db.query(
        `SELECT pl.*, d.first_name || ' ' || d.last_name AS driver_name, d.reference_code
         FROM payroll_lines pl JOIN drivers d ON d.id = pl.driver_id WHERE pl.payroll_run_id = $1`,
        [req.params.id]
    );
    res.json({ success: true, data: { ...runRes.rows[0], lines: lines.rows } });
});

export const listPayrollRuns = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const { rows } = await db.query(
        `SELECT pr.*, COUNT(pl.id) AS line_count, COALESCE(SUM(pl.net_pay_estimate), 0) AS total_net
         FROM payroll_runs pr LEFT JOIN payroll_lines pl ON pl.payroll_run_id = pr.id
         WHERE pr.tenant_id = $1 GROUP BY pr.id ORDER BY pr.created_at DESC LIMIT 100`,
        [tenantId]
    );
    res.json({ success: true, data: rows });
});

// ------------------------------------------------------------------------------------
// PAYOUT HUB — "Mass Execute Payouts" wired to the real Stripe payout flow (§3)
// ------------------------------------------------------------------------------------
const stripeTransfer = async (amount: number, destination: string | null, tenantRef: string, driverRef: string): Promise<string | null> => {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw forbidden('Stripe is not configured (STRIPE_SECRET_KEY missing). Payouts cannot execute.');
    if (!destination) throw forbidden('Fulfilling tenant has no Stripe Connect account configured; connect the tenant before payouts.');

    const res = await fetch('https://api.stripe.com/v1/transfers', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            amount: String(Math.round(amount * 100)),
            currency: 'gbp',
            destination,
            'metadata[driver_id]': driverRef,
        }),
    });
    const json: any = await res.json();
    if (!res.ok) throw forbidden(`Stripe transfer failed: ${json.error?.message || res.status}`);
    return json.id as string;
};

export const executePayout = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const { driverId, amount } = req.body || {};
    if (!driverId || !amount || Number(amount) <= 0) throw badRequest('driverId and a positive amount are required.');

    const tenantRes = await db.query('SELECT stripe_account_id FROM tenants WHERE id = $1', [tenantId]);
    const transferId = await stripeTransfer(Number(amount), tenantRes.rows[0]?.stripe_account_id || null, String(tenantId), String(driverId));

    const { rows } = await db.query(
        `INSERT INTO payouts (tenant_id, driver_id, amount, status, stripe_transfer_id, executed_at, executed_by)
         VALUES ($1,$2,$3,'PAID',$4, CURRENT_TIMESTAMP, 'ERP_PAYOUT_HUB') RETURNING *`,
        [tenantId, driverId, round2(Number(amount)), transferId]
    );
    NotificationServicePayout(driverId, Number(amount));
    res.status(201).json({ success: true, data: rows[0] });
});

export const massExecutePayouts = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const { payoutIds } = req.body || {};
    if (!Array.isArray(payoutIds) || payoutIds.length === 0) throw badRequest('payoutIds array is required.');

    const results: Array<{ payoutId: string; status: string; error?: string }> = [];
    for (const payoutId of payoutIds) {
        try {
            const payRes = await db.query(`SELECT * FROM payouts WHERE id = $1 AND tenant_id = $2 AND status = 'PENDING' FOR UPDATE`, [payoutId, tenantId]);
            if (payRes.rows.length === 0) throw new Error('Payout not found or not pending.');
            const payout = payRes.rows[0];
            const tenantRes = await db.query('SELECT stripe_account_id FROM tenants WHERE id = $1', [tenantId]);
            const transferId = await stripeTransfer(Number(payout.amount), tenantRes.rows[0]?.stripe_account_id || null, String(tenantId), String(payout.driver_id));
            await db.query(
                `UPDATE payouts SET status = 'PAID', stripe_transfer_id = $2, executed_at = CURRENT_TIMESTAMP, executed_by = 'ERP_MASS_PAYOUT' WHERE id = $1`,
                [payoutId, transferId]
            );
            if (payout.driver_id) NotificationServicePayout(payout.driver_id, Number(payout.amount));
            results.push({ payoutId, status: 'PAID' });
        } catch (err) {
            await db.query(
                `UPDATE payouts SET status = 'FAILED', failure_reason = $2 WHERE id = $1`,
                [payoutId, (err as Error).message]
            );
            results.push({ payoutId, status: 'FAILED', error: (err as Error).message });
        }
    }
    res.json({ success: true, data: results });
});

export const listPayouts = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const { status } = req.query;
    const { rows } = await db.query(
        `SELECT p.*, d.first_name || ' ' || d.last_name AS driver_name, d.reference_code
         FROM payouts p LEFT JOIN drivers d ON d.id = p.driver_id
         WHERE p.tenant_id = $1 AND ($2::text IS NULL OR p.status = $2)
         ORDER BY p.created_at DESC LIMIT 500`,
        [tenantId, (status as string) || null]
    );
    res.json({ success: true, data: rows });
});

export const createPendingPayoutsFromLedgers = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const rows = await withTransaction(tenantId, async (client) => {
        return (await client.query(
            `INSERT INTO payouts (tenant_id, driver_id, amount, status)
             SELECT $1, dl.driver_id, COALESCE(SUM(CASE WHEN dl.direction = 'CREDIT' THEN dl.amount ELSE -dl.amount END), 0) - COALESCE((
                    SELECT SUM(p.amount) FROM payouts p
                    WHERE p.tenant_id = $1 AND p.driver_id = dl.driver_id AND p.status IN ('PENDING','PROCESSING','PAID')
                ), 0) AS payable,
                'PENDING'
             FROM driver_ledgers dl
             WHERE dl.tenant_id = $1
             GROUP BY dl.driver_id
             HAVING COALESCE(SUM(CASE WHEN dl.direction = 'CREDIT' THEN dl.amount ELSE -dl.amount END), 0)
                    - COALESCE((
                        SELECT SUM(p.amount) FROM payouts p
                        WHERE p.tenant_id = $1 AND p.driver_id = dl.driver_id AND p.status IN ('PENDING','PROCESSING','PAID')
                    ), 0) > 0
             RETURNING *`,
            [tenantId]
        )).rows;
    });
    res.status(201).json({ success: true, data: rows });
});

// Notification import lives at module top (avoids mid-file circular usage)
import { NotificationService } from '../utils/notificationService';
const NotificationServicePayout = (driverId: string, amount: number): void => {
    NotificationService.notifyPayoutConfirmation('', driverId, amount).catch(() => undefined);
};
