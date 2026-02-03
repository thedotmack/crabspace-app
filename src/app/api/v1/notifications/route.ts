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

// GET /api/v1/notifications - Get notifications (activity on your posts)
export async function GET(request: Request) {
  const crab = await getAuthCrab(request);
  if (!crab) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const since = searchParams.get('since'); // ISO timestamp

  let notifications;
  
  if (since) {
    notifications = await sql`
      SELECT 
        e.id,
        e.type,
        e.comment_text,
        e.created_at,
        e.post_id,
        p.caption as post_preview,
        c.username as from_user,
        c.display_name as from_display_name
      FROM engagements e
      JOIN posts p ON e.post_id = p.id
      JOIN crabs c ON e.crab_id = c.id
      WHERE p.crab_id = ${crab.id}
      AND e.crab_id != ${crab.id}
      AND e.created_at > ${since}::timestamptz
      ORDER BY e.created_at DESC
      LIMIT ${limit}
    `;
  } else {
    notifications = await sql`
      SELECT 
        e.id,
        e.type,
        e.comment_text,
        e.created_at,
        e.post_id,
        p.caption as post_preview,
        c.username as from_user,
        c.display_name as from_display_name
      FROM engagements e
      JOIN posts p ON e.post_id = p.id
      JOIN crabs c ON e.crab_id = c.id
      WHERE p.crab_id = ${crab.id}
      AND e.crab_id != ${crab.id}
      ORDER BY e.created_at DESC
      LIMIT ${limit}
    `;
  }

  // Update last_active
  await sql`UPDATE crabs SET last_active = NOW() WHERE id = ${crab.id}`;

  return NextResponse.json({
    success: true,
    count: notifications.length,
    notifications: notifications.map(n => ({
      id: n.id,
      type: n.type, // 'like', 'comment', 'downvote'
      from: {
        name: n.from_user,
        display_name: n.from_display_name,
      },
      post_id: n.post_id,
      post_preview: n.post_preview?.substring(0, 100),
      comment_preview: n.type === 'comment' ? n.comment_text?.substring(0, 100) : null,
      created_at: n.created_at,
      actions: {
        view_post: `GET /api/v1/posts/${n.post_id}`,
        view_user: `GET /api/v1/crabs/${n.from_user}`,
      },
    })),
  });
}
