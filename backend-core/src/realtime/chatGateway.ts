import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HttpServer } from 'http';
import { db } from '../config/db';
import { AuthService } from '../services/auth.service';

/**
 * REALTIME MESSAGING GATEWAY — our own WebSocket layer (self-hosted chat swap).
 *
 * No Firestore listeners, no third-party realtime DB: chat messages live in our
 * own PostgreSQL `messages` tables and are fanned out here. Upstream push to a
 * locked phone remains APNs/FCM at the OS level (delivery pipe only); the
 * who/why/content/record of every notification stays ours.
 *
 * Protocol:
 *   → connect:   ws://host/ws/chat?token=<our access token>
 *   → client:    { type: 'JOIN',  threadKey }
 *                { type: 'SEND',  threadKey, threadType?, body, tripId? }
 *                { type: 'LEAVE', threadKey }
 *   → server:    { type: 'JOINED', threadKey }
 *                { type: 'MESSAGE', message }   (broadcast to the thread room)
 *                { type: 'ERROR', error }
 *
 * Threads are tenant-scoped: a JOIN/SEND on a foreign tenant's threadKey is
 * rejected. Senders are recorded as the authenticated actor (DRIVER or
 * CLIENT); dashboard dispatchers authenticate with x-tenant-id + SEND as
 * DISPATCHER via the REST endpoint instead.
 */
interface SocketMeta {
    identityId: string;
    actorType: 'DRIVER' | 'PRIVATE_CLIENT';
    actorId: string;
    tenantId: string;
    displayName: string | null;
    sockets: Set<WebSocket>;
}

export const attachChatGateway = (httpServer: HttpServer): WebSocketServer => {
    const wss = new WebSocketServer({ noServer: true });

    const rooms = new Map<string, Set<WebSocket>>();
    const metaBySocket = new WeakMap<WebSocket, SocketMeta>();

    const joinRoom = (threadKey: string, ws: WebSocket): void => {
        let set = rooms.get(threadKey);
        if (!set) {
            set = new Set();
            rooms.set(threadKey, set);
        }
        set.add(ws);
    };

    const leaveAllRooms = (ws: WebSocket): void => {
        for (const [key, set] of rooms.entries()) {
            if (set.delete(ws) && set.size === 0) rooms.delete(key);
        }
    };

    httpServer.on('upgrade', (request, socket, head) => {
        const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
        if (url.pathname !== '/ws/chat') {
            socket.destroy();
            return;
        }
        const token = url.searchParams.get('token') || '';
        let claims;
        try {
            claims = AuthService.verifyAccessToken(token);
        } catch {
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
            return;
        }
        wss.handleUpgrade(request, socket, head, (ws) => {
            metaBySocket.set(ws, {
                identityId: claims.sub,
                actorType: claims.actorType,
                actorId: claims.actorId,
                tenantId: claims.tenantId,
                displayName: null,
                sockets: new Set(),
            });
            wss.emit('connection', ws, request);
        });
    });

    wss.on('connection', (ws: WebSocket) => {
        const meta = metaBySocket.get(ws);
        if (!meta) {
            ws.close(1011, 'no identity');
            return;
        }

        ws.on('message', async (raw: unknown) => {
            let parsed: any;
            try {
                parsed = JSON.parse(String(raw));
            } catch {
                ws.send(JSON.stringify({ type: 'ERROR', error: 'Malformed JSON frame.' }));
                return;
            }

            try {
                if (parsed.type === 'JOIN') {
                    const threadKey = String(parsed.threadKey || '');
                    if (!threadKey) throw new Error('threadKey required.');
                    // A principal may always open their OWN thread. A trip thread is
                    // allowed when it already exists in-tenant OR when the actor is a
                    // participant of that trip (covers brand-new trips with no
                    // messages yet). Anything else is rejected as a foreign thread.
                    const ownThreadPrefix = meta.actorType === 'DRIVER' ? 'driver-' : 'client-';
                    const isOwnThread = threadKey === `${ownThreadPrefix}${meta.actorId}`;
                    if (!isOwnThread) {
                        const existing = await db.query(
                            `SELECT 1 FROM messages
                             WHERE tenant_id = $1 AND thread_key = $2 LIMIT 1`,
                            [meta.tenantId, threadKey]
                        );
                        let allowed = existing.rows.length > 0;
                        if (!allowed && threadKey.startsWith('trip-')) {
                            const tripId = threadKey.slice(5);
                            // Guard the uuid cast: a malformed id must surface as a
                            // foreign-thread rejection, not a raw Postgres error.
                            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tripId);
                            if (isUuid) {
                                const participant = await db.query(
                                    `SELECT 1 FROM trips
                                     WHERE id = $2 AND tenant_id = $1
                                       AND (private_client_id = $3 OR driver_id = $3) LIMIT 1`,
                                    [meta.tenantId, tripId, meta.actorId]
                                );
                                allowed = participant.rows.length > 0;
                            }
                        }
                        if (!allowed) {
                            throw new Error('Unknown thread for this tenant.');
                        }
                    }
                    joinRoom(threadKey, ws);
                    ws.send(JSON.stringify({ type: 'JOINED', threadKey }));
                    return;
                }

                if (parsed.type === 'SEND') {
                    const threadKey = String(parsed.threadKey || '');
                    const body = String(parsed.body || '').trim();
                    if (!threadKey || !body) throw new Error('threadKey and body are required.');
                    const threadType = String(parsed.threadType || (meta.actorType === 'DRIVER' ? 'DRIVER_DISPATCH' : 'CLIENT_ENGAGEMENT'));

                    const { rows } = await db.query(
                        `INSERT INTO messages (tenant_id, thread_type, thread_key, trip_id, sender_type, sender_id, body)
                         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
                        [meta.tenantId, threadType, threadKey, parsed.tripId ? String(parsed.tripId) : null,
                         meta.actorType === 'DRIVER' ? 'DRIVER' : 'CLIENT', meta.actorId, body.slice(0, 4000)]
                    );
                    const message = rows[0];

                    const room = rooms.get(threadKey);
                    const frame = JSON.stringify({ type: 'MESSAGE', message });
                    if (room) {
                        for (const client of room) {
                            if (client.readyState === WebSocket.OPEN) client.send(frame);
                        }
                    }
                    return;
                }

                if (parsed.type === 'LEAVE') {
                    leaveAllRooms(ws);
                    ws.send(JSON.stringify({ type: 'LEFT' }));
                    return;
                }

                ws.send(JSON.stringify({ type: 'ERROR', error: 'Unsupported frame type.' }));
            } catch (err: any) {
                ws.send(JSON.stringify({ type: 'ERROR', error: err?.message || 'Gateway error.' }));
            }
        });

        ws.on('close', () => {
            leaveAllRooms(ws);
        });
    });

    console.log('[WS] Realtime chat gateway ready at /ws/chat');
    return wss;
};
