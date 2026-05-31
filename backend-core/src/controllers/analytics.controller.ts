import { Request, Response } from 'express';

/**
 * VELO PLATFORM - ANALYTICS & DATA AGGREGATION ENGINE
 * Executes high-performance mock SQL queries, structuring clean JSON payloads
 * optimized directly for frontend chart components.
 */

export const getTenantAnalytics = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).tenantId; // RLS Enforced Isolation

        console.log(`\n[ANALYTICS ENGINE] Executing Tenant Fleet Aggregation for: ${tenantId}`);
        console.log(`[SQL EXECUTION STREAM] SELECT SUM(customer_retail_fare) FROM invoices WHERE tenant_id = '${tenantId}';`);

        // Simulated RLS-constrained PostgreSQL Output Array (Formatted for Recharts/Chart.js)
        const chartData = {
            revenue: {
                total_gross: 14500.00,
                trend_percentage: "+12.4%",
                chart_series: [
                    { label: "Mon", value: 1200 },
                    { label: "Tue", value: 2100 },
                    { label: "Wed", value: 1800 },
                    { label: "Thu", value: 2400 },
                    { label: "Fri", value: 3100 },
                    { label: "Sat", value: 2900 },
                    { label: "Sun", value: 1000 }
                ]
            },
            job_distribution: {
                chart_series: [
                    { label: "In-House Dispatch", value: 82 },
                    { label: "B2B Network Fulfillment", value: 18 }
                ]
            },
            chauffeur_utilization: {
                average_efficiency: "78%",
                active_drivers: 14,
                offline_drivers: 4
            }
        };

        return res.status(200).json({
            success: true,
            tenant_id: tenantId,
            analytics: chartData
        });

    } catch (error) {
        console.error('CRITICAL [VELO ANALYTICS FAILURE]:', error);
        return res.status(500).json({ error: 'Internal Server Error during Tenant analytics aggregation.' });
    }
};


export const getPlatformAnalytics = async (req: Request, res: Response) => {
    try {
        const adminKey = req.headers['x-admin-key'];

        // Strict Master Authentication Constraint
        if (adminKey !== 'super-secret-velo-admin-key-999') {
            console.error(`[SECURITY BREACH ATTEMPT] Invalid or missing admin key on Platform Analytics endpoint.`);
            return res.status(403).json({ error: 'Forbidden: Valid Master Admin Key Required' });
        }

        console.log(`\n[ANALYTICS ENGINE] Executing Master Back-Office Global Aggregations.`);
        console.log(`[SQL EXECUTION STREAM] SELECT SUM(origin_fee_extracted + fulfiller_fee_extracted) AS total_revenue FROM network_clearing_ledger;`);

        // Simulated Omnipotent Global PostgreSQL Output Array
        const globalChartData = {
            clearing_house_revenue: {
                total_platform_fees_extracted: 14500.00, // Based on pure £2 network trades
                chart_series: [
                    { label: "Q1", value: 3500 },
                    { label: "Q2", value: 4200 },
                    { label: "Q3", value: 2800 },
                    { label: "Q4", value: 4000 }
                ]
            },
            global_network_volume: {
                total_jobs_processed: 125000,
                b2b_trade_percentage: "32%", // 32% of jobs hit the open pool
                chart_series: [
                    { label: "Direct In-House", value: 85000 },
                    { label: "B2B Traded", value: 40000 }
                ]
            },
            system_wide_roster: {
                total_active_tenants: 42,
                total_registered_drivers: 840,
                currently_online_drivers: 312
            }
        };

        return res.status(200).json({
            success: true,
            status: "MASTER_TOWER_AUTHENTICATED",
            analytics: globalChartData
        });

    } catch (error) {
        console.error('CRITICAL [VELO ANALYTICS FAILURE]:', error);
        return res.status(500).json({ error: 'Internal Server Error during Master analytics aggregation.' });
    }
};

export const getVehicleProductivity = async (req: Request, res: Response) => {
    try {
        // We do not strictly need the tenantMiddleware injection here if called directly from Tenant ERP Dashboard without standard wrapping,
        // but normally we would extract tenantId. We'll extract directly from headers for this route.
        const tenantId = req.headers['x-tenant-id'] as string;
        const vehicleId = req.params.id;

        if (!tenantId) return res.status(401).json({ error: 'Unauthorized' });

        console.log(`\n[FINANCE ENGINE] Executing Net Yield Aggregation for Vehicle: ${vehicleId}`);

        // Mock DB State (Normally we SUM(amount_pence) WHERE vehicle_id = id AND tenant_id = tenantId)
        
        // 1. Mock Gross Revenue for this specific car (e.g., £5,400.00 -> 540000 pence)
        const grossRevenuePence = 540000; 

        // 2. Fixed Outlays (Finance + Insurance)
        const monthlyFinanceCostPence = 80000;  // £800
        const monthlyInsuranceCostPence = 25000; // £250

        // 3. Dynamic Expenses (Normally fetched from fleet tables, mocking an array of accumulated costs)
        const bookingExpensesPence = 35000; // £350 in Tolls/Parking
        const generalExpensesPence = 42000; // £420 in Fuel/Wash

        // 4. Mathematics
        const totalExpensesPence = monthlyFinanceCostPence + monthlyInsuranceCostPence + bookingExpensesPence + generalExpensesPence;
        const netYieldPence = grossRevenuePence - totalExpensesPence;

        const productivityData = {
            vehicle_id: vehicleId,
            gross_revenue_pounds: grossRevenuePence / 100,
            expenses: {
                monthly_finance_fixed: monthlyFinanceCostPence / 100,
                monthly_insurance_fixed: monthlyInsuranceCostPence / 100,
                booking_expenses: bookingExpensesPence / 100,
                general_expenses: generalExpensesPence / 100,
                total_outlays_pounds: totalExpensesPence / 100
            },
            net_yield_pounds: netYieldPence / 100,
            trend: "+4.2%"
        };

        return res.status(200).json({
            success: true,
            productivity: productivityData
        });

    } catch (error) {
        console.error('CRITICAL [VELO ANALYTICS FAILURE]:', error);
        return res.status(500).json({ error: 'Internal Server Error during Vehicle Productivity aggregation.' });
    }
};
