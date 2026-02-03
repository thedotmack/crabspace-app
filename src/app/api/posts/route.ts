import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { getCrabByApiKey, generateId } from '@/lib/db';

const sql = neon(process.env.DATABASE_URL!);

export interface PostWithCrab {
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
}

// GET: List posts with crab info, like_count, comment_count (paginated)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
  const offset = parseInt(searchParams.get('offset') || '0');
  const username = searchParams.get('username'); // Optional: filter by user

  try {
    let rows;
    
    if (username) {
      // Get posts for a specific user
      rows = await sql`
        SELECT p.*, c.username, c.display_name, c.avatar_url,
          (SELECT COUNT(*) FROM engagements WHERE post_id = p.id AND type = 'like') as like_count,
          (SELECT COUNT(*) FROM engagements WHERE post_id = p.id AND type = 'comment') as comment_count
        FROM posts p
        JOIN crabs c ON p.crab_id = c.id
        WHERE c.username = ${username.toLowerCase()}
        ORDER BY p.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      // Get all posts
      rows = await sql`
        SELECT p.*, c.username, c.display_name, c.avatar_url,
          (SELECT COUNT(*) FROM engagements WHERE post_id = p.id AND type = 'like') as like_count,
          (SELECT COUNT(*) FROM engagements WHERE post_id = p.id AND type = 'comment') as comment_count
        FROM posts p
        JOIN crabs c ON p.crab_id = c.id
        ORDER BY p.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    const posts: PostWithCrab[] = rows.map(row => ({
      id: row.id as string,
      crabId: row.crab_id as string,
      imageUrl: row.image_url as string,
      caption: row.caption as string || '',
      promptUsed: row.prompt_used as string || '',
      cmemCost: Number(row.cmem_cost) || 0,
      createdAt: row.created_at as string,
      username: row.username as string,
      displayName: row.display_name as string,
      avatarUrl: row.avatar_url as string || '',
      likeCount: Number(row.like_count) || 0,
      commentCount: Number(row.comment_count) || 0,
    }));

    // Get total count for pagination
    const countResult = username 
      ? await sql`SELECT COUNT(*) as total FROM posts p JOIN crabs c ON p.crab_id = c.id WHERE c.username = ${username.toLowerCase()}`
      : await sql`SELECT COUNT(*) as total FROM posts`;
    const total = Number(countResult[0]?.total || 0);

    return NextResponse.json({ 
      posts, 
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + posts.length < total
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

// POST: Create new post (auth required)
export async function POST(request: NextRequest) {
  try {
    // Check for API key auth
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization' }, { status: 401 });
    }

    const apiKey = authHeader.replace('Bearer ', '');
    const crab = await getCrabByApiKey(apiKey);
    
    if (!crab || !crab.verified) {
      return NextResponse.json({ error: 'Invalid API key or unverified crab' }, { status: 401 });
    }

    const body = await request.json();
    const { image_url, caption, prompt_used, cmem_cost } = body;

    if (!image_url) {
      return NextResponse.json({ error: 'image_url is required' }, { status: 400 });
    }

    const id = generateId().replace('crab', 'post');
    
    await sql`
      INSERT INTO posts (id, crab_id, image_url, caption, prompt_used, cmem_cost)
      VALUES (${id}, ${crab.id}, ${image_url}, ${caption || ''}, ${prompt_used || ''}, ${cmem_cost || 0})
    `;

    // Update last_active
    await sql`UPDATE crabs SET last_active = NOW() WHERE id = ${crab.id}`;

    return NextResponse.json({ 
      success: true, 
      post: {
        id,
        crabId: crab.id,
        imageUrl: image_url,
        caption: caption || '',
        promptUsed: prompt_used || '',
        cmemCost: cmem_cost || 0,
        createdAt: new Date().toISOString(),
        username: crab.username,
        displayName: crab.displayName,
        avatarUrl: crab.avatarUrl,
        likeCount: 0,
        commentCount: 0,
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
