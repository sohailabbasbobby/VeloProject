import { Request, Response } from 'express';
import { db, withTransaction } from '../config/db';
import { asyncHandler, badRequest, notFound } from '../utils/httpError';
import { getAuthContext } from '../middleware/tenant.middleware';

/**
 * CORPORATE ACCOUNTS & BILLING + PRIVATE CLIENT REGISTRY (§2, §3.1)
 * Strict entity separation: corporate accounts track invoicing/authorized users;
 * private clients track VIP preferences. Never merged.
 */

const nextReferenceCode = async (client: any, prefix: string, table: string): Promise<string> => {
    const res = await client.query(
        `SELECT COALESCE(MAX(NULLIF(regexp_replace(reference_code, '\\D', 'g'), '')::int), 0) + 1 AS next
         FROM ${table} WHERE reference_code LIKE $1`,
        [`${prefix}-%`]
    );
    let n = res.rows[0]?.next || 1;
    for (let i = 0; i < 100; i++) {
        const code = `${prefix}-${String(n).padStart(4, '0')}`;
        const dup = await client.query(`SELECT 1 FROM ${table} WHERE reference_code = $1`, [code]);
        if (dup.rows.length === 0) return code;
        n++;
    }
    throw new Error('Unable to allocate a unique reference code.');
};

// ------------------------------------------------------------------------------------
// CORPORATE ACCOUNTS & BILLING
// ------------------------------------------------------------------------------------
export const listCorporateAccounts = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const { rows } = await db.query(
        `SELECT c.*,
                (SELECT COUNT(*) FROM corporate_authorized_users u WHERE u.corporate_account_id = c.id) AS authorized_user_count,
                (SELECT COUNT(*) FROM invoices i WHERE i.corporate_account_id = c.id AND i.status IN ('ISSUED','OVERDUE')) AS open_invoice_count,
                (SELECT COALESCE(SUM(i.customer_retail_fare), 0) FROM invoices i WHERE i.corporate_account_id = c.id AND i.status IN ('ISSUED','OVERDUE')) AS outstanding_total
         FROM corporate_accounts c WHERE c.tenant_id = $1
         ORDER BY c.created_at DESC`,
        [tenantId]
    );
    res.json({ success: true, data: rows });
});

export const getCorporateAccount = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const acc = await db.query(`SELECT * FROM corporate_accounts WHERE id = $1 AND tenant_id = $2`, [req.params.id, tenantId]);
    if (acc.rows.length === 0) throw notFound('Corporate account not found.');

    const [users, invoices, trips] = await Promise.all([
        db.query(`SELECT * FROM corporate_authorized_users WHERE corporate_account_id = $1 ORDER BY is_primary_contact DESC, full_name`, [req.params.id]),
        db.query(`SELECT * FROM invoices WHERE corporate_account_id = $1 ORDER BY created_at DESC LIMIT 100`, [req.params.id]),
        db.query(
            `SELECT id, task_id, state, custom_price, pickup_address, dropoff_address, scheduled_at, passenger_name
             FROM trips WHERE corporate_account_id = $1 ORDER BY created_at DESC LIMIT 100`,
            [req.params.id]
        ),
    ]);
    res.json({ success: true, data: { ...acc.rows[0], authorizedUsers: users.rows, invoices: invoices.rows, trips: trips.rows } });
});

