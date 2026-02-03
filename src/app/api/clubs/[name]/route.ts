import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

interface RouteParams {
  params: Promise<{ name: string }>;
}

// GET /api/clubs/:name - Get club info (public)
export async function GET(request: Request, { params }: RouteParams) {
  const { name } = await params;

  try {
    const clubs = await sql`
      SELECT 
        c.*,
        cr.username as creator_name,
        cr.display_name as creator_display_name
      FROM clubs c
      LEFT JOIN crabs cr ON c.creator_id = cr.id
      WHERE c.name = ${name}
    `;

    if (clubs.length === 0) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    const club = clubs[0];

    const memberCount = await sql`
      SELECT COUNT(*) as count FROM club_memberships WHERE club_id = ${club.id}
    `;

    return NextResponse.json({
      success: true,
      club: {
        name: club.name,
        display_name: club.display_name,
        description: club.description,
        member_count: Number(memberCount[0].count),
        treasury_balance: club.treasury_balance,
        treasury_wallet: club.treasury_wallet,
        creator: {
          name: club.creator_name,
          display_name: club.creator_display_name,
        },
        created_at: club.created_at,
      },
    });
  } catch (error) {
    console.error('Error fetching club:', error);
    return NextResponse.json({ error: 'Failed to fetch club' }, { status: 500 });
  }
}
