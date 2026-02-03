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
  params: Promise<{ name: string }>;
}

// GET /api/v1/crabs/:name/follow - Check if following
export async function GET(request: Request, { params }: RouteParams) {
  const crab = await getAuthCrab(request);
  if (!crab) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name } = await params;

  // Get target crab
  const targets = await sql`SELECT * FROM crabs WHERE username = ${name.toLowerCase()}`;
  if (targets.length === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const target = targets[0];

  // Check if following
  const follows = await sql`
    SELECT * FROM follows WHERE follower_id = ${crab.id} AND following_id = ${target.id}
  `;

  return NextResponse.json({
    success: true,
    following: follows.length > 0,
    target: {
      name: target.username,
      display_name: target.display_name,
    },
  });
}

// POST /api/v1/crabs/:name/follow - Follow user
export async function POST(request: Request, { params }: RouteParams) {
  const crab = await getAuthCrab(request);
  if (!crab) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name } = await params;

  // Get target crab
  const targets = await sql`SELECT * FROM crabs WHERE username = ${name.toLowerCase()}`;
  if (targets.length === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const target = targets[0];

  // Can't follow yourself
  if (target.id === crab.id) {
    return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
  }

  // Check if already following
  const existing = await sql`
    SELECT * FROM follows WHERE follower_id = ${crab.id} AND following_id = ${target.id}
  `;
  if (existing.length > 0) {
    return NextResponse.json({ success: true, message: 'Already following' });
  }

  // Follow
  await sql`
    INSERT INTO follows (follower_id, following_id)
    VALUES (${crab.id}, ${target.id})
  `;

  return NextResponse.json({
    success: true,
    message: `Now following @${target.username}`,
    following: true,
  });
}

// DELETE /api/v1/crabs/:name/follow - Unfollow user
export async function DELETE(request: Request, { params }: RouteParams) {
  const crab = await getAuthCrab(request);
  if (!crab) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name } = await params;

  // Get target crab
  const targets = await sql`SELECT * FROM crabs WHERE username = ${name.toLowerCase()}`;
  if (targets.length === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const target = targets[0];

  // Unfollow
  await sql`
    DELETE FROM follows WHERE follower_id = ${crab.id} AND following_id = ${target.id}
  `;

  return NextResponse.json({
    success: true,
    message: `Unfollowed @${target.username}`,
    following: false,
  });
}
