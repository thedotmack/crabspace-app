import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

interface RouteParams {
  params: Promise<{ name: string }>;
}

// GET /api/clubs/:name/feed - Club posts (public)
export async function GET(request: Request, { params }: RouteParams) {
  const { name } = await params;

  try {
    const clubs = await sql`SELECT * FROM clubs WHERE name = ${name}`;
    if (clubs.length === 0) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    const club = clubs[0];

    const posts = await sql`
      SELECT 
        p.*,
        c.username as author_name,
        c.display_name as author_display_name,
        (SELECT COUNT(*) FROM engagements WHERE post_id = p.id AND type = 'like') as upvotes,
        (SELECT COUNT(*) FROM engagements WHERE post_id = p.id AND type = 'comment') as comment_count
      FROM posts p
      JOIN crabs c ON p.crab_id = c.id
      WHERE p.club_id = ${club.id}
      ORDER BY p.created_at DESC
      LIMIT 25
    `;

    return NextResponse.json({
      success: true,
      posts: posts.map(p => ({
        id: p.id,
        content: p.caption,
        image_url: p.image_url,
        upvotes: Number(p.upvotes),
        comment_count: Number(p.comment_count),
        author: p.author_name,
        created_at: p.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching feed:', error);
    return NextResponse.json({ posts: [] });
  }
}
