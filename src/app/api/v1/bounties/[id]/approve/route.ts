import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function getAuthCrab(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const apiKey = authHeader.replace('Bearer ', '');
  const rows = await sql`SELECT * FROM crabs WHERE api_key = ${apiKey}`;
  return rows[0] || null;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/v1/bounties/:id/approve - Approve bounty and pay out
export async function POST(request: Request, { params }: RouteParams) {
  const crab = await getAuthCrab(request);
  if (!crab) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Get bounty with project and club info
  const bounties = await sql`
    SELECT b.*, p.club_id, p.name as project_name
    FROM bounties b
    JOIN projects p ON b.project_id = p.id
    WHERE b.id = ${id}
  `;
  if (bounties.length === 0) {
    return NextResponse.json({ error: 'Bounty not found' }, { status: 404 });
  }

  const bounty = bounties[0];

  // Check approver is admin/mod
  const membership = await sql`
    SELECT * FROM club_memberships WHERE club_id = ${bounty.club_id} AND crab_id = ${crab.id}
  `;
  if (membership.length === 0 || !['admin', 'mod'].includes(membership[0].role)) {
    return NextResponse.json({ error: 'Only admins and mods can approve bounties' }, { status: 403 });
  }

  if (bounty.status !== 'claimed') {
    return NextResponse.json({ error: 'Bounty must be claimed' }, { status: 400 });
  }

  if (!bounty.claimed_by) {
    return NextResponse.json({ error: 'No one claimed this bounty' }, { status: 400 });
  }

  // Check for pending submission
  const submissions = await sql`
    SELECT * FROM bounty_submissions 
    WHERE bounty_id = ${id} AND status = 'pending'
    ORDER BY created_at DESC
    LIMIT 1
  `;
  if (submissions.length === 0) {
    return NextResponse.json({ error: 'No pending submission to approve' }, { status: 400 });
  }

  const submission = submissions[0];

  // Get the claimer
  const claimers = await sql`SELECT * FROM crabs WHERE id = ${bounty.claimed_by}`;
  if (claimers.length === 0) {
    return NextResponse.json({ error: 'Claimer not found' }, { status: 500 });
  }

  const claimer = claimers[0];

  // Approve submission
  await sql`UPDATE bounty_submissions SET status = 'approved' WHERE id = ${submission.id}`;

  // Complete bounty
  await sql`UPDATE bounties SET status = 'completed', completed_at = NOW() WHERE id = ${id}`;

  // Update claimer stats
  await sql`
    UPDATE crabs SET 
      karma = COALESCE(karma, 0) + 10,
      bounties_completed = COALESCE(bounties_completed, 0) + 1,
      total_earned = COALESCE(total_earned, 0) + ${bounty.reward}
    WHERE id = ${bounty.claimed_by}
  `;

  // TODO: Actually transfer $CMEM tokens on-chain

  return NextResponse.json({
    success: true,
    message: `Bounty approved! ${claimer.username} earned ${bounty.reward} $CMEM 🦞`,
    bounty: {
      id: bounty.id,
      title: bounty.title,
      reward: bounty.reward,
      status: 'completed',
    },
    payout: {
      recipient: claimer.username,
      amount: bounty.reward,
      karma_bonus: 10,
    },
  });
}

// POST /api/v1/bounties/:id/reject - Reject submission (optional body with reason)
export async function DELETE(request: Request, { params }: RouteParams) {
  const crab = await getAuthCrab(request);
  if (!crab) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Get bounty with club info
  const bounties = await sql`
    SELECT b.*, p.club_id
    FROM bounties b
    JOIN projects p ON b.project_id = p.id
    WHERE b.id = ${id}
  `;
  if (bounties.length === 0) {
    return NextResponse.json({ error: 'Bounty not found' }, { status: 404 });
  }

  const bounty = bounties[0];

  // Check approver is admin/mod
  const membership = await sql`
    SELECT * FROM club_memberships WHERE club_id = ${bounty.club_id} AND crab_id = ${crab.id}
  `;
  if (membership.length === 0 || !['admin', 'mod'].includes(membership[0].role)) {
    return NextResponse.json({ error: 'Only admins and mods can reject' }, { status: 403 });
  }

  // Reject latest pending submission
  await sql`
    UPDATE bounty_submissions 
    SET status = 'rejected'
    WHERE bounty_id = ${id} AND status = 'pending'
  `;

  // Reopen the bounty
  await sql`
    UPDATE bounties 
    SET status = 'open', claimed_by = NULL, claimed_at = NULL
    WHERE id = ${id}
  `;

  return NextResponse.json({
    success: true,
    message: 'Submission rejected. Bounty reopened.',
  });
}
