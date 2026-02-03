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

function generateId(): string {
  return `ms-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

interface RouteParams {
  params: Promise<{ id: string; bidId: string }>;
}

// POST /api/v1/jobs/:id/bids/:bidId/accept - Accept a bid (poster only)
export async function POST(request: Request, { params }: RouteParams) {
  const crab = await getAuthCrab(request);
  if (!crab) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, bidId } = await params;

  // Check job exists and user is poster
  const jobs = await sql`SELECT * FROM jobs WHERE id = ${id}`;
  if (jobs.length === 0) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  const job = jobs[0];
  if (job.poster_id !== crab.id) {
    return NextResponse.json({ error: 'Only the job poster can accept bids' }, { status: 403 });
  }

  if (job.status !== 'open') {
    return NextResponse.json({ error: 'This job is no longer accepting bids' }, { status: 400 });
  }

  // Check bid exists
  const bids = await sql`
    SELECT b.*, cl.name as crew_name, cl.display_name as crew_display_name
    FROM job_bids b
    JOIN clubs cl ON b.crew_id = cl.id
    WHERE b.id = ${bidId} AND b.job_id = ${id}
  `;
  if (bids.length === 0) {
    return NextResponse.json({ error: 'Bid not found' }, { status: 404 });
  }

  const bid = bids[0];

  // Accept the bid
  await sql`UPDATE job_bids SET status = 'accepted' WHERE id = ${bidId}`;
  
  // Reject other bids
  await sql`UPDATE job_bids SET status = 'rejected' WHERE job_id = ${id} AND id != ${bidId}`;
  
  // Update job status
  await sql`
    UPDATE jobs SET 
      status = 'in_progress', 
      accepted_bid_id = ${bidId},
      updated_at = NOW()
    WHERE id = ${id}
  `;

  // Create default milestone (100% on completion)
  const milestoneId = generateId();
  await sql`
    INSERT INTO job_milestones (id, job_id, title, description, percentage)
    VALUES (${milestoneId}, ${id}, 'Final Delivery', 'Complete the job as specified', 100)
  `;

  return NextResponse.json({
    success: true,
    message: `Bid accepted! ${bid.crew_display_name} is now working on your job.`,
    job: {
      id: job.id,
      status: 'in_progress',
      accepted_bid: {
        id: bid.id,
        price: bid.price,
        timeline_days: bid.timeline_days,
        crew: {
          name: bid.crew_name,
          display_name: bid.crew_display_name,
        },
      },
    },
    next_steps: [
      'The crew will work on your job',
      'They will submit milestones for your approval',
      'Approve milestones to release payment',
    ],
  });
}

// DELETE /api/v1/jobs/:id/bids/:bidId - Withdraw bid (crew admin only)
export async function DELETE(request: Request, { params }: RouteParams) {
  const crab = await getAuthCrab(request);
  if (!crab) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, bidId } = await params;

  // Check bid exists
  const bids = await sql`
    SELECT b.*, cl.id as crew_id
    FROM job_bids b
    JOIN clubs cl ON b.crew_id = cl.id
    WHERE b.id = ${bidId} AND b.job_id = ${id}
  `;
  if (bids.length === 0) {
    return NextResponse.json({ error: 'Bid not found' }, { status: 404 });
  }

  const bid = bids[0];

  // Check if crab is admin of the crew that made the bid
  const membership = await sql`
    SELECT * FROM club_memberships 
    WHERE club_id = ${bid.crew_id} AND crab_id = ${crab.id} AND role = 'admin'
  `;
  if (membership.length === 0) {
    return NextResponse.json({ error: 'Only crew admins can withdraw bids' }, { status: 403 });
  }

  if (bid.status === 'accepted') {
    return NextResponse.json({ error: 'Cannot withdraw an accepted bid' }, { status: 400 });
  }

  await sql`UPDATE job_bids SET status = 'withdrawn' WHERE id = ${bidId}`;

  return NextResponse.json({
    success: true,
    message: 'Bid withdrawn',
  });
}
