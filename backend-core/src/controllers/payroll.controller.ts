import { Request, Response } from 'express';
import { db } from '../config/db';

/**
 * VELO PLATFORM - DUAL REMUNERATION MATRIX
 * Processes complex payout calculations based on driver profiles (COMMISSION vs SALARIED).
 * 100% of driver tips are mathematically decoupled and shielded from percentage cuts.
 */
export const generatePayrollSummary = async (req: Request, res: Response, next: import('express').NextFunction) => {
    try {
        const tenantId = (req as any).tenantId; // Enforcing Row-Level Security

        console.log(`\n[PAYROLL ENGINE INITIATED] Aggregating analytics for Tenant: ${tenantId}`);

        // 1. Database Query: Aggregating driver timesheets and invoices
        const driversRes = await db.query(
            'SELECT id, first_name, last_name, pay_structure, commission_rate, hourly_rate, overtime_rate FROM drivers WHERE tenant_id = $1',
            [tenantId]
        );

        const payrollAnalytics: any[] = [];

        for (const driver of driversRes.rows) {
            let corePayout = 0;
            
            // Fetch total tips for this driver
            const tipsRes = await db.query(
                'SELECT SUM(tip_amount) as total_tips FROM driver_tips WHERE driver_id = $1 AND tenant_id = $2',
                [driver.id, tenantId]
            );
            const pureTips = parseFloat(tipsRes.rows[0].total_tips) || 0;

            if (driver.pay_structure === 'COMMISSION') {
                // Fetch total retail gross from invoices for this driver
                const invoicesRes = await db.query(
                    'SELECT SUM(customer_retail_fare) as total_gross FROM invoices WHERE tenant_id = $1 AND driver_id = $2', 
                    [tenantId, driver.id]
                );
                const totalRetailGross = parseFloat(invoicesRes.rows[0].total_gross) || 0;

                corePayout = (totalRetailGross * (parseFloat(driver.commission_rate) / 100));
                
                payrollAnalytics.push({
                    driver_id: driver.id,
                    name: `${driver.first_name} ${driver.last_name}`,
                    structure: "COMMISSION",
                    calculation_base: `£${totalRetailGross.toFixed(2)} @ ${driver.commission_rate}%`,
                    calculated_core_payout: corePayout,
                    protected_tips_passthrough: pureTips,
                    total_gross_disbursement: corePayout + pureTips
                });
            } 
            else if (driver.pay_structure === 'SALARIED') {
                // Fetch total hours from driver_shifts
                const shiftsRes = await db.query(
                    'SELECT SUM(total_hours) as total_hours, SUM(overtime_hours) as overtime_hours FROM driver_shifts WHERE driver_id = $1 AND tenant_id = $2',
                    [driver.id, tenantId]
                );
                
                const totalStandardHours = parseFloat(shiftsRes.rows[0].total_hours) || 0;
                const totalOvertimeHours = parseFloat(shiftsRes.rows[0].overtime_hours) || 0;

                const hourlyRate = parseFloat(driver.hourly_rate) || 25.00;
                const overtimeRate = parseFloat(driver.overtime_rate) || 37.50;

                const basePay = totalStandardHours * hourlyRate;
                const otPay = totalOvertimeHours * overtimeRate;
                corePayout = basePay + otPay;

                payrollAnalytics.push({
                    driver_id: driver.id,
                    name: `${driver.first_name} ${driver.last_name}`,
                    structure: "SALARIED",
                    calculation_base: `${totalStandardHours}hrs @ £${hourlyRate.toFixed(2)}/hr + ${totalOvertimeHours}hrs OT`,
                    calculated_core_payout: corePayout,
                    protected_tips_passthrough: pureTips,
                    total_gross_disbursement: corePayout + pureTips
                });
            }
        }

        console.log(`[VELO PAYROLL ALGORITHM] Calculation cycle completed. Transmitting protected timesheet arrays.`);

        return res.status(200).json({
            success: true,
            tenant_id: tenantId,
            period: "CURRENT_WEEK_LIVE",
            payroll_summary: payrollAnalytics
        });

    } catch (error) {
        next(error);
    }
};
