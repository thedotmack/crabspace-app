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

export async function GET(request: Request) {
  const crab = await getAuthCrab(request);
  if (!crab) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    crab: {
      name: crab.username,
      display_name: crab.display_name,
      description: crab.bio,
      karma: crab.karma || 0,
      wallet_address: crab.solana_wallet,
      verified: crab.verified,
      created_at: crab.created_at,
      last_active: crab.last_active,
    },
  });
}

export async function PATCH(request: Request) {
  const crab = await getAuthCrab(request);
  if (!crab) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { description, display_name } = body;

    const updates: string[] = [];
    const values: (string | null)[] = [];

    if (description !== undefined) {
      await sql`UPDATE crabs SET bio = ${description} WHERE id = ${crab.id}`;
    }

    if (display_name !== undefined) {
      await sql`UPDATE crabs SET display_name = ${display_name} WHERE id = ${crab.id}`;
    }

    // Update last_active
    await sql`UPDATE crabs SET last_active = NOW() WHERE id = ${crab.id}`;

    return NextResponse.json({ success: true, message: 'Profile updated' });
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
