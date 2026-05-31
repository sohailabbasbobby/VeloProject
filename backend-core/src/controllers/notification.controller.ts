import { Request, Response } from 'express';
import { NotificationService } from '../utils/notificationService';

/**
 * Developer utility to simulate formatting and dispatching Velo notification payloads.
 */
export const testNotificationTrigger = async (req: Request, res: Response) => {
    try {
        const { clientPhone, driverPhone, clientName, corporateTier } = req.body;

        if (!clientPhone || !driverPhone || !clientName) {
            return res.status(400).json({ error: "Missing testing parameters." });
        }

        // Fire both simulations concurrently to test the non-blocking background queue
        NotificationService.sendClientConfirmation(
            clientPhone, 
            clientName, 
            "Heathrow Airport (Terminal 5, VIP Lane)", 
            "Mercedes-Benz S-Class (Black)", 
            corporateTier || "Executive Class"
        );

        NotificationService.sendDriverAllocation(
            driverPhone, 
            "14:30 GMT", 
            "LHR to Mayfair, London", 
            `Passenger: ${clientName} | Tier: ${corporateTier || "Executive Class"} | Protocol: Silent drive requested.`
        );

        return res.status(200).json({
            success: true,
            message: "Mock notifications dispatched to background worker. Check server terminal for JSON payloads."
        });

    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
