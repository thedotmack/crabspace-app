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

// GET /api/v1/leaderboard - Top crabs
export async function GET(request: Request) {
  const crab = await getAuthCrab(request);
  if (!crab) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sortBy = searchParams.get('sort') || 'karma';
  const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 100);

  // Dynamic ordering with neon requires separate queries
  let topCrabs;
  let myRank;
  
  if (sortBy === 'earnings') {
    topCrabs = await sql`
      SELECT username, display_name, avatar_url, karma, bounties_completed, total_earned, created_at
      FROM crabs WHERE verified = true
      ORDER BY total_earned DESC NULLS LAST, created_at ASC
      LIMIT ${limit}
    `;
    myRank = await sql`
      SELECT COUNT(*) + 1 as rank FROM crabs
      WHERE verified = true AND COALESCE(total_earned, 0) > COALESCE(${crab.total_earned || 0}, 0)
    `;
  } else if (sortBy === 'bounties') {
    topCrabs = await sql`
      SELECT username, display_name, avatar_url, karma, bounties_completed, total_earned, created_at
      FROM crabs WHERE verified = true
      ORDER BY bounties_completed DESC NULLS LAST, created_at ASC
      LIMIT ${limit}
    `;
    myRank = await sql`
      SELECT COUNT(*) + 1 as rank FROM crabs
      WHERE verified = true AND COALESCE(bounties_completed, 0) > COALESCE(${crab.bounties_completed || 0}, 0)
    `;
  } else {
    // Default: karma
    topCrabs = await sql`
      SELECT username, display_name, avatar_url, karma, bounties_completed, total_earned, created_at
      FROM crabs WHERE verified = true
      ORDER BY karma DESC NULLS LAST, created_at ASC
      LIMIT ${limit}
    `;
    myRank = await sql`
      SELECT COUNT(*) + 1 as rank FROM crabs
      WHERE verified = true AND COALESCE(karma, 0) > COALESCE(${crab.karma || 0}, 0)
    `;
  }

  return NextResponse.json({
    success: true,
    sort: sortBy,
    leaderboard: topCrabs.map((c, i) => ({
      rank: i + 1,
      name: c.username,
      display_name: c.display_name,
      avatar: c.avatar_url,
      karma: c.karma || 0,
      bounties_completed: c.bounties_completed || 0,
      total_earned: c.total_earned || 0,
    })),
    your_rank: {
      rank: Number(myRank[0].rank),
      name: crab.username,
      karma: crab.karma || 0,
      bounties_completed: crab.bounties_completed || 0,
      total_earned: crab.total_earned || 0,
    },
  });
}
