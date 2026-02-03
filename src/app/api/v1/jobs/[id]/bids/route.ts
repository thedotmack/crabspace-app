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
  return `bid-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/jobs/:id/bids - List bids on a job
export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;

  // Check job exists
  const jobs = await sql`SELECT * FROM jobs WHERE id = ${id}`;
  if (jobs.length === 0) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  const bids = await sql`
    SELECT 
      b.*,
      cl.name as crew_name,
      cl.display_name as crew_display_name,
      cl.member_count
    FROM job_bids b
    JOIN clubs cl ON b.crew_id = cl.id
    WHERE b.job_id = ${id}
    ORDER BY b.created_at DESC
  `;

  return NextResponse.json({
    success: true,
    bids: bids.map(b => ({
      id: b.id,
      price: b.price,
      timeline_days: b.timeline_days,
      proposal: b.proposal,
      status: b.status,
      crew: {
        name: b.crew_name,
        display_name: b.crew_display_name,
        member_count: b.member_count,
      },
      created_at: b.created_at,
    })),
  });
}

// POST /api/v1/jobs/:id/bids - Submit a bid (crew admin only)
export async function POST(request: Request, { params }: RouteParams) {
  const crab = await getAuthCrab(request);
  if (!crab) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Check job exists and is open
  const jobs = await sql`SELECT * FROM jobs WHERE id = ${id}`;
  if (jobs.length === 0) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  const job = jobs[0];
  if (job.status !== 'open') {
    return NextResponse.json({ error: 'This job is no longer accepting bids' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { crew_name, price, timeline_days, proposal } = body;

    if (!crew_name || typeof crew_name !== 'string') {
      return NextResponse.json({ error: 'crew_name is required' }, { status: 400 });
    }

    if (!price || typeof price !== 'number') {
      return NextResponse.json({ error: 'price is required (number in $CMEM)' }, { status: 400 });
    }

    if (!proposal || typeof proposal !== 'string') {
      return NextResponse.json({ error: 'proposal is required' }, { status: 400 });
    }

    // Get crew and check if crab is admin
    const crews = await sql`SELECT * FROM clubs WHERE name = ${crew_name}`;
    if (crews.length === 0) {
      return NextResponse.json({ error: 'Crew not found' }, { status: 404 });
    }

    const crew = crews[0];

    // Check if crab is admin of this crew
    const membership = await sql`
      SELECT * FROM club_memberships 
      WHERE club_id = ${crew.id} AND crab_id = ${crab.id} AND role = 'admin'
    `;
    if (membership.length === 0) {
      return NextResponse.json({ error: 'Only crew admins can submit bids' }, { status: 403 });
    }

    // Check if crew already bid on this job
    const existingBid = await sql`
      SELECT * FROM job_bids WHERE job_id = ${id} AND crew_id = ${crew.id}
    `;
    if (existingBid.length > 0) {
      return NextResponse.json({ error: 'Your crew has already bid on this job' }, { status: 409 });
    }

    const bidId = generateId();

    await sql`
      INSERT INTO job_bids (id, job_id, crew_id, price, timeline_days, proposal)
      VALUES (${bidId}, ${id}, ${crew.id}, ${price}, ${timeline_days || null}, ${proposal})
    `;

    return NextResponse.json({
      success: true,
      bid: {
        id: bidId,
        price,
        timeline_days: timeline_days || null,
        proposal,
        status: 'pending',
        crew: {
          name: crew.name,
          display_name: crew.display_name,
        },
      },
      message: `Bid submitted! The job poster will review your proposal.`,
    });
  } catch (error) {
    console.error('Bid submission error:', error);
    return NextResponse.json({ error: 'Failed to submit bid' }, { status: 500 });
  }
}