export const createCorporateAccount = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const {
        companyName, industry, billingEmail, billingAddress, vatNumber,
        purchaseOrderRequired = false, lineOfCreditLimit, paymentTermsDays = 30,
        preferredVehicleTier, notes, authorizedUsers = [],
    } = req.body || {};
    if (!companyName) throw badRequest('companyName is required.');

    const account = await withTransaction(tenantId, async (client) => {
        const referenceCode = await nextReferenceCode(client, 'CORP', 'corporate_accounts');
        const accRes = await client.query(
            `INSERT INTO corporate_accounts
                (tenant_id, reference_code, company_name, industry, billing_email, billing_address, vat_number,
                 purchase_order_required, line_of_credit_limit, payment_terms_days, preferred_vehicle_tier, notes)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
            [tenantId, referenceCode, companyName, industry || null, billingEmail || null, billingAddress || null,
             vatNumber || null, purchaseOrderRequired, lineOfCreditLimit ? Number(lineOfCreditLimit) : null,
             paymentTermsDays, preferredVehicleTier || null, notes || null]
        );
        const accountRow = accRes.rows[0];
        for (const u of authorizedUsers) {
            await client.query(
                `INSERT INTO corporate_authorized_users (corporate_account_id, full_name, email, phone, booking_permission, cost_center, is_primary_contact)
                 VALUES ($1,$2,$3,$4,$5,$6,$7)`,
                [accountRow.id, u.fullName || u.full_name, u.email, u.phone || null,
                 u.bookingPermission || 'FULL', u.costCenter || null, Boolean(u.isPrimaryContact)]
            );
        }
        return accountRow;
    });
    res.status(201).json({ success: true, data: account });
});

export const updateCorporateAccount = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const allowed = ['company_name','industry','status','billing_email','billing_address','vat_number',
        'purchase_order_required','line_of_credit_limit','payment_terms_days','preferred_vehicle_tier','notes'];
    const updates: string[] = [];
    const params: unknown[] = [req.params.id, tenantId];
    let p = 3;
    for (const key of allowed) {
        if (req.body && (req.body as any)[key] !== undefined) {
            updates.push(`${key} = $${p++}`);
            params.push((req.body as any)[key]);
        }
    }
    const alias: Record<string, string> = { companyName: 'company_name', billingEmail: 'billing_email', billingAddress: 'billing_address', vatNumber: 'vat_number', purchaseOrderRequired: 'purchase_order_required', lineOfCreditLimit: 'line_of_credit_limit', paymentTermsDays: 'payment_terms_days', preferredVehicleTier: 'preferred_vehicle_tier' };
    for (const [camel, snake] of Object.entries(alias)) {
        if (req.body && (req.body as any)[camel] !== undefined) {
            updates.push(`${snake} = $${p++}`);
            params.push((req.body as any)[camel]);
        }
    }
    if (updates.length === 0) throw badRequest('No updatable fields supplied.');
    const { rows } = await db.query(
        `UPDATE corporate_accounts SET ${updates.join(', ')} WHERE id = $1 AND tenant_id = $2 RETURNING *`,
        params
    );
    if (rows.length === 0) throw notFound('Corporate account not found.');
    res.json({ success: true, data: rows[0] });
});

export const addAuthorizedUser = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const { fullName, email, phone, bookingPermission = 'FULL', costCenter, isPrimaryContact = false } = req.body || {};
    if (!fullName || !email) throw badRequest('fullName and email are required.');

    const acc = await db.query(`SELECT 1 FROM corporate_accounts WHERE id = $1 AND tenant_id = $2`, [req.params.id, tenantId]);
    if (acc.rows.length === 0) throw notFound('Corporate account not found.');

    const { rows } = await db.query(
        `INSERT INTO corporate_authorized_users (corporate_account_id, full_name, email, phone, booking_permission, cost_center, is_primary_contact)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [req.params.id, fullName, email, phone || null, bookingPermission, costCenter || null, isPrimaryContact]
    );
    res.status(201).json({ success: true, data: rows[0] });
});

export const removeAuthorizedUser = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const { rows } = await db.query(
        `DELETE FROM corporate_authorized_users u USING corporate_accounts c
         WHERE u.corporate_account_id = c.id AND c.tenant_id = $2 AND u.id = $1 RETURNING u.id`,
        [req.params.userId, tenantId]
    );
    if (rows.length === 0) throw notFound('Authorized user not found.');
    res.json({ success: true, data: { removed: rows[0].id } });
});

// ------------------------------------------------------------------------------------
// PRIVATE CLIENT REGISTRY
// ------------------------------------------------------------------------------------
export const listPrivateClients = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const { rows } = await db.query(
        `SELECT p.*,
                (SELECT COUNT(*) FROM trips t WHERE t.private_client_id = p.id) AS total_trips
         FROM private_clients p WHERE p.tenant_id = $1
         ORDER BY p.created_at DESC`,
        [tenantId]
    );
    res.json({ success: true, data: rows });
});

export const getPrivateClient = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const cli = await db.query(`SELECT * FROM private_clients WHERE id = $1 AND tenant_id = $2`, [req.params.id, tenantId]);
    if (cli.rows.length === 0) throw notFound('Private client not found.');

    const [trips, addresses, threads] = await Promise.all([
        db.query(
            `SELECT id, task_id, state, custom_price, pickup_address, dropoff_address, scheduled_at
             FROM trips WHERE private_client_id = $1 ORDER BY created_at DESC LIMIT 100`,
            [req.params.id]
        ),
        db.query(`SELECT * FROM saved_addresses WHERE owner_type = 'PRIVATE_CLIENT' AND owner_id = $1 ORDER BY is_default DESC, created_at DESC`, [req.params.id]),
        db.query(
            `SELECT id, body, sender_type, created_at FROM messages
             WHERE tenant_id = $2 AND thread_type = 'CLIENT_ENGAGEMENT' AND thread_key = $1
             ORDER BY created_at DESC LIMIT 100`,
            [req.params.id, tenantId]
        ),
    ]);
    res.json({ success: true, data: { ...cli.rows[0], trips: trips.rows, savedAddresses: addresses.rows, engagement: threads.rows } });
});

