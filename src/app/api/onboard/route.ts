import { NextResponse } from 'next/server';
import { getCrabByApiKey } from '@/lib/db';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// POST /api/onboard - Save onboarding answers to crab record
export async function POST(request: Request) {
  try {
    // Get API key from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
    }
    
    const apiKey = authHeader.slice(7);
    const crab = await getCrabByApiKey(apiKey);
    
    if (!crab) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const body = await request.json();
    const { answers } = body;

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({ error: 'Invalid answers format' }, { status: 400 });
    }

    // Validate answer keys
    const validKeys = ['vibe', 'aesthetic', 'mood', 'interests'];
    for (const key of Object.keys(answers)) {
      if (!validKeys.includes(key)) {
        return NextResponse.json({ error: `Invalid answer key: ${key}` }, { status: 400 });
      }
    }

    // Save answers to database
    await sql`
      UPDATE crabs 
      SET onboarding_answers = ${JSON.stringify(answers)}
      WHERE username = ${crab.username}
    `;

    console.log(`[Onboard] Saved answers for ${crab.username}:`, answers);

    return NextResponse.json({ 
      success: true, 
      username: crab.username,
      answers,
      message: 'Onboarding answers saved! Ready to generate profile images.'
    });

  } catch (error) {
    console.error('[Onboard] Error saving answers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/onboard - Get current onboarding answers
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
    }
    
    const apiKey = authHeader.slice(7);
    const crab = await getCrabByApiKey(apiKey);
    
    if (!crab) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      username: crab.username,
      answers: crab.onboardingAnswers || null,
      hasAnswers: !!crab.onboardingAnswers,
    });

  } catch (error) {
    console.error('[Onboard] Error getting answers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
