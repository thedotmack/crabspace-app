// Gemini image generation wrapper using nano-banana-pro script
import { execFile } from 'child_process';
import { promisify } from 'util';
import { mkdir } from 'fs/promises';
import path from 'path';

const execFileAsync = promisify(execFile);

// Use environment variable or default path for the script
const SCRIPT = process.env.NANO_BANANA_SCRIPT || '/usr/lib/node_modules/openclaw/skills/nano-banana-pro/scripts/generate_image.py';

export async function generateImage(
  prompt: string, 
  filename: string, 
  resolution: '1K' | '2K' = '1K'
): Promise<string> {
  // Use process.cwd() for portable path resolution
  const outputDir = path.join(process.cwd(), 'public', 'generated');
  
  // Ensure output directory exists
  await mkdir(outputDir, { recursive: true });
  
  const outputPath = path.join(outputDir, filename);
  
  console.log('[Gemini] Generating image:', filename);
  console.log('[Gemini] Prompt:', prompt.substring(0, 100) + '...');
  
  try {
    // Use execFile with array arguments to prevent shell injection
    const { stdout, stderr } = await execFileAsync('uv', [
      'run',
      SCRIPT,
      '--prompt', prompt,
      '--filename', outputPath,
      '--resolution', resolution
    ], { 
      timeout: 120000, // 2 minute timeout
      env: { ...process.env }
    });
    
    if (stderr && !stderr.includes('INFO')) {
      console.warn('[Gemini] stderr:', stderr);
    }
    
    console.log('[Gemini] Generated:', outputPath);
    
    // Return the public URL path
    return `/generated/${filename}`;
  } catch (error) {
    console.error('[Gemini] Generation failed:', error);
    throw new Error(`Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Generate both profile pic and banner for a user
export async function generateProfileImages(
  username: string,
  profilePrompt: string,
  bannerPrompt: string
): Promise<{ avatarUrl: string; bannerUrl: string }> {
  const timestamp = Date.now();
  const avatarFilename = `${username}-avatar-${timestamp}.png`;
  const bannerFilename = `${username}-banner-${timestamp}.png`;
  
  // Generate both in parallel
  const [avatarUrl, bannerUrl] = await Promise.all([
    generateImage(profilePrompt, avatarFilename, '1K'),
    generateImage(bannerPrompt, bannerFilename, '2K'),
  ]);
  
  return { avatarUrl, bannerUrl };
}
