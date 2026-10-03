// ============================================================
// api/src/routes/auth.ts
// POST /auth/signup  POST /auth/login  POST /auth/logout
// GET  /auth/session
// ============================================================
import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();
const SALT_ROUNDS = 12;

function makeToken(userId: string): string {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '30d') as string,
  } as jwt.SignOptions);
}

async function saveSession(userId: string, token: string) {
  const decoded = jwt.decode(token) as { exp: number };
  const expiresAt = new Date(decoded.exp * 1000).toISOString();
  await query(
    `INSERT INTO sessions (id, user_id, token, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [uuidv4(), userId, token, expiresAt]
  );
}

// ── POST /auth/signup ─────────────────────────────────────────
router.post('/signup', async (req: Request, res: Response) => {
  const { name, email, password } = req.body ?? {};

  if (!name?.trim() || !email?.trim() || !password) {
    res.status(400).json({ error: 'name, email and password are required' });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' });
    return;
  }

  const existing = await queryOne(`SELECT id FROM users WHERE email = $1`, [email.toLowerCase()]);
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const avatar = name.trim().slice(0, 2).toUpperCase();
  const colors = ['#8DC63F','#F98D51','#4DD0E1','#CE93D8','#F48FB1','#81C784'];
  const color  = colors[Math.floor(Math.random() * colors.length)];

  const user = await queryOne<{ id: string; name: string; email: string; color: string; avatar: string; upi_id: string }>(
    `INSERT INTO users (name, email, password_hash, avatar, color)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, color, avatar, upi_id`,
    [name.trim(), email.toLowerCase(), passwordHash, avatar, color]
  );

  const token = makeToken(user!.id);
  await saveSession(user!.id, token);

  res.status(201).json({ token, user });
});

// ── POST /auth/login ──────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};

  if (!email?.trim() || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }

  const user = await queryOne<{ id: string; name: string; email: string; color: string; avatar: string; password_hash: string; upi_id: string }>(
    `SELECT id, name, email, color, avatar, password_hash, upi_id FROM users WHERE email = $1`,
    [email.toLowerCase()]
  );

  // Always run bcrypt to prevent timing attacks
  const hash = user?.password_hash ?? '$2a$12$invalidhashtopreventtiming';
  const valid = await bcrypt.compare(password, hash);

  if (!user || !valid) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const token = makeToken(user.id);
  await saveSession(user.id, token);

  const { password_hash: _, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

// ── POST /auth/logout ─────────────────────────────────────────
router.post('/logout', requireAuth, async (req: Request, res: Response) => {
  const token = req.headers.authorization!.slice(7);
  await query(`DELETE FROM sessions WHERE token = $1`, [token]);
  res.json({ ok: true });
});

// ── GET /auth/session ─────────────────────────────────────────
router.get('/session', requireAuth, (req: Request, res: Response) => {
  res.json({ user: req.user });
});

// ── PUT /auth/profile ───────────────────────────────────────────
router.put('/profile', requireAuth, async (req: Request, res: Response) => {
  const { upi_id } = req.body;
  const updated = await queryOne(
    `UPDATE users SET upi_id = $1 WHERE id = $2 RETURNING id, name, email, color, avatar, upi_id`,
    [upi_id, req.user!.id]
  );
  res.json({ user: updated });
});

export default router;
