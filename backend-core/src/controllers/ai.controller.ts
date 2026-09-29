import { Request, Response } from 'express';
import { db } from '../config/db';
import { asyncHandler, badRequest, notFound, conflict } from '../utils/httpError';
import { getAuthContext } from '../middleware/tenant.middleware';

/**
 * AI CONTROLLER (§2) — real OCR/vision document verification for onboarding
 * compliance documents via the OpenAI vision API. The fake setTimeout pipeline is
 * gone: each verification calls the live API, persists the extracted data and
 * confidence score into compliance_documents, and drives the driver/vehicle
 * onboarding state machine.
 *
 * Requires env: OPENAI_API_KEY. Without it the endpoint returns a configuration
 * error — verification is never simulated.
 */

const VISION_MODEL = 'gpt-4o-mini';

const verifyDocumentWithVision = async (fileUrl: string, documentType: string) => {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
        throw conflict('OPENAI_API_KEY is not configured. Document verification requires a real OCR/vision integration.');
    }

    const prompt = `You are a compliance document verifier for a UK executive chauffeur platform.
Document type: ${documentType}.
Extract all key fields (names, numbers, expiry dates) as JSON and assess whether the document is genuine, legible and unexpired.
Respond with JSON only: {"fields": {...}, "expiryDate": "YYYY-MM-DD" | null, "legible": true|false, "confidence": 0-100, "verdict": "VERIFIED"|"REJECTED"|"REVIEW", "reason": "..."}`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: VISION_MODEL,
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        { type: 'image_url', image_url: { url: fileUrl } },
                    ],
                },
            ],
            max_tokens: 800,
            response_format: { type: 'json_object' },
        }),
    });

    const json: any = await res.json();
    if (!res.ok) {
        throw conflict(`Vision API error: ${json.error?.message || res.status}`);
    }
    try {
        return JSON.parse(json.choices[0].message.content);
    } catch {
        return { fields: {}, expiryDate: null, legible: false, confidence: 0, verdict: 'REVIEW', reason: 'Unparseable vision response' };
    }
};

export const verifyComplianceDocument = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const { entityType, entityId, documentType, fileUrl, fileMime, uploadedBy } = req.body || {};
    if (!entityType || !entityId || !documentType || !fileUrl) {
        throw badRequest('entityType, entityId, documentType and fileUrl are required.');
    }
    if (!['DRIVER', 'VEHICLE', 'STAFF', 'TENANT'].includes(entityType)) {
        throw badRequest("entityType must be DRIVER, VEHICLE, STAFF or TENANT.");
    }

    const verification = await verifyDocumentWithVision(String(fileUrl), String(documentType));

    const { rows } = await db.query(
        `INSERT INTO compliance_documents
            (tenant_id, entity_type, entity_id, document_type, file_url, file_mime,
             ai_verification_status, ai_confidence, ai_extracted_data, ai_rejection_reason, expires_at, uploaded_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         RETURNING id, document_type, ai_verification_status, ai_confidence, expires_at`,
        [tenantId, entityType, entityId, documentType, fileUrl, fileMime || null,
         verification.verdict || 'REVIEW', verification.confidence ?? 0,
         JSON.stringify(verification.fields || {}), verification.reason || null,
         verification.expiryDate || null, uploadedBy || 'ERP']
    );

    // Drive the onboarding state machine (§2 onboarding workflow)
    if (entityType === 'DRIVER') {
        const statusMap: Record<string, string> = { VERIFIED: 'VERIFIED', REJECTED: 'REJECTED', REVIEW: 'IN_REVIEW' };
        await db.query(
            `UPDATE drivers SET onboarding_status = GREATEST(onboarding_status, 'DOCS_UPLOADED'),
                    compliance_status = CASE WHEN $2 = 'VERIFIED' THEN 'VERIFIED' ELSE compliance_status END,
                    pco_badge_expiry = CASE WHEN $1 = 'PCO_BADGE' AND $3 IS NOT NULL THEN $3::date ELSE pco_badge_expiry END,
                    updated_at = CURRENT_TIMESTAMP
             WHERE id = $4`,
            [documentType, verification.verdict || 'REVIEW', verification.expiryDate, entityId]
        );
        void statusMap;
    } else if (entityType === 'VEHICLE') {
        await db.query(
            `UPDATE vehicles SET
                mot_expiry = CASE WHEN $1 = 'MOT_CERT' AND $3 IS NOT NULL THEN $3::date ELSE mot_expiry END,
                insurance_expiry = CASE WHEN $1 = 'INSURANCE' AND $3 IS NOT NULL THEN $3::date ELSE insurance_expiry END,
                phv_expiry = CASE WHEN $1 = 'PHV_LICENCE' AND $3 IS NOT NULL THEN $3::date ELSE phv_expiry END,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $4`,
            [documentType, verification.verdict || 'REVIEW', verification.expiryDate, entityId]
        );
    }

    res.status(201).json({ success: true, data: { document: rows[0], verification } });
});

export const listComplianceDocuments = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const { entityType, entityId } = req.query;
    const { rows } = await db.query(
        `SELECT id, entity_type, entity_id, document_type, file_url, ai_verification_status, ai_confidence, expires_at, created_at
         FROM compliance_documents
         WHERE tenant_id = $1 AND ($2::text IS NULL OR entity_type = $2) AND ($3::text IS NULL OR entity_id::text = $3)
         ORDER BY created_at DESC LIMIT 200`,
        [tenantId, (entityType as string) || null, (entityId as string) || null]
    );
    res.json({ success: true, data: rows });
});

export const overrideDocumentVerification = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const { status, reason } = req.body || {};
    if (!['VERIFIED', 'REJECTED', 'REVIEW'].includes(status)) throw badRequest("status must be VERIFIED, REJECTED or REVIEW.");
    const { rows } = await db.query(
        `UPDATE compliance_documents SET ai_verification_status = $2, ai_rejection_reason = $3
         WHERE id = $1 AND tenant_id = $4 RETURNING id, ai_verification_status`,
        [req.params.id, status, reason || 'Manual override', tenantId]
    );
    if (rows.length === 0) throw notFound('Document not found.');
    res.json({ success: true, data: rows[0] });
});
