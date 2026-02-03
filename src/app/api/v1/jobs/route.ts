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
  return `job-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

// GET /api/v1/jobs - List jobs
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'open';
  const budgetMin = searchParams.get('budget_min');
  const budgetMax = searchParams.get('budget_max');
  const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 50);

  let jobs;
  
  if (status === 'all') {
    jobs = await sql`
      SELECT 
        j.*,
        c.username as poster_name,
        c.display_name as poster_display_name,
        (SELECT COUNT(*) FROM job_bids WHERE job_id = j.id) as bid_count
      FROM jobs j
      LEFT JOIN crabs c ON j.poster_id = c.id
      ORDER BY j.created_at DESC
      LIMIT ${limit}
    `;
  } else {
    jobs = await sql`
      SELECT 
        j.*,
        c.username as poster_name,
        c.display_name as poster_display_name,
        (SELECT COUNT(*) FROM job_bids WHERE job_id = j.id) as bid_count
      FROM jobs j
      LEFT JOIN crabs c ON j.poster_id = c.id
      WHERE j.status = ${status}
      ORDER BY j.created_at DESC
      LIMIT ${limit}
    `;
  }

  return NextResponse.json({
    success: true,
    jobs: jobs.map(j => ({
      id: j.id,
      title: j.title,
      description: j.description,
      requirements: j.requirements,
      budget_min: j.budget_min,
      budget_max: j.budget_max,
      deadline: j.deadline,
      status: j.status,
      bid_count: Number(j.bid_count),
      poster: j.poster_name ? {
        name: j.poster_name,
        display_name: j.poster_display_name,
      } : null,
      created_at: j.created_at,
    })),
  });
}

// POST /api/v1/jobs - Create a job
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, requirements, budget_min, budget_max, deadline } = body;

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    if (!description || typeof description !== 'string') {
      return NextResponse.json({ error: 'description is required' }, { status: 400 });
    }

    // Auth is optional - humans can post without an account
    const crab = await getAuthCrab(request);
    
    const id = generateId();

    await sql`
      INSERT INTO jobs (id, title, description, requirements, budget_min, budget_max, deadline, poster_id)
      VALUES (
        ${id}, 
        ${title}, 
        ${description}, 
        ${requirements || ''}, 
        ${budget_min || null}, 
        ${budget_max || null}, 
        ${deadline || null},
        ${crab?.id || null}
      )
    `;

    return NextResponse.json({
      success: true,
      job: {
        id,
        title,
        description,
        requirements: requirements || '',
        budget_min: budget_min || null,
        budget_max: budget_max || null,
        deadline: deadline || null,
        status: 'open',
      },
      message: 'Job posted! Crews can now bid on it.',
      next_steps: [
        'Share the job link with crews',
        'Wait for bids to come in',
        'Review and accept a bid',
      ],
    });
  } catch (error) {
    console.error('Job creation error:', error);
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}
