import { processDispatchTimeouts } from '../controllers/trips.controller';
import { expireDueNegotiations } from '../controllers/pool.controller';

/**
 * DISPATCH WORKER (§1.3) — periodic sweep that:
 *  1. expires own-fleet-first acceptance windows and escalates opted-in jobs to the pool
 *  2. rolls back negotiations whose deadline passed (10-minute lock, DB-authoritative)
 */
export const startDispatchWorker = (): NodeJS.Timeout => {
    const sweep = async () => {
        try {
            await processDispatchTimeouts();
        } catch (err) {
            console.error('[DISPATCH] Own-fleet timeout sweep failed:', (err as Error).message);
        }
        try {
            await expireDueNegotiations();
        } catch (err) {
            console.error('[DISPATCH] Negotiation expiry sweep failed:', (err as Error).message);
        }
    };
    sweep();
    const timer = setInterval(sweep, 15_000); // 15-second granularity
    return timer;
};
