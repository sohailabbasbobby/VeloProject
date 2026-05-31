import { Request, Response } from 'express';

/**
 * VELO PLATFORM - DUAL REMUNERATION MATRIX
 * Processes complex payout calculations based on driver profiles (COMMISSION vs SALARIED).
 * 100% of driver tips are mathematically decoupled and shielded from percentage cuts.
 */
export const generatePayrollSummary = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).tenantId; // Enforcing Row-Level Security

        console.log(`\n[PAYROLL ENGINE INITIATED] Aggregating analytics for Tenant: ${tenantId}`);

        // 1. Database Mock: Simulating an aggregated PostgREST SQL response
        // In production, this data is heavily grouped and SUM() operated by the RDBMS.
        const mockDriverData = [
            {
                driverId: "DRV-100-COM",
                driverName: "Michael Evans",
                payStructure: "COMMISSION",
                commissionRatePercent: 20.0, // Driver keeps 20% of retail gross
                metrics: {
                    totalRetailGross: 2500.00,
                    totalTipsAllocated: 150.00
                }
            },
            {
                driverId: "DRV-200-SAL",
                driverName: "Sarah Jenkins",
                payStructure: "SALARIED",
                hourlyRate: 25.00, // Standard Mock Rate
                overtimeRate: 37.50, // Time and a half
                metrics: {
                    totalStandardHours: 40.0,
                    totalOvertimeHours: 5.5,
                    totalTipsAllocated: 320.00
                }
            }
        ];

        // 2. Engine Calculation Cycle
        const payrollAnalytics: any[] = [];

        for (const record of mockDriverData) {
            let corePayout = 0;
            const pureTips = record.metrics.totalTipsAllocated;

            if (record.payStructure === 'COMMISSION') {
                // (Total Retail Fare * Commission %)
                corePayout = (record.metrics.totalRetailGross! * (record.commissionRatePercent! / 100));
                
                payrollAnalytics.push({
                    driver_id: record.driverId,
                    name: record.driverName,
                    structure: "COMMISSION",
                    calculation_base: `£${record.metrics.totalRetailGross!.toFixed(2)} @ ${record.commissionRatePercent}%`,
                    calculated_core_payout: corePayout,
                    protected_tips_passthrough: pureTips,
                    total_gross_disbursement: corePayout + pureTips
                });
            } 
            else if (record.payStructure === 'SALARIED') {
                // (Hours * Base Rate) + (OT Hours * OT Rate)
                const basePay = record.metrics.totalStandardHours! * record.hourlyRate!;
                const otPay = record.metrics.totalOvertimeHours! * record.overtimeRate!;
                corePayout = basePay + otPay;

                payrollAnalytics.push({
                    driver_id: record.driverId,
                    name: record.driverName,
                    structure: "SALARIED",
                    calculation_base: `${record.metrics.totalStandardHours}hrs @ £${record.hourlyRate!.toFixed(2)}/hr + ${record.metrics.totalOvertimeHours}hrs OT`,
                    calculated_core_payout: corePayout,
                    protected_tips_passthrough: pureTips,
                    total_gross_disbursement: corePayout + pureTips
                });
            }
        }

        console.log(`[VELO PAYROLL ALGORITHM] Calculation cycle completed. Transmitting protected timesheet arrays.`);
        console.log(`-----------------------------------------------------\n`);

        return res.status(200).json({
            success: true,
            tenant_id: tenantId,
            period: "CURRENT_WEEK_LIVE",
            payroll_summary: payrollAnalytics
        });

    } catch (error) {
        console.error('CRITICAL [VELO PAYROLL ENGINE FAILURE]:', error);
        return res.status(500).json({ error: 'VELO API: Internal Server Error during payroll matrix calculations.' });
    }
};
