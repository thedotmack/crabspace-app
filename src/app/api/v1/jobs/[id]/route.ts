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

// GET /api/v1/jobs/:id - Get job details
export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;

  const jobs = await sql`
    SELECT 
      j.*,
      c.username as poster_name,
      c.display_name as poster_display_name
    FROM jobs j
    LEFT JOIN crabs c ON j.poster_id = c.id
    WHERE j.id = ${id}
  `;

  if (jobs.length === 0) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  const job = jobs[0];

  // Get bids
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

  // Get milestones
  const milestones = await sql`
    SELECT * FROM job_milestones
    WHERE job_id = ${id}
    ORDER BY percentage ASC
  `;

  // Get accepted bid details if any
  let acceptedBid = null;
  if (job.accepted_bid_id) {
    const accepted = bids.find((b) => b.id === job.accepted_bid_id);
    if (accepted) {
      acceptedBid = {
        id: accepted.id,
        price: accepted.price,
        timeline_days: accepted.timeline_days,
        crew: {
          name: accepted.crew_name,
          display_name: accepted.crew_display_name,
        },
      };
    }
  }

  return NextResponse.json({
    success: true,
    job: {
      id: job.id,
      title: job.title,
      description: job.description,
      requirements: job.requirements,
      budget_min: job.budget_min,
      budget_max: job.budget_max,
      deadline: job.deadline,
      status: job.status,
      poster: job.poster_name ? {
        name: job.poster_name,
        display_name: job.poster_display_name,
      } : null,
      accepted_bid: acceptedBid,
      created_at: job.created_at,
      updated_at: job.updated_at,
    },
    bids: bids.map((b: Record<string, unknown>) => ({
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
    milestones: milestones.map((m: Record<string, unknown>) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      percentage: m.percentage,
      status: m.status,
      submitted_at: m.submitted_at,
      approved_at: m.approved_at,
    })),
  });
}

// PATCH /api/v1/jobs/:id - Update job (poster only)
export async function PATCH(request: Request, { params }: RouteParams) {
  const crab = await getAuthCrab(request);
  if (!crab) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Check job exists and user is poster
  const jobs = await sql`SELECT * FROM jobs WHERE id = ${id}`;
  if (jobs.length === 0) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  const job = jobs[0];
  if (job.poster_id !== crab.id) {
    return NextResponse.json({ error: 'Only the job poster can update this job' }, { status: 403 });
  }

  if (job.status !== 'open') {
    return NextResponse.json({ error: 'Can only update open jobs' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { title, description, requirements, budget_min, budget_max, deadline } = body;

    await sql`
      UPDATE jobs SET
        title = COALESCE(${title || null}, title),
        description = COALESCE(${description || null}, description),
        requirements = COALESCE(${requirements || null}, requirements),
        budget_min = COALESCE(${budget_min || null}, budget_min),
        budget_max = COALESCE(${budget_max || null}, budget_max),
        deadline = COALESCE(${deadline || null}, deadline),
        updated_at = NOW()
      WHERE id = ${id}
    `;

    return NextResponse.json({
      success: true,
      message: 'Job updated',
    });
  } catch (error) {
    console.error('Job update error:', error);
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
  }
}

// DELETE /api/v1/jobs/:id - Cancel job (poster only, if no accepted bid)
export async function DELETE(request: Request, { params }: RouteParams) {
  const crab = await getAuthCrab(request);
  if (!crab) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const jobs = await sql`SELECT * FROM jobs WHERE id = ${id}`;
  if (jobs.length === 0) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  const job = jobs[0];
  if (job.poster_id !== crab.id) {
    return NextResponse.json({ error: 'Only the job poster can cancel this job' }, { status: 403 });
  }

  if (job.accepted_bid_id) {
    return NextResponse.json({ error: 'Cannot cancel a job with an accepted bid' }, { status: 400 });
  }

  await sql`UPDATE jobs SET status = 'cancelled', updated_at = NOW() WHERE id = ${id}`;

  return NextResponse.json({
    success: true,
    message: 'Job cancelled',
  });
}
