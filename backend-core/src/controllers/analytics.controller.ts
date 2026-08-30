import { Request, Response } from 'express';
import { db } from '../config/db';

/**
 * VELO PLATFORM - ANALYTICS & DATA AGGREGATION ENGINE
 * Executes live SQL queries to aggregate tenant and platform metrics.
 */

export const getTenantAnalytics = async (req: Request, res: Response, next: import('express').NextFunction) => {
    try {
        const tenantId = (req as any).tenantId; // RLS Enforced Isolation

        console.log(`\n[ANALYTICS ENGINE] Executing Tenant Fleet Aggregation for: ${tenantId}`);

        // Aggregate total revenue from invoices
        const revenueRes = await db.query(
            'SELECT SUM(customer_retail_fare) as total_gross FROM invoices WHERE tenant_id = $1',
            [tenantId]
        );
        const totalGross = parseFloat(revenueRes.rows[0].total_gross) || 0;

        const dailyRevenueRes = await db.query(
            `SELECT TO_CHAR(created_at, 'Dy') as day, SUM(customer_retail_fare) as total
             FROM invoices
             WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '7 days'
             GROUP BY TO_CHAR(created_at, 'Dy')`,
            [tenantId]
        );
        const revenueSeries = dailyRevenueRes.rows.map(r => ({ label: r.day, value: parseFloat(r.total) }));

        // Aggregate active vs offline drivers
        const activeDriversRes = await db.query(
            "SELECT COUNT(*) as count FROM driver_locations WHERE tenant_id = $1 AND is_online = TRUE",
            [tenantId]
        );
        const activeDrivers = parseInt(activeDriversRes.rows[0].count, 10) || 0;

        const offlineDriversRes = await db.query(
            "SELECT COUNT(*) as count FROM driver_locations WHERE tenant_id = $1 AND is_online = FALSE",
            [tenantId]
        );
        const offlineDrivers = parseInt(offlineDriversRes.rows[0].count, 10) || 0;

        const jobDistRes = await db.query(
            `SELECT 
                COUNT(CASE WHEN originating_tenant_id = fulfilling_tenant_id THEN 1 END) as in_house,
                COUNT(CASE WHEN originating_tenant_id != fulfilling_tenant_id THEN 1 END) as b2b
             FROM b2b_network_transactions
             WHERE originating_tenant_id = $1 OR fulfilling_tenant_id = $1`,
            [tenantId]
        );
        const inHouse = parseInt(jobDistRes.rows[0].in_house) || 0;
        const b2b = parseInt(jobDistRes.rows[0].b2b) || 0;

        const chartData = {
            revenue: {
                total_gross: totalGross,
                trend_percentage: "+0.0%", 
                chart_series: revenueSeries.length > 0 ? revenueSeries : [{ label: "N/A", value: 0 }]
            },
            job_distribution: {
                chart_series: [
                    { label: "In-House Dispatch", value: inHouse },
                    { label: "B2B Network Fulfillment", value: b2b }
                ]
            },
            chauffeur_utilization: {
                average_efficiency: (activeDrivers + offlineDrivers) > 0 ? `${Math.round((activeDrivers / (activeDrivers + offlineDrivers)) * 100)}%` : "0%",
                active_drivers: activeDrivers,
                offline_drivers: offlineDrivers
            }
        };

        return res.status(200).json({
            success: true,
            tenant_id: tenantId,
            analytics: chartData
        });

    } catch (error) {
        next(error);
    }
};

