import { Request, Response, NextFunction } from 'express';

/**
 * Tenant Isolation Middleware
 * Extracts the tenant ID from headers or auth token and attaches it to the request context.
 * In production, this would set the `app.current_tenant_id` session variable in PostgreSQL 
 * right before executing queries to enforce Row-Level Security (RLS).
 */
export const tenantMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.headers['x-tenant-id'];

    if (!tenantId) {
        return res.status(401).json({ error: 'Unauthorized: Missing Tenant Context' });
    }

    // Attach to request for downstream controllers
    (req as any).tenantId = tenantId;
    
    // NOTE: DB connection pooling middleware would inject `SET LOCAL app.current_tenant_id = '${tenantId}'` here
    
    next();
};
