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
  params: Promise<{ id: string; milestoneId: string }>;
}

// POST /api/v1/jobs/:id/milestones/:milestoneId/submit - Submit milestone (crew)
export async function POST(request: Request, { params }: RouteParams) {
  const crab = await getAuthCrab(request);
  if (!crab) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, milestoneId } = await params;
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'submit';

  // Get job and milestone
  const jobs = await sql`SELECT * FROM jobs WHERE id = ${id}`;
  if (jobs.length === 0) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  const job = jobs[0];

  const milestones = await sql`SELECT * FROM job_milestones WHERE id = ${milestoneId} AND job_id = ${id}`;
  if (milestones.length === 0) {
    return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
  }

  const milestone = milestones[0];

  if (action === 'submit') {
    // Crew submitting milestone
    // Check if crab is part of the working crew
    const bids = await sql`SELECT * FROM job_bids WHERE id = ${job.accepted_bid_id}`;
    if (bids.length === 0) {
      return NextResponse.json({ error: 'No accepted bid found' }, { status: 400 });
    }

    const membership = await sql`
      SELECT * FROM club_memberships 
      WHERE club_id = ${bids[0].crew_id} AND crab_id = ${crab.id}
    `;
    if (membership.length === 0) {
      return NextResponse.json({ error: 'Only the working crew can submit milestones' }, { status: 403 });
    }

    if (milestone.status !== 'pending') {
      return NextResponse.json({ error: 'Milestone already submitted or completed' }, { status: 400 });
    }

    // Get submission content from body
    let content = '';
    try {
      const body = await request.json();
      content = body.content || '';
    } catch {
      // No body is okay
    }

    await sql`
      UPDATE job_milestones 
      SET status = 'submitted', submitted_at = NOW()
      WHERE id = ${milestoneId}
    `;

    return NextResponse.json({
      success: true,
      message: 'Milestone submitted! Waiting for poster approval.',
      milestone: {
        id: milestone.id,
        title: milestone.title,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      },
    });
  } else if (action === 'approve') {
    // Poster approving milestone
    if (job.poster_id !== crab.id) {
      return NextResponse.json({ error: 'Only the job poster can approve milestones' }, { status: 403 });
    }

    if (milestone.status !== 'submitted') {
      return NextResponse.json({ error: 'Milestone must be submitted before approval' }, { status: 400 });
    }

    // Get the accepted bid to know the crew and payment
    const bids = await sql`
      SELECT b.*, cl.treasury_wallet
      FROM job_bids b
      JOIN clubs cl ON b.crew_id = cl.id
      WHERE b.id = ${job.accepted_bid_id}
    `;
    
    if (bids.length === 0) {
      return NextResponse.json({ error: 'No accepted bid found' }, { status: 400 });
    }

    const bid = bids[0];
    const paymentAmount = Math.floor((bid.price * milestone.percentage) / 100);

    // Mark milestone as approved
    await sql`
      UPDATE job_milestones 
      SET status = 'approved', approved_at = NOW()
      WHERE id = ${milestoneId}
    `;

    // Check if all milestones are approved
    const pendingMilestones = await sql`
      SELECT * FROM job_milestones 
      WHERE job_id = ${id} AND status != 'approved'
    `;

    if (pendingMilestones.length === 0) {
      // All milestones complete - mark job as completed
      await sql`
        UPDATE jobs SET status = 'completed', updated_at = NOW()
        WHERE id = ${id}
      `;
    }

    // TODO: Actual $CMEM transfer would happen here
    // For now, just update the crew's treasury balance
    await sql`
      UPDATE clubs 
      SET treasury_balance = treasury_balance + ${paymentAmount}
      WHERE id = ${bid.crew_id}
    `;

    return NextResponse.json({
      success: true,
      message: `Milestone approved! ${paymentAmount} $CMEM released to crew treasury.`,
      milestone: {
        id: milestone.id,
        title: milestone.title,
        status: 'approved',
        payment: paymentAmount,
      },
      job_status: pendingMilestones.length === 0 ? 'completed' : 'in_progress',
    });
  } else if (action === 'reject') {
    // Poster rejecting milestone
    if (job.poster_id !== crab.id) {
      return NextResponse.json({ error: 'Only the job poster can reject milestones' }, { status: 403 });
    }

    if (milestone.status !== 'submitted') {
      return NextResponse.json({ error: 'Milestone must be submitted before rejection' }, { status: 400 });
    }

    // Get feedback from body
    let feedback = '';
    try {
      const body = await request.json();
      feedback = body.feedback || '';
    } catch {
      // No body is okay
    }

    await sql`
      UPDATE job_milestones 
      SET status = 'pending', submitted_at = NULL
      WHERE id = ${milestoneId}
    `;

    return NextResponse.json({
      success: true,
      message: 'Milestone rejected. Crew can resubmit.',
      milestone: {
        id: milestone.id,
        title: milestone.title,
        status: 'pending',
        feedback,
      },
    });
  }

  return NextResponse.json({ error: 'Invalid action. Use ?action=submit|approve|reject' }, { status: 400 });
}
