/**
 * REALTIME CHAT GATEWAY TESTS — our own WebSocket layer over the `messages` tables.
 * Covers: token-authenticated upgrade (rejects bad tokens), tenant-scoped JOIN,
 * SEND broadcast to room members, and PostgreSQL persistence of every frame.
 */
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://velo_admin:testpass@127.0.0.1:5433/velo_network';
process.env.JWT_SECRET = 'test-secret-key-for-velo-selfhosted-auth-0123456789';

import http from 'http';
import { Pool } from 'pg';
import WebSocket from 'ws';
import { db as servicePool } from '../config/db';
import { attachChatGateway } from '../realtime/chatGateway';
import { AuthService } from '../services/auth.service';

const TEST_TENANT = '00000000-0000-0000-0000-000000000001';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

let server: http.Server;
let baseUrl: string;
let accessToken: string;
let actorId: string;

let threadA = 'trip-ws-test-1';
let threadForeign = 'trip-foreign-tenant-thread';

const wsConnect = (token: string): Promise<WebSocket> =>
    new Promise((resolve, reject) => {
        const ws = new WebSocket(`${baseUrl}/ws/chat?token=${encodeURIComponent(token)}`);
        ws.on('open', () => resolve(ws));
        ws.on('error', reject);
    });

const nextFrame = (ws: WebSocket, type: string, timeoutMs = 3000): Promise<any> =>
    new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`timeout waiting for ${type}`)), timeoutMs);
        const handler = (raw: unknown) => {
            const frame = JSON.parse(String(raw));
            if (frame.type === type) {
                clearTimeout(timer);
                ws.off('message', handler);
                resolve(frame);
            }
        };
        ws.on('message', handler);
    });

beforeAll(async () => {
    const runId = Date.now();
    threadA = `trip-ws-test-${runId}`;
    threadForeign = `trip-foreign-${runId}`;
    server = http.createServer((_req, res) => res.end('ok'));
    attachChatGateway(server);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const addr = server.address();
    const port = typeof addr === 'object' && addr ? addr.port : 0;
    baseUrl = `ws://127.0.0.1:${port}`;

    const session = await AuthService.registerPassword({
        tenantId: TEST_TENANT,
        actorType: 'PRIVATE_CLIENT',
        email: `ws-test-${Date.now()}-${Math.floor(Math.random() * 1e6)}@velo-test.local`,
        password: 'WsTestPass1!',
        displayName: 'WS Tester',
        profile: {},
    });
    accessToken = session.accessToken;
    actorId = session.actor.id;

    // Seed an existing tenant-scoped thread so JOIN is permitted.
    await pool.query(
        `INSERT INTO messages (tenant_id, thread_type, thread_key, sender_type, body)
         VALUES ($1, 'CLIENT_ENGAGEMENT', $2, 'DISPATCHER', 'Thread opened by dispatch.')`,
        [TEST_TENANT, threadA]
    );
});

afterAll(async () => {
    await pool.query(`DELETE FROM messages WHERE thread_key LIKE 'trip-ws-test-%' OR thread_key LIKE 'trip-foreign-%'`);
    server.close();
    await pool.end();
    await servicePool.end();
});

describe('chat gateway upgrade auth', () => {
    it('rejects an invalid token at the upgrade stage', async () => {
        await expect(wsConnect('not-a-real-token')).rejects.toThrow(/401|Unexpected server response/);
    });

    it('accepts a valid session token', async () => {
        const ws = await wsConnect(accessToken);
        expect(ws.readyState).toBe(WebSocket.OPEN);
        ws.close();
    });
});

describe('thread scoping and messaging', () => {
    it('rejects a JOIN on a thread that does not belong to the tenant', async () => {
        const ws = await wsConnect(accessToken);
        ws.send(JSON.stringify({ type: 'JOIN', threadKey: threadForeign }));
        const frame = await nextFrame(ws, 'ERROR');
        expect(frame.error).toMatch(/Unknown thread/);
        ws.close();
    });

    it('broadcasts SEND to room members and persists the message in PostgreSQL', async () => {
        const sender = await wsConnect(accessToken);
        const listener = await wsConnect(accessToken);

        sender.send(JSON.stringify({ type: 'JOIN', threadKey: threadA }));
        await nextFrame(sender, 'JOINED');
        listener.send(JSON.stringify({ type: 'JOIN', threadKey: threadA }));
        await nextFrame(listener, 'JOINED');

        sender.send(JSON.stringify({ type: 'SEND', threadKey: threadA, body: 'Driver is 4 minutes away.', threadType: 'CLIENT_ENGAGEMENT' }));

        const received = await nextFrame(listener, 'MESSAGE');
        expect(received.message.body).toBe('Driver is 4 minutes away.');
        expect(received.message.thread_key).toBe(threadA);
        expect(received.message.tenant_id).toBe(TEST_TENANT);

        const { rows } = await pool.query(
            `SELECT * FROM messages WHERE thread_key = '${threadA}' AND body = 'Driver is 4 minutes away.'`
        );
        expect(rows.length).toBe(1);
        expect(rows[0].sender_id).toBe(actorId);

        sender.close();
        listener.close();
    });

    it('rejects a SEND without a body', async () => {
        const ws = await wsConnect(accessToken);
        ws.send(JSON.stringify({ type: 'SEND', threadKey: threadA, body: '' }));
        const frame = await nextFrame(ws, 'ERROR');
        expect(frame.error).toMatch(/body/);
        ws.close();
    });
});
