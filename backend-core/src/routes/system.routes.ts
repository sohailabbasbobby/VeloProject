import { Router } from 'express';
import * as system from '../controllers/system.controller';
import { requireAdmin } from '../middleware/tenant.middleware';

const router = Router();

// Global settings: readable by tenants, writable by platform admin only (§4)
router.get('/settings', system.getAllSettings);
router.put('/settings/:key', requireAdmin, system.updateSetting);

// Staff directory + workforce roster
router.get('/staff', system.listStaff);
router.get('/staff/:id', system.getStaffMember);
router.post('/staff', system.createStaff);
router.put('/staff/:id', system.updateStaff);
router.get('/roster', system.getRoster);
router.post('/roster', system.createShiftSlot);
router.put('/roster/:slotId', system.updateShiftSlot);
router.delete('/roster/:slotId', system.deleteShiftSlot);

// White-label wizard
router.get('/whitelabel', system.getWhiteLabelConfig);
router.put('/whitelabel', system.updateWhiteLabelConfig);

// Diagnostics
router.get('/diagnostics/export', system.exportDiagnostics);
export default router;
