import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    // Fail fast — a production deployment must never silently fall back to a guessed DSN.
    console.error('[DB] FATAL: DATABASE_URL environment variable is not set.');
    process.exit(1);
}

// Strict production-safe pool guardrails (§2 server hardening)
export const db = new Pool({
    connectionString,
    max: parseInt(process.env.DB_POOL_MAX || '20', 10),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000', 10),
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT_MS || '5000', 10),
    statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT_MS || '15000', 10),
    allowExitOnIdle: false,
});

db.on('error', (err) => {
    console.error('[DB] Unexpected pool client error:', err.message);
});

// Test connection on startup
db.connect()
    .then((client) => {
        console.log('[DB] Successfully connected to PostgreSQL database.');
        client.release();
    })
    .catch((err) => {
        console.error('[DB] Connection error:', err.stack);
    });

/**
 * Sets the tenant RLS context on a checked-out client.
 * Parameterized SET LOCAL avoids SQL injection through tenant ids.
 */
export const setTenantContext = async (client: PoolClient, tenantId: string): Promise<void> => {
    await client.query("SELECT set_config('app.current_tenant_id', $1, true)", [tenantId]);
};

/**
 * Runs `fn` inside BEGIN/COMMIT/ROLLBACK with tenant RLS context applied.
 * Any thrown error bubbles to the global error middleware after rollback.
 */
export const withTransaction = async <T>(
    tenantId: string | null,
    fn: (client: PoolClient) => Promise<T>
): Promise<T> => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        if (tenantId) {
            await setTenantContext(client, tenantId);
        }
        const result = await fn(client);
        await client.query('COMMIT');
        return result;
    } catch (err) {
        try {
            await client.query('ROLLBACK');
        } catch (rollbackErr) {
            console.error('[DB] Rollback failure:', (rollbackErr as Error).message);
        }
        throw err;
    } finally {
        client.release();
    }
};

export const query = async <T extends QueryResultRow = QueryResultRow>(
    text: string,
    params: unknown[] = [],
    tenantId: string | null = null
): Promise<QueryResult<T>> => {
    if (tenantId) {
        return withTransaction(tenantId, (client) => client.query<T>(text, params));
    }
    return db.query<T>(text, params);
};
