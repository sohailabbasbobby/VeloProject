import { Router } from 'express';
import * as payroll from '../controllers/payroll.controller';

const router = Router();
router.post('/preview', payroll.runPayrollPreview);
router.get('/runs', payroll.listPayrollRuns);
router.post('/runs', payroll.createPayrollRun);
router.get('/runs/:id', payroll.getPayrollRun);
router.post('/payouts', payroll.executePayout);
router.post('/payouts/generate-pending', payroll.createPendingPayoutsFromLedgers);
router.post('/payouts/mass-execute', payroll.massExecutePayouts);
router.get('/payouts', payroll.listPayouts);
router.get('/my/ledger', payroll.getMyLedger);
export default router;
