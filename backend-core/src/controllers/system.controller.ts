import { Request, Response } from 'express';

export interface SystemSettings {
    b2bNegotiationTimeoutMins: number;
    nearbyDriverRadiusMeters: number;
    marketplaceBaseFarePence: number;
    marketplacePerMilePence: number;
    marketplacePerMinutePence: number;
}

// Simulated DB state representing `global_system_settings` baseline
let activeSystemSettings: SystemSettings = {
    b2bNegotiationTimeoutMins: 10,
    nearbyDriverRadiusMeters: 5000,
    marketplaceBaseFarePence: 500, // £5.00 Base
    marketplacePerMilePence: 250,  // £2.50 / Mile
    marketplacePerMinutePence: 50  // £0.50 / Minute
};

/**
 * EXPORTED HELPER: Allows internal controllers (like the Pool Controller) to
 * read the live physics state dynamically at runtime instead of hardcoding.
 */
export const getSystemSettings = (): SystemSettings => {
    return activeSystemSettings;
};

/**
 * VELO CORE ENDPOINT (BACK-OFFICE MASTER TOWER)
 * Allows administrators to dynamically manipulate operational network physics.
 */
export const updateSystemConfig = async (req: Request, res: Response) => {
    try {
        const adminKey = req.headers['x-admin-key'];
        if (adminKey !== 'super-secret-velo-admin-key-999') {
            return res.status(403).json({ error: 'Forbidden: Valid Master Admin Key Required' });
        }

        const newSettings = req.body as Partial<SystemSettings>;
        
        // Merge updates into the active memory state (Simulating a DB UPDATE)
        activeSystemSettings = { ...activeSystemSettings, ...newSettings };

        console.log(`\n[BACK-OFFICE TOWER] Master Configuration overriding global_system_settings...`);
        console.log(JSON.stringify(activeSystemSettings, null, 2));
        console.log(`-----------------------------------------------------\n`);

        return res.status(200).json({
            success: true,
            message: "System Engine Operational Configuration successfully updated.",
            active_settings: activeSystemSettings
        });

    } catch (error) {
        console.error('CRITICAL [VELO SYSTEM CONFIG FAILURE]:', error);
        return res.status(500).json({ error: 'VELO API: Internal Server Error during system config update.' });
    }
};
