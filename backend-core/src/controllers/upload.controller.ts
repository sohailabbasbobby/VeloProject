import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { asyncHandler, badRequest, forbidden } from '../utils/httpError';
import { getAuthContext } from '../middleware/tenant.middleware';

/**
 * UPLOAD CONTROLLER (§2) — persistent local disk storage (container volume),
 * content-addressed filenames, strict MIME allow-list and size caps.
 * Access control: every file is namespaced by tenant and served back only with a
 * matching tenant context (or admin key). The fake CDN URL generator is gone.
 */

const UPLOAD_ROOT = process.env.UPLOAD_ROOT_DIR || path.resolve(process.cwd(), 'uploads');
const MAX_BYTES = parseInt(process.env.UPLOAD_MAX_BYTES || '10485760', 10); // 10 MB

const ALLOWED_MIME = new Set([
    'image/jpeg', 'image/png', 'image/webp', 'image/heic',
    'application/pdf',
]);

const sanitize = (name: string): string => name.replace(/[^a-zA-Z0-9._-]/g, '_');

export const uploadFile = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    if (!tenantId) throw forbidden('Tenant context required.');
    if (!req.body || !req.body.fileBase64) {
        throw badRequest('fileBase64 (base64-encoded file) and fileMime are required.');
    }
    const { fileBase64, fileMime, category = 'documents' } = req.body as { fileBase64: string; fileMime?: string; category?: string };

    const mime = fileMime || 'image/jpeg';
    if (!ALLOWED_MIME.has(mime)) {
        throw badRequest(`Unsupported file type ${mime}. Allowed: ${[...ALLOWED_MIME].join(', ')}`);
    }

    const buffer = Buffer.from(fileBase64, 'base64');
    if (buffer.length === 0) throw badRequest('Empty file payload.');
    if (buffer.length > MAX_BYTES) throw badRequest(`File exceeds the ${Math.round(MAX_BYTES / 1048576)} MB limit.`);

    // Content-addressed, tenant-namespaced path
    const hash = crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 24);
    const ext = mime.includes('pdf') ? 'pdf' : (mime.split('/')[1] || 'bin').replace('jpeg', 'jpg');
    const safeCategory = sanitize(category);
    const dir = path.join(UPLOAD_ROOT, sanitize(tenantId), safeCategory);
    fs.mkdirSync(dir, { recursive: true });
    const filename = `${Date.now()}-${hash}.${ext}`;
    fs.writeFileSync(path.join(dir, filename), buffer);

    // Serve through the authenticated download route — never a static public URL
    const relativeUrl = `/api/uploads/file/${encodeURIComponent(sanitize(tenantId))}/${encodeURIComponent(safeCategory)}/${filename}`;
    res.status(201).json({ success: true, data: { url: relativeUrl, bytes: buffer.length, mime } });
});

export const downloadFile = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId, isAdmin } = getAuthContext(req);
    const { tenantId: fileTenant, category, filename } = req.params as any;

    if (!isAdmin && fileTenant !== tenantId) {
        throw forbidden('Access denied: files are tenant-scoped.');
    }
    const safeTenant = sanitize(String(fileTenant));
    const safeCategory = sanitize(String(category));
    const safeName = sanitize(String(filename));
    const filePath = path.join(UPLOAD_ROOT, safeTenant, safeCategory, safeName);
    if (!filePath.startsWith(UPLOAD_ROOT) || !fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, error: 'File not found.' });
    }
    res.setHeader('Content-Type', mimeForExt(safeName));
    fs.createReadStream(filePath).pipe(res);
});

const mimeForExt = (name: string): string => {
    if (name.endsWith('.pdf')) return 'application/pdf';
    if (name.endsWith('.png')) return 'image/png';
    if (name.endsWith('.webp')) return 'image/webp';
    return 'image/jpeg';
};
