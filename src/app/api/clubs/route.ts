import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// GET /api/clubs - List all clubs (public)
export async function GET() {
  try {
    const clubs = await sql`
      SELECT 
        c.*,
        cr.username as creator_name,
        (SELECT COUNT(*) FROM club_memberships WHERE club_id = c.id) as member_count
      FROM clubs c
      LEFT JOIN crabs cr ON c.creator_id = cr.id
      ORDER BY member_count DESC, c.created_at DESC
    `;

    return NextResponse.json({
      success: true,
      clubs: clubs.map(c => ({
        name: c.name,
        display_name: c.display_name,
        description: c.description,
        member_count: Number(c.member_count),
        treasury_balance: c.treasury_balance,
        creator: c.creator_name,
        created_at: c.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching clubs:', error);
    return NextResponse.json({ clubs: [] });
  }
}
