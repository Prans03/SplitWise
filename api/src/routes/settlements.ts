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

// ── GET /groups/:id/settlements/balances ──────────────────────
router.get('/balances', async (req: Request, res: Response) => {
  const { id: groupId } = req.params;
  const userId = req.user!.id;
  if (!await assertMember(groupId, userId, res)) return;

  // We need to calculate who owes whom.
  // 1. Get all expenses in the group
  const expenses = await query<{ id: string, paid_by: string, amount: number, description: string }>(
    `SELECT id, paid_by, amount, description FROM expenses WHERE group_id = $1`,
    [groupId]
  );

  // 2. Get all splits
  const splits = await query<{ expense_id: string, user_id: string, amount: number }>(
    `SELECT es.expense_id, es.user_id, es.amount 
     FROM expense_splits es
     JOIN expenses e ON e.id = es.expense_id
     WHERE e.group_id = $1`,
    [groupId]
  );

  // 3. Get all settlements
  const allSettlements = await query<{ id: string, from_user_id: string, to_user_id: string, amount: number, status: string }>(
    `SELECT id, from_user_id, to_user_id, amount, status FROM settlements WHERE group_id = $1`,
    [groupId]
  );
  const settlements = allSettlements.filter(s => s.status === 'ACKNOWLEDGED');
  const pendingSettlements = allSettlements.filter(s => s.status === 'PENDING' || s.status === 'REJECTED');

  // Users lookup
  const users = await query<{ id: string, name: string, avatar: string, color: string, upi_id: string }>(
    `SELECT u.id, u.name, u.avatar, u.color, u.upi_id 
     FROM users u
     JOIN group_members gm ON gm.user_id = u.id
     WHERE gm.group_id = $1`,
    [groupId]
  );
  const userMap = new Map(users.map(u => [u.id, u]));

  // balances[A][B] means A owes B this amount
  const debts: Record<string, Record<string, number>> = {};
  for (const u1 of users) {
    debts[u1.id] = {};
    for (const u2 of users) {
      debts[u1.id][u2.id] = 0;
    }
  }

  // Calculate debts from expenses
  for (const exp of expenses) {
    const expSplits = splits.filter(s => s.expense_id === exp.id);
    for (const split of expSplits) {
      if (split.user_id !== exp.paid_by) {
        if (debts[split.user_id] && debts[split.user_id][exp.paid_by] !== undefined) {
          debts[split.user_id][exp.paid_by] += Number(split.amount);
        }
      }
    }
  }

  // Deduct settlements
  for (const st of settlements) {
    if (debts[st.from_user_id] && debts[st.from_user_id][st.to_user_id] !== undefined) {
      debts[st.from_user_id][st.to_user_id] -= Number(st.amount);
    }
  }

  // Simplify debts
  for (const u1 of users) {
    for (const u2 of users) {
      if (u1.id !== u2.id) {
        const u1OwesU2 = debts[u1.id][u2.id];
        const u2OwesU1 = debts[u2.id][u1.id];
        if (u1OwesU2 > u2OwesU1) {
          debts[u1.id][u2.id] = u1OwesU2 - u2OwesU1;
          debts[u2.id][u1.id] = 0;
        } else {
          debts[u2.id][u1.id] = u2OwesU1 - u1OwesU2;
          debts[u1.id][u2.id] = 0;
        }
      }
    }
  }

  const whoPaysYou: any[] = [];
  const whoYouPay: any[] = [];
  let overallBalance = 0;

  for (const other of users) {
    if (other.id === userId) continue;
    const theyOweMe = debts[other.id][userId] || 0;
    const iOweThem = debts[userId][other.id] || 0;

    const net = theyOweMe - iOweThem;
    overallBalance += net;

    if (net > 0) {
      whoPaysYou.push({
        userId: other.id,
        name: other.name,
        avatarUrl: other.avatar || null,
        color: other.color,
        amountOwed: net,
        upiId: other.upi_id
      });
    } else if (net < 0) {
      whoYouPay.push({
        userId: other.id,
        name: other.name,
        avatarUrl: other.avatar || null,
        color: other.color,
        amountOwed: Math.abs(net),
        upiId: other.upi_id
      });
    }
  }

  const memberBalances = users.map(u => {
    let bal = 0;
    for (const other of users) {
      if (u.id === other.id) continue;
      bal += (debts[other.id][u.id] || 0) - (debts[u.id][other.id] || 0);
    }
    return {
      userId: u.id,
      name: u.name,
      avatarUrl: u.avatar || null,
      color: u.color,
      netBalance: bal
    };
  });

  const enrichedPending = pendingSettlements.map(s => {
    const from = userMap.get(s.from_user_id)!;
    const to = userMap.get(s.to_user_id)!;
    return {
      id: s.id,
      fromUserId: s.from_user_id,
      toUserId: s.to_user_id,
      fromName: from.name,
      toName: to.name,
      amount: s.amount,
      status: s.status
    };
  });

  res.json({
    overallBalance,
    activeSettlementsCount: whoPaysYou.length + whoYouPay.length,
    whoPaysYou,
    whoYouPay,
    memberBalances,
    pendingSettlements: enrichedPending
  });
});

