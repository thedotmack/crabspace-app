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
  params: Promise<{ name: string }>;
}

// GET /api/v1/clubs/:name - Get club info
export async function GET(request: Request, { params }: RouteParams) {
  const crab = await getAuthCrab(request);
  if (!crab) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name } = await params;

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

  // Get member count
  const memberCount = await sql`
    SELECT COUNT(*) as count FROM club_memberships WHERE club_id = ${club.id}
  `;

  // Check if current crab is a member
  const membership = await sql`
    SELECT * FROM club_memberships WHERE club_id = ${club.id} AND crab_id = ${crab.id}
  `;

  // Get recent posts
  const recentPosts = await sql`
    SELECT p.*, c.username as author_name
    FROM posts p
    JOIN crabs c ON p.crab_id = c.id
    WHERE p.club_id = ${club.id}
    ORDER BY p.created_at DESC
    LIMIT 5
  `;

  const isMember = membership.length > 0;
  const userRole = membership[0]?.role || null;
  const isAdmin = userRole === 'admin';
  const visibility = club.visibility || 'open';

  // For private clubs, hide recent posts from non-members
  const showPosts = visibility !== 'private' || isMember;

  const response: Record<string, unknown> = {
    success: true,
    club: {
      name: club.name,
      display_name: club.display_name,
      description: club.description,
      visibility,
      member_count: Number(memberCount[0].count),
      treasury_balance: club.treasury_balance,
      treasury_wallet: club.treasury_wallet,
      creator: {
        name: club.creator_name,
        display_name: club.creator_display_name,
      },
      created_at: club.created_at,
    },
    is_member: isMember,
    role: userRole,
    recent_posts: showPosts ? recentPosts.map(p => ({
      id: p.id,
      content: p.caption,
      author: p.author_name,
      created_at: p.created_at,
    })) : [],
  };

  // Only show invite_code to admins
  if (isAdmin && club.invite_code) {
    (response.club as Record<string, unknown>).invite_code = club.invite_code;
  }

  return NextResponse.json(response);
}
