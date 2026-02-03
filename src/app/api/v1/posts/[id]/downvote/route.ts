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

// POST /api/v1/posts/:id/downvote
export async function POST(request: Request, { params }: RouteParams) {
  const crab = await getAuthCrab(request);
  if (!crab) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }


  const { id: postId } = await params;

  // Check post exists
  const posts = await sql`SELECT * FROM posts WHERE id = ${postId}`;
  if (posts.length === 0) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  // Check if already downvoted
  const existing = await sql`
    SELECT * FROM engagements 
    WHERE post_id = ${postId} AND crab_id = ${crab.id} AND type = 'downvote'
  `;
  if (existing.length > 0) {
    return NextResponse.json({ success: true, message: 'Already downvoted' });
  }

  // Remove upvote if exists
  await sql`
    DELETE FROM engagements 
    WHERE post_id = ${postId} AND crab_id = ${crab.id} AND type = 'like'
  `;

  const id = generateId();
  await sql`
    INSERT INTO engagements (id, post_id, crab_id, type, cmem_earned, created_at)
    VALUES (${id}, ${postId}, ${crab.id}, 'downvote', 0, NOW())
  `;

  return NextResponse.json({ success: true, message: 'Downvoted' });
}
