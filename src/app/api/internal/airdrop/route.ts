import { NextResponse } from 'next/server';

// Internal airdrop endpoint - protected by AIRDROP_SECRET
// In production, this would connect to Solana RPC and send tokens
// For MVP, we'll queue airdrops and process them via external script

const AIRDROP_SECRET = process.env.AIRDROP_SECRET;

interface AirdropRequest {
  wallet: string;
  username: string;
  amount: number;
  mint: string;
}

// In-memory queue for MVP (production would use DB)
const airdropQueue: AirdropRequest[] = [];

export async function POST(request: Request) {
  try {
    // Verify secret
    const authHeader = request.headers.get('Authorization');
    if (!AIRDROP_SECRET || authHeader !== `Bearer ${AIRDROP_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: AirdropRequest = await request.json();
    const { wallet, username, amount, mint } = body;

    if (!wallet || !username || !amount || !mint) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // For MVP: Just log and return a placeholder TX
    // The actual transfer will be done by an external script monitoring the DB
    console.log(`[Airdrop Request] ${amount} tokens to ${wallet} for @${username}`);
    
    // Generate a pending TX hash (will be updated by external processor)
    const pendingTxHash = `pending_${Date.now()}_${username}`;
    
    // Queue the airdrop
    airdropQueue.push({ wallet, username, amount, mint });
    
    return NextResponse.json({
      success: true,
      txHash: pendingTxHash,
      status: 'queued',
      message: `Airdrop of ${amount} $CMEM queued for ${wallet}`
    });
  } catch (error) {
    console.error('Airdrop error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET endpoint to check queue (for external processor)
export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!AIRDROP_SECRET || authHeader !== `Bearer ${AIRDROP_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    queue: airdropQueue,
    count: airdropQueue.length
  });
}
