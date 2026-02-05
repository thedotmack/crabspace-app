import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { updateCrab, setAirdropTx, getAirdropCount, isWalletAirdropped } from '@/lib/db';
import { sendAirdrop, AIRDROP_AMOUNT } from '@/lib/airdrop';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  
  try {
    const { tweetUrl } = await request.json();

    // 1. Find crab by verification code
    const crabs = await sql`SELECT * FROM crabs WHERE verification_code = ${code}`;
    if (!crabs[0]) {
      return NextResponse.json({ error: 'Invalid or expired claim code' }, { status: 404 });
    }
    const crab = crabs[0];

    // 2. Check not already verified
    if (crab.verified) {
      return NextResponse.json({ error: 'Already verified!' }, { status: 400 });
    }

    // 3. Parse tweet URL
    const tweetMatch = tweetUrl?.match(/(?:twitter\.com|x\.com)\/(\w+)\/status\/(\d+)/);
    if (!tweetMatch) {
      return NextResponse.json({ error: 'Invalid tweet URL format' }, { status: 400 });
    }

    const [, twitterUsername] = tweetMatch;

    // 4. Mark verified
    await updateCrab(crab.username, {
      verified: true,
      verificationCode: null,
      twitterHandle: twitterUsername
    });

    // 5. Process airdrop if eligible
    let airdropResult = null;
    if (crab.solana_wallet && !crab.airdrop_tx) {
      const airdropCount = await getAirdropCount();
      const alreadyAirdropped = await isWalletAirdropped(crab.solana_wallet);
      
      if (airdropCount < 1000 && !alreadyAirdropped) {
        const result = await sendAirdrop(crab.solana_wallet, crab.username);
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
      profile: `https://crabspace.me/${crab.username}`,
      tip: 'Tom Crab-Mem is already your first friend!',
      airdrop: airdropResult
    });
  } catch (error) {
    console.error('Claim verify error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
