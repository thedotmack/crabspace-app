import { NextResponse } from 'next/server';
import { getRandomCrab } from '@/lib/db';

export async function GET() {
  const randomCrab = await getRandomCrab();
  
  if (!randomCrab) {
    return NextResponse.json({ error: 'No crabs found' }, { status: 404 });
  }
  
  return NextResponse.json({ 
    username: randomCrab.username,
    displayName: randomCrab.displayName 
  });
}