export const createPrivateClient = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const {
        fullName, email, phone, tier = 'BLACK', homeAddress,
        preferredVehicleTier, dietaryConstraints, cabinConstraints,
        temperaturePreference, musicPreference, privacyLevel = 'STANDARD', vipNotes, savedAddresses = [],
    } = req.body || {};
    if (!fullName) throw badRequest('fullName is required.');

    const client = await withTransaction(tenantId, async (client2) => {
        const referenceCode = await nextReferenceCode(client2, 'PVT', 'private_clients');
        const cliRes = await client2.query(
            `INSERT INTO private_clients
                (tenant_id, reference_code, full_name, email, phone, tier, home_address,
                 preferred_vehicle_tier, dietary_constraints, cabin_constraints,
                 temperature_preference, music_preference, privacy_level, vip_notes)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
            [tenantId, referenceCode, fullName, email || null, phone || null, tier, homeAddress || null,
             preferredVehicleTier || null, dietaryConstraints || null, cabinConstraints || null,
             temperaturePreference || null, musicPreference || null, privacyLevel, vipNotes || null]
        );
        const clientRow = cliRes.rows[0];
        for (const a of savedAddresses) {
            await client2.query(
                `INSERT INTO saved_addresses (owner_type, owner_id, label, address, lat, lng, is_default)
                 VALUES ('PRIVATE_CLIENT',$1,$2,$3,$4,$5,$6)`,
                [clientRow.id, a.label, a.address, a.lat || null, a.lng || null, Boolean(a.isDefault)]
            );
        }
        return clientRow;
    });
    res.status(201).json({ success: true, data: client });
});

export const updatePrivateClient = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const alias: Record<string, string> = {
        fullName: 'full_name', email: 'email', phone: 'phone', tier: 'tier', homeAddress: 'home_address',
        preferredVehicleTier: 'preferred_vehicle_tier', dietaryConstraints: 'dietary_constraints',
        cabinConstraints: 'cabin_constraints', temperaturePreference: 'temperature_preference',
        musicPreference: 'music_preference', privacyLevel: 'privacy_level', vipNotes: 'vip_notes',
        photoUrl: 'photo_url', status: 'status',
    };
    const updates: string[] = [];
    const params: unknown[] = [req.params.id, tenantId];
    let p = 3;
    for (const [camel, snake] of Object.entries(alias)) {
        if (req.body && (req.body as any)[camel] !== undefined) {
            updates.push(`${snake} = $${p++}`);
            params.push((req.body as any)[camel]);
        }
    }
    if (updates.length === 0) throw badRequest('No updatable fields supplied.');
    const { rows } = await db.query(
        `UPDATE private_clients SET ${updates.join(', ')} WHERE id = $1 AND tenant_id = $2 RETURNING *`,
        params
    );
    if (rows.length === 0) throw notFound('Private client not found.');
    res.json({ success: true, data: rows[0] });
});

// ------------------------------------------------------------------------------------
// SAVED ADDRESSES (customer app CRUD — §6, backed by DB, not local state)
// ------------------------------------------------------------------------------------
export const listSavedAddresses = asyncHandler(async (req: Request, res: Response) => {
    const { clientId } = getAuthContext(req);
    if (!clientId) throw badRequest('Client authentication required.');
    const { rows } = await db.query(
        `SELECT * FROM saved_addresses WHERE owner_type = 'PRIVATE_CLIENT' AND owner_id = $1 ORDER BY is_default DESC, created_at DESC`,
        [clientId]
    );
    res.json({ success: true, data: rows });
});

export const createSavedAddress = asyncHandler(async (req: Request, res: Response) => {
    const { clientId } = getAuthContext(req);
    if (!clientId) throw badRequest('Client authentication required.');
    const { label, address, lat, lng, isDefault = false } = req.body || {};
    if (!label || !address) throw badRequest('label and address are required.');
    const { rows } = await db.query(
        `INSERT INTO saved_addresses (owner_type, owner_id, label, address, lat, lng, is_default)
         VALUES ('PRIVATE_CLIENT',$1,$2,$3,$4,$5,$6) RETURNING *`,
        [clientId, label, address, lat || null, lng || null, isDefault]
    );
    res.status(201).json({ success: true, data: rows[0] });
});

export const deleteSavedAddress = asyncHandler(async (req: Request, res: Response) => {
    const { clientId } = getAuthContext(req);
    if (!clientId) throw badRequest('Client authentication required.');
    const { rows } = await db.query(
        `DELETE FROM saved_addresses WHERE id = $1 AND owner_type = 'PRIVATE_CLIENT' AND owner_id = $2 RETURNING id`,
        [req.params.addressId, clientId]
    );
    if (rows.length === 0) throw notFound('Saved address not found.');
    res.json({ success: true, data: { deleted: rows[0].id } });
});
