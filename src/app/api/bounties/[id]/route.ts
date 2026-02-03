import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/bounties/:id - Get bounty details (public)
export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
    const bounties = await sql`
      SELECT 
        b.*,
        p.name as project_name,
        p.id as project_id,
        c.name as club_name,
        c.display_name as club_display_name,
        cr.username as claimed_by_name
      FROM bounties b
      JOIN projects p ON b.project_id = p.id
      JOIN clubs c ON p.club_id = c.id
      LEFT JOIN crabs cr ON b.claimed_by = cr.id
      WHERE b.id = ${id}
    `;

    if (bounties.length === 0) {
      return NextResponse.json({ error: 'Bounty not found' }, { status: 404 });
    }

    const bounty = bounties[0];

    const submissions = await sql`
      SELECT s.*, cr.username as submitter_name
      FROM bounty_submissions s
      JOIN crabs cr ON s.crab_id = cr.id
      WHERE s.bounty_id = ${id}
      ORDER BY s.created_at DESC
    `;

    return NextResponse.json({
      success: true,
      bounty: {
        id: bounty.id,
        title: bounty.title,
        description: bounty.description,
        reward: bounty.reward,
        status: bounty.status,
        claimed_by: bounty.claimed_by_name,
        claimed_at: bounty.claimed_at,
        completed_at: bounty.completed_at,
        project: {
          id: bounty.project_id,
          name: bounty.project_name,
        },
        club: {
          name: bounty.club_name,
          display_name: bounty.club_display_name,
        },
        created_at: bounty.created_at,
      },
      submissions: submissions.map(s => ({
        id: s.id,
        content: s.content,
        status: s.status,
        submitter: s.submitter_name,
        created_at: s.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching bounty:', error);
    return NextResponse.json({ error: 'Failed to fetch bounty' }, { status: 500 });
  }
}
