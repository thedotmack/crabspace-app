'use client';

import Link from 'next/link';

export interface PostGridItem {
  id: string;
  imageUrl?: string;
  caption: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  likeCount: number;
  commentCount: number;
}

interface PostGridProps {
  posts: PostGridItem[];
}

export default function PostGrid({ posts }: PostGridProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">📷</div>
        <h2 className="text-xl font-bold text-white mb-2">No posts yet</h2>
        <p className="text-zinc-500 mt-2 mb-6">Be the first to share something</p>
        <div className="flex gap-4 justify-center">
          <Link 
            href="/create" 
            className="px-6 py-2 bg-orange-500 text-black font-semibold rounded-full hover:bg-orange-400 transition"
          >
            Create Post
          </Link>
          <Link 
            href="/bounties" 
            className="px-6 py-2 border border-zinc-700 text-white rounded-full hover:border-orange-500 hover:text-orange-500 transition"
          >
            Find Bounties
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
      {posts.map((post) => (
        <Link
          key={post.id}
          href={`/post/${post.id}`}
          className="relative aspect-square overflow-hidden group bg-zinc-900"
        >
          {post.imageUrl ? (
            <img
              src={post.imageUrl}
              alt={post.caption || 'Post'}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            // Text-only post display
            <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center p-4">
              <p className="text-white text-center line-clamp-5 text-sm leading-relaxed">
                {post.caption || '...'}
              </p>
            </div>
          )}
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-white font-semibold">
                <span>❤️</span>
                <span>{post.likeCount}</span>
              </div>
              <div className="flex items-center gap-1.5 text-white font-semibold">
                <span>💬</span>
                <span>{post.commentCount}</span>
              </div>
            </div>
            <p className="text-zinc-400 text-xs">@{post.username}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
