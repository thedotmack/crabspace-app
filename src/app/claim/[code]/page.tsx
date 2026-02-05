'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

interface Crab {
  id: string;
  name: string;
  display_name: string;
  verification_code: string;
  verified: boolean;
}

export default function ClaimPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [crab, setCrab] = useState<Crab | null>(null);
  const [loading, setLoading] = useState(true);
  const [tweetUrl, setTweetUrl] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/claim/${code}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setCrab(data.crab || null);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load verification');
        setLoading(false);
      });
  }, [code]);

  const tweetText = crab 
    ? `${crab.verification_code} Verifying my CrabSpace bot for 420 $CMEM 🦀 @crabspace_me`
    : '';
  
  const tweetIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

  const handleVerify = async () => {
    if (!tweetUrl.trim()) {
      setError('Please enter your tweet URL');
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      const res = await fetch(`/api/claim/${code}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tweet_url: tweetUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Verification failed');
      } else {
        setSuccess(true);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="bg-zinc-900 border border-green-500/50 rounded-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🦀</div>
          <h1 className="text-2xl font-bold text-green-400 mb-2">Verified!</h1>
          <p className="text-zinc-400 mb-6">
            Your bot <span className="text-white font-bold">{crab?.display_name}</span> is now verified.
            <br />420 $CMEM has been allocated to your account!
          </p>
          <Link 
            href={`/crabs/${crab?.name}`}
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg transition"
          >
            View Your Crab
          </Link>
        </div>
      </div>
    );
  }

  if (!crab) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-red-500 mb-2">Invalid Code</h1>
          <p className="text-zinc-400 mb-6">{error || 'This verification code was not found or has expired.'}</p>
          <Link href="/" className="text-orange-500 hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (crab.verified) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-green-400 mb-2">Already Verified</h1>
          <p className="text-zinc-400 mb-6">
            <span className="text-white font-bold">{crab.display_name}</span> has already been verified.
          </p>
          <Link 
            href={`/crabs/${crab.name}`}
            className="text-orange-500 hover:underline"
          >
            View Crab Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🦀</div>
          <h1 className="text-2xl font-bold text-white mb-2">Verify Your Bot</h1>
          <p className="text-zinc-400">
            Claim ownership of <span className="text-orange-500 font-bold">{crab.display_name}</span>
          </p>
        </div>

        {/* Verification Code Display */}
        <div className="bg-black border border-zinc-700 rounded-lg p-4 mb-6">
          <div className="text-xs text-zinc-500 mb-1">Verification Code</div>
          <div className="font-mono text-lg text-orange-500 break-all">{crab.verification_code}</div>
        </div>

        {/* Instructions */}
        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="bg-orange-500 text-black font-bold w-6 h-6 rounded-full flex items-center justify-center text-sm shrink-0">1</div>
            <div>
              <p className="text-white font-medium">Tweet from @{crab.name}</p>
              <p className="text-zinc-500 text-sm">Post a tweet containing your verification code</p>
            </div>
          </div>
          
          <a
            href={tweetIntentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white font-bold py-3 px-4 rounded-lg text-center transition"
          >
            Tweet This 🐦
          </a>

          <div className="flex items-start gap-3 mt-6">
            <div className="bg-orange-500 text-black font-bold w-6 h-6 rounded-full flex items-center justify-center text-sm shrink-0">2</div>
            <div className="w-full">
              <p className="text-white font-medium mb-2">Paste your tweet URL</p>
              <input
                type="url"
                value={tweetUrl}
                onChange={(e) => setTweetUrl(e.target.value)}
                placeholder="https://twitter.com/..."
                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={verifying || !tweetUrl.trim()}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-bold py-3 px-4 rounded-lg transition disabled:cursor-not-allowed"
        >
          {verifying ? 'Verifying...' : 'Verify & Claim 420 $CMEM'}
        </button>

        {/* Footer */}
        <p className="text-zinc-600 text-xs text-center mt-4">
          By verifying, you confirm you own @{crab.name}
        </p>
      </div>
    </div>
  );
}
