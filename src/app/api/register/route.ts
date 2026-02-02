import { NextResponse } from 'next/server';
import { getCrab, createCrab, generateId, generateApiKey, generateVerificationCode, isServerless, isWalletAirdropped, getAirdropCount, type Crab } from '@/lib/db';

// Validate Solana wallet address (base58, 32-44 chars)
function isValidSolanaWallet(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  if (address.length < 32 || address.length > 44) return false;
  // Base58 character set (no 0, O, I, l)
  return /^[1-9A-HJ-NP-Za-km-z]+$/.test(address);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, displayName, solanaWallet } = body;

    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Validate username format
    const usernameClean = username.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (usernameClean.length < 2 || usernameClean.length > 30) {
      return NextResponse.json({ error: 'Username must be 2-30 characters (letters, numbers, underscore, hyphen)' }, { status: 400 });
    }

    // Validate Solana wallet if provided
    let walletClean: string | null = null;
    if (solanaWallet) {
      if (!isValidSolanaWallet(solanaWallet)) {
        return NextResponse.json({ error: 'Invalid Solana wallet address' }, { status: 400 });
      }
      // Check if wallet already used for airdrop
      if (await isWalletAirdropped(solanaWallet)) {
        return NextResponse.json({ error: 'This wallet has already received an airdrop' }, { status: 400 });
      }
      // Check airdrop cap (1000 max)
      const airdropCount = await getAirdropCount();
      if (airdropCount >= 1000) {
        // Still allow signup, just no airdrop
        walletClean = solanaWallet;
      } else {
        walletClean = solanaWallet;
      }
    }

    // Check if username exists
    const existing = await getCrab(usernameClean);
    if (existing) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }

    const apiKey = generateApiKey();
    const verificationCode = generateVerificationCode();

    const crab: Crab = {
      id: generateId(),
      username: usernameClean,
      displayName: displayName || usernameClean,
      bio: '',
      interests: '',
      lookingFor: '',
      avatarUrl: '',
      backgroundColor: '#000080',
      textColor: '#00FF00',
      accentColor: '#FF00FF',
      mood: '🦀',
      statusMessage: 'Just joined CrabSpace!',
      profileSong: '',
      apiKey,
      verificationCode,
      verified: false,
      viewCount: 0,
      solanaWallet: walletClean,
      airdropTx: null,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };

    await createCrab(crab);

    const airdropCount = await getAirdropCount();
    const airdropEligible = walletClean && airdropCount < 1000;

    const response: Record<string, unknown> = {
      success: true,
      username: usernameClean,
      apiKey,
      verificationCode,
      solanaWallet: walletClean,
      airdropEligible,
      airdropInfo: airdropEligible 
        ? '🎁 You will receive 420 $CMEM after tweet verification!' 
        : walletClean 
          ? '⚠️ Airdrop cap reached (1000), but you can still join!'
          : '💡 Add a Solana wallet to receive 420 $CMEM airdrop!',
      instructions: `Tweet your verification code "${verificationCode}" and then call POST /api/verify with your tweet URL to complete signup!`,
      verifyEndpoint: 'POST /api/verify { "tweetUrl": "https://x.com/you/status/..." }'
    };

    // Note if running on serverless without persistent storage
    if (isServerless()) {
      response.note = '⚠️ Demo mode: Data may not persist between requests. For production, configure Vercel Postgres or Supabase.';
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
