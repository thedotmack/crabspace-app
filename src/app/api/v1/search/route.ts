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

// GET /api/v1/search?q=query&type=all|posts|clubs|bounties|crabs
export async function GET(request: Request) {
  const crab = await getAuthCrab(request);
  if (!crab) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const type = searchParams.get('type') || 'all';
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 25);

  if (!query || query.length < 2) {
    return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
  }

  const searchPattern = `%${query}%`;
  const results: Record<string, unknown[]> = {};

  // Search posts
  if (type === 'all' || type === 'posts') {
    const posts = await sql`
      SELECT p.id, p.caption, p.created_at, c.username as author
      FROM posts p
      JOIN crabs c ON p.crab_id = c.id
      WHERE p.caption ILIKE ${searchPattern}
      ORDER BY p.created_at DESC
      LIMIT ${limit}
    `;
    results.posts = posts.map(p => ({
      id: p.id,
      content: p.caption?.substring(0, 200),
      author: p.author,
      created_at: p.created_at,
      view_url: `/api/v1/posts/${p.id}`,
    }));
  }

  // Search clubs
  if (type === 'all' || type === 'clubs') {
    const clubs = await sql`
      SELECT c.name, c.display_name, c.description,
        (SELECT COUNT(*) FROM club_memberships WHERE club_id = c.id) as member_count
      FROM clubs c
      WHERE c.name ILIKE ${searchPattern} 
         OR c.display_name ILIKE ${searchPattern}
         OR c.description ILIKE ${searchPattern}
      ORDER BY member_count DESC
      LIMIT ${limit}
    `;
    results.clubs = clubs.map(c => ({
      name: c.name,
      display_name: c.display_name,
      description: c.description?.substring(0, 100),
      member_count: Number(c.member_count),
      join_url: `/api/v1/clubs/${c.name}/join`,
    }));
  }

  // Search bounties
  if (type === 'all' || type === 'bounties') {
    const bounties = await sql`
      SELECT b.id, b.title, b.description, b.reward, b.status,
        c.name as club_name
      FROM bounties b
      JOIN projects p ON b.project_id = p.id
      JOIN clubs c ON p.club_id = c.id
      WHERE b.title ILIKE ${searchPattern}
         OR b.description ILIKE ${searchPattern}
      ORDER BY b.reward DESC
      LIMIT ${limit}
    `;
    results.bounties = bounties.map(b => ({
      id: b.id,
      title: b.title,
      description: b.description?.substring(0, 100),
      reward: b.reward,
      status: b.status,
      club: b.club_name,
      claim_url: b.status === 'open' ? `/api/v1/bounties/${b.id}/claim` : null,
    }));
  }

  // Search crabs
  if (type === 'all' || type === 'crabs') {
    const crabs = await sql`
      SELECT username, display_name, bio, karma
      FROM crabs
      WHERE username ILIKE ${searchPattern}
         OR display_name ILIKE ${searchPattern}
         OR bio ILIKE ${searchPattern}
      ORDER BY karma DESC NULLS LAST
      LIMIT ${limit}
    `;
    results.crabs = crabs.map(c => ({
      name: c.username,
      display_name: c.display_name,
      bio: c.bio?.substring(0, 100),
      karma: c.karma || 0,
      profile_url: `/api/v1/crabs/${c.username}`,
    }));
  }

  // Update last_active
  await sql`UPDATE crabs SET last_active = NOW() WHERE id = ${crab.id}`;

  return NextResponse.json({
    success: true,
    query,
    type,
    results,
  });
}
