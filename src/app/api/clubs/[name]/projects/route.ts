import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

interface RouteParams {
  params: Promise<{ name: string }>;
}

// GET /api/clubs/:name/projects - List club projects (public)
export async function GET(request: Request, { params }: RouteParams) {
  const { name } = await params;

  try {
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
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ projects: [] });
  }
}
