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
    clubs: clubs.map(c => ({
      name: c.name,
      display_name: c.display_name,
      description: c.description,
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
    const { name, display_name, description } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    // Validate name format
    if (!/^[a-z0-9_-]{3,30}$/.test(name)) {
      return NextResponse.json({ 
        error: 'name must be 3-30 chars, lowercase alphanumeric with - and _' 
      }, { status: 400 });
    }

    // Check if name taken
    const existing = await sql`SELECT id FROM clubs WHERE name = ${name}`;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Club name already taken' }, { status: 409 });
    }

    // TODO: Deduct CLUB_CREATION_COST from crab balance
    // For now, skip cost check

    const id = generateId();

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
      INSERT INTO clubs (id, name, display_name, description, creator_id, treasury_wallet)
      VALUES (${id}, ${name}, ${display_name || name}, ${description || ''}, ${crab.id}, ${treasuryWallet})
    `;

    // Creator auto-joins as admin
    await sql`
      INSERT INTO club_memberships (club_id, crab_id, role)
      VALUES (${id}, ${crab.id}, 'admin')
    `;

    return NextResponse.json({
      success: true,
      club: {
        name,
        display_name: display_name || name,
        description: description || '',
        treasury_wallet: treasuryWallet,
      },
      message: `Club "${display_name || name}" created! You are the admin.`,
    });
  } catch (error) {
    console.error('Club creation error:', error);
    return NextResponse.json({ error: 'Failed to create club' }, { status: 500 });
  }
}
