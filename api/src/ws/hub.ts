// ============================================================
// api/src/ws/hub.ts – WebSocket room manager
// ============================================================
import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { verifyTokenForWs, AuthUser } from '../middleware/auth';
import { query } from '../db';

interface AuthedSocket extends WebSocket {
  user?: AuthUser;
  groupIds?: Set<string>;
  isAlive?: boolean;
}

// groupId → Set of connected sockets
const rooms = new Map<string, Set<AuthedSocket>>();

export function createWsHub(wss: WebSocketServer) {
  // ── Heartbeat to detect dead connections ──────────────────
  const hbInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const sock = ws as AuthedSocket;
      if (!sock.isAlive) { sock.terminate(); return; }
      sock.isAlive = false;
      sock.ping();
    });
  }, 30_000);

  wss.on('close', () => clearInterval(hbInterval));

  wss.on('connection', async (ws: AuthedSocket, req: IncomingMessage) => {
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    // ── Authenticate via ?token= query param ─────────────
    const url   = new URL(req.url ?? '/', `http://localhost`);
    const token = url.searchParams.get('token') ?? '';
    const user  = await verifyTokenForWs(token);

    if (!user) { ws.close(4001, 'Unauthorized'); return; }
    ws.user = user;
    ws.groupIds = new Set<string>();

    // ── Auto-join all user's groups ─────────────────────
    const memberships = await query<{ group_id: string }>(
      `SELECT group_id FROM group_members WHERE user_id = $1`,
      [user.id]
    );
    for (const { group_id } of memberships) {
      joinRoom(ws, group_id);
    }

    // ── Client messages (join/leave room) ───────────────
    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'join' && msg.groupId) joinRoom(ws, msg.groupId);
        if (msg.type === 'leave' && msg.groupId) leaveRoom(ws, msg.groupId);
      } catch { /* ignore */ }
    });

    ws.on('close', () => {
      ws.groupIds?.forEach((gid) => leaveRoom(ws, gid));
    });

    ws.send(JSON.stringify({ type: 'connected', userId: user.id }));
  });
}

function joinRoom(ws: AuthedSocket, groupId: string) {
  if (!rooms.has(groupId)) rooms.set(groupId, new Set());
  rooms.get(groupId)!.add(ws);
  ws.groupIds?.add(groupId);
}

function leaveRoom(ws: AuthedSocket, groupId: string) {
  rooms.get(groupId)?.delete(ws);
  ws.groupIds?.delete(groupId);
}

export function broadcastToGroup(
  groupId: string,
  event: Record<string, unknown>,
  exceptUserId?: string
) {
  const sockets = rooms.get(groupId);
  if (!sockets) return;
  const payload = JSON.stringify(event);
  sockets.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN && ws.user?.id !== exceptUserId) {
      ws.send(payload);
    }
  });
}
