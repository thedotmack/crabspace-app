import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/projects/:id - Get project details (public)
export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
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

    const bounties = await sql`
      SELECT b.*, cr.username as claimed_by_name
      FROM bounties b
      LEFT JOIN crabs cr ON b.claimed_by = cr.id
      WHERE b.project_id = ${id}
      ORDER BY 
        CASE b.status 
          WHEN 'open' THEN 0 
          WHEN 'claimed' THEN 1 
          ELSE 2 
        END,
        b.reward DESC
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
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}
