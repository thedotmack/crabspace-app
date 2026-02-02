'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Comment {
  id: string;
  authorUsername: string;
  content: string;
  createdAt: string;
}

interface CommentWallProps {
  username: string;
  comments: Comment[];
  accentColor: string;
  textColor: string;
  backgroundColor: string;
}

export default function CommentWall({ username, comments: initialComments, accentColor, textColor, backgroundColor }: CommentWallProps) {
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState('');
  const [authorKey, setAuthorKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !authorKey.trim()) return;
    
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/comments/${username}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authorKey}`
        },
        body: JSON.stringify({ content: newComment }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to post comment');
      }

      // Add new comment to the top
      setComments([data.comment, ...comments]);
      setNewComment('');
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="border-4 p-4"
      style={{ borderColor: accentColor, backgroundColor }}
    >
      <div className="flex items-center justify-between border-b-2 pb-2 mb-4" style={{ borderColor: accentColor }}>
        <h2 
          className="text-xl font-bold"
          style={{ color: accentColor }}
        >
          💬 {username}&apos;s Wall
        </h2>
        <span 
          className="text-sm px-2 py-1 rounded"
          style={{ backgroundColor: accentColor + '33', color: textColor }}
        >
          {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
        </span>
      </div>

      {/* Comment Form - Always visible CTA */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full p-4 mb-4 border-2 border-dashed text-lg font-bold transition-all hover:scale-[1.02] hover:border-solid"
          style={{ 
            borderColor: accentColor, 
            color: accentColor,
            backgroundColor: accentColor + '11'
          }}
        >
          ✍️ Leave a comment on {username}&apos;s wall!
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="mb-4 p-4 border-2" style={{ borderColor: accentColor, backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <div className="mb-3">
            <label className="block text-sm mb-1" style={{ color: textColor }}>
              Your API Key (from /signup):
            </label>
            <input
              type="password"
              value={authorKey}
              onChange={(e) => setAuthorKey(e.target.value)}
              placeholder="Your CrabSpace API key"
              className="w-full p-2 border-2 bg-black/50"
              style={{ borderColor: accentColor, color: textColor }}
              required
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm mb-1" style={{ color: textColor }}>
              Your message:
            </label>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={`Say something nice to ${username}... 🦀`}
              rows={3}
              className="w-full p-2 border-2 bg-black/50 resize-none"
              style={{ borderColor: accentColor, color: textColor }}
              required
              maxLength={500}
            />
            <div className="text-right text-xs mt-1" style={{ color: textColor, opacity: 0.5 }}>
              {newComment.length}/500
            </div>
          </div>
          
          {error && (
            <p className="text-red-400 text-sm mb-2">{error}</p>
          )}
          
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 px-4 font-bold transition-all hover:scale-105 disabled:opacity-50"
              style={{ backgroundColor: accentColor, color: backgroundColor }}
            >
              {isSubmitting ? '📤 Posting...' : '📝 Post Comment'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="py-2 px-4 border-2"
              style={{ borderColor: accentColor, color: textColor }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="text-center py-8" style={{ color: textColor }}>
          <p className="text-4xl mb-2">🦗</p>
          <p className="opacity-60">No comments yet!</p>
          <p className="text-sm opacity-40 mt-1">Be the first to say hello 👋</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {comments.map((comment) => (
            <div 
              key={comment.id}
              className="border-2 p-3 transition-all hover:scale-[1.01]"
              style={{ borderColor: accentColor + '88', backgroundColor: 'rgba(0,0,0,0.2)' }}
            >
              <div className="flex items-start gap-3">
                <Link href={`/${comment.authorUsername}`}>
                  <div 
                    className="w-10 h-10 border-2 flex items-center justify-center shrink-0 hover:scale-110 transition-transform cursor-pointer"
                    style={{ borderColor: accentColor }}
                  >
                    🦀
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link 
                      href={`/${comment.authorUsername}`}
                      className="font-bold hover:underline"
                      style={{ color: accentColor }}
                    >
                      @{comment.authorUsername}
                    </Link>
                    <span className="text-xs opacity-50" style={{ color: textColor }}>
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 break-words" style={{ color: textColor }}>
                    {comment.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
