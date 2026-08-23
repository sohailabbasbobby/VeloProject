import express, { Application, Request, Response } from 'express';
import cors from 'cors';

// Import Routes
import b2bRoutes from './routes/b2b.routes';
import escrowRoutes from './routes/escrow.routes';
import clearingRoutes from './routes/clearing.routes';
import poolRoutes from './routes/pool.routes';
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
import { tenantMiddleware } from './middleware/tenant.middleware';

const app: Application = express();

// Global Middleware
app.use(cors());
app.use(express.json());

// Public Health Check Endpoint
app.use('/api/v1/health', healthRoutes);

// Apply Tenant Isolation Middleware to all protected routes
app.use('/api', tenantMiddleware);

// Mount Routes
app.use('/api/b2b', b2bRoutes);
app.use('/api/escrow', escrowRoutes);
app.use('/api/network-clear', clearingRoutes);
app.use('/api/pool', poolRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/fleet', fleetRoutes);
app.use('/api/fleet', uploadRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/onboarding', onboardingRoutes);

// Health Check
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'HEALTHY', engine: 'Velo Backend Core' });
});

// Global Error-Handling Catch-All Middleware
app.use((err: any, req: Request, res: Response, next: express.NextFunction) => {
    console.error('CRITICAL [UNHANDLED EXCEPTION]:', err.message || err);
    
    // Check for PostgreSQL connection timeout or specific codes
    if (err.code === '57014' || err.message.includes('timeout')) {
        return res.status(503).json({
            success: false,
            error: 'VELO SYSTEM: Database connection timeout. The transaction was aborted.',
            code: err.code
        });
    }

    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'VELO SYSTEM: An unexpected internal server error occurred.',
        code: err.code || 'INTERNAL_ERROR'
    });
});

export default app;
