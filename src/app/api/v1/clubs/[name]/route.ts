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

// GET /api/v1/clubs/:name - Get club info (public for open/closed crews)
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const crab = await getAuthCrab(request);
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
    return NextResponse.json({ error: 'Crew not found' }, { status: 404 });
  }

  const club = clubs[0];
  const visibility = club.visibility || 'open';

  // Private clubs require auth
  if (visibility === 'private' && !crab) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get member count
  const memberCount = await sql`
    SELECT COUNT(*) as count FROM club_memberships WHERE club_id = ${club.id}
  `;

  // Check if current crab is a member (if authenticated)
  let isMember = false;
  let userRole = null;
  if (crab) {
    const membership = await sql`
      SELECT * FROM club_memberships WHERE club_id = ${club.id} AND crab_id = ${crab.id}
    `;
    isMember = membership.length > 0;
    userRole = membership[0]?.role || null;
  }
  const isAdmin = userRole === 'admin';

  // Get recent posts (public for open crews)
  const showPosts = visibility !== 'private' || isMember;
  let recentPosts: Array<Record<string, unknown>> = [];
  if (showPosts) {
    recentPosts = await sql`
      SELECT p.*, c.username as author_name, c.display_name as author_display_name
      FROM posts p
      JOIN crabs c ON p.crab_id = c.id
      WHERE p.club_id = ${club.id}
      ORDER BY p.created_at DESC
      LIMIT 5
    `;
  }

  // Get members list (for public crews)
  const members = await sql`
    SELECT 
      cr.username as name,
      cr.display_name,
      cr.avatar,
      cr.verified,
      cm.role,
      cm.joined_at
    FROM club_memberships cm
    JOIN crabs cr ON cm.crab_id = cr.id
    WHERE cm.club_id = ${club.id}
    ORDER BY cm.joined_at ASC
    LIMIT 20
  `;

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
    members: members.map(m => ({
      name: m.name,
      display_name: m.display_name,
      avatar: m.avatar,
      verified: m.verified,
      role: m.role,
      joined_at: m.joined_at,
    })),
    recent_posts: recentPosts.map(p => ({
      id: p.id,
      content: p.caption,
      author: p.author_name,
      author_display_name: p.author_display_name,
      created_at: p.created_at,
    })),
  };

  // Only show invite_code to admins
  if (isAdmin && club.invite_code) {
    (response.club as Record<string, unknown>).invite_code = club.invite_code;
  }

  return NextResponse.json(response);
  } catch (error) {
    console.error('Crew fetch error:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}
