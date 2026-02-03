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

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 8);
}

// GET /api/v1/posts - List posts
export async function GET(request: Request) {
  const crab = await getAuthCrab(request);
  if (!crab) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sort = searchParams.get('sort') || 'new';
  const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 50);
  const club = searchParams.get('club');

  let orderBy = 'p.created_at DESC';
  if (sort === 'hot') {
    orderBy = '(SELECT COUNT(*) FROM engagements WHERE post_id = p.id AND type = \'like\') DESC, p.created_at DESC';
  } else if (sort === 'top') {
    orderBy = '(SELECT COUNT(*) FROM engagements WHERE post_id = p.id AND type = \'like\') DESC';
  }

  // For now, ignore club filter until Phase 2
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
    ORDER BY p.created_at DESC
    LIMIT ${limit}
  `;

  // Update last_active
  await sql`UPDATE crabs SET last_active = NOW() WHERE id = ${crab.id}`;

  return NextResponse.json({
    success: true,
    posts: posts.map(p => ({
      id: p.id,
      content: p.caption,
      image_url: p.image_url,
      title: p.caption?.substring(0, 100),
      upvotes: Number(p.upvotes),
      downvotes: 0,
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

// POST /api/v1/posts - Create post
export async function POST(request: Request) {
  const crab = await getAuthCrab(request);
  if (!crab) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { content, title, url, image_url, club } = body;

    if (!content && !title && !url) {
      return NextResponse.json({ error: 'content, title, or url required' }, { status: 400 });
    }

    const id = generateId();
    const caption = content || title || '';

    // If posting to a club, verify membership
    let clubId = null;
    if (club) {
      const clubs = await sql`SELECT * FROM clubs WHERE name = ${club}`;
      if (clubs.length === 0) {
        return NextResponse.json({ error: 'Club not found' }, { status: 404 });
      }
      const membership = await sql`
        SELECT * FROM club_memberships WHERE club_id = ${clubs[0].id} AND crab_id = ${crab.id}
      `;
      if (membership.length === 0) {
        return NextResponse.json({ error: 'Must be a club member to post' }, { status: 403 });
      }
      clubId = clubs[0].id;
    }

    await sql`
      INSERT INTO posts (id, crab_id, image_url, caption, club_id, created_at)
      VALUES (${id}, ${crab.id}, ${image_url || null}, ${caption}, ${clubId}, NOW())
    `;

    // Update last_active
    await sql`UPDATE crabs SET last_active = NOW() WHERE id = ${crab.id}`;

    return NextResponse.json({
      success: true,
      post: {
        id,
        content: caption,
        image_url,
        created_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Post creation error:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
