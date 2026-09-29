import app from './app';
import http from 'http';
import dotenv from 'dotenv';
import { db } from './config/db';
import { startSubscriptionWorker } from './workers/subscription.worker';
import { startDispatchWorker } from './workers/dispatch.worker';
import { attachChatGateway } from './realtime/chatGateway';
import type { WebSocketServer } from 'ws';

dotenv.config();

const PORT = process.env.PORT || 8000;

const startServer = async () => {
    try {
        const server = http.createServer(app);
        const chatWss: WebSocketServer = attachChatGateway(server);

        server.listen(PORT, () => {
            console.log(`🚀 Velo Backend Core Engine running on port ${PORT}`);
        });

        // Background workers
        startSubscriptionWorker();
        startDispatchWorker();

        // Graceful Shutdown Interceptor
        const gracefulShutdown = async (signal: string) => {
            console.log(`\n[SYSTEM] Received ${signal}. Draining DB pool and closing HTTP server gracefully...`);
            chatWss.clients.forEach((c) => c.close(1001, 'server shutting down'));
            chatWss.close();
            server.close(async () => {
                console.log('[SYSTEM] HTTP listener closed.');
                try {
                    await db.end();
                    console.log('[SYSTEM] PostgreSQL connection pool drained.');
                    process.exit(0);
                } catch (dbErr) {
                    console.error('[SYSTEM] Error draining DB pool:', dbErr);
                    process.exit(1);
                }
            });

            // Fallback timeout in case connections hang
            setTimeout(() => {
                console.error('[SYSTEM] Graceful shutdown timeout exceeded. Forcing exit.');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    } catch (error) {
        console.error('CRITICAL: Failed to start server', error);
        process.exit(1);
    }
};

startServer();
