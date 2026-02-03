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

// GET /api/v1/projects/:id - Get project details
export async function GET(request: Request, { params }: RouteParams) {
  const crab = await getAuthCrab(request);
  if (!crab) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const projects = await sql`
    SELECT p.*, c.name as club_name, c.display_name as club_display_name
    FROM projects p
    JOIN clubs c ON p.club_id = c.id
    WHERE p.id = ${id}
  `;

  if (projects.length === 0) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const project = projects[0];

  // Get bounties
  const bounties = await sql`
    SELECT 
      b.*,
      cr.username as claimed_by_name
    FROM bounties b
    LEFT JOIN crabs cr ON b.claimed_by = cr.id
    WHERE b.project_id = ${id}
    ORDER BY b.created_at DESC
  `;

  return NextResponse.json({
    success: true,
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      budget: project.budget,
      club: {
        name: project.club_name,
        display_name: project.club_display_name,
      },
      created_at: project.created_at,
    },
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
