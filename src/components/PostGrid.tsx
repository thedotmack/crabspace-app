'use client';

import Link from 'next/link';
import { useState } from 'react';

export interface PostGridItem {
  id: string;
  imageUrl: string;
  caption: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  likeCount: number;
  commentCount: number;
}

interface PostGridProps {
  posts: PostGridItem[];
  accentColor?: string;
  textColor?: string;
}

export default function PostGrid({ 
  posts, 
  accentColor = '#FF00FF',
  textColor = '#00FF00' 
}: PostGridProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (posts.length === 0) {
    return (
      <div 
        className="text-center py-16 border-2 border-dashed"
        style={{ borderColor: accentColor, color: textColor }}
      >
        <div className="text-6xl mb-4">📷</div>
        <p className="text-xl">No posts yet!</p>
        <p className="opacity-70 mt-2">Be the first to share a photo</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1 md:gap-2">
      {posts.map((post) => (
        <Link
          key={post.id}
          href={`/post/${post.id}`}
          className="relative aspect-square block overflow-hidden border-2 transition-all duration-200"
          style={{ 
            borderColor: hoveredId === post.id ? accentColor : 'transparent',
            transform: hoveredId === post.id ? 'scale(1.02)' : 'scale(1)',
          }}
          onMouseEnter={() => setHoveredId(post.id)}
          onMouseLeave={() => setHoveredId(null)}
        >
          {/* Image */}
          <img
            src={post.imageUrl}
            alt={post.caption || 'Post image'}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          
          {/* Hover overlay with stats */}
          <div 
            className="absolute inset-0 flex items-center justify-center gap-4 transition-opacity duration-200"
            style={{ 
              backgroundColor: 'rgba(0,0,0,0.7)',
              opacity: hoveredId === post.id ? 1 : 0,
            }}
          >
            <div className="flex items-center gap-1 text-white font-bold">
              <span>❤️</span>
              <span>{post.likeCount}</span>
            </div>
            <div className="flex items-center gap-1 text-white font-bold">
              <span>💬</span>
              <span>{post.commentCount}</span>
            </div>
          </div>

          {/* Author badge on hover */}
          {hoveredId === post.id && (
            <div 
              className="absolute bottom-2 left-2 right-2 flex items-center gap-2 p-2 rounded"
              style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
            >
              <div 
                className="w-6 h-6 rounded-full border flex items-center justify-center text-xs overflow-hidden"
                style={{ borderColor: accentColor }}
              >
                {post.avatarUrl ? (
                  <img src={post.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  '🦀'
                )}
              </div>
              <span className="text-xs truncate" style={{ color: textColor }}>
                @{post.username}
              </span>
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}