// ── POST /groups/:id/settlements/remind ───────────────────────
router.post('/remind', async (req: Request, res: Response) => {
  const { id: groupId } = req.params;
  const { targetUserId, amount } = req.body;
  if (!await assertMember(groupId, req.user!.id, res)) return;

  // In a real app, send push notification/email here.
  broadcastToGroup(groupId, { type: 'settlement.remind', from: req.user!.id, to: targetUserId, amount });
  res.json({ success: true, message: 'Reminder sent' });
});

// ── POST /groups/:id/settlements/acknowledge ──────────────────
router.post('/acknowledge', async (req: Request, res: Response) => {
  const { id: groupId } = req.params;
  const { fromUserId, amount } = req.body; // The person who paid you
  if (!await assertMember(groupId, req.user!.id, res)) return;

  const stId = uuidv4();
  await query(
    `INSERT INTO settlements (id, group_id, from_user_id, to_user_id, amount)
     VALUES ($1, $2, $3, $4, $5)`,
    [stId, groupId, fromUserId, req.user!.id, Number(amount)]
  );

  broadcastToGroup(groupId, { type: 'settlement.acknowledged', from: fromUserId, to: req.user!.id, amount });
  res.json({ success: true, id: stId });
});

// ── POST /groups/:id/settlements/settle-up ───────────────────
router.post('/settle-up', async (req: Request, res: Response) => {
  const { id: groupId } = req.params;
  const { toUserId, amount } = req.body; // The person you are paying
  if (!await assertMember(groupId, req.user!.id, res)) return;

  const idempotencyKey = req.header('Idempotency-Key');

  if (idempotencyKey) {
    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM settlements WHERE idempotency_key = $1`, [idempotencyKey]
    );
    if (existing) {
      // Already processed, return success implicitly
      res.json({ success: true, id: existing.id, message: 'Idempotent request' });
      return;
    }
  }

  const stId = uuidv4();
  await query(
    `INSERT INTO settlements (id, group_id, from_user_id, to_user_id, amount, status, idempotency_key)
     VALUES ($1, $2, $3, $4, $5, 'PENDING', $6)`,
    [stId, groupId, req.user!.id, toUserId, Number(amount), idempotencyKey || null]
  );

  // Event Sourcing: Log the initialization
  await query(
    `INSERT INTO settlement_events (id, settlement_id, action, actor_id) VALUES ($1, $2, $3, $4)`,
    [uuidv4(), stId, 'PAYMENT_INITIATED', req.user!.id]
  );

  broadcastToGroup(groupId, { type: 'settlement.recorded', from: req.user!.id, to: toUserId, amount });
  res.json({ success: true, id: stId });
});

// ── POST /groups/:id/settlements/:stId/verify ─────────────────
router.post('/:stId/verify', async (req: Request, res: Response) => {
  const { id: groupId, stId } = req.params;
  const { action } = req.body; // 'ACCEPT' or 'REJECT'
  if (!await assertMember(groupId, req.user!.id, res)) return;

  const st = await queryOne<{ to_user_id: string }>(
    `SELECT to_user_id FROM settlements WHERE id = $1 AND group_id = $2`, [stId, groupId]
  );
  if (!st) { res.status(404).json({ error: 'Not found' }); return; }
  
  // Only the receiver can verify/reject
  if (st.to_user_id !== req.user!.id) {
    res.status(403).json({ error: 'Only the receiver can verify this payment' });
    return;
  }

  const newStatus = action === 'ACCEPT' ? 'ACKNOWLEDGED' : 'REJECTED';
  await query(`UPDATE settlements SET status = $1 WHERE id = $2`, [newStatus, stId]);

  // Event Sourcing: Log the verification
  const eventAction = action === 'ACCEPT' ? 'PAYMENT_VERIFIED' : 'PAYMENT_REJECTED';
  await query(
    `INSERT INTO settlement_events (id, settlement_id, action, actor_id) VALUES ($1, $2, $3, $4)`,
    [uuidv4(), stId, eventAction, req.user!.id]
  );
  
  broadcastToGroup(groupId, { type: 'settlement.verified', groupId, stId, status: newStatus });
  res.json({ success: true, status: newStatus });
});

export default router;
