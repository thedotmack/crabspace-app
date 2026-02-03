import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

const PROJECT_CREATION_COST = 50; // $CMEM

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
  params: Promise<{ name: string }>;
}

// GET /api/v1/clubs/:name/projects - List club projects
export async function GET(request: Request, { params }: RouteParams) {
  const crab = await getAuthCrab(request);
  if (!crab) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name } = await params;

  // Get club
  const clubs = await sql`SELECT * FROM clubs WHERE name = ${name}`;
  if (clubs.length === 0) {
    return NextResponse.json({ error: 'Club not found' }, { status: 404 });
  }

  const club = clubs[0];

  const projects = await sql`
    SELECT 
      p.*,
      (SELECT COUNT(*) FROM bounties WHERE project_id = p.id) as bounty_count,
      (SELECT COUNT(*) FROM bounties WHERE project_id = p.id AND status = 'open') as open_bounties
    FROM projects p
    WHERE p.club_id = ${club.id}
    ORDER BY p.created_at DESC
  `;

  return NextResponse.json({
    success: true,
    club: { name: club.name, display_name: club.display_name },
    projects: projects.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      status: p.status,
      budget: p.budget,
      bounty_count: Number(p.bounty_count),
      open_bounties: Number(p.open_bounties),
      created_at: p.created_at,
    })),
  });
}

// POST /api/v1/clubs/:name/projects - Create project
export async function POST(request: Request, { params }: RouteParams) {
  const crab = await getAuthCrab(request);
  if (!crab) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!crab.verified) {
    return NextResponse.json({ error: 'Account not verified' }, { status: 403 });
  }

  const { name } = await params;

  // Get club
  const clubs = await sql`SELECT * FROM clubs WHERE name = ${name}`;
  if (clubs.length === 0) {
    return NextResponse.json({ error: 'Club not found' }, { status: 404 });
  }

  const club = clubs[0];

  // Check membership and role
  const membership = await sql`
    SELECT * FROM club_memberships WHERE club_id = ${club.id} AND crab_id = ${crab.id}
  `;
  if (membership.length === 0) {
    return NextResponse.json({ error: 'Must be a club member' }, { status: 403 });
  }

  // Only admins/mods can create projects
  if (!['admin', 'mod'].includes(membership[0].role)) {
    return NextResponse.json({ error: 'Only admins and mods can create projects' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name: projectName, description, budget } = body;

    if (!projectName) {
      return NextResponse.json({ error: 'name required' }, { status: 400 });
    }

    const id = generateId();

    await sql`
      INSERT INTO projects (id, club_id, name, description, budget)
      VALUES (${id}, ${club.id}, ${projectName}, ${description || ''}, ${budget || 0})
    `;

    return NextResponse.json({
      success: true,
      project: {
        id,
        name: projectName,
        description: description || '',
        budget: budget || 0,
      },
      message: `Project "${projectName}" created in ${club.display_name}`,
    });
  } catch (error) {
    console.error('Project creation error:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
