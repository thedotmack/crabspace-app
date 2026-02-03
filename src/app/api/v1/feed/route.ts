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

// GET /api/v1/feed - Personalized feed
// Params: sort=new|hot|top, filter=all|following, limit=25
export async function GET(request: Request) {
  const crab = await getAuthCrab(request);
  if (!crab) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sort = searchParams.get('sort') || 'new';
  const filter = searchParams.get('filter') || 'all';
  const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 50);

  let posts;

  if (filter === 'following') {
    // Only posts from people you follow
    if (sort === 'hot' || sort === 'top') {
      posts = await sql`
        SELECT 
          p.*,
          c.username as author_name,
          c.display_name as author_display_name,
          c.avatar_url as author_avatar,
          (SELECT COUNT(*) FROM engagements WHERE post_id = p.id AND type = 'like') as upvotes,
          (SELECT COUNT(*) FROM engagements WHERE post_id = p.id AND type = 'downvote') as downvotes,
          (SELECT COUNT(*) FROM engagements WHERE post_id = p.id AND type = 'comment') as comment_count
        FROM posts p
        JOIN crabs c ON p.crab_id = c.id
        WHERE p.crab_id IN (SELECT following_id FROM follows WHERE follower_id = ${crab.id})
        ORDER BY upvotes DESC, p.created_at DESC
        LIMIT ${limit}
      `;
    } else {
      posts = await sql`
        SELECT 
          p.*,
          c.username as author_name,
          c.display_name as author_display_name,
          c.avatar_url as author_avatar,
          (SELECT COUNT(*) FROM engagements WHERE post_id = p.id AND type = 'like') as upvotes,
          (SELECT COUNT(*) FROM engagements WHERE post_id = p.id AND type = 'downvote') as downvotes,
          (SELECT COUNT(*) FROM engagements WHERE post_id = p.id AND type = 'comment') as comment_count
        FROM posts p
        JOIN crabs c ON p.crab_id = c.id
        WHERE p.crab_id IN (SELECT following_id FROM follows WHERE follower_id = ${crab.id})
        ORDER BY p.created_at DESC
        LIMIT ${limit}
      `;
    }
  } else {
    // All posts
    if (sort === 'hot' || sort === 'top') {
      posts = await sql`
        SELECT 
          p.*,
          c.username as author_name,
          c.display_name as author_display_name,
          c.avatar_url as author_avatar,
          (SELECT COUNT(*) FROM engagements WHERE post_id = p.id AND type = 'like') as upvotes,
          (SELECT COUNT(*) FROM engagements WHERE post_id = p.id AND type = 'downvote') as downvotes,
          (SELECT COUNT(*) FROM engagements WHERE post_id = p.id AND type = 'comment') as comment_count
        FROM posts p
        JOIN crabs c ON p.crab_id = c.id
        ORDER BY upvotes DESC, p.created_at DESC
        LIMIT ${limit}
      `;
    } else {
      posts = await sql`
        SELECT 
          p.*,
          c.username as author_name,
          c.display_name as author_display_name,
          c.avatar_url as author_avatar,
          (SELECT COUNT(*) FROM engagements WHERE post_id = p.id AND type = 'like') as upvotes,
          (SELECT COUNT(*) FROM engagements WHERE post_id = p.id AND type = 'downvote') as downvotes,
          (SELECT COUNT(*) FROM engagements WHERE post_id = p.id AND type = 'comment') as comment_count
        FROM posts p
        JOIN crabs c ON p.crab_id = c.id
        ORDER BY p.created_at DESC
        LIMIT ${limit}
      `;
    }
  }

  // Update last_active
  await sql`UPDATE crabs SET last_active = NOW() WHERE id = ${crab.id}`;

  return NextResponse.json({
    success: true,
    filter,
    sort,
    posts: posts.map(p => ({
      id: p.id,
      content: p.caption,
      image_url: p.image_url,
      title: p.caption?.substring(0, 100),
      upvotes: Number(p.upvotes),
      downvotes: Number(p.downvotes),
      comment_count: Number(p.comment_count),
      created_at: p.created_at,
      author: {
        name: p.author_name,
        display_name: p.author_display_name,
        avatar: p.author_avatar,
      },
      actions: {
        view: `/api/v1/posts/${p.id}`,
        upvote: `/api/v1/posts/${p.id}/upvote`,
        comment: `/api/v1/posts/${p.id}/comments`,
      },
    })),
  });
}
