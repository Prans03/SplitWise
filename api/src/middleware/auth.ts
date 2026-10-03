// ============================================================
// api/src/middleware/auth.ts – JWT session middleware
// ============================================================
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { queryOne } from '../db';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  color: string;
  avatar: string;
  upi_id: string | null;
}

declare global {
  namespace Express {
    interface Request { user?: AuthUser }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing token' });
    return;
  }

  const token = header.slice(7);

  try {
    jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  // Confirm session still exists in DB
  const session = await queryOne<{ user_id: string; expires_at: string }>(
    `SELECT user_id, expires_at FROM sessions WHERE token = $1 AND expires_at > NOW()`,
    [token]
  );

  if (!session) {
    res.status(401).json({ error: 'Session expired' });
    return;
  }

  const user = await queryOne<AuthUser>(
    `SELECT id, name, email, color, avatar, upi_id FROM users WHERE id = $1`,
    [session.user_id]
  );

  if (!user) {
    res.status(401).json({ error: 'User not found' });
    return;
  }

  req.user = user;
  next();
}

export async function verifyTokenForWs(token: string): Promise<AuthUser | null> {
  try {
    jwt.verify(token, process.env.JWT_SECRET!);
    const session = await queryOne<{ user_id: string }>(
      `SELECT user_id FROM sessions WHERE token = $1 AND expires_at > NOW()`,
      [token]
    );
    if (!session) return null;
    return queryOne<AuthUser>(
      `SELECT id, name, email, color, avatar, upi_id FROM users WHERE id = $1`,
      [session.user_id]
    );
  } catch {
    return null;
  }
}
