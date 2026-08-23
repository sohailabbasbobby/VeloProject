import { db } from '../config/db';

/**
 * VELO PLATFORM - SUBSCRIPTION WORKER
 * Cron-style worker to deduct the £50.00/week subscription fee for enrolled drivers.
 */
export const processWeeklySubscriptions = async () => {
    const client = await db.connect();
    try {
        console.log('[SUBSCRIPTION WORKER] Starting weekly subscription billing cycle...');

        // Begin transaction
        await client.query('BEGIN');

        // Fetch all drivers enrolled in the subscription model
        // Note: Assuming `is_subscribed` is added to the schema
        const result = await client.query(`
            SELECT id, tenant_id, first_name, last_name 
            FROM drivers 
            WHERE is_subscribed = TRUE
        `);

        const subscribedDrivers = result.rows;
        console.log(`[SUBSCRIPTION WORKER] Found ${subscribedDrivers.length} subscribed drivers.`);

        for (const driver of subscribedDrivers) {
            // Deduct £50.00 (5000 pence) from the driver's ledger or record an invoice
            // For the sake of this worker, we log the extraction to a subscription_invoices table or just standard invoices
            console.log(`[SUBSCRIPTION WORKER] Billing £50.00 to driver ${driver.first_name} ${driver.last_name} (${driver.id})`);
            
            // Simulating invoice creation for the £50 flat fee
            await client.query(`
                INSERT INTO invoices (tenant_id, booking_id, customer_retail_fare, driver_net_payout, driver_vat_liability)
                VALUES ($1, $2, 0.00, -50.00, 10.00) -- £10 VAT on £50 fee
            `, [driver.tenant_id, '00000000-0000-0000-0000-000000000000']);
        }

        await client.query('COMMIT');
        console.log('[SUBSCRIPTION WORKER] Weekly subscription billing cycle complete.');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('CRITICAL [SUBSCRIPTION WORKER FAILURE]:', error);
    } finally {
        client.release();
    }
};

// If run directly
if (require.main === module) {
    processWeeklySubscriptions().then(() => process.exit(0));
}
