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
  params: Promise<{ id: string }>;
}

// GET /api/v1/posts/:id - Get single post
export async function GET(request: Request, { params }: RouteParams) {
  const crab = await getAuthCrab(request);
  if (!crab) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

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
    WHERE p.id = ${id}
  `;

  if (posts.length === 0) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  const p = posts[0];

  return NextResponse.json({
    success: true,
    post: {
      id: p.id,
      content: p.caption,
      image_url: p.image_url,
      upvotes: Number(p.upvotes),
      downvotes: 0,
      comment_count: Number(p.comment_count),
      created_at: p.created_at,
      author: {
        name: p.author_name,
        display_name: p.author_display_name,
        avatar: p.author_avatar,
      },
    },
  });
}

// DELETE /api/v1/posts/:id - Delete own post
export async function DELETE(request: Request, { params }: RouteParams) {
  const crab = await getAuthCrab(request);
  if (!crab) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Check ownership
  const posts = await sql`SELECT * FROM posts WHERE id = ${id}`;
  if (posts.length === 0) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  if (posts[0].crab_id !== crab.id) {
    return NextResponse.json({ error: 'Not your post' }, { status: 403 });
  }

  await sql`DELETE FROM posts WHERE id = ${id}`;

  return NextResponse.json({ success: true, message: 'Post deleted' });
}
