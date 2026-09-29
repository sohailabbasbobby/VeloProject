import { db, withTransaction } from '../config/db';
import { SettingsService } from '../services/settings.service';
import { NotificationService } from '../utils/notificationService';

/**
 * SUBSCRIPTION WORKER (§1.1.4) — runs weekly: for every driver with
 * payment_model = 'SUBSCRIPTION' and subscription_status = 'ACTIVE', writes a
 * £50.00 debit to driver_ledgers + driver_subscriptions. Failed/lapsed
 * subscriptions auto-downgrade the driver and notify both driver and tenant admin.
 *
 * Billing model: the £50/week fee is debited against the driver's ledger balance
 * and netted out of payouts — no separate card charge is simulated.
 */

const WEEK_MS = 7 * 24 * 3600 * 1000;

export const runSubscriptionCycle = async (): Promise<{ billed: number; lapsed: number }> => {
    const cfg = await SettingsService.getSubscriptionSettings();
    const weeklyFee = Number(cfg.weeklyFee || 50);

    // 1. Bill active subscribers whose current period has ended
    const due = await db.query(
        `SELECT d.id, d.tenant_id, d.first_name, d.last_name, d.subscription_renews_at
         FROM drivers d
         WHERE d.payment_model = 'SUBSCRIPTION' AND d.subscription_status = 'ACTIVE' AND d.is_active
           AND (d.subscription_renews_at IS NULL OR d.subscription_renews_at <= CURRENT_TIMESTAMP)`
    );

    let billed = 0;
    for (const driver of due.rows) {
        try {
            await withTransaction(driver.tenant_id, async (client) => {
                await client.query(
                    `INSERT INTO driver_ledgers (driver_id, tenant_id, entry_type, direction, amount, description)
                     VALUES ($1,$2,'SUBSCRIPTION_FEE','DEBIT',$3,$4)`,
                    [driver.id, driver.tenant_id, weeklyFee,
                     `Weekly Velo subscription ${new Date().toISOString().slice(0, 10)}`]
                );
                await client.query(
                    `INSERT INTO driver_subscriptions (driver_id, tenant_id, period_start, period_end, amount, status, paid_at)
                     VALUES ($1,$2, CURRENT_DATE, CURRENT_DATE + 7, $3, 'PAID', CURRENT_TIMESTAMP)`,
                    [driver.id, driver.tenant_id, weeklyFee]
                );
                await client.query(
                    `UPDATE drivers SET subscription_renews_at = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
                    [driver.id, new Date(Date.now() + WEEK_MS)]
                );
            });
            billed++;
        } catch (err) {
            console.error(`[SUBSCRIPTION] Billing failed for driver ${driver.id}:`, (err as Error).message);
            // Lapse: auto-downgrade + notify driver and tenant admin
            await db.query(
                `UPDATE drivers SET subscription_status = 'PAST_DUE', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
                [driver.id]
            );
            await db.query(
                `INSERT INTO driver_subscriptions (driver_id, tenant_id, period_start, period_end, amount, status, failure_reason)
                 VALUES ($1,$2, CURRENT_DATE, CURRENT_DATE + 7, $3, 'FAILED', $4)`,
                [driver.id, driver.tenant_id, weeklyFee, (err as Error).message]
            );
            NotificationService.dispatch({
                recipientType: 'DRIVER', recipientId: driver.id, tenantId: driver.tenant_id,
                title: 'Subscription Payment Failed',
                body: `Your £${weeklyFee.toFixed(2)} weekly subscription could not be collected. Commission-free billing is paused until it is settled.`,
                channels: ['PUSH', 'IN_APP'],
            }).catch(() => undefined);
            NotificationService.dispatch({
                recipientType: 'TENANT_ADMIN', recipientId: null, tenantId: driver.tenant_id,
                title: 'Driver Subscription Lapsed',
                body: `${driver.first_name} ${driver.last_name}'s subscription payment failed; the account was auto-downgraded to PAST_DUE.`,
                channels: ['IN_APP'],
            }).catch(() => undefined);
        }
    }

    // 2. Auto-cancel subscriptions overdue by more than 14 days
    const lapsedRes = await db.query(
        `UPDATE drivers SET subscription_status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP
         WHERE payment_model = 'SUBSCRIPTION' AND subscription_status = 'PAST_DUE'
           AND updated_at <= CURRENT_TIMESTAMP - INTERVAL '14 days'
         RETURNING id, tenant_id`
    );
    for (const driver of lapsedRes.rows) {
        NotificationService.dispatch({
            recipientType: 'DRIVER', recipientId: driver.id, tenantId: driver.tenant_id,
            title: 'Subscription Cancelled',
            body: 'Your Velo subscription was cancelled after 14 days of non-payment. Contact your operator to re-subscribe.',
            channels: ['PUSH', 'IN_APP'],
        }).catch(() => undefined);
    }

    return { billed, lapsed: lapsedRes.rows.length };
};

export const startSubscriptionWorker = (): NodeJS.Timeout => {
    // Run at startup, then weekly
    runSubscriptionCycle().then((r) => console.log(`[SUBSCRIPTION] Startup cycle: billed=${r.billed} lapsed=${r.lapsed}`)).catch((e) => console.error('[SUBSCRIPTION] Startup cycle failed:', e.message));
    const timer = setInterval(() => {
        runSubscriptionCycle().then((r) => console.log(`[SUBSCRIPTION] Weekly cycle: billed=${r.billed} lapsed=${r.lapsed}`)).catch((e) => console.error('[SUBSCRIPTION] Weekly cycle failed:', e.message));
    }, WEEK_MS);
    return timer;
};
