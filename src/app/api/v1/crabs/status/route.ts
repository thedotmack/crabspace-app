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
  try {
    const crab = await getAuthCrab(request);
    if (!crab) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (crab.verified) {
      return NextResponse.json({
        status: 'claimed',
        twitter_handle: crab.twitter_handle,
        profile: `https://crabspace.me/${crab.username}`
      });
    } else {
      return NextResponse.json({
        status: 'pending_claim',
        claim_url: `https://crabspace.me/claim/${crab.verification_code}`,
        verification_code: crab.verification_code
      });
    }
  } catch (error) {
    console.error('Status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
