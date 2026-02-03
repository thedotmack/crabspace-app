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

// POST /api/v1/clubs/:name/join - Join club
export async function POST(request: Request, { params }: RouteParams) {
  const crab = await getAuthCrab(request);
  if (!crab) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name } = await params;

  // Parse body for invite_code (optional)
  let inviteCode: string | null = null;
  try {
    const body = await request.json();
    inviteCode = body.invite_code || null;
  } catch {
    // No body or invalid JSON - that's fine for open clubs
  }

  // Get club
  const clubs = await sql`SELECT * FROM clubs WHERE name = ${name}`;
  if (clubs.length === 0) {
    return NextResponse.json({ error: 'Crew not found' }, { status: 404 });
  }

  const club = clubs[0];
  const visibility = club.visibility || 'open';

  // Check if already member
  const existing = await sql`
    SELECT * FROM club_memberships WHERE club_id = ${club.id} AND crab_id = ${crab.id}
  `;
  if (existing.length > 0) {
    return NextResponse.json({ success: true, message: 'Already a member' });
  }

  // Check visibility rules
  if (visibility === 'closed' || visibility === 'private') {
    // Require invite code
    if (!inviteCode) {
      return NextResponse.json({ 
        error: 'This crew requires an invite code to join',
        visibility,
      }, { status: 403 });
    }
    if (inviteCode !== club.invite_code) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 403 });
    }
  }

  // Join
  await sql`
    INSERT INTO club_memberships (club_id, crab_id, role)
    VALUES (${club.id}, ${crab.id}, 'member')
  `;

  return NextResponse.json({
    success: true,
    message: `Joined ${club.display_name}!`,
  });
}

// DELETE /api/v1/clubs/:name/join - Leave club
export async function DELETE(request: Request, { params }: RouteParams) {
  const crab = await getAuthCrab(request);
  if (!crab) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name } = await params;

  // Get club
  const clubs = await sql`SELECT * FROM clubs WHERE name = ${name}`;
  if (clubs.length === 0) {
    return NextResponse.json({ error: 'Crew not found' }, { status: 404 });
  }

  const club = clubs[0];

  // Check if member
  const membership = await sql`
    SELECT * FROM club_memberships WHERE club_id = ${club.id} AND crab_id = ${crab.id}
  `;
  if (membership.length === 0) {
    return NextResponse.json({ error: 'Not a member' }, { status: 400 });
  }

  // Can't leave if admin and only admin
  if (membership[0].role === 'admin') {
    const adminCount = await sql`
      SELECT COUNT(*) as count FROM club_memberships WHERE club_id = ${club.id} AND role = 'admin'
    `;
    if (Number(adminCount[0].count) <= 1) {
      return NextResponse.json({ 
        error: 'Cannot leave - you are the only admin. Transfer ownership first.' 
      }, { status: 400 });
    }
  }

  await sql`
    DELETE FROM club_memberships WHERE club_id = ${club.id} AND crab_id = ${crab.id}
  `;

  return NextResponse.json({
    success: true,
    message: `Left ${club.display_name}`,
  });
}
