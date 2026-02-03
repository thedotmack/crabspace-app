'use client';

import { useState, useEffect } from 'react';

interface LikeButtonProps {
  postId: string;
  initialLiked?: boolean;
  initialLikeCount?: number;
  apiKey?: string;
}

export default function LikeButton({ 
  postId, 
  initialLiked = false, 
  initialLikeCount = 0,
  apiKey 
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);
  const [cmemEarned, setCmemEarned] = useState<number | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Clear animations after timeout
  useEffect(() => {
    if (showAnimation) {
      const timer = setTimeout(() => {
        setShowAnimation(false);
        setCmemEarned(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showAnimation]);

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  const handleLike = async () => {
    if (!apiKey) {
      setErrorMsg('Login to like posts');
      return;
    }
    if (liked || isLoading) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/engage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          post_id: postId,
          type: 'like',
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setLiked(true);
        setLikeCount(prev => prev + 1);
        
        if (data.cmemEarned > 0) {
          setCmemEarned(data.cmemEarned);
          setShowAnimation(true);
        } else if (data.alreadyEarnedToday) {
          // Still show a subtle animation even if no CMEM
          setShowAnimation(true);
        }
      } else {
        setErrorMsg(data.error || 'Failed to like');
      }
    } catch (error) {
      console.error('Error liking post:', error);
      setErrorMsg('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative inline-flex items-center gap-2">
      <button
        onClick={handleLike}
        disabled={isLoading || liked}
        className={`
          flex items-center gap-1 px-3 py-1.5 border-2 transition-all duration-200
          ${liked 
            ? 'border-red-500 bg-red-500/20 cursor-default' 
            : 'border-pink-500 hover:bg-pink-500/20 hover:scale-105 active:scale-95'
          }
          ${isLoading ? 'opacity-50 cursor-wait' : ''}
        `}
        style={{ 
          borderColor: liked ? '#FF6B6B' : '#FF00FF',
        }}
      >
        <span className={`text-xl transition-transform ${liked ? 'scale-110' : ''}`}>
          {liked ? '❤️' : '🤍'}
        </span>
        <span style={{ color: '#00FF00' }}>
          {likeCount}
        </span>
      </button>

      {/* CMEM Earned Animation */}
      {showAnimation && cmemEarned !== null && cmemEarned > 0 && (
        <div 
          className="absolute -top-8 left-1/2 -translate-x-1/2 animate-bounce"
          style={{ 
            color: '#FFD700',
            fontWeight: 'bold',
            textShadow: '0 0 10px #FFD700, 0 0 20px #FFD700',
            animation: 'float-up 2s ease-out forwards',
          }}
        >
          +{cmemEarned} $CMEM ✨
        </div>
      )}

      {/* Already earned indicator */}
      {showAnimation && (cmemEarned === 0 || cmemEarned === null) && (
        <div 
          className="absolute -top-8 left-1/2 -translate-x-1/2 text-sm"
          style={{ 
            color: '#FF00FF',
            opacity: 0.8,
          }}
        >
          💜 Liked!
        </div>
      )}

      {/* Error message */}
      {errorMsg && (
        <div 
          className="absolute -top-8 left-1/2 -translate-x-1/2 text-sm whitespace-nowrap"
          style={{ color: '#FF6B6B' }}
        >
          {errorMsg}
        </div>
      )}

      <style jsx>{`
        @keyframes float-up {
          0% {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
        }
      `}</style>
    </div>
  );
}
