import { Request, Response } from 'express';
import { asyncHandler } from '../utils/httpError';
import { HealthService } from '../services/health.service';

export const getHealth = asyncHandler(async (req: Request, res: Response) => {
    const data = await HealthService.getFullHealth();
    res.json({ success: true, data });
});

export const ping = (req: Request, res: Response) => {
    res.json({ status: 'HEALTHY', engine: 'Velo Backend Core', at: new Date().toISOString() });
};
