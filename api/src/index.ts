// ============================================================
// api/src/index.ts – Main Express + WebSocket server
// ============================================================
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';
import { pool } from './db';
import { createWsHub } from './ws/hub';
import authRouter     from './routes/auth';
import groupsRouter   from './routes/groups';
import expensesRouter from './routes/expenses';
import settlementsRouter from './routes/settlements';

const app    = express();
const server = http.createServer(app);
const wss    = new WebSocketServer({ server, path: '/ws' });

// ── Middleware ─────────────────────────────────────────────────
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────────
app.use('/auth',         authRouter);
app.use('/groups',       groupsRouter);
app.use('/groups/:id/expenses', expensesRouter);
app.use('/groups/:id/settlements', settlementsRouter);

// ── Health ─────────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', ts: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: 'db_error' });
  }
});

// ── 404 ────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// ── Error handler ──────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ── WebSocket hub ──────────────────────────────────────────────
createWsHub(wss);

// ── Start ──────────────────────────────────────────────────────
const PORT = Number(process.env.PORT ?? 4000);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ SplitWise API running on http://0.0.0.0:${PORT}`);
  console.log(`🔌 WebSocket available at ws://0.0.0.0:${PORT}/ws`);
});
