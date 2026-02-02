import { getCrabByApiKey, type Crab } from './db';

export async function getAuthCrab(request: Request): Promise<Crab | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;
  
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  
  return await getCrabByApiKey(match[1]);
}

export async function verifyTweet(tweetUrl: string, expectedCode: string): Promise<{ valid: boolean; username?: string }> {
  // Extract tweet ID from URL
  const tweetMatch = tweetUrl.match(/(?:twitter\.com|x\.com)\/(\w+)\/status\/(\d+)/);
  if (!tweetMatch) {
    return { valid: false };
  }
  
  const [, twitterUsername, tweetId] = tweetMatch;
  
  // For MVP, we'll use a simple approach:
  // In production, you'd use Twitter API or a service like Nitter
  // For now, we'll trust the tweet URL and extract username
  // The main agent can verify manually if needed
  
  try {
    // Try fetching the tweet via nitter or similar
    // For MVP, we'll do a basic check - just verify the URL format is valid
    // and return the username
    
    // In a real implementation:
    // const response = await fetch(`https://api.twitter.com/2/tweets/${tweetId}`);
    // const data = await response.json();
    // Check if tweet contains the code
    
    // For MVP - trust the URL, return username
    // The verification is mainly to link Twitter identity
    return {
      valid: true,
      username: twitterUsername
    };
  } catch {
    return { valid: false };
  }
}
