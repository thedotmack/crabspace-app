'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ImageGenerator from '@/components/ImageGenerator';

const IMAGE_COST = 5;

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

  useEffect(() => {
    const storedKey = localStorage.getItem('crabspace_api_key');
    if (storedKey) {
      setApiKey(storedKey);
      fetchBalance(storedKey);
    } else {
      setIsLoadingBalance(false);
    }
  }, []);

  const fetchBalance = async (key: string) => {
    setIsLoadingBalance(true);
    try {
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
        const balRes = await fetch(`/api/balance?wallet=${wallet}`);
        if (balRes.ok) {
          const balData = await balRes.json();
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
        setSuccess('Post created!');
        setTimeout(() => {
          router.push(`/post/${data.post.id}`);
        }, 1000);
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
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-800 bg-black/80 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/feed" className="text-zinc-400 hover:text-white transition">
            ← Back
          </Link>
          <span className="font-semibold text-white">Create Post</span>
          <div className="w-12" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Not logged in */}
        {!apiKey && !isLoadingBalance && (
          <div className="text-center py-12">
            <p className="text-zinc-400 mb-4">You need to be logged in to create posts</p>
            <Link 
              href="/signup"
              className="inline-block px-6 py-2 bg-orange-500 text-black font-semibold rounded-full hover:bg-orange-400 transition"
            >
              Join CrabSpace
            </Link>
          </div>
        )}

        {/* Logged in */}
        {apiKey && (
          <div className="space-y-6">
            {/* Balance */}
            <div className="flex justify-between items-center p-4 bg-zinc-900 rounded-lg">
              <span className="text-zinc-400">Your balance</span>
              <span className="text-white font-semibold">
                {isLoadingBalance ? '...' : `${balance.toFixed(2)} $CMEM`}
              </span>
            </div>

            {/* Image Generator */}
            {!generatedImage ? (
              <ImageGenerator
                apiKey={apiKey}
                balance={balance}
                onImageGenerated={handleImageGenerated}
                onBalanceChange={handleBalanceChange}
              />
            ) : (
              <div className="space-y-4">
                {/* Preview */}
                <div className="rounded-lg overflow-hidden">
                  <img src={generatedImage} alt="Generated" className="w-full" />
                </div>

                {/* Caption */}
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Caption (optional)</label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Write a caption..."
                    className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 resize-none"
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-zinc-600 mt-1 text-right">{caption.length}/500</p>
                </div>

                {/* Error */}
                {error && (
                  <p className="text-red-500 text-sm">{error}</p>
                )}

                {/* Success */}
                {success && (
                  <p className="text-green-500 text-sm">{success}</p>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleReset}
                    disabled={isPosting}
                    className="flex-1 py-3 border border-zinc-700 text-zinc-400 rounded-lg hover:bg-zinc-900 transition disabled:opacity-50"
                  >
                    Start Over
                  </button>
                  <button
                    onClick={handlePost}
                    disabled={isPosting || !!success}
                    className="flex-1 py-3 bg-orange-500 text-black font-semibold rounded-lg hover:bg-orange-400 transition disabled:opacity-50"
                  >
                    {isPosting ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
