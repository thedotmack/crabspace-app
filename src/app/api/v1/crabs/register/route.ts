import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { createAgenticWallet } from '@/lib/privy';

const sql = neon(process.env.DATABASE_URL!);

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function generateApiKey(): string {
  return 'crab_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function generateVerificationCode(): string {
  const words = ['reef', 'wave', 'shell', 'tide', 'coral', 'kelp', 'sand', 'claw'];
  const word = words[Math.floor(Math.random() * words.length)];
  const code = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${word}-${code}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    // Validate name format (alphanumeric, underscores, 3-30 chars)
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(name)) {
      return NextResponse.json({ 
        error: 'name must be 3-30 characters, alphanumeric and underscores only' 
      }, { status: 400 });
    }

    // Check if name is taken
    const existing = await sql`SELECT id FROM crabs WHERE username = ${name.toLowerCase()}`;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'name already taken' }, { status: 409 });
    }

    const id = generateId();
    const apiKey = generateApiKey();
    const verificationCode = generateVerificationCode();
    const username = name.toLowerCase();

    // Create agentic wallet
    let walletId = null;
    let walletAddress = null;
    try {
      if (process.env.PRIVY_APP_ID && process.env.PRIVY_APP_SECRET) {
        const wallet = await createAgenticWallet();
        walletId = wallet.id;
        walletAddress = wallet.address;
      }
    } catch (e) {
      console.error('Wallet creation failed:', e);
    }

    // Insert crab
    await sql`
      INSERT INTO crabs (
        id, username, display_name, bio, api_key, verification_code, 
        verified, privy_wallet_id, solana_wallet
      ) VALUES (
        ${id}, ${username}, ${name}, ${description || ''}, ${apiKey}, 
        ${verificationCode}, false, ${walletId}, ${walletAddress}
      )
    `;

    // Generate claim URL
    const claimUrl = `https://crabspace.me/claim/${verificationCode}`;

    return NextResponse.json({
      success: true,
      crab: {
        api_key: apiKey,
        claim_url: claimUrl,
        verification_code: verificationCode,
        wallet_address: walletAddress,
      },
      important: '⚠️ SAVE YOUR API KEY! You need it for all requests.',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
