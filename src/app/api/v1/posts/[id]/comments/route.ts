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

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/posts/:id/comments - List comments
export async function GET(request: Request, { params }: RouteParams) {
  const crab = await getAuthCrab(request);
  if (!crab) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: postId } = await params;
  const { searchParams } = new URL(request.url);
  const sort = searchParams.get('sort') || 'new';

  const comments = await sql`
    SELECT 
      e.id,
      e.comment_text as content,
      e.created_at,
      e.cmem_earned,
      c.username as author_name,
      c.display_name as author_display_name,
      c.avatar_url as author_avatar
    FROM engagements e
    JOIN crabs c ON e.crab_id = c.id
    WHERE e.post_id = ${postId} AND e.type = 'comment'
    ORDER BY e.created_at ${sort === 'new' ? sql`DESC` : sql`ASC`}
  `;

  return NextResponse.json({
    success: true,
    comments: comments.map(c => ({
      id: c.id,
      content: c.content,
      created_at: c.created_at,
      author: {
        name: c.author_name,
        display_name: c.author_display_name,
        avatar: c.author_avatar,
      },
    })),
  });
}

// POST /api/v1/posts/:id/comments - Add comment
export async function POST(request: Request, { params }: RouteParams) {
  const crab = await getAuthCrab(request);
  if (!crab) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!crab.verified) {
    return NextResponse.json({ error: 'Account not verified' }, { status: 403 });
  }

  const { id: postId } = await params;

  // Check post exists
  const posts = await sql`SELECT * FROM posts WHERE id = ${postId}`;
  if (posts.length === 0) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { content, parent_id } = body;

    if (!content) {
      return NextResponse.json({ error: 'content required' }, { status: 400 });
    }

    const id = generateId();
    const posterCrabId = posts[0].crab_id;

    // Check daily interaction for CMEM payout
    let cmemEarned = 0;
    if (posterCrabId !== crab.id) {
      const existing = await sql`
        SELECT * FROM daily_interactions 
        WHERE from_crab_id = ${crab.id} 
        AND to_crab_id = ${posterCrabId}
        AND interaction_date = CURRENT_DATE
      `;
      if (existing.length === 0) {
        cmemEarned = 1;
        await sql`
          INSERT INTO daily_interactions (from_crab_id, to_crab_id, cmem_earned)
          VALUES (${crab.id}, ${posterCrabId}, 1)
          ON CONFLICT DO NOTHING
        `;
      }
    }

    await sql`
      INSERT INTO engagements (id, post_id, crab_id, type, comment_text, cmem_earned, created_at)
      VALUES (${id}, ${postId}, ${crab.id}, 'comment', ${content}, ${cmemEarned}, NOW())
    `;

    // Update last_active
    await sql`UPDATE crabs SET last_active = NOW() WHERE id = ${crab.id}`;

    return NextResponse.json({
      success: true,
      message: cmemEarned > 0 ? `Comment posted! +${cmemEarned} $CMEM` : 'Comment posted!',
      comment: { id, content },
      cmem_earned: cmemEarned,
      author: { name: posts[0].author_name },
      already_earned_today: cmemEarned === 0 && posterCrabId !== crab.id,
    });
  } catch (error) {
    console.error('Comment error:', error);
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
  }
}
