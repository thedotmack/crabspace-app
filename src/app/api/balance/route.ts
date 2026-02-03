import { NextRequest, NextResponse } from 'next/server';
import { getCmemBalance, getSolBalance } from '@/lib/cmem';

// GET: Get CMEM and SOL balance for a wallet
export async function GET(request: NextRequest) {
  try {
    const wallet = request.nextUrl.searchParams.get('wallet');
    
    if (!wallet) {
      return NextResponse.json({ error: 'wallet parameter required' }, { status: 400 });
    }

    // Validate wallet address format (basic check)
    if (wallet.length < 32 || wallet.length > 44) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }

    const [cmemBalance, solBalance] = await Promise.all([
      getCmemBalance(wallet),
      getSolBalance(wallet),
    ]);

    return NextResponse.json({
      wallet,
      cmem: cmemBalance,
      sol: solBalance,
    });
  } catch (error) {
    console.error('Balance API error:', error);
    return NextResponse.json({ error: 'Failed to fetch balance' }, { status: 500 });
  }
}
