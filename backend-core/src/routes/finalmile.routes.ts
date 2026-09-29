import { Router } from 'express';
import * as finalmile from '../controllers/finalmile.controller';

/**
 * FINAL-MILE ROUTES — audit logs, live command metrics, vehicle defects,
 * driver trip queues, push registration, Stripe Connect onboarding and the
 * AI Operator command endpoint.
 */
const router = Router();

// Audit ledger (tenant-scoped)
router.get('/audit-logs', finalmile.listAuditLogs);

// Live operational metrics (MainHub / AI Operator panel)
router.get('/command-metrics', finalmile.commandMetrics);

// Vehicle defects (vehicle_issues)
router.get('/issues', finalmile.listVehicleIssues);
router.post('/vehicles/:id/defects', finalmile.reportVehicleDefect);
router.post('/issues/:issueId/resolve', finalmile.resolveVehicleIssue);

// Driver app trip queues (sidebar UPCOMING / HISTORY)
router.get('/driver/queues', finalmile.driverTripQueues);

// Push token registration + honest delivery test
router.post('/push/register', finalmile.registerPushToken);
router.post('/push/test', finalmile.testPushDelivery);

// Stripe Connect tenant onboarding (fail-open when unconfigured)
router.get('/stripe/connect/status', finalmile.getStripeConnectStatus);
router.post('/stripe/connect/onboard', finalmile.startStripeConnectOnboarding);
router.post('/stripe/connect/refresh', finalmile.refreshStripeConnectStatus);
// Backoffice admin variant: onboard a specific tenant by id
router.post('/stripe/connect/onboard/:tenantId', finalmile.startStripeConnectOnboardingAdmin);

// AI Operator command endpoint (live context; fail-open without provider key)
router.post('/ai/command', finalmile.aiOperatorCommand);

// Corporate CRM: fleet-wide authorized users
router.get('/corporate-users', finalmile.listAllAuthorizedUsers);

// Reporting & Taxation CSV export
router.get('/exports/vat.csv', finalmile.exportVatCsv);

export default router;
