import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Create a PostgreSQL connection pool
// Defaults to the local environment variables or standard defaults
export const db = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://velo_admin:secure_placeholder_password@localhost:5432/velo_network',
});

// Test connection on startup
db.connect()
    .then(client => {
        console.log('[DB] Successfully connected to PostgreSQL database.');
        client.release();
    })
    .catch(err => {
        console.error('[DB] Connection error:', err.stack);
    });
