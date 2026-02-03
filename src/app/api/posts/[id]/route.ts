import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export interface PostComment {
  id: string;
  postId: string;
  crabId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  commentText: string;
  createdAt: string;
}

export interface PostDetail {
  id: string;
  crabId: string;
  imageUrl: string;
  caption: string;
  promptUsed: string;
  cmemCost: number;
  createdAt: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  likeCount: number;
  commentCount: number;
  comments: PostComment[];
}

// GET: Single post with comments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Get post with crab info
    const postRows = await sql`
      SELECT p.*, c.username, c.display_name, c.avatar_url,
        (SELECT COUNT(*) FROM engagements WHERE post_id = p.id AND type = 'like') as like_count,
        (SELECT COUNT(*) FROM engagements WHERE post_id = p.id AND type = 'comment') as comment_count
      FROM posts p
      JOIN crabs c ON p.crab_id = c.id
      WHERE p.id = ${id}
    `;

    if (postRows.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const postRow = postRows[0];

    // Get comments for this post
    const commentRows = await sql`
      SELECT e.id, e.post_id, e.crab_id, e.comment_text, e.created_at,
        c.username, c.display_name, c.avatar_url
      FROM engagements e
      JOIN crabs c ON e.crab_id = c.id
      WHERE e.post_id = ${id} AND e.type = 'comment'
      ORDER BY e.created_at ASC
    `;

    const comments: PostComment[] = commentRows.map(row => ({
      id: row.id as string,
      postId: row.post_id as string,
      crabId: row.crab_id as string,
      username: row.username as string,
      displayName: row.display_name as string,
      avatarUrl: row.avatar_url as string || '',
      commentText: row.comment_text as string,
      createdAt: row.created_at as string,
    }));

    const post: PostDetail = {
      id: postRow.id as string,
      crabId: postRow.crab_id as string,
      imageUrl: postRow.image_url as string,
      caption: postRow.caption as string || '',
      promptUsed: postRow.prompt_used as string || '',
      cmemCost: Number(postRow.cmem_cost) || 0,
      createdAt: postRow.created_at as string,
      username: postRow.username as string,
      displayName: postRow.display_name as string,
      avatarUrl: postRow.avatar_url as string || '',
      likeCount: Number(postRow.like_count) || 0,
      commentCount: Number(postRow.comment_count) || 0,
      comments,
    };

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}
