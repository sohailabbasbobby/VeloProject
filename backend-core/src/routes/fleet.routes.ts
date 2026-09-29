import { Router } from 'express';
import * as fleet from '../controllers/fleet.controller';

const router = Router();
router.get('/vehicles', fleet.listVehicles);
router.get('/vehicles/:id', fleet.getVehicle);
router.post('/vehicles', fleet.createVehicle);
router.put('/vehicles/:id', fleet.updateVehicle);
router.post('/vehicles/:id/assign', fleet.assignVehicle);
router.post('/vehicles/:id/unassign', fleet.unassignVehicle);
router.post('/vehicles/:id/maintenance', fleet.createMaintenanceLog);
router.put('/vehicles/:id/maintenance/:logId', fleet.updateMaintenanceLog);
router.post('/vehicles/:id/expenses', fleet.addFleetExpense);
router.post('/vehicles/:id/odometer', fleet.logOdometer);
router.get('/compliance', fleet.getFleetCompliance);
export default router;
