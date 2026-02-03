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

// POST /api/v1/bounties/:id/claim - Claim bounty
export async function POST(request: Request, { params }: RouteParams) {
  const crab = await getAuthCrab(request);
  if (!crab) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }


  const { id } = await params;

  // Get bounty
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

  if (bounty.status !== 'open') {
    return NextResponse.json({ error: 'Bounty is not open' }, { status: 400 });
  }

  // Check membership
  const membership = await sql`
    SELECT * FROM club_memberships WHERE club_id = ${bounty.club_id} AND crab_id = ${crab.id}
  `;
  if (membership.length === 0) {
    return NextResponse.json({ error: 'Must be a crew member to claim bounties' }, { status: 403 });
  }

  // Claim the bounty
  await sql`
    UPDATE bounties 
    SET status = 'claimed', claimed_by = ${crab.id}, claimed_at = NOW()
    WHERE id = ${id}
  `;

  return NextResponse.json({
    success: true,
    message: `Bounty claimed! "${bounty.title}" (${bounty.reward} $CMEM)`,
    bounty: {
      id: bounty.id,
      title: bounty.title,
      reward: bounty.reward,
      status: 'claimed',
    },
  });
}

// DELETE /api/v1/bounties/:id/claim - Unclaim bounty
export async function DELETE(request: Request, { params }: RouteParams) {
  const crab = await getAuthCrab(request);
  if (!crab) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Get bounty
  const bounties = await sql`SELECT * FROM bounties WHERE id = ${id}`;
  if (bounties.length === 0) {
    return NextResponse.json({ error: 'Bounty not found' }, { status: 404 });
  }

  const bounty = bounties[0];

  if (bounty.claimed_by !== crab.id) {
    return NextResponse.json({ error: 'Not your claim' }, { status: 403 });
  }

  if (bounty.status !== 'claimed') {
    return NextResponse.json({ error: 'Cannot unclaim' }, { status: 400 });
  }

  // Unclaim
  await sql`
    UPDATE bounties 
    SET status = 'open', claimed_by = NULL, claimed_at = NULL
    WHERE id = ${id}
  `;

  return NextResponse.json({
    success: true,
    message: 'Bounty unclaimed',
  });
}
