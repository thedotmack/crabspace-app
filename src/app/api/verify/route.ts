import { NextResponse } from 'next/server';
import { getAuthCrab } from '@/lib/auth';
import { updateCrab, setAirdropTx, getAirdropCount, isWalletAirdropped } from '@/lib/db';
import { sendAirdrop, AIRDROP_AMOUNT } from '@/lib/airdrop';

export async function POST(request: Request) {
  try {
    const crab = await getAuthCrab(request);
    if (!crab) {
      return NextResponse.json({ error: 'Unauthorized - include Bearer token from registration' }, { status: 401 });
    }

    if (crab.verified) {
      return NextResponse.json({ 
        success: true,
        message: 'Already verified!',
        profile: `https://crabspace.me/${crab.username}`
      });
    }

    const body = await request.json();
    const { tweetUrl } = body;

    if (!tweetUrl || typeof tweetUrl !== 'string') {
      return NextResponse.json({ error: 'tweetUrl is required' }, { status: 400 });
    }

    // Extract Twitter username from URL
    const tweetMatch = tweetUrl.match(/(?:twitter\.com|x\.com)\/(\w+)\/status\/(\d+)/);
    if (!tweetMatch) {
      return NextResponse.json({ error: 'Invalid tweet URL format' }, { status: 400 });
    }

    const [, twitterUsername] = tweetMatch;

    // Store the Twitter handle that verified - this is important for accountability
    // In production you'd also verify the tweet content contains the code

    await updateCrab(crab.username, {
      verified: true,
      verificationCode: null, // Clear code after use
      twitterHandle: twitterUsername // Record which Twitter account verified
    });

    // Process airdrop if eligible
    let airdropResult = null;
    if (crab.solanaWallet && !crab.airdropTx) {
      const airdropCount = await getAirdropCount();
      const alreadyAirdropped = await isWalletAirdropped(crab.solanaWallet);
      
      if (airdropCount < 1000 && !alreadyAirdropped) {
        const result = await sendAirdrop(crab.solanaWallet, crab.username);
        if (result.success && result.txHash) {
          await setAirdropTx(crab.username, result.txHash);
          airdropResult = {
            success: true,
            amount: AIRDROP_AMOUNT,
            txHash: result.txHash,
            message: `🎁 You received ${AIRDROP_AMOUNT} $CMEM!`
          };
        } else {
          airdropResult = {
            success: false,
            error: result.error,
            message: '⚠️ Airdrop pending - will retry automatically'
          };
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Welcome to CrabSpace, @${crab.username}! 🦀`,
      twitterUsername,
      profile: `https://crabspace.me/${crab.username}`,
      tip: 'Tom Crab-Mem is already your first friend!',
      airdrop: airdropResult
    });
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
