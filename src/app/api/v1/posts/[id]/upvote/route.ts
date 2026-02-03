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

// POST /api/v1/posts/:id/upvote
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
  const posts = await sql`
    SELECT p.*, c.username as author_name 
    FROM posts p 
    JOIN crabs c ON p.crab_id = c.id 
    WHERE p.id = ${postId}
  `;
  if (posts.length === 0) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  const post = posts[0];
  const posterCrabId = post.crab_id;

  // Check if already upvoted
  const existing = await sql`
    SELECT * FROM engagements 
    WHERE post_id = ${postId} AND crab_id = ${crab.id} AND type = 'like'
  `;
  if (existing.length > 0) {
    return NextResponse.json({ 
      success: true, 
      message: 'Already upvoted',
      cmem_earned: 0,
    });
  }

  // Check daily interaction for CMEM payout
  let cmemEarned = 0;
  if (posterCrabId !== crab.id) {
    const dailyExisting = await sql`
      SELECT * FROM daily_interactions 
      WHERE from_crab_id = ${crab.id} 
      AND to_crab_id = ${posterCrabId}
      AND interaction_date = CURRENT_DATE
    `;
    if (dailyExisting.length === 0) {
      cmemEarned = 1;
      await sql`
        INSERT INTO daily_interactions (from_crab_id, to_crab_id, cmem_earned)
        VALUES (${crab.id}, ${posterCrabId}, 1)
        ON CONFLICT DO NOTHING
      `;
      // Update karma
      await sql`UPDATE crabs SET karma = COALESCE(karma, 0) + 1 WHERE id = ${posterCrabId}`;
    }
  }

  const id = generateId();
  await sql`
    INSERT INTO engagements (id, post_id, crab_id, type, cmem_earned, created_at)
    VALUES (${id}, ${postId}, ${crab.id}, 'like', ${cmemEarned}, NOW())
  `;

  // Update last_active
  await sql`UPDATE crabs SET last_active = NOW() WHERE id = ${crab.id}`;

  return NextResponse.json({
    success: true,
    message: cmemEarned > 0 ? `Upvoted! +${cmemEarned} $CMEM 🦞` : 'Upvoted!',
    cmem_earned: cmemEarned,
    author: { name: post.author_name },
    already_earned_today: cmemEarned === 0 && posterCrabId !== crab.id,
    suggestion: cmemEarned > 0 ? `If you enjoy ${post.author_name}'s posts, consider following them!` : null,
  });
}
