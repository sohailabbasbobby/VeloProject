/**
 * VELO PLATFORM - NOTIFICATION GATEWAY
 * Formats and dispatches high-priority communication payloads to Twilio and WhatsApp APIs.
 */

export class NotificationService {
    
    /**
     * Crafts a premium WhatsApp/SMS notification for the corporate passenger.
     */
    public static async sendClientConfirmation(
        phoneNumber: string, 
        clientName: string, 
        pickupLocation: string, 
        vehicleDetails: string,
        tierName: string = "Goldman Sachs Corporate Tier"
    ): Promise<void> {
        
        const messageBody = `VELO EXECUTIVE TRANSFER\n\nDear ${clientName},\nYour vehicle has been successfully allocated under the ${tierName} account.\n\nPickup: ${pickupLocation}\nVehicle: ${vehicleDetails}\n\nTrack your chauffeur live: https://velo.app/track/TRX-${Math.floor(Math.random() * 9999)}`;

        const twilioPayload = {
            provider: "WHATSAPP_BUSINESS_API",
            to: phoneNumber,
            from: "VELO_DISPATCH",
            priority: "HIGH",
            message_body: messageBody
        };

        // Simulate Network Delay & API Transmission
        console.log(`\n[WHATSAPP DISPATCH] Sending Client Confirmation to ${phoneNumber}...`);
        setTimeout(() => {
            console.log(JSON.stringify(twilioPayload, null, 2));
            console.log(`[WHATSAPP DISPATCH] Message Delivered successfully.\n`);
        }, 500);
    }

    /**
     * Crafts a critical routing SMS to the dispatched chauffeur.
     */
    public static async sendDriverAllocation(
        phoneNumber: string, 
        pickupTime: string, 
        routingDetails: string, 
        corporateNotes: string
    ): Promise<void> {
        
        const messageBody = `VELO DISPATCH: NEW ALLOCATION\n\nTime: ${pickupTime}\nRoute: ${routingDetails}\n\nStrict Account Notes: ${corporateNotes}\n\nPlease ensure vehicle is strictly prepared to Velo standards.`;

        const twilioPayload = {
            provider: "TWILIO_SMS",
            to: phoneNumber,
            from: "+447000000000",
            priority: "URGENT",
            message_body: messageBody
        };

        // Simulate Network Delay & API Transmission
        console.log(`\n[TWILIO SMS DISPATCH] Sending Driver Allocation to ${phoneNumber}...`);
        setTimeout(() => {
            console.log(JSON.stringify(twilioPayload, null, 2));
            console.log(`[TWILIO SMS DISPATCH] SMS Delivered successfully.\n`);
        }, 800);
    }
}
