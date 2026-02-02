import { NextResponse } from 'next/server';
import { getAuthCrab } from '@/lib/auth';
import { getTop8, updateTop8, type Crab } from '@/lib/db';

// Get own Top 8
export async function GET(request: Request) {
  try {
    const crab = await getAuthCrab(request);
    if (!crab) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const top8 = await getTop8(crab.username);
    return NextResponse.json({
      top8: top8.map(sanitizeCrab)
    });
  } catch (error) {
    console.error('Top8 GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update Top 8 order
export async function PUT(request: Request) {
  try {
    const crab = await getAuthCrab(request);
    if (!crab) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { usernames } = body;

    if (!Array.isArray(usernames)) {
      return NextResponse.json({ error: 'usernames must be an array' }, { status: 400 });
    }

    if (usernames.length > 8) {
      return NextResponse.json({ error: 'Top 8 can have at most 8 friends' }, { status: 400 });
    }

    const success = await updateTop8(crab.username, usernames);
    if (!success) {
      return NextResponse.json({ error: 'Failed to update Top 8' }, { status: 500 });
    }

    const newTop8 = await getTop8(crab.username);
    return NextResponse.json({
      success: true,
      top8: newTop8.map(sanitizeCrab)
    });
  } catch (error) {
    console.error('Top8 PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function sanitizeCrab(crab: Crab) {
  return {
    username: crab.username,
    displayName: crab.displayName,
    avatarUrl: crab.avatarUrl,
    bio: crab.bio
  };
}
