import { Router } from 'express';
import { uploadFile, downloadFile } from '../controllers/upload.controller';

const router = Router();
router.post('/files', uploadFile);
router.get('/file/:tenantId/:category/:filename', downloadFile);
export default router;
