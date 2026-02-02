import { NextResponse } from 'next/server';
import { getAuthCrab } from '@/lib/auth';
import { updateCrab, getTop8, getComments, updateLastActive, type Crab } from '@/lib/db';

// Get own profile
export async function GET(request: Request) {
  try {
    const crab = await getAuthCrab(request);
    if (!crab) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const top8 = await getTop8(crab.username);
    const comments = await getComments(crab.username);

    return NextResponse.json({
      crab: sanitizeCrab(crab),
      top8: top8.map(sanitizeCrab),
      comments: comments.slice(0, 20)
    });
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update own profile
export async function PATCH(request: Request) {
  try {
    const crab = await getAuthCrab(request);
    if (!crab) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Only allow updating these fields
    const allowedFields: (keyof Crab)[] = [
      'displayName', 'bio', 'interests', 'lookingFor',
      'avatarUrl', 'backgroundColor', 'textColor', 'accentColor',
      'mood', 'statusMessage', 'profileSong'
    ];

    const updates: Partial<Crab> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    // Validate colors
    const colorFields = ['backgroundColor', 'textColor', 'accentColor'];
    for (const field of colorFields) {
      if (updates[field as keyof Crab] && !/^#[0-9A-Fa-f]{6}$/.test(updates[field as keyof Crab] as string)) {
        return NextResponse.json({ error: `Invalid ${field} - must be hex color like #FF00FF` }, { status: 400 });
      }
    }

    const updated = await updateCrab(crab.username, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
    
    // Update last active timestamp
    updateLastActive(crab.username).catch(() => {});

    return NextResponse.json({
      success: true,
      crab: sanitizeCrab(updated)
    });
  } catch (error) {
    console.error('Profile PATCH error:', error);
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
    createdAt: crab.createdAt
  };
}
