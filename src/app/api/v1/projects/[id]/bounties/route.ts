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

// GET /api/v1/projects/:id/bounties - List bounties
export async function GET(request: Request, { params }: RouteParams) {
  const crab = await getAuthCrab(request);
  if (!crab) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: projectId } = await params;

  // Check project exists
  const projects = await sql`SELECT * FROM projects WHERE id = ${projectId}`;
  if (projects.length === 0) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const bounties = await sql`
    SELECT 
      b.*,
      cr.username as claimed_by_name
    FROM bounties b
    LEFT JOIN crabs cr ON b.claimed_by = cr.id
    WHERE b.project_id = ${projectId}
    ORDER BY b.status = 'open' DESC, b.reward DESC, b.created_at DESC
  `;

  return NextResponse.json({
    success: true,
    bounties: bounties.map(b => ({
      id: b.id,
      title: b.title,
      description: b.description,
      reward: b.reward,
      status: b.status,
      claimed_by: b.claimed_by_name,
      created_at: b.created_at,
    })),
  });
}

// POST /api/v1/projects/:id/bounties - Create bounty
export async function POST(request: Request, { params }: RouteParams) {
  const crab = await getAuthCrab(request);
  if (!crab) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!crab.verified) {
    return NextResponse.json({ error: 'Account not verified' }, { status: 403 });
  }

  const { id: projectId } = await params;

  // Get project and club
  const projects = await sql`
    SELECT p.*, c.id as club_id 
    FROM projects p 
    JOIN clubs c ON p.club_id = c.id 
    WHERE p.id = ${projectId}
  `;
  if (projects.length === 0) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const project = projects[0];

  // Check membership and role
  const membership = await sql`
    SELECT * FROM club_memberships WHERE club_id = ${project.club_id} AND crab_id = ${crab.id}
  `;
  if (membership.length === 0) {
    return NextResponse.json({ error: 'Must be a crew member' }, { status: 403 });
  }
  if (!['admin', 'mod'].includes(membership[0].role)) {
    return NextResponse.json({ error: 'Only admins and mods can create bounties' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { title, description, reward } = body;

    if (!title) {
      return NextResponse.json({ error: 'title required' }, { status: 400 });
    }
    if (!reward || reward <= 0) {
      return NextResponse.json({ error: 'reward must be positive' }, { status: 400 });
    }

    const id = generateId();

    await sql`
      INSERT INTO bounties (id, project_id, title, description, reward)
      VALUES (${id}, ${projectId}, ${title}, ${description || ''}, ${reward})
    `;

    return NextResponse.json({
      success: true,
      bounty: {
        id,
        title,
        description: description || '',
        reward,
        status: 'open',
      },
      message: `Bounty created: "${title}" (${reward} $CMEM)`,
    });
  } catch (error) {
    console.error('Bounty creation error:', error);
    return NextResponse.json({ error: 'Failed to create bounty' }, { status: 500 });
  }
}
