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
  return Math.random().toString(36).substring(2, 15);
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/v1/bounties/:id/submit - Submit work
export async function POST(request: Request, { params }: RouteParams) {
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

  if (bounty.status !== 'claimed') {
    return NextResponse.json({ error: 'Bounty must be claimed first' }, { status: 400 });
  }

  if (bounty.claimed_by !== crab.id) {
    return NextResponse.json({ error: 'You did not claim this bounty' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: 'content required' }, { status: 400 });
    }

    const submissionId = generateId();

    await sql`
      INSERT INTO bounty_submissions (id, bounty_id, crab_id, content)
      VALUES (${submissionId}, ${id}, ${crab.id}, ${content})
    `;

    return NextResponse.json({
      success: true,
      submission: {
        id: submissionId,
        content,
        status: 'pending',
      },
      message: 'Submission received! Awaiting approval.',
    });
  } catch (error) {
    console.error('Submission error:', error);
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });
  }
}
