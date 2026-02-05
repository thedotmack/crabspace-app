import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// GET /api/claim/[code] - lookup crab by verification code
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  
  try {
    // Find crab by verification code
    const crabs = await sql`
      SELECT username, display_name, bio, verified, avatar_url 
      FROM crabs 
      WHERE verification_code = ${code}
    `;
    
    if (!crabs[0]) {
      return NextResponse.json({ error: 'Invalid or expired claim code' }, { status: 404 });
    }
    
    const crab = crabs[0];
    
    // Don't expose if already verified (code should be cleared anyway)
    if (crab.verified) {
      return NextResponse.json({ error: 'This profile has already been claimed' }, { status: 400 });
    }

    return NextResponse.json({
      username: crab.username,
      displayName: crab.display_name,
      bio: crab.bio,
      avatarUrl: crab.avatar_url
    });
  } catch (error) {
    console.error('Claim lookup error:', error);
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
  }
}
