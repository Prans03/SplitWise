// ============================================================
// api/src/routes/groups.ts
// ============================================================
import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../db';
import { requireAuth } from '../middleware/auth';
import { broadcastToGroup } from '../ws/hub';

const router = Router();
router.use(requireAuth);

// ── GET /groups ───────────────────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  const groups = await query(
    `SELECT g.id, g.name, g.emoji, g.created_at, g.updated_at,
            gm.role,
            (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) AS member_count,
            (
              -- Net balance for the requesting user: positive = others owe them, negative = they owe
              COALESCE((
                SELECT SUM(e.amount) - SUM(COALESCE(my_split.amount, 0))
                FROM expenses e
                LEFT JOIN expense_splits my_split ON my_split.expense_id = e.id AND my_split.user_id = $1
                WHERE e.group_id = g.id AND e.paid_by = $1 AND e.is_personal = FALSE
              ), 0)
              -
              COALESCE((
                SELECT SUM(es.amount)
                FROM expense_splits es
                JOIN expenses e ON e.id = es.expense_id
                WHERE e.group_id = g.id AND e.paid_by != $1 AND es.user_id = $1 AND e.is_personal = FALSE
              ), 0)
            ) AS user_net_balance
     FROM groups g
     JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = $1
     ORDER BY g.updated_at DESC`,
    [req.user!.id]
  );
  // Map user_net_balance → totalSpent field expected by frontend
  const mapped = (groups as any[]).map(g => ({
    ...g,
    total_spent: Number(g.user_net_balance ?? 0),
  }));
  res.json(mapped);
});

// ── POST /groups ──────────────────────────────────────────────
router.post('/', async (req: Request, res: Response) => {
  const { name, emoji = '👥' } = req.body ?? {};
  if (!name?.trim()) { res.status(400).json({ error: 'name required' }); return; }

  const group = await queryOne(
    `INSERT INTO groups (id, name, emoji, created_by)
     VALUES ($1,$2,$3,$4)
     RETURNING id, name, emoji, created_at, updated_at`,
    [uuidv4(), name.trim(), emoji, req.user!.id]
  );

  // Add creator as owner
  await query(
    `INSERT INTO group_members (id, group_id, user_id, role)
     VALUES ($1,$2,$3,'owner')`,
    [uuidv4(), (group as any).id, req.user!.id]
  );

  res.status(201).json(group);
});

// ── GET /groups/:id ───────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const member = await queryOne(
    `SELECT role FROM group_members WHERE group_id=$1 AND user_id=$2`,
    [id, req.user!.id]
  );
  if (!member) { res.status(403).json({ error: 'Not a member' }); return; }

  const group = await queryOne(
    `SELECT g.id, g.name, g.emoji, g.created_at, g.updated_at FROM groups g WHERE g.id=$1`,
    [id]
  );
  if (!group) { res.status(404).json({ error: 'Not found' }); return; }

  const members = await query(
    `SELECT u.id, u.name, u.email, u.color, u.avatar, gm.role, gm.joined_at
     FROM group_members gm
     JOIN users u ON u.id = gm.user_id
     WHERE gm.group_id = $1`,
    [id]
  );

  res.json({ ...group as any, members });
});

// ── PUT /groups/:id ───────────────────────────────────────────
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, emoji } = req.body ?? {};

  const member = await queryOne<{ role: string }>(
    `SELECT role FROM group_members WHERE group_id=$1 AND user_id=$2`,
    [id, req.user!.id]
  );
  if (!member || member.role !== 'owner') {
    res.status(403).json({ error: 'Only owners can edit the group' }); return;
  }

  const updated = await queryOne(
    `UPDATE groups SET
       name  = COALESCE($1, name),
       emoji = COALESCE($2, emoji)
     WHERE id = $3
     RETURNING id, name, emoji, updated_at`,
    [name ?? null, emoji ?? null, id]
  );

  broadcastToGroup(id, { type: 'group.updated', group: updated });
  res.json(updated);
});

// ── DELETE /groups/:id ────────────────────────────────────────
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const member = await queryOne<{ role: string }>(
    `SELECT role FROM group_members WHERE group_id=$1 AND user_id=$2`,
    [id, req.user!.id]
  );
  if (!member || member.role !== 'owner') {
    res.status(403).json({ error: 'Only owners can delete groups' }); return;
  }

  broadcastToGroup(id, { type: 'group.deleted', groupId: id });
  await query(`DELETE FROM groups WHERE id=$1`, [id]);
  res.json({ ok: true });
});

// ── POST /groups/:id/invite ───────────────────────────────────
router.post('/:id/invite', async (req: Request, res: Response) => {
  const { id } = req.params;
  const member = await queryOne(
    `SELECT role FROM group_members WHERE group_id=$1 AND user_id=$2`,
    [id, req.user!.id]
  );
  if (!member) { res.status(403).json({ error: 'Not a member' }); return; }

  const token  = uuidv4().replace(/-/g, '');
  const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
  await query(
    `INSERT INTO invite_tokens (id, group_id, token, created_by, expires_at)
     VALUES ($1,$2,$3,$4,$5)`,
    [uuidv4(), id, token, req.user!.id, expiry]
  );
  res.json({ token, expiresAt: expiry });
});

// ── POST /groups/join ─────────────────────────────────────────
router.post('/join', async (req: Request, res: Response) => {
  const { token } = req.body ?? {};
  if (!token) { res.status(400).json({ error: 'token required' }); return; }

  const invite = await queryOne<{ id: string; group_id: string; used_by: string | null }>(
    `SELECT id, group_id, used_by FROM invite_tokens
     WHERE token=$1 AND (expires_at IS NULL OR expires_at > NOW())`,
    [token]
  );
  if (!invite) { res.status(404).json({ error: 'Invalid or expired invite' }); return; }
  if (invite.used_by) { res.status(409).json({ error: 'Invite already used' }); return; }

  // Already a member?
  const existing = await queryOne(
    `SELECT id FROM group_members WHERE group_id=$1 AND user_id=$2`,
    [invite.group_id, req.user!.id]
  );
  if (!existing) {
    await query(
      `INSERT INTO group_members (id, group_id, user_id, role)
       VALUES ($1,$2,$3,'member')`,
      [uuidv4(), invite.group_id, req.user!.id]
    );
    await query(
      `UPDATE invite_tokens SET used_by=$1, used_at=NOW() WHERE id=$2`,
      [req.user!.id, invite.id]
    );
    broadcastToGroup(invite.group_id, {
      type: 'member.updated',
      groupId: invite.group_id,
      user: req.user,
      action: 'joined',
    });
  }

  const group = await queryOne(
    `SELECT g.id, g.name, g.emoji FROM groups g WHERE g.id=$1`,
    [invite.group_id]
  );
  res.json({ group });
});

// ── DELETE /groups/:id/members/:uid ──────────────────────────
router.delete('/:id/members/:uid', async (req: Request, res: Response) => {
  const { id, uid } = req.params;
  const requester = await queryOne<{ role: string }>(
    `SELECT role FROM group_members WHERE group_id=$1 AND user_id=$2`,
    [id, req.user!.id]
  );
  // Only owner OR self-removal
  if (!requester || (requester.role !== 'owner' && req.user!.id !== uid)) {
    res.status(403).json({ error: 'Unauthorized' }); return;
  }
  await query(`DELETE FROM group_members WHERE group_id=$1 AND user_id=$2`, [id, uid]);
  broadcastToGroup(id, { type: 'member.updated', groupId: id, userId: uid, action: 'removed' });
  res.json({ ok: true });
});

export default router;
