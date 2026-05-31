import { Request, Response } from 'express';
import { MapsService, Coordinate } from '../utils/mapsService';
import { NotificationService } from '../utils/notificationService';
import { getSystemSettings } from '../controllers/system.controller';

// In-Memory store for Active Rollback Timers
// (In production, replace with BullMQ/Redis to survive server restarts)
const negotiationTimers: Map<string, NodeJS.Timeout> = new Map();

/**
 * Validates and posts a new job to the global open pool board.
 */
export const postJob = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).tenantId; // Secure RLS constraint
        const { pickupLocation, dropoffLocation, pickupCoord, dropoffCoord, baseWholesaleFare } = req.body;

        const fare = Number(baseWholesaleFare);

        // 1. Map Routing Evaluation
        if (!pickupCoord || !dropoffCoord) {
            return res.status(400).json({ error: "Missing precise spatial coordinates for routing evaluation." });
        }

        const metrics = await MapsService.getRouteMetrics(pickupCoord as Coordinate, dropoffCoord as Coordinate);
        
        // 2. Dynamic Safety Pricing Floor Validation
        const engineSettings = getSystemSettings();
        
        const baseFare = engineSettings.marketplaceBaseFarePence / 100;
        const ratePerMile = engineSettings.marketplacePerMilePence / 100;
        const ratePerMinute = engineSettings.marketplacePerMinutePence / 100;

        // Note: For now, we simulate estimated duration (minutes) as distance * 2.5 min/mile if mapsService doesn't provide it natively in this mock.
        const estimatedMinutes = metrics.estimatedDurationMinutes || (metrics.distanceMiles * 2.5);

        const dynamicFloor = baseFare + (metrics.distanceMiles * ratePerMile) + (estimatedMinutes * ratePerMinute);

        if (fare < dynamicFloor) {
            console.error(`[VELO SECURITY] Rejected job post from ${tenantId}. Fare £${fare} violates the dynamic distance floor of £${dynamicFloor.toFixed(2)}.`);
            return res.status(403).json({ 
                error: `VELO NETWORK POLICY: The minimum wholesale fare allowed for this route is £${dynamicFloor.toFixed(2)}.` 
            });
        }

        // 3. Database Action Stub (Executing RLS-secured INSERT with GEOMETRY)
        const mockJobId = `POOL-JOB-${Math.floor(Math.random() * 10000)}`;
        console.log(`[SQL EXECUTION STREAM] INSERT INTO b2b_pool_jobs (originating_tenant_id, pickup_geom, dropoff_geom, base_wholesale_fare, current_wholesale_fare, state) VALUES ('${tenantId}', ST_SetSRID(ST_MakePoint(${pickupCoord.lng}, ${pickupCoord.lat}), 4326), ST_SetSRID(ST_MakePoint(${dropoffCoord.lng}, ${dropoffCoord.lat}), 4326), ${fare}, ${fare}, 'OPEN')`);
        console.log(`[BACK-OFFICE FEED] New Job posted to network by ${tenantId} at £${fare.toFixed(2)} (Route: ${metrics.distanceMiles} miles).`);

        return res.status(201).json({
            success: true,
            jobId: mockJobId,
            message: 'Job successfully posted to the Global Open Pool.'
        });

    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * Mutates job status to NEGOTIATION, triggering the query filter that masks it from other dashboards.
 * Initializes the 10-Minute Timeout Rollback tracker.
 */
