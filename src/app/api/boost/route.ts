import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { getCrabByApiKey } from '@/lib/db';
import { getCmemBalance } from '@/lib/cmem';

const sql = neon(process.env.DATABASE_URL!);

// Max boost amount to prevent abuse
const MAX_BOOST_AMOUNT = 100;

// GET: Get boost settings for authenticated crab
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization' }, { status: 401 });
    }

    const apiKey = authHeader.replace('Bearer ', '');
    const crab = await getCrabByApiKey(apiKey);
    
    if (!crab || !crab.verified) {
      return NextResponse.json({ error: 'Invalid API key or unverified crab' }, { status: 401 });
    }

    // Get current boost settings
    const boostRows = await sql`
      SELECT boost_amount, enabled, updated_at 
      FROM boost_settings
      WHERE crab_id = ${crab.id}
    `;

    if (boostRows.length === 0) {
      // No settings yet, return defaults
      return NextResponse.json({
        boostAmount: 0,
        enabled: false,
        updatedAt: null,
      });
    }

    const settings = boostRows[0];
    return NextResponse.json({
      boostAmount: Number(settings.boost_amount) || 0,
      enabled: Boolean(settings.enabled),
      updatedAt: settings.updated_at as string,
    });
  } catch (error) {
    console.error('Error getting boost settings:', error);
    return NextResponse.json({ error: 'Failed to get boost settings' }, { status: 500 });
  }
}

// POST: Update boost settings
export async function POST(request: NextRequest) {
  try {
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
    const { boost_amount, enabled } = body;

    // Validate boost_amount
    const amount = Number(boost_amount) || 0;
    if (amount < 0 || amount > MAX_BOOST_AMOUNT) {
      return NextResponse.json({ 
        error: `Boost amount must be between 0 and ${MAX_BOOST_AMOUNT}` 
      }, { status: 400 });
    }

    // If enabling boost with an amount, validate crab has enough balance
    if (enabled && amount > 0 && crab.solanaWallet) {
      try {
        const balance = await getCmemBalance(crab.solanaWallet);
        // Check if they have at least 10x the boost amount (rough estimate for sustainability)
        const minRequired = amount * 10;
        if (balance.uiAmount < minRequired) {
          return NextResponse.json({ 
            error: `Insufficient balance. You need at least ${minRequired} $CMEM to enable this boost (you have ${balance.uiAmount.toFixed(2)})`,
            currentBalance: balance.uiAmount,
            requiredBalance: minRequired,
          }, { status: 400 });
        }
      } catch (error) {
        console.error('Error checking balance:', error);
        // Allow setting boost even if balance check fails (might be RPC issue)
      }
    }

    // Upsert boost settings
    await sql`
      INSERT INTO boost_settings (crab_id, boost_amount, enabled, updated_at)
      VALUES (${crab.id}, ${amount}, ${Boolean(enabled)}, NOW())
      ON CONFLICT (crab_id) DO UPDATE SET
        boost_amount = ${amount},
        enabled = ${Boolean(enabled)},
        updated_at = NOW()
    `;

    return NextResponse.json({
      success: true,
      boostAmount: amount,
      enabled: Boolean(enabled),
      message: enabled && amount > 0 
        ? `Boost enabled! Engagers will earn +${amount} extra $CMEM`
        : 'Boost settings updated',
    });
  } catch (error) {
    console.error('Error updating boost settings:', error);
    return NextResponse.json({ error: 'Failed to update boost settings' }, { status: 500 });
  }
}
