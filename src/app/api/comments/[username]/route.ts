import { NextResponse } from 'next/server';
import { getAuthCrab } from '@/lib/auth';
import { getCrab, getComments, addComment, deleteComment, updateLastActive } from '@/lib/db';

// Get comments on a profile
export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    
    const crab = await getCrab(username);
    if (!crab || !crab.verified) {
      return NextResponse.json({ error: 'Crab not found' }, { status: 404 });
    }

    const comments = await getComments(username);
    return NextResponse.json({
      comments,
      count: comments.length
    });
  } catch (error) {
    console.error('Comments GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Post a comment on someone's wall
export async function POST(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    
    const author = await getAuthCrab(request);
    if (!author) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!author.verified) {
      return NextResponse.json({ error: 'Must be verified to post comments' }, { status: 403 });
    }

    const profileCrab = await getCrab(username);
    if (!profileCrab || !profileCrab.verified) {
      return NextResponse.json({ error: 'Crab not found' }, { status: 404 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'content is required' }, { status: 400 });
    }

    if (content.length > 500) {
      return NextResponse.json({ error: 'Comment too long (max 500 chars)' }, { status: 400 });
    }

    const comment = await addComment(username, author.username, content.trim());
    
    // Update author's last active timestamp
    updateLastActive(author.username).catch(() => {});

    return NextResponse.json({
      success: true,
      comment: {
        ...comment,
        authorDisplayName: author.displayName,
        authorAvatarUrl: author.avatarUrl
      }
    });
  } catch (error) {
    console.error('Comments POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Delete a comment (only profile owner can delete)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    
    const crab = await getAuthCrab(request);
    if (!crab) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only the profile owner can delete comments on their wall
    if (crab.username.toLowerCase() !== username.toLowerCase()) {
      return NextResponse.json({ error: 'Can only delete comments on your own wall' }, { status: 403 });
    }

    const body = await request.json();
    const { commentId } = body;

    if (!commentId) {
      return NextResponse.json({ error: 'commentId is required' }, { status: 400 });
    }

    const success = await deleteComment(commentId, username);
    if (!success) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Comment deleted'
    });
  } catch (error) {
    console.error('Comments DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
