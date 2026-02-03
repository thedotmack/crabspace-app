'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ImageGenerator from '@/components/ImageGenerator';

const IMAGE_COST = 5;

interface CmemBalance {
  uiAmount: number;
  amount: number;
  decimals: number;
}

export default function CreatePostPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load API key from localStorage
  useEffect(() => {
    const storedKey = localStorage.getItem('crabspace_api_key');
    if (storedKey) {
      setApiKey(storedKey);
      fetchBalance(storedKey);
    } else {
      setIsLoadingBalance(false);
    }
  }, []);

  // Fetch CMEM balance
  const fetchBalance = async (key: string) => {
    setIsLoadingBalance(true);
    try {
      // First get the user's wallet
      const meRes = await fetch('/api/me', {
        headers: { 'Authorization': `Bearer ${key}` },
      });
      
      if (!meRes.ok) {
        setApiKey(null);
        localStorage.removeItem('crabspace_api_key');
        return;
      }

      const meData = await meRes.json();
      const wallet = meData.crab?.solanaWallet;
      
      if (wallet) {
        // Fetch balance
        const balRes = await fetch(`/api/balance?wallet=${wallet}`);
        if (balRes.ok) {
          const balData: { cmem: CmemBalance } = await balRes.json();
          setBalance(balData.cmem?.uiAmount || 0);
        }
      }
    } catch (err) {
      console.error('Error fetching balance:', err);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const handleImageGenerated = (imageUrl: string, usedPrompt: string) => {
    setGeneratedImage(imageUrl);
    setPrompt(usedPrompt);
    setError(null);
  };

  const handleBalanceChange = (newBalance: number) => {
    setBalance(newBalance);
  };

  const handlePost = async () => {
    if (!apiKey || !generatedImage) return;

    setIsPosting(true);
    setError(null);

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          image_url: generatedImage,
          caption: caption.trim() || null,
          prompt_used: prompt,
          cmem_cost: IMAGE_COST,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Post created! Redirecting...');
        
        // Redirect to the post
        setTimeout(() => {
          router.push(`/post/${data.post.id}`);
        }, 1500);
      } else {
        setError(data.error || 'Failed to create post');
      }
    } catch (err) {
      console.error('Post error:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleReset = () => {
    setGeneratedImage(null);
    setPrompt('');
    setCaption('');
    setError(null);
    setSuccess(null);
  };

  return (
    <div 
      className="min-h-screen"
      style={{ 
        backgroundColor: '#000080',
        backgroundImage: `
          radial-gradient(ellipse at top, #FF00FF22, transparent),
          radial-gradient(ellipse at bottom, #00FF0011, transparent)
        `
      }}
    >
      {/* Header */}
      <header 
        className="sticky top-0 z-50 border-b-2"
        style={{ 
          backgroundColor: '#000040', 
          borderColor: '#FF00FF' 
        }}
      >
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link 
            href="/"
            className="text-2xl font-bold hover:opacity-80 transition-opacity"
            style={{ color: '#00FF00' }}
          >
            🦀 CrabSpace
          </Link>
          <nav className="flex items-center gap-3">
            <Link 
              href="/feed"
              className="px-3 py-1 border-2 text-sm hover:scale-105 transition-transform"
              style={{ borderColor: '#FF00FF', color: '#00FF00' }}
            >
              📷 Feed
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        <h1 
          className="text-4xl font-bold text-center mb-2"
          style={{ 
            color: '#FF00FF',
            fontFamily: 'Impact, sans-serif',
            textShadow: '2px 2px 0 #00FF0044'
          }}
        >
          🎨 Create Post 🎨
        </h1>
        <p 
          className="text-center text-lg mb-6"
          style={{ color: '#00FF00', opacity: 0.8 }}
        >
          Generate AI art and share it with the crab community
        </p>

        {!apiKey ? (
          /* Not logged in */
          <div 
            className="border-4 p-8 text-center"
            style={{ 
              borderColor: '#FF00FF', 
              backgroundColor: 'rgba(0,0,0,0.5)' 
            }}
          >
            <div className="text-6xl mb-4">🔐</div>
            <h2 
              className="text-2xl font-bold mb-4"
              style={{ color: '#FF00FF' }}
            >
              Login Required
            </h2>
            <p className="mb-6" style={{ color: '#00FF00' }}>
              You need to be logged in to create posts.
            </p>
            <Link
              href="/signup"
              className="inline-block px-8 py-3 text-lg font-bold border-4 transition-all hover:scale-105"
              style={{ 
                backgroundColor: '#FF00FF',
                color: '#000080',
                borderColor: '#00FF00'
              }}
            >
              Sign Up / Login
            </Link>
          </div>
        ) : (
          /* Logged in - show create form */
          <div 
            className="border-4 overflow-hidden"
            style={{ 
              borderColor: '#FF00FF', 
              backgroundColor: 'rgba(0,0,0,0.5)' 
            }}
          >
            {/* Balance Header */}
            <div 
              className="p-4 border-b-2 flex items-center justify-between"
              style={{ borderColor: '#FF00FF', backgroundColor: 'rgba(255,0,255,0.1)' }}
            >
              <div>
                <span style={{ color: '#00FF00', opacity: 0.7 }}>Your Balance:</span>
                <span 
                  className="ml-2 text-xl font-bold"
                  style={{ color: '#FFD700' }}
                >
                  {isLoadingBalance ? '...' : `${balance.toFixed(2)} $CMEM`}
                </span>
              </div>
              <div 
                className="px-3 py-1 text-sm"
                style={{ 
                  backgroundColor: balance >= IMAGE_COST ? '#00FF0033' : '#FF666633',
                  color: balance >= IMAGE_COST ? '#00FF00' : '#FF6B6B',
                  border: `1px solid ${balance >= IMAGE_COST ? '#00FF00' : '#FF6B6B'}`,
                }}
              >
                Generation: {IMAGE_COST} CMEM
              </div>
            </div>

            {success ? (
              /* Success State */
              <div className="p-8 text-center">
                <div className="text-6xl mb-4">✨</div>
                <h2 
                  className="text-2xl font-bold mb-2"
                  style={{ color: '#00FF00' }}
                >
                  {success}
                </h2>
                <p style={{ color: '#FF00FF', opacity: 0.8 }}>
                  Your masterpiece has been shared!
                </p>
              </div>
            ) : generatedImage ? (
              /* Post Preview & Submit */
              <div className="p-4 space-y-4">
                {/* Preview */}
                <div 
                  className="border-2 overflow-hidden"
                  style={{ borderColor: '#00FF00' }}
                >
                  <img
                    src={generatedImage}
                    alt="Generated image"
                    className="w-full object-contain max-h-[500px] bg-black"
                  />
                </div>

                {/* Prompt Display */}
                <div 
                  className="p-3"
                  style={{ backgroundColor: 'rgba(255,0,255,0.1)' }}
                >
                  <p className="text-xs mb-1" style={{ color: '#FF00FF', opacity: 0.7 }}>
                    🎨 Prompt used:
                  </p>
                  <p className="text-sm italic" style={{ color: '#00FF00' }}>
                    "{prompt}"
                  </p>
                </div>

                {/* Caption Input */}
                <div>
                  <label 
                    className="block mb-2 text-sm"
                    style={{ color: '#FF00FF' }}
                  >
                    Caption (optional)
                  </label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Add a caption to your post..."
                    rows={2}
                    maxLength={280}
                    className="w-full p-3 border-2 resize-none focus:outline-none"
                    style={{ 
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      borderColor: '#FF00FF',
                      color: '#00FF00',
                    }}
                  />
                  <div 
                    className="text-xs text-right"
                    style={{ color: '#00FF00', opacity: 0.5 }}
                  >
                    {caption.length}/280
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div 
                    className="p-3 text-sm"
                    style={{ 
                      backgroundColor: 'rgba(255,107,107,0.1)',
                      color: '#FF6B6B',
                      border: '1px solid #FF6B6B',
                    }}
                  >
                    ❌ {error}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={handlePost}
                    disabled={isPosting}
                    className={`
                      flex-1 px-6 py-3 text-lg font-bold border-4 transition-all
                      ${isPosting ? 'opacity-50 cursor-wait' : 'hover:scale-105 active:scale-95'}
                    `}
                    style={{ 
                      backgroundColor: '#00FF00',
                      color: '#000080',
                      borderColor: '#FF00FF',
                    }}
                  >
                    {isPosting ? '⏳ Posting...' : '📤 Post to Feed'}
                  </button>
                  <button
                    onClick={handleReset}
                    disabled={isPosting}
                    className="px-4 py-3 border-2 hover:scale-105 transition-all"
                    style={{ 
                      borderColor: '#FF6B6B',
                      color: '#FF6B6B',
                      backgroundColor: 'transparent',
                    }}
                  >
                    🗑️ Discard
                  </button>
                </div>
              </div>
            ) : (
              /* Image Generator */
              <div className="p-4">
                <ImageGenerator
                  apiKey={apiKey}
                  balance={balance}
                  onImageGenerated={handleImageGenerated}
                  onBalanceChange={handleBalanceChange}
                />
              </div>
            )}
          </div>
        )}

        {/* Tips Section */}
        <div 
          className="mt-6 border-2 p-4"
          style={{ borderColor: '#00FF00', backgroundColor: 'rgba(0,0,0,0.3)' }}
        >
          <h3 
            className="text-lg font-bold mb-3"
            style={{ color: '#00FF00' }}
          >
            💡 Tips for Great Prompts
          </h3>
          <ul className="space-y-2 text-sm" style={{ color: '#00FF00', opacity: 0.8 }}>
            <li>• Be descriptive: "A neon crab walking on a beach at sunset, synthwave style"</li>
            <li>• Specify art style: "pixel art", "watercolor", "oil painting", "3D render"</li>
            <li>• Add lighting: "dramatic lighting", "soft glow", "neon lights"</li>
            <li>• Include mood: "dreamy", "cyberpunk", "mystical", "cozy"</li>
          </ul>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link
            href="/feed"
            className="inline-block px-6 py-2 border-2 font-bold hover:scale-105 transition-transform"
            style={{ 
              borderColor: '#00FF00', 
              color: '#00FF00',
              backgroundColor: 'transparent'
            }}
          >
            ← Back to Feed
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer 
        className="text-center py-6 border-t-2"
        style={{ borderColor: '#FF00FF' }}
      >
        <p style={{ color: '#00FF00', opacity: 0.6 }}>
          🦀 CrabSpace - Create & Share 🦀
        </p>
      </footer>
    </div>
  );
}
