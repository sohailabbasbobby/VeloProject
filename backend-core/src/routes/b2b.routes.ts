import { Router, Request, Response } from 'express';

const router = Router();

// Route: Settle B2B Network Transaction
router.post('/settle', (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId; // from middleware
    const { bookingId, wholesaleFare, fulfillingTenantId } = req.body;

    // Financial Rule Enforcement:
    // Insert into b2b_network_transactions
    // Origin_fee = 1.00, Fulfiller_fee = 1.00 (Total £2.00 Platform Fee)
    
    res.status(201).json({ 
        success: true, 
        message: 'B2B transaction settled. Network fees extracted.',
        data: {
            originating_tenant: tenantId,
            fulfilling_tenant: fulfillingTenantId,
            platform_fee_total: 2.00
        }
    });
});

router.put('/trips/:id/price', (req: Request, res: Response) => {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(403).json({ error: 'Forbidden: Valid Master Admin Key Required' });
    }
    const { customPlatformFee } = req.body;
    console.log(`Updated trip ${req.params.id} with Custom Platform Fee: £${customPlatformFee}`);
    res.status(200).json({ success: true, message: 'Custom Platform Fee updated.' });
});

export default router;
