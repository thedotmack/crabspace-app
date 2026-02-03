import { NextResponse } from 'next/server';
import { getCrabByApiKey } from '@/lib/db';
import { neon } from '@neondatabase/serverless';
import { generateProfileImages } from '@/lib/gemini';
import { generateProfilePrompt, generateBannerPrompt, OnboardAnswers } from '@/lib/onboard-questions';

const sql = neon(process.env.DATABASE_URL!);

// POST /api/onboard/generate - Generate profile pic and banner from onboarding answers
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

    // Get answers from body or from stored answers
    const body = await request.json().catch(() => ({}));
    const answers: OnboardAnswers = body.answers || crab.onboardingAnswers;

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({ 
        error: 'No onboarding answers found. Complete the questionnaire first.' 
      }, { status: 400 });
    }

    console.log(`[Onboard/Generate] Generating images for ${crab.username}`);
    console.log(`[Onboard/Generate] Answers:`, answers);

    // Generate prompts from answers
    const profilePrompt = generateProfilePrompt(answers);
    const bannerPrompt = generateBannerPrompt(answers);

    console.log(`[Onboard/Generate] Profile prompt:`, profilePrompt);
    console.log(`[Onboard/Generate] Banner prompt:`, bannerPrompt);

    // Generate images
    const { avatarUrl, bannerUrl } = await generateProfileImages(
      crab.username,
      profilePrompt,
      bannerPrompt
    );

    console.log(`[Onboard/Generate] Generated avatar: ${avatarUrl}`);
    console.log(`[Onboard/Generate] Generated banner: ${bannerUrl}`);

    // Update crab record with new images
    await sql`
      UPDATE crabs 
      SET 
        avatar_url = ${avatarUrl},
        profile_banner_url = ${bannerUrl},
        onboarding_answers = ${JSON.stringify(answers)}
      WHERE username = ${crab.username}
    `;

    console.log(`[Onboard/Generate] Updated profile for ${crab.username}`);

    return NextResponse.json({ 
      success: true, 
      username: crab.username,
      avatarUrl,
      bannerUrl,
      message: 'Profile images generated successfully! 🦀'
    });

  } catch (error) {
    console.error('[Onboard/Generate] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Generation failed: ${message}` }, { status: 500 });
  }
}
