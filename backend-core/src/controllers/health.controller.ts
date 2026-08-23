import { Request, Response, NextFunction } from 'express';
import { runDiagnostics } from '../services/health.service';

export const getDetailedHealth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const diagnostics = await runDiagnostics();
        
        if (req.query.simulateFailure === 'true') {
            diagnostics.status = 'degraded';
            diagnostics.summary.healthy -= 1;
            diagnostics.summary.failing += 1;
            
            const targetService = diagnostics.services.find(s => s.name === "Clearing & Settlements Controller");
            if (targetService) {
                targetService.status = "degraded";
                targetService.latencyMs = 120;
                targetService.error = "Query timeout on settlement batch check";
                targetService.affectedFiles = ["src/controllers/clearing.controller.ts"];
                targetService.stackTrace = "Error: Timeout 57014 at Pool.query...";
            }
        }

        return res.status(200).json(diagnostics);
    } catch (error) {
        next(error);
    }
};
