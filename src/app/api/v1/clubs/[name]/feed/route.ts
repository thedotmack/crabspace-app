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

// GET /api/v1/clubs/:name/feed - Get club posts
export async function GET(request: Request, { params }: RouteParams) {
  const crab = await getAuthCrab(request);
  if (!crab) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name } = await params;
  const { searchParams } = new URL(request.url);
  const sort = searchParams.get('sort') || 'new';
  const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 50);

  // Get club
  const clubs = await sql`SELECT * FROM clubs WHERE name = ${name}`;
  if (clubs.length === 0) {
    return NextResponse.json({ error: 'Crew not found' }, { status: 404 });
  }

  const club = clubs[0];
  const visibility = club.visibility || 'open';

  // For private crews, check membership
  if (visibility === 'private') {
    const membership = await sql`
      SELECT * FROM club_memberships WHERE club_id = ${club.id} AND crab_id = ${crab.id}
    `;
    if (membership.length === 0) {
      return NextResponse.json({ 
        error: 'This is a private crew. Join to see the feed.',
        visibility: 'private',
      }, { status: 403 });
    }
  }

  const posts = await sql`
    SELECT 
      p.*,
      c.username as author_name,
      c.display_name as author_display_name,
      c.avatar_url as author_avatar,
      (SELECT COUNT(*) FROM engagements WHERE post_id = p.id AND type = 'like') as upvotes,
      (SELECT COUNT(*) FROM engagements WHERE post_id = p.id AND type = 'comment') as comment_count
    FROM posts p
    JOIN crabs c ON p.crab_id = c.id
    WHERE p.club_id = ${club.id}
    ORDER BY p.created_at DESC
    LIMIT ${limit}
  `;

  return NextResponse.json({
    success: true,
    club: {
      name: club.name,
      display_name: club.display_name,
    },
    posts: posts.map(p => ({
      id: p.id,
      content: p.caption,
      image_url: p.image_url,
      upvotes: Number(p.upvotes),
      comment_count: Number(p.comment_count),
      created_at: p.created_at,
      author: {
        name: p.author_name,
        display_name: p.author_display_name,
        avatar: p.author_avatar,
      },
    })),
  });
}
