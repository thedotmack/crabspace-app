'use client';

import { useState, useEffect } from 'react';

const IMAGE_COST = 5; // CMEM per generation

interface CommentInputProps {
  postId: string;
  apiKey?: string;
  balance?: number;
  enableImageGeneration?: boolean;
  onCommentAdded?: (comment: {
    id: string;
    commentText: string;
    cmemEarned: number;
  }) => void;
  onBalanceChange?: (newBalance: number) => void;
}

export default function CommentInput({ 
  postId, 
  apiKey, 
  balance = 0,
  enableImageGeneration = false,
  onCommentAdded,
  onBalanceChange,
}: CommentInputProps) {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    cmem?: number;
  } | null>(null);
  
  // Image generation state
  const [showImageGen, setShowImageGen] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Clear feedback after timeout
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Handle image generation
  const handleGenerateImage = async () => {
    if (!apiKey || balance < IMAGE_COST || !imagePrompt.trim()) return;

    setIsGenerating(true);
    setFeedback(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ prompt: imagePrompt.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.imageUrl) {
        setGeneratedImage(data.imageUrl);
        // Update balance
        if (data.newBalance !== undefined) {
          onBalanceChange?.(data.newBalance);
        }
        setFeedback({ type: 'success', message: `Image generated! -${IMAGE_COST} CMEM` });
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to generate image' });
      }
    } catch (error) {
      console.error('Generation error:', error);
      setFeedback({ type: 'error', message: 'Network error' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearImage = () => {
    setGeneratedImage(null);
    setImagePrompt('');
    setShowImageGen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey) {
      setFeedback({ type: 'error', message: 'Login to comment' });
      return;
    }

    const trimmedComment = comment.trim();
    if (!trimmedComment) {
      setFeedback({ type: 'error', message: 'Comment cannot be empty' });
      return;
    }

    if (trimmedComment.length > 500) {
      setFeedback({ type: 'error', message: 'Comment too long (max 500 chars)' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch('/api/engage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          post_id: postId,
          type: 'comment',
          comment_text: trimmedComment,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setComment('');
        
        if (data.cmemEarned > 0) {
          setFeedback({ 
            type: 'success', 
            message: `Comment posted! +${data.cmemEarned} $CMEM`,
            cmem: data.cmemEarned,
          });
        } else if (data.alreadyEarnedToday) {
          setFeedback({ 
            type: 'info', 
            message: 'Comment posted! (Already earned CMEM from this crab today)',
          });
        } else {
          setFeedback({ type: 'success', message: 'Comment posted!' });
        }

        // Notify parent of new comment
        if (onCommentAdded && data.engagement) {
          onCommentAdded({
            id: data.engagement.id,
            commentText: data.engagement.commentText,
            cmemEarned: data.cmemEarned,
          });
        }
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to post comment' });
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      setFeedback({ type: 'error', message: 'Network error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!apiKey) {
    return (
      <div 
        className="p-4 border-2 border-dashed text-center"
        style={{ borderColor: '#FF00FF44', color: '#00FF00', opacity: 0.7 }}
      >
        <p>🦀 Login to leave a comment and earn $CMEM!</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Image Generation Section (optional) */}
      {enableImageGeneration && (
        <div className="mb-3">
          {!showImageGen && !generatedImage && (
            <button
              type="button"
              onClick={() => setShowImageGen(true)}
              className="text-sm px-3 py-1 border hover:scale-105 transition-all"
              style={{ 
                borderColor: '#FF00FF',
                color: '#FF00FF',
                backgroundColor: 'transparent',
              }}
            >
              🎨 Add AI Image ({IMAGE_COST} CMEM)
            </button>
          )}

          {showImageGen && !generatedImage && (
            <div 
              className="p-3 border-2 space-y-2"
              style={{ borderColor: '#FF00FF', backgroundColor: 'rgba(255,0,255,0.05)' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: '#FF00FF' }}>
                  🎨 Generate Image ({IMAGE_COST} CMEM)
                </span>
                <button
                  type="button"
                  onClick={() => setShowImageGen(false)}
                  className="text-xs hover:opacity-70"
                  style={{ color: '#FF6B6B' }}
                >
                  ✕ Cancel
                </button>
              </div>
              <input
                type="text"
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="Describe your image..."
                maxLength={500}
                className="w-full p-2 text-sm border focus:outline-none"
                style={{ 
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  borderColor: '#FF00FF',
                  color: '#00FF00',
                }}
              />
              <button
                type="button"
                onClick={handleGenerateImage}
                disabled={isGenerating || balance < IMAGE_COST || !imagePrompt.trim()}
                className={`
                  w-full px-3 py-2 text-sm font-bold border transition-all
                  ${isGenerating || balance < IMAGE_COST ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
                `}
                style={{ 
                  borderColor: '#FF00FF',
                  color: '#FF00FF',
                  backgroundColor: 'rgba(255,0,255,0.1)',
                }}
              >
                {isGenerating ? '⏳ Generating...' : balance < IMAGE_COST ? `Need ${IMAGE_COST} CMEM` : '🎨 Generate'}
              </button>
            </div>
          )}

          {generatedImage && (
            <div 
              className="border-2 overflow-hidden"
              style={{ borderColor: '#00FF00' }}
            >
              <img
                src={generatedImage}
                alt="Generated"
                className="w-full max-h-48 object-contain bg-black"
              />
              <div className="p-2 flex items-center justify-between" style={{ backgroundColor: 'rgba(0,255,0,0.1)' }}>
                <span className="text-xs" style={{ color: '#00FF00' }}>
                  ✨ Image attached
                </span>
                <button
                  type="button"
                  onClick={handleClearImage}
                  className="text-xs hover:opacity-70"
                  style={{ color: '#FF6B6B' }}
                >
                  🗑️ Remove
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="relative">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Leave a comment... 🦀"
          rows={3}
          maxLength={500}
          disabled={isSubmitting}
          className="w-full p-3 border-2 resize-none focus:outline-none transition-colors"
          style={{ 
            backgroundColor: 'rgba(0,0,0,0.3)',
            borderColor: '#FF00FF',
            color: '#00FF00',
          }}
        />
        <div 
          className="absolute bottom-2 right-2 text-xs"
          style={{ color: '#00FF00', opacity: 0.5 }}
        >
          {comment.length}/500
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <button
          type="submit"
          disabled={isSubmitting || !comment.trim()}
          className={`
            px-4 py-2 border-2 font-bold transition-all
            ${isSubmitting ? 'opacity-50 cursor-wait' : 'hover:scale-105 active:scale-95'}
            ${!comment.trim() ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          style={{ 
            borderColor: '#00FF00',
            color: '#00FF00',
            backgroundColor: 'transparent',
          }}
        >
          {isSubmitting ? '⏳ Posting...' : '💬 Post Comment'}
        </button>

        {/* Feedback message */}
        {feedback && (
          <div 
            className={`
              flex items-center gap-2 px-3 py-1 text-sm
              animate-pulse
            `}
            style={{ 
              color: feedback.type === 'error' ? '#FF6B6B' : 
                     feedback.type === 'success' ? '#FFD700' : '#FF00FF',
            }}
          >
            {feedback.type === 'success' && feedback.cmem && (
              <span 
                className="font-bold"
                style={{ textShadow: '0 0 10px #FFD700' }}
              >
                ✨ +{feedback.cmem} $CMEM
              </span>
            )}
            <span>{feedback.message}</span>
          </div>
        )}
      </div>
    </form>
  );
}
