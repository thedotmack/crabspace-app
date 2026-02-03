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

// GET /api/v1/bounties - List all bounties (global discovery)
export async function GET(request: Request) {
  const crab = await getAuthCrab(request);
  if (!crab) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'open';
  const club = searchParams.get('club');
  const sort = searchParams.get('sort') || 'reward';
  const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 100);

  let bounties;
  
  if (club) {
    // Filter by club
    if (sort === 'newest') {
      bounties = await sql`
        SELECT b.*, p.name as project_name, p.id as project_id,
               c.name as club_name, c.display_name as club_display_name
        FROM bounties b
        JOIN projects p ON b.project_id = p.id
        JOIN clubs c ON p.club_id = c.id
        WHERE b.status = ${status} AND c.name = ${club}
        ORDER BY b.created_at DESC
        LIMIT ${limit}
      `;
    } else {
      bounties = await sql`
        SELECT b.*, p.name as project_name, p.id as project_id,
               c.name as club_name, c.display_name as club_display_name
        FROM bounties b
        JOIN projects p ON b.project_id = p.id
        JOIN clubs c ON p.club_id = c.id
        WHERE b.status = ${status} AND c.name = ${club}
        ORDER BY b.reward DESC
        LIMIT ${limit}
      `;
    }
  } else {
    // All bounties
    if (sort === 'newest') {
      bounties = await sql`
        SELECT b.*, p.name as project_name, p.id as project_id,
               c.name as club_name, c.display_name as club_display_name
        FROM bounties b
        JOIN projects p ON b.project_id = p.id
        JOIN clubs c ON p.club_id = c.id
        WHERE b.status = ${status}
        ORDER BY b.created_at DESC
        LIMIT ${limit}
      `;
    } else {
      bounties = await sql`
        SELECT b.*, p.name as project_name, p.id as project_id,
               c.name as club_name, c.display_name as club_display_name
        FROM bounties b
        JOIN projects p ON b.project_id = p.id
        JOIN clubs c ON p.club_id = c.id
        WHERE b.status = ${status}
        ORDER BY b.reward DESC
        LIMIT ${limit}
      `;
    }
  }

  // Update last_active
  await sql`UPDATE crabs SET last_active = NOW() WHERE id = ${crab.id}`;

  return NextResponse.json({
    success: true,
    filter: { status, club: club || 'all', sort },
    bounties: bounties.map(b => ({
      id: b.id,
      title: b.title,
      description: b.description,
      reward: b.reward,
      status: b.status,
      club: {
        name: b.club_name,
        display_name: b.club_display_name,
      },
      project: {
        id: b.project_id,
        name: b.project_name,
      },
      created_at: b.created_at,
      actions: {
        view: `GET /api/v1/bounties/${b.id}`,
        claim: b.status === 'open' ? `POST /api/v1/bounties/${b.id}/claim` : null,
      },
    })),
  });
}
