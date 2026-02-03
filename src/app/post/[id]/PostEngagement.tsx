'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import LikeButton from '@/components/LikeButton';
import CommentInput from '@/components/CommentInput';

interface PostComment {
  id: string;
  postId: string;
  crabId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  commentText: string;
  createdAt: string;
}

interface PostEngagementProps {
  postId: string;
  initialLikeCount: number;
  cmemCost: number;
  comments: PostComment[];
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Helper to get initial values from localStorage (client-side only)
function getStoredValue(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key);
}

export default function PostEngagement({
  postId,
  initialLikeCount,
  cmemCost,
  comments: initialComments,
}: PostEngagementProps) {
  const [comments, setComments] = useState<PostComment[]>(initialComments);
  const [authState, setAuthState] = useState<{
    apiKey?: string;
    username?: string;
    displayName?: string;
    avatarUrl?: string;
  }>({});

  // Load auth state from localStorage on mount
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setAuthState({
      apiKey: getStoredValue('crabspace_api_key') || undefined,
      username: getStoredValue('crabspace_username') || undefined,
      displayName: getStoredValue('crabspace_display_name') || undefined,
      avatarUrl: getStoredValue('crabspace_avatar_url') || undefined,
    });
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const { apiKey, username: currentUsername, displayName: currentDisplayName, avatarUrl: currentAvatarUrl } = authState;

  // Handle new comment added
  const handleCommentAdded = (newComment: {
    id: string;
    commentText: string;
    cmemEarned: number;
  }) => {
    // Add new comment to the top of the list
    const fullComment: PostComment = {
      id: newComment.id,
      postId,
      crabId: '', // We don't have this, but it's not used in display
      username: currentUsername || 'anonymous',
      displayName: currentDisplayName || 'Anonymous Crab',
      avatarUrl: currentAvatarUrl || '',
      commentText: newComment.commentText,
      createdAt: new Date().toISOString(),
    };
    setComments(prev => [fullComment, ...prev]);
  };

  return (
    <div className="space-y-6">
      {/* Stats & Like Row */}
      <div 
        className="flex flex-wrap items-center gap-4 pb-4 border-b"
        style={{ borderColor: '#FF00FF44' }}
      >
        <LikeButton 
          postId={postId} 
          initialLikeCount={initialLikeCount}
          apiKey={apiKey}
        />
        
        <div className="flex items-center gap-2">
          <span className="text-xl">💬</span>
          <span style={{ color: '#00FF00' }}>{comments.length} comments</span>
        </div>
        
        {cmemCost > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xl">💰</span>
            <span style={{ color: '#FFD700' }}>{cmemCost} $CMEM</span>
          </div>
        )}
      </div>

      {/* Comment Input */}
      <div className="pb-4 border-b" style={{ borderColor: '#FF00FF44' }}>
        <CommentInput 
          postId={postId}
          apiKey={apiKey}
          onCommentAdded={handleCommentAdded}
        />
      </div>

      {/* Comments Section */}
      <div>
        <h3 
          className="text-lg font-bold mb-4"
          style={{ color: '#FF00FF' }}
        >
          💬 Comments ({comments.length})
        </h3>

        {comments.length === 0 ? (
          <div 
            className="text-center py-8 border-2 border-dashed"
            style={{ borderColor: '#FF00FF44', color: '#00FF00' }}
          >
            <p className="opacity-70">No comments yet</p>
            <p className="text-sm opacity-50 mt-1">Be the first to comment and earn $CMEM! 🦀</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div 
                key={comment.id}
                className="flex gap-3 p-3 border"
                style={{ borderColor: '#FF00FF44', backgroundColor: 'rgba(0,0,0,0.3)' }}
              >
                <Link href={`/${comment.username}`}>
                  <div 
                    className="w-8 h-8 border flex items-center justify-center text-sm overflow-hidden shrink-0"
                    style={{ borderColor: '#FF00FF' }}
                  >
                    {comment.avatarUrl ? (
                      <img src={comment.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      '🦀'
                    )}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <p style={{ color: '#00FF00' }}>
                    <Link 
                      href={`/${comment.username}`}
                      className="font-bold hover:underline"
                      style={{ color: '#FF00FF' }}
                    >
                      @{comment.username}
                    </Link>{' '}
                    {comment.commentText}
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#00FF00', opacity: 0.4 }}>
                    {formatDate(comment.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
