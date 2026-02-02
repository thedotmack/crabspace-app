import { NextResponse } from 'next/server';

// Proxy to claude-mem observations API
// Configure CLAUDE_MEM_URL env var to point to your claude-mem instance

const CLAUDE_MEM_URL = process.env.CLAUDE_MEM_URL || 'http://localhost:37777';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '50';
    const offset = searchParams.get('offset') || '0';

    const response = await fetch(
      `${CLAUDE_MEM_URL}/api/observations?limit=${limit}&offset=${offset}`,
      {
        headers: {
          'Accept': 'application/json',
        },
        // Don't cache
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      throw new Error(`claude-mem returned ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Memory proxy error:', error);
    
    // Return empty response instead of error to gracefully degrade
    return NextResponse.json({
      items: [],
      hasMore: false,
      error: 'Unable to connect to claude-mem',
    });
  }
}
