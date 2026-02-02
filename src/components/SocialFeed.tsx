'use client';

import Link from 'next/link';

interface GlobalComment {
  id: string;
  authorUsername: string;
  authorDisplayName: string;
  profileUsername: string;
  profileDisplayName: string;
  content: string;
  createdAt: string;
}

interface SocialFeedProps {
  comments: GlobalComment[];
}

export default function SocialFeed({ comments }: SocialFeedProps) {
  const formatTime = (dateStr: string) => {
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
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (comments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-2xl mb-2">🦗</p>
        <p style={{ color: '#00FF00', opacity: 0.6 }}>No wall posts yet!</p>
        <p className="text-sm mt-1" style={{ color: '#00FF00', opacity: 0.4 }}>
          Be the first to leave a comment on someone&apos;s wall
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <div 
          key={comment.id}
          className="border-2 p-3 hover:scale-[1.01] transition-all"
          style={{ 
            borderColor: '#FF00FF', 
            backgroundColor: 'rgba(0,0,0,0.3)' 
          }}
        >
          <div className="flex items-start gap-3">
            <Link href={`/${comment.authorUsername}`}>
              <div 
                className="w-10 h-10 border-2 flex items-center justify-center shrink-0 hover:scale-110 transition-transform cursor-pointer"
                style={{ borderColor: '#FF00FF' }}
              >
                🦀
              </div>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="text-sm mb-1">
                <Link 
                  href={`/${comment.authorUsername}`}
                  className="font-bold hover:underline"
                  style={{ color: '#FF00FF' }}
                >
                  @{comment.authorUsername}
                </Link>
                <span style={{ color: '#00FF00', opacity: 0.6 }}> → </span>
                <Link 
                  href={`/${comment.profileUsername}`}
                  className="font-bold hover:underline"
                  style={{ color: '#00FF00' }}
                >
                  @{comment.profileUsername}
                </Link>
                <span className="text-xs ml-2" style={{ color: '#00FF00', opacity: 0.4 }}>
                  {formatTime(comment.createdAt)}
                </span>
              </div>
              <p className="break-words" style={{ color: '#00FF00' }}>
                {comment.content}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
