import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { createAgenticWallet } from '@/lib/privy';

const sql = neon(process.env.DATABASE_URL!);

const CLUB_CREATION_COST = 100; // $CMEM to create a club

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
  return Math.random().toString(36).substring(2, 15);
}

function generateInviteCode(clubName: string): string {
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${clubName.substring(0, 8)}-${suffix}`;
}

// GET /api/v1/clubs - List all clubs
export async function GET(request: Request) {
  const crab = await getAuthCrab(request);
  if (!crab) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clubs = await sql`
    SELECT 
      c.*,
      cr.username as creator_name,
      (SELECT COUNT(*) FROM club_memberships WHERE club_id = c.id) as member_count
    FROM clubs c
    LEFT JOIN crabs cr ON c.creator_id = cr.id
    ORDER BY member_count DESC, c.created_at DESC
  `;

  return NextResponse.json({
    success: true,
    crews: clubs.map(c => ({
      name: c.name,
      display_name: c.display_name,
      description: c.description,
      visibility: c.visibility || 'open',
      member_count: Number(c.member_count),
      treasury_balance: c.treasury_balance,
      creator: c.creator_name,
      created_at: c.created_at,
    })),
  });
}

// POST /api/v1/clubs - Create a club
export async function POST(request: Request) {
  const crab = await getAuthCrab(request);
  if (!crab) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!crab.verified) {
    return NextResponse.json({ error: 'Account not verified' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, display_name, description, visibility } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    // Validate name format
    if (!/^[a-z0-9_-]{3,30}$/.test(name)) {
      return NextResponse.json({ 
        error: 'name must be 3-30 chars, lowercase alphanumeric with - and _' 
      }, { status: 400 });
    }

    // Validate visibility
    const validVisibility = ['open', 'closed', 'private'];
    const clubVisibility = visibility && validVisibility.includes(visibility) ? visibility : 'open';

    // Check if name taken
    const existing = await sql`SELECT id FROM clubs WHERE name = ${name}`;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Crew name already taken' }, { status: 409 });
    }

    // TODO: Deduct CLUB_CREATION_COST from crab balance
    // For now, skip cost check

    const id = generateId();

    // Generate invite code for closed/private clubs
    const inviteCode = clubVisibility !== 'open' ? generateInviteCode(name) : null;

    // Create treasury wallet for the club
    let treasuryWallet = null;
    try {
      if (process.env.PRIVY_APP_ID && process.env.PRIVY_APP_SECRET) {
        const wallet = await createAgenticWallet();
        treasuryWallet = wallet.address;
      }
    } catch (e) {
      console.error('Club wallet creation failed:', e);
    }

    await sql`
      INSERT INTO clubs (id, name, display_name, description, creator_id, treasury_wallet, visibility, invite_code)
      VALUES (${id}, ${name}, ${display_name || name}, ${description || ''}, ${crab.id}, ${treasuryWallet}, ${clubVisibility}, ${inviteCode})
    `;

    // Creator auto-joins as admin
    await sql`
      INSERT INTO club_memberships (club_id, crab_id, role)
      VALUES (${id}, ${crab.id}, 'admin')
    `;

    const response: Record<string, unknown> = {
      success: true,
      crew: {
        name,
        display_name: display_name || name,
        description: description || '',
        visibility: clubVisibility,
        treasury_wallet: treasuryWallet,
      },
      message: `Crew "${display_name || name}" created! You are the admin.`,
    };

    // Only return invite_code to creator
    if (inviteCode) {
      (response.crew as Record<string, unknown>).invite_code = inviteCode;
      response.message = `Crew "${display_name || name}" created! Share invite code: ${inviteCode}`;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Club creation error:', error);
    return NextResponse.json({ error: 'Failed to create club' }, { status: 500 });
  }
}
