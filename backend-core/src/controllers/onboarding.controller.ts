import { Request, Response } from 'express';
import { db } from '../config/db';

/**
 * VELO CORE - ONBOARDING CONTROLLER
 * Simulates advanced Gemini Vision OCR and provisioning, now backed by actual DB records.
 */

export const signupTenant = async (req: Request, res: Response, next: import('express').NextFunction) => {
    try {
        const { companyName, ownerName, email } = req.body;
        
        if (!companyName || !email) return res.status(400).json({ error: 'Company Name and Email required.' });

        console.log(`[ONBOARDING ENGINE] Provisioning white-labeled tenant environment for ${companyName}...`);
        
        const tenantId = `TENANT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        const insertRes = await db.query(`
            INSERT INTO tenants (id, name, activation_status, preferred_language)
            VALUES ($1, $2, 'REGISTRATION', 'en')
            RETURNING *
        `, [tenantId, companyName]);

        return res.status(201).json({ success: true, tenant: insertRes.rows[0] });
    } catch (error) {
        next(error);
    }
};

export const verifyDocuments = async (req: Request, res: Response, next: import('express').NextFunction) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;
        
        if (!tenantId) return res.status(401).json({ error: 'Unauthorized.' });

        console.log(`[GEMINI VISION ENGINE] Scanning uploaded Operator Licensing Documents for ${tenantId}...`);
        
        // Simulating the extraction logic that would come from an AI call
        const extractedData = {
            extracted_license_number: 'PCO-9988776655',
            expiry_date: '2028-11-01',
            status: 'AI_VERIFIED'
        };

        const insertRes = await db.query(`
            INSERT INTO operator_documents (tenant_id, document_type, extracted_data, verification_status, confidence_score)
            VALUES ($1, 'OPERATOR_LICENSE', $2, 'VERIFIED', 0.99)
            RETURNING *
        `, [tenantId, JSON.stringify(extractedData)]);

        return res.status(200).json({ success: true, verification: insertRes.rows[0] });
    } catch (error) {
        next(error);
    }
};
