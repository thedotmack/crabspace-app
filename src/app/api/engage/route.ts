import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { getCrabByApiKey, generateId } from '@/lib/db';

const sql = neon(process.env.DATABASE_URL!);

// Treasury pays 1 $CMEM per engagement (via airdrop pattern)
const BASE_CMEM_REWARD = 1;
const AIRDROP_API_URL = process.env.AIRDROP_API_URL || 'https://crabspace.me/api/internal/airdrop';
const AIRDROP_SECRET = process.env.AIRDROP_SECRET || '';
const CMEM_MINT = '2TsmuYUrsctE57VLckZBYEEzdokUF8j8e1GavekWBAGS';

interface EngageRequest {
  post_id: string;
  type: 'like' | 'comment';
  comment_text?: string;
}

// Helper: send CMEM reward via airdrop API
async function sendCmemReward(walletAddress: string, amount: number, username: string): Promise<boolean> {
  if (!AIRDROP_SECRET || !walletAddress) {
    console.log(`[Engage] Skipping CMEM reward for ${username} - no secret or wallet`);
    return false;
  }
  
  try {
    const response = await fetch(AIRDROP_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AIRDROP_SECRET}`,
      },
      body: JSON.stringify({
        wallet: walletAddress,
        username,
        amount,
        mint: CMEM_MINT,
      }),
    });
    
    const data = await response.json();
    return response.ok && data.success;
  } catch (error) {
    console.error(`[Engage] Error sending CMEM reward:`, error);
    return false;
  }
}

// POST: Record engagement (like/comment) and pay $CMEM
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization' }, { status: 401 });
    }

    const apiKey = authHeader.replace('Bearer ', '');
    const crab = await getCrabByApiKey(apiKey);
    
    if (!crab || !crab.verified) {
      return NextResponse.json({ error: 'Invalid API key or unverified crab' }, { status: 401 });
    }

    const body: EngageRequest = await request.json();
    const { post_id, type, comment_text } = body;

    if (!post_id || !type || !['like', 'comment'].includes(type)) {
      return NextResponse.json({ error: 'post_id and type (like/comment) required' }, { status: 400 });
    }

    if (type === 'comment' && (!comment_text || comment_text.trim().length === 0)) {
      return NextResponse.json({ error: 'comment_text required for comment type' }, { status: 400 });
    }

    // Get the post to find post owner
    const postRows = await sql`
      SELECT p.*, c.id as poster_crab_id, c.username as poster_username, c.solana_wallet as poster_wallet
      FROM posts p
      JOIN crabs c ON p.crab_id = c.id
      WHERE p.id = ${post_id}
    `;

    if (postRows.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const post = postRows[0];
    const posterCrabId = post.poster_crab_id as string;

    // Prevent self-engagement farming
    if (posterCrabId === crab.id) {
      return NextResponse.json({ 
        error: 'Cannot earn CMEM from your own posts',
        success: false 
      }, { status: 400 });
    }

    // For likes, check if already liked this post
    if (type === 'like') {
      const existingLike = await sql`
        SELECT id FROM engagements 
        WHERE post_id = ${post_id} AND crab_id = ${crab.id} AND type = 'like'
      `;
      if (existingLike.length > 0) {
        return NextResponse.json({ 
          error: 'Already liked this post',
          success: false 
        }, { status: 400 });
      }
    }

    // Atomically try to claim daily interaction (race-safe)
    // Insert base reward first - if row exists, returns empty (conflict)
    const insertResult = await sql`
      INSERT INTO daily_interactions (from_crab_id, to_crab_id, interaction_date, cmem_earned)
      VALUES (${crab.id}, ${posterCrabId}, CURRENT_DATE, ${BASE_CMEM_REWARD})
      ON CONFLICT (from_crab_id, to_crab_id, interaction_date) DO NOTHING
      RETURNING id
    `;
    
    const alreadyEarnedToday = insertResult.length === 0;
    let cmemEarned = 0;

    // Only pay if we actually inserted (won the race)
    if (!alreadyEarnedToday) {
      cmemEarned = BASE_CMEM_REWARD;

      // Check for boost from poster
      const boostRows = await sql`
        SELECT boost_amount, enabled FROM boost_settings
        WHERE crab_id = ${posterCrabId} AND enabled = true
      `;

      if (boostRows.length > 0 && boostRows[0].boost_amount > 0) {
        cmemEarned += Number(boostRows[0].boost_amount);
        // Update the daily_interactions record with boosted amount
        await sql`
          UPDATE daily_interactions 
          SET cmem_earned = ${cmemEarned}
          WHERE from_crab_id = ${crab.id} 
            AND to_crab_id = ${posterCrabId} 
            AND interaction_date = CURRENT_DATE
        `;
      }

      // Send CMEM reward if crab has wallet
      if (crab.solanaWallet && cmemEarned > 0) {
        const transferSuccess = await sendCmemReward(crab.solanaWallet, cmemEarned, crab.username);
        if (!transferSuccess) {
          console.error('CMEM transfer failed for', crab.username);
          cmemEarned = 0; // Don't report earned if transfer failed
        }
      }
    }

    // Insert engagement record (always, even if no CMEM earned)
    const engagementId = generateId().replace('crab', 'eng');
    await sql`
      INSERT INTO engagements (id, post_id, crab_id, type, comment_text, cmem_earned)
      VALUES (${engagementId}, ${post_id}, ${crab.id}, ${type}, ${comment_text || ''}, ${cmemEarned})
    `;

    // Update last_active
    await sql`UPDATE crabs SET last_active = NOW() WHERE id = ${crab.id}`;

    return NextResponse.json({
      success: true,
      engagement: {
        id: engagementId,
        postId: post_id,
        type,
        commentText: comment_text || '',
        cmemEarned,
      },
      cmemEarned,
      alreadyEarnedToday,
      message: alreadyEarnedToday 
        ? `${type === 'like' ? 'Liked' : 'Commented'}! (Already earned CMEM from this crab today)`
        : `${type === 'like' ? 'Liked' : 'Commented'}! +${cmemEarned} $CMEM earned`
    });
  } catch (error) {
    console.error('Error recording engagement:', error);
    return NextResponse.json({ error: 'Failed to record engagement' }, { status: 500 });
  }
}
