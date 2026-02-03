'use client';

import Link from 'next/link';

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
}

export default function PostGrid({ posts }: PostGridProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">📷</div>
        <p className="text-xl text-white">No posts yet</p>
        <p className="text-zinc-500 mt-2">Be the first to share something</p>
        <Link 
          href="/create" 
          className="inline-block mt-6 px-6 py-2 bg-orange-500 text-black font-semibold rounded-full hover:bg-orange-400 transition"
        >
          Create Post
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-0.5">
      {posts.map((post) => (
        <Link
          key={post.id}
          href={`/post/${post.id}`}
          className="relative aspect-square overflow-hidden group"
        >
          <img
            src={post.imageUrl}
            alt={post.caption || 'Post'}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
            <div className="flex items-center gap-1.5 text-white font-semibold">
              <span>❤️</span>
              <span>{post.likeCount}</span>
            </div>
            <div className="flex items-center gap-1.5 text-white font-semibold">
              <span>💬</span>
              <span>{post.commentCount}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
