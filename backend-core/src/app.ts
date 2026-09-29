import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

// Import Routes
import b2bRoutes from './routes/b2b.routes';
import escrowRoutes from './routes/escrow.routes';
import poolRoutes from './routes/pool.routes';
import tripsRoutes from './routes/trips.routes';
import telemetryRoutes from './routes/telemetry.routes';
import notificationRoutes from './routes/notification.routes';
import payrollRoutes from './routes/payroll.routes';
import analyticsRoutes from './routes/analytics.routes';
import systemRoutes from './routes/system.routes';
import fleetRoutes from './routes/fleet.routes';
import uploadRoutes from './routes/upload.routes';
import aiRoutes from './routes/ai.routes';
import onboardingRoutes from './routes/onboarding.routes';
import healthRoutes from './routes/health.routes';

// Import Middleware
import { resolveAuth } from './middleware/tenant.middleware';

const app: Application = express();

// Global Security & Request Configuration
app.use(helmet());
app.use(cors({
    origin: (process.env.CORS_ORIGINS || '*').split(','),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id', 'x-admin-key', 'x-driver-id'],
}));
app.use(express.json({ limit: '15mb' })); // large enough for base64 gatekeeper captures

// Correlation ID Tracking
app.use((req: Request, res: Response, next: NextFunction) => {
    const reqId = req.headers['x-request-id'] || uuidv4();
    req.headers['x-request-id'] = reqId;
    res.setHeader('x-request-id', reqId);
    next();
});

// Public Health Check Endpoint
app.use('/api/v1/health', healthRoutes);

// Authentication + tenant isolation for all protected routes
app.use('/api', resolveAuth);

// Mount Routes
app.use('/api/b2b', b2bRoutes);
app.use('/api/escrow', escrowRoutes);
app.use('/api/pool', poolRoutes);
app.use('/api/trips', tripsRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/fleet', fleetRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/onboarding', onboardingRoutes);

// Global Error-Handling Catch-All Middleware (typed, PostgreSQL-code aware)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const requestId = String(req.headers['x-request-id'] || '');
    console.error(`[ERROR ${requestId}]`, err.code || '-', err.message || err);

    // PostgreSQL error interception
    if (err.code === '57014' || /timeout/i.test(String(err.message))) {
        return res.status(503).json({
            success: false,
            error: 'VELO SYSTEM: Database timeout. The transaction was aborted.',
            code: err.code,
            requestId,
        });
    }
    if (err.code === '23505') {
        return res.status(409).json({ success: false, error: 'Conflict with existing data.', code: 'UNIQUE_VIOLATION', requestId });
    }
    if (err.code === '23503') {
        return res.status(409).json({ success: false, error: 'Referenced record does not exist.', code: 'FK_VIOLATION', requestId });
    }
    if (err.code === '23514') {
        return res.status(400).json({ success: false, error: 'Data violates a database constraint.', code: 'CONSTRAINT_VIOLATION', requestId });
    }
    if (err.code === '42501') {
        return res.status(403).json({ success: false, error: 'Tenant isolation policy denied this operation.', code: 'RLS_DENIED', requestId });
    }

    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'VELO SYSTEM: An unexpected internal server error occurred.',
        code: err.code || 'INTERNAL_ERROR',
        requestId,
    });
});

export default app;
