import * as admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

let cached: admin.app.App | null = null;

/**
 * Lazily initializes Firebase Admin with production service-account credentials.
 * Credentials are provisioned via environment (§7.5); the server refuses to verify
 * tokens without them rather than falling back to an insecure bypass.
 */
export const getFirebaseAdmin = (): admin.app.App => {
    if (cached) return cached;

    const credentialsB64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
    const credentialsJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (!credentialsB64 && !credentialsJson) {
        throw new Error(
            'FIREBASE_SERVICE_ACCOUNT_B64 (or _JSON) is not configured. Real token verification is mandatory — no bypass is permitted.'
        );
    }

    const credentials = credentialsB64
        ? JSON.parse(Buffer.from(credentialsB64, 'base64').toString('utf8'))
        : JSON.parse(credentialsJson as string);

    cached = admin.initializeApp({
        credential: admin.credential.cert(credentials),
        projectId: process.env.FIREBASE_PROJECT_ID || credentials.project_id,
    });
    return cached;
};

export const verifyIdToken = async (idToken: string): Promise<admin.auth.DecodedIdToken> => {
    return getFirebaseAdmin().auth().verifyIdToken(idToken);
};

/**
 * Sends a push notification through Firebase Cloud Messaging.
 * Returns false (rather than throwing) when credentials are absent so that
 * notification dispatch degrades gracefully in environments without FCM.
 */
export const sendPush = async (deviceToken: string, title: string, body: string, data?: Record<string, string>): Promise<boolean> => {
    try {
        await getFirebaseAdmin().messaging().send({
            token: deviceToken,
            notification: { title, body },
            data: data || {},
        });
        return true;
    } catch (err) {
        console.error('[FCM] Push dispatch failed:', (err as Error).message);
        return false;
    }
};
