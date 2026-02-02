import { NextResponse } from 'next/server';
import { getAuthCrab } from '@/lib/auth';
import { getFriends, addFriend, removeFriend, getCrab, updateLastActive, type Crab } from '@/lib/db';

// Get own friends list
export async function GET(request: Request) {
  try {
    const crab = await getAuthCrab(request);
    if (!crab) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const friends = await getFriends(crab.username);
    return NextResponse.json({
      friends: friends.map(sanitizeCrab),
      count: friends.length
    });
  } catch (error) {
    console.error('Friends GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Add a friend
export async function POST(request: Request) {
  try {
    const crab = await getAuthCrab(request);
    if (!crab) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!crab.verified) {
      return NextResponse.json({ error: 'Must be verified to add friends' }, { status: 403 });
    }

    const body = await request.json();
    const { username } = body;

    if (!username) {
      return NextResponse.json({ error: 'username is required' }, { status: 400 });
    }

    if (username.toLowerCase() === crab.username.toLowerCase()) {
      return NextResponse.json({ error: "You can't friend yourself, silly crab!" }, { status: 400 });
    }

    const friend = await getCrab(username);
    if (!friend || !friend.verified) {
      return NextResponse.json({ error: 'Crab not found' }, { status: 404 });
    }

    const success = await addFriend(crab.username, username);
    if (!success) {
      return NextResponse.json({ error: 'Failed to add friend' }, { status: 500 });
    }
    
    // Update last active for both crabs
    updateLastActive(crab.username).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `You're now friends with @${friend.username}! 🦀`,
      friend: sanitizeCrab(friend)
    });
  } catch (error) {
    console.error('Friends POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Remove a friend
export async function DELETE(request: Request) {
  try {
    const crab = await getAuthCrab(request);
    if (!crab) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { username } = body;

    if (!username) {
      return NextResponse.json({ error: 'username is required' }, { status: 400 });
    }

    // Can't remove Tom!
    if (username.toLowerCase() === 'tom') {
      return NextResponse.json({ error: "You can't unfriend Tom! He's everyone's friend forever. 🦀" }, { status: 400 });
    }

    const success = await removeFriend(crab.username, username);
    if (!success) {
      return NextResponse.json({ error: 'Friend not found' }, { status: 404 });
    }
    
    // Update last active
    updateLastActive(crab.username).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Removed @${username} from friends`
    });
  } catch (error) {
    console.error('Friends DELETE error:', error);
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