export const getPlatformAnalytics = async (req: Request, res: Response, next: import('express').NextFunction) => {
    try {
        const adminKey = req.headers['x-admin-key'];

        if (adminKey !== process.env.ADMIN_KEY) {
            console.error(`[SECURITY BREACH ATTEMPT] Invalid or missing admin key on Platform Analytics endpoint.`);
            return res.status(403).json({ error: 'Forbidden: Valid Master Admin Key Required' });
        }

        console.log(`\n[ANALYTICS ENGINE] Executing Master Back-Office Global Aggregations.`);
        
        const platformRevRes = await db.query(
            'SELECT SUM(creator_fee_gross + fulfiller_fee_gross) AS total_revenue FROM network_clearing_ledger'
        );
        const totalPlatformFees = parseFloat(platformRevRes.rows[0].total_revenue) || 0;

        const qtrRevenueRes = await db.query(
            `SELECT TO_CHAR(created_at, '"Q"Q') as quarter, SUM(creator_fee_gross + fulfiller_fee_gross) as total
             FROM network_clearing_ledger
             GROUP BY TO_CHAR(created_at, '"Q"Q')`
        );
        const qtrSeries = qtrRevenueRes.rows.map(r => ({ label: r.quarter, value: parseFloat(r.total) }));

        const platformJobDistRes = await db.query(
            `SELECT 
                COUNT(CASE WHEN originating_tenant_id = fulfilling_tenant_id THEN 1 END) as in_house,
                COUNT(CASE WHEN originating_tenant_id != fulfilling_tenant_id THEN 1 END) as b2b,
                COUNT(*) as total
             FROM b2b_network_transactions`
        );
        const totalJobs = parseInt(platformJobDistRes.rows[0].total) || 0;
        const b2bJobs = parseInt(platformJobDistRes.rows[0].b2b) || 0;
        const inHouseJobs = parseInt(platformJobDistRes.rows[0].in_house) || 0;

        const tenantCountRes = await db.query('SELECT COUNT(*) as count FROM tenants');
        const driverCountRes = await db.query('SELECT COUNT(*) as count FROM drivers');
        const onlineDriverCountRes = await db.query('SELECT COUNT(*) as count FROM driver_locations WHERE is_online = TRUE');

        const globalChartData = {
            clearing_house_revenue: {
                total_platform_fees_extracted: totalPlatformFees,
                chart_series: qtrSeries.length > 0 ? qtrSeries : [{ label: "Q1", value: 0 }]
            },
            global_network_volume: {
                total_jobs_processed: totalJobs,
                b2b_trade_percentage: totalJobs > 0 ? `${Math.round((b2bJobs / totalJobs) * 100)}%` : "0%",
                chart_series: [
                    { label: "Direct In-House", value: inHouseJobs },
                    { label: "B2B Traded", value: b2bJobs }
                ]
            },
            system_wide_roster: {
                total_active_tenants: parseInt(tenantCountRes.rows[0].count, 10),
                total_registered_drivers: parseInt(driverCountRes.rows[0].count, 10),
                currently_online_drivers: parseInt(onlineDriverCountRes.rows[0].count, 10)
            }
        };

        return res.status(200).json({
            success: true,
            status: "MASTER_TOWER_AUTHENTICATED",
            analytics: globalChartData
        });

    } catch (error) {
        next(error);
    }
};

export const getVehicleProductivity = async (req: Request, res: Response, next: import('express').NextFunction) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;
        const vehicleId = req.params.id;

        if (!tenantId) return res.status(401).json({ error: 'Unauthorized' });

        console.log(`\n[FINANCE ENGINE] Executing Net Yield Aggregation for Vehicle: ${vehicleId}`);

        // Fixed Outlays
        const fixedFinancesRes = await db.query(
            'SELECT monthly_finance_cost, monthly_insurance_cost FROM vehicle_fixed_finances WHERE vehicle_id = $1 AND tenant_id = $2',
            [vehicleId, tenantId]
        );
        
        let monthlyFinanceCostPence = 0;
        let monthlyInsuranceCostPence = 0;
        
        if (fixedFinancesRes.rowCount && fixedFinancesRes.rowCount > 0) {
            monthlyFinanceCostPence = fixedFinancesRes.rows[0].monthly_finance_cost;
            monthlyInsuranceCostPence = fixedFinancesRes.rows[0].monthly_insurance_cost;
        }

        // Dynamic Expenses
        const generalExpRes = await db.query(
            'SELECT SUM(amount_pence) as total FROM fleet_general_expenses WHERE vehicle_id = $1 AND tenant_id = $2',
            [vehicleId, tenantId]
        );
        const generalExpensesPence = parseInt(generalExpRes.rows[0].total || '0', 10);

        // Compute gross revenue by aggregating invoices linked to drivers who have driven this vehicle
        const grossRes = await db.query(
            `SELECT SUM(i.customer_retail_fare * 100) as total
             FROM invoices i
             JOIN chauffeur_shifts cs ON i.driver_id = cs.driver_id
             WHERE cs.vehicle_id = $1 AND i.tenant_id = $2`,
             [vehicleId, tenantId]
        );
        const grossRevenuePence = parseInt(grossRes.rows[0].total || '0', 10);

        // Compute booking expenses similarly
        const bookingExpRes = await db.query(
            `SELECT SUM(be.amount_pence) as total
             FROM booking_expenses be
             JOIN chauffeur_shifts cs ON be.driver_id = cs.driver_id
             WHERE cs.vehicle_id = $1 AND be.tenant_id = $2`,
             [vehicleId, tenantId]
        );
        const bookingExpensesPence = parseInt(bookingExpRes.rows[0].total || '0', 10);

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
            trend: "+0.0%"
        };

        return res.status(200).json({
            success: true,
            productivity: productivityData
        });

    } catch (error) {
        next(error);
    }
};
