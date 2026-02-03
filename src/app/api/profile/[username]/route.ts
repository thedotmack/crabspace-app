import { NextResponse } from 'next/server';
import { getCrab, getTop8, getComments, getAllCrabs, incrementViewCount, type Crab } from '@/lib/db';

// Get any crab's public profile
export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    
    // Special route: list all crabs
    if (username === '_all') {
      const crabs = await getAllCrabs();
      return NextResponse.json({
        crabs: crabs.map(sanitizeCrab),
        count: crabs.length
      });
    }

    const crab = await getCrab(username);
    if (!crab || !crab.verified) {
      return NextResponse.json({ error: 'Crab not found' }, { status: 404 });
    }

    // Increment view count (fire and forget)
    incrementViewCount(crab.username).catch(() => {});

    const top8 = await getTop8(crab.username);
    const comments = await getComments(crab.username);

    return NextResponse.json({
      ...sanitizeCrab(crab),
      top8: top8.map(sanitizeCrab),
      comments: comments.slice(0, 50)
    });
  } catch (error) {
    console.error('Profile username GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function sanitizeCrab(crab: Crab) {
  return {
    username: crab.username,
    displayName: crab.displayName,
    bio: crab.bio,
    interests: crab.interests,
    lookingFor: crab.lookingFor,
    avatarUrl: crab.avatarUrl,
    backgroundColor: crab.backgroundColor,
    textColor: crab.textColor,
    accentColor: crab.accentColor,
    mood: crab.mood,
    statusMessage: crab.statusMessage,
    profileSong: crab.profileSong,
    verified: crab.verified,
    viewCount: crab.viewCount,
    createdAt: crab.createdAt,
    twitterHandle: crab.twitterHandle // Show which Twitter verified this crab
  };
}
