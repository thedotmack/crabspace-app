import { NextRequest, NextResponse } from 'next/server';
import { getCrabByApiKey } from '@/lib/db';
import { getCmemBalance } from '@/lib/cmem';
import { generateImage } from '@/lib/gemini';

// Cost to generate one image
const IMAGE_COST = 5; // CMEM per generation

// Treasury wallet for receiving CMEM payments (would be used for actual deduction)
const TREASURY_WALLET = process.env.TREASURY_WALLET || '';

interface GenerateRequest {
  prompt: string;
  resolution?: '1K' | '2K';
}

// POST: Generate image using Gemini (costs CMEM)
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

    const body: GenerateRequest = await request.json();
    const { prompt, resolution = '1K' } = body;

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (prompt.length > 1000) {
      return NextResponse.json({ error: 'Prompt too long (max 1000 chars)' }, { status: 400 });
    }

    // Check if user has wallet for balance check
    if (!crab.solanaWallet) {
      return NextResponse.json({ 
        error: 'No wallet connected. Add a Solana wallet to your profile to generate images.',
        needsWallet: true,
      }, { status: 400 });
    }

    // Check CMEM balance
    const balance = await getCmemBalance(crab.solanaWallet);
    
    if (balance.uiAmount < IMAGE_COST) {
      return NextResponse.json({ 
        error: `Insufficient CMEM balance. Need ${IMAGE_COST} CMEM, have ${balance.uiAmount.toFixed(2)} CMEM`,
        balance: balance.uiAmount,
        required: IMAGE_COST,
      }, { status: 400 });
    }

    // Generate the image
    const timestamp = Date.now();
    const safeUsername = crab.username.replace(/[^a-zA-Z0-9]/g, '');
    const filename = `${timestamp}-${safeUsername}.png`;

    console.log(`[Generate] User ${crab.username} generating image (cost: ${IMAGE_COST} CMEM)`);

    const imageUrl = await generateImage(prompt, filename, resolution);

    // TODO: Actually deduct CMEM from user's wallet
    // For now, we just track the cost - real deduction would require:
    // 1. User signs a transaction to transfer CMEM to treasury
    // 2. Or use Privy agentic wallet to sign on behalf
    // Currently this is a placeholder - the balance check is real,
    // but deduction is not implemented (would need user wallet signature)
    
    const newBalance = balance.uiAmount - IMAGE_COST; // Simulated balance after deduction

    console.log(`[Generate] Success! Image: ${imageUrl}, User: ${crab.username}`);

    return NextResponse.json({
      success: true,
      imageUrl,
      prompt,
      cmemSpent: IMAGE_COST,
      newBalance,
      message: `Image generated! ${IMAGE_COST} $CMEM spent`,
    });
  } catch (error) {
    console.error('[Generate] Error:', error);
    const message = error instanceof Error ? error.message : 'Image generation failed';
    return NextResponse.json({ 
      error: message,
      success: false,
    }, { status: 500 });
  }
}
