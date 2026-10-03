// ============================================================
// api/src/routes/expenses.ts
// GET/POST/PUT/DELETE /groups/:id/expenses
// ============================================================
import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../db';
import { requireAuth } from '../middleware/auth';
import { broadcastToGroup } from '../ws/hub';

const router = Router({ mergeParams: true });
router.use(requireAuth);

async function assertMember(groupId: string, userId: string, res: Response): Promise<boolean> {
  const m = await queryOne(`SELECT id FROM group_members WHERE group_id=$1 AND user_id=$2`, [groupId, userId]);
  if (!m) { res.status(403).json({ error: 'Not a group member' }); return false; }
  return true;
}

// ── GET /groups/:id/expenses ──────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  const { id: groupId } = req.params;
  if (!await assertMember(groupId, req.user!.id, res)) return;

  const expenses = await query(
    `SELECT e.id, e.description, e.amount, e.currency, e.category,
            e.paid_by, e.split_mode, e.is_personal, e.date, e.created_at,
            u.name AS paid_by_name, u.color AS paid_by_color,
            (SELECT json_agg(json_build_object(
              'userId', es.user_id, 'amount', es.amount,
              'name', su.name, 'color', su.color
            ))
             FROM expense_splits es
             JOIN users su ON su.id = es.user_id
             WHERE es.expense_id = e.id
            ) AS splits
     FROM expenses e
     LEFT JOIN users u ON u.id = e.paid_by
     WHERE e.group_id = $1
     ORDER BY e.date DESC`,
    [groupId]
  );

  const settlements = await query(
    `SELECT s.id, 'Settlement: ' || u1.name || ' paid ' || u2.name as description, s.amount, 'INR' as currency, 'settlement' as category,
            s.from_user_id as paid_by, 'custom' as split_mode, s.created_at as date, s.created_at,
            u1.name AS paid_by_name, u1.color AS paid_by_color,
            json_build_array(json_build_object(
              'userId', s.to_user_id, 'amount', s.amount,
              'name', u2.name, 'color', u2.color
            )) AS splits
     FROM settlements s
     JOIN users u1 ON u1.id = s.from_user_id
     JOIN users u2 ON u2.id = s.to_user_id
     WHERE s.group_id = $1`,
    [groupId]
  );

  const allData = [...expenses, ...settlements].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  res.json(allData);
});

// ── POST /groups/:id/expenses ─────────────────────────────────
router.post('/', async (req: Request, res: Response) => {
  const { id: groupId } = req.params;
  if (!await assertMember(groupId, req.user!.id, res)) return;

  const { description, amount, category = 'other', paidById, splitMode = 'equally', splitMemberIds, customSplits, date, isPersonal = false } = req.body ?? {};

  if (!description?.trim()) { res.status(400).json({ error: 'description required' }); return; }
  if (!amount || Number(amount) <= 0) { res.status(400).json({ error: 'amount must be positive' }); return; }
  if (!paidById) { res.status(400).json({ error: 'paidById required' }); return; }

  const expenseId = uuidv4();
  const expense = await queryOne(
    `INSERT INTO expenses (id, group_id, description, amount, category, paid_by, split_mode, is_personal, date, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,COALESCE($9::timestamptz, NOW()),$10)
     RETURNING id, description, amount, currency, category, paid_by, split_mode, is_personal, date, created_at`,
    [expenseId, groupId, description.trim(), Number(amount), category, paidById, splitMode, Boolean(isPersonal), date ?? null, req.user!.id]
  );

  // Compute splits
  let splits: Array<{ userId: string; amount: number }> = [];
  if (splitMode === 'custom' && customSplits) {
    splits = customSplits;
  } else if (splitMemberIds?.length) {
    const share = Number(amount) / splitMemberIds.length;
    splits = splitMemberIds.map((uid: string) => ({ userId: uid, amount: Math.round(share * 100) / 100 }));
  } else {
    // Fall back to all group members
    const members = await query<{ user_id: string }>(
      `SELECT user_id FROM group_members WHERE group_id=$1`, [groupId]
    );
    const share = Number(amount) / members.length;
    splits = members.map((m) => ({ userId: m.user_id, amount: Math.round(share * 100) / 100 }));
  }

  // Insert splits
  for (const s of splits) {
    await query(
      `INSERT INTO expense_splits (id, expense_id, user_id, amount) VALUES ($1,$2,$3,$4)`,
      [uuidv4(), expenseId, s.userId, s.amount]
    );
  }

  const full = { ...expense as any, splits, is_personal: Boolean(isPersonal) };
  broadcastToGroup(groupId, { type: 'expense.created', groupId, expense: full }, req.user!.id);
  res.status(201).json(full);
});

// ── PUT /groups/:id/expenses/:eid ─────────────────────────────
router.put('/:eid', async (req: Request, res: Response) => {
  const { id: groupId, eid } = req.params;
  if (!await assertMember(groupId, req.user!.id, res)) return;

  const { description, amount, category, paidById, date } = req.body ?? {};
  const updated = await queryOne(
    `UPDATE expenses SET
       description = COALESCE($1, description),
       amount      = COALESCE($2, amount),
       category    = COALESCE($3, category),
       paid_by     = COALESCE($4, paid_by),
       date        = COALESCE($5::timestamptz, date)
     WHERE id=$6 AND group_id=$7
     RETURNING id, description, amount, currency, category, paid_by, split_mode, date`,
    [description ?? null, amount ? Number(amount) : null, category ?? null, paidById ?? null, date ?? null, eid, groupId]
  );
  if (!updated) { res.status(404).json({ error: 'Not found' }); return; }

  broadcastToGroup(groupId, { type: 'expense.updated', groupId, expense: updated });
  res.json(updated);
});

// ── DELETE /groups/:id/expenses/:eid ─────────────────────────
router.delete('/:eid', async (req: Request, res: Response) => {
  const { id: groupId, eid } = req.params;
  if (!await assertMember(groupId, req.user!.id, res)) return;

  const exp = await queryOne<{ created_by: string }>(
    `SELECT created_by FROM expenses WHERE id=$1 AND group_id=$2`, [eid, groupId]
  );
  if (exp) {
    await query(`DELETE FROM expenses WHERE id=$1`, [eid]);
    broadcastToGroup(groupId, { type: 'expense.deleted', groupId, expenseId: eid });
    res.json({ ok: true });
    return;
  }

  const settlement = await queryOne(
    `SELECT * FROM settlements WHERE id=$1 AND group_id=$2`, [eid, groupId]
  );
  if (settlement) {
    await query(`DELETE FROM settlements WHERE id=$1`, [eid]);
    broadcastToGroup(groupId, { type: 'settlement.deleted', groupId, settlementId: eid });
    res.json({ ok: true });
    return;
  }

  res.status(404).json({ error: 'Not found' });
});

export default router;