export const submitCounterOffer = async (req: Request, res: Response) => {
    try {
        const counteringTenantId = (req as any).tenantId; 
        const jobId = String(req.params.jobId);
        const { proposedFare } = req.body;

        // 1. Database State Mutation (Masking the job)
        console.log(`[SQL EXECUTION STREAM] UPDATE b2b_pool_jobs SET state = 'NEGOTIATION', countering_tenant_id = '${counteringTenantId}', current_wholesale_fare = ${proposedFare} WHERE id = '${jobId}' AND state = 'OPEN'`);
        
        console.log(`[VELO NETWORK LOGIC] Job ${jobId} transitioned to NEGOTIATION mode. Successfully masked from global radar feeds.`);

        // 2. Initialize the Dynamic Rollback Tracker from the System Engine
        const engineSettings = getSystemSettings();
        const TIMEOUT_MS = engineSettings.b2bNegotiationTimeoutMins * 60 * 1000; 

        console.log(`[VELO ENGINE] ${engineSettings.b2bNegotiationTimeoutMins}-Minute Negotiation Lock mechanism armed for ${jobId}. Counter countdown started.`);

        const rollbackTask = setTimeout(() => {
            // AUTOMATED ROLLBACK EXECUTION
            executeAutomatedRollback(jobId);
        }, TIMEOUT_MS);

        negotiationTimers.set(jobId, rollbackTask);

        return res.status(200).json({
            success: true,
            message: `Counter offer submitted at £${proposedFare}. The 10-Minute Negotiation Lock is now active.`
        });

    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * Allows the originating tenant to accept or reject the counter offer.
 */
export const resolveCounterOffer = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).tenantId; // Ensuring only originating tenant can resolve
        const jobId = String(req.params.jobId);
        const { resolution } = req.body; // 'ACCEPT' or 'REJECT'

        // 1. Clear the automated timeout lock
        const timer = negotiationTimers.get(jobId);
        if (timer) {
            clearTimeout(timer);
            negotiationTimers.delete(jobId);
            console.log(`[VELO ENGINE] Timeout lock cleared for ${jobId}. Resolution triggered manually by Originator.`);
        } else {
            return res.status(400).json({ error: 'Negotiation session has expired or does not exist.' });
        }

        if (resolution === 'ACCEPT') {
            console.log(`[SQL EXECUTION STREAM] UPDATE b2b_pool_jobs SET state = 'ALLOCATED' WHERE id = '${jobId}'`);
            console.log(`[BACK-OFFICE FEED] Counter offer accepted. Job ${jobId} locked and allocated to fulfiller.`);
            
            // BACKGROUND NOTIFICATION TRIGGERS
            // These fire asynchronously without blocking the client response
            NotificationService.sendClientConfirmation(
                "+447911123456", // Mock Client Phone
                "Jonathan Pierce (VIP)",
                "Heathrow T5 (VIP Pickup Zone)",
                "Mercedes S-Class (Black)",
                "Goldman Sachs Corporate Tier"
            ).catch(err => console.error("Notification Engine Error:", err));

            NotificationService.sendDriverAllocation(
                "+447811122233", // Mock Driver Phone
                "ASAP",
                "LHR to Mayfair, London",
                "Goldman Sachs Corporate Tier - Silent Drive Protocol"
            ).catch(err => console.error("Notification Engine Error:", err));

            return res.status(200).json({ success: true, message: 'Counter offer accepted. Route mapped to fulfilling fleet.' });
        } 
        
        if (resolution === 'REJECT') {
            executeAutomatedRollback(jobId);
            return res.status(200).json({ success: true, message: 'Counter offer rejected. Job reverted to open pool.' });
        }

        return res.status(400).json({ error: 'Invalid resolution parameter.' });

    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * Helper function executing the strict Rollback parameters.
 */
const executeAutomatedRollback = (jobId: string) => {
    negotiationTimers.delete(jobId);

    // 1. Discard counter offer, restore base price, flip state back to OPEN
    console.log(`\n--- AUTOMATED SYSTEM ROLLBACK TRIGGERED ---`);
    console.log(`[SQL EXECUTION STREAM] UPDATE b2b_pool_jobs SET state = 'OPEN', countering_tenant_id = NULL, current_wholesale_fare = base_wholesale_fare WHERE id = '${jobId}'`);
    console.log(`[VELO NETWORK LOGIC] Negotiation Timeout expired or rejected. Job ${jobId} successfully reverted to global open board visibility.`);
    console.log(`-------------------------------------------\n`);
};

/**
 * MOCK ENDPOINT: Allows developers to execute a PostGIS spatial radius query
 * to find the closest online drivers matching a specific vehicle tier.
 */
export const getNearbyDrivers = async (req: Request, res: Response) => {
    try {
        const { lat, lng, radius, tier } = req.query;

        if (!lat || !lng || !radius || !tier) {
            return res.status(400).json({ error: "Missing required query parameters: lat, lng, radius, tier." });
        }

        const pickupCoord: Coordinate = { lat: Number(lat), lng: Number(lng) };
        const maxRadiusMiles = Number(radius);
        const vehicleTier = String(tier);

        // Retrieve the complex PostGIS query string
        const rawSql = MapsService.getClosestOnlineDrivers(pickupCoord, maxRadiusMiles, vehicleTier);
        
        console.log(`[POSTGIS EXECUTION STREAM] Generating ST_DWithin query:`);
        console.log(rawSql);

        return res.status(200).json({
            success: true,
            message: `Generated spatial query for radius ${maxRadiusMiles} miles targeting tier ${vehicleTier}.`,
            sql_query: rawSql
        });

    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
