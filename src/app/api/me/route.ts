import { NextResponse } from 'next/server';
import { getAuthCrab } from '@/lib/auth';

// GET: Get current authenticated user info
export async function GET(request: Request) {
  try {
    const crab = await getAuthCrab(request);
    if (!crab) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      crab: {
        id: crab.id,
        username: crab.username,
        displayName: crab.displayName,
        bio: crab.bio,
        avatarUrl: crab.avatarUrl,
        solanaWallet: crab.solanaWallet,
        verified: crab.verified,
        createdAt: crab.createdAt,
      }
    });
  } catch (error) {
    console.error('Me API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
