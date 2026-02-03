import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Header from '@/components/Header';
import PostEngagement from './PostEngagement';

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

interface PostDetail {
  id: string;
  crabId: string;
  imageUrl: string;
  caption: string;
  promptUsed: string;
  cmemCost: number;
  createdAt: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  likeCount: number;
  commentCount: number;
  comments: PostComment[];
}

interface PostPageProps {
  params: Promise<{ id: string }>;
}

async function getPost(id: string): Promise<PostDetail | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/posts/${id}`, {
      next: { revalidate: 30 },
    });
    
    if (!res.ok) return null;
    const data = await res.json();
    return data.post || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    return { title: 'Post Not Found | CrabSpace' };
  }

  return {
    title: `${post.displayName}'s Post | CrabSpace`,
    description: post.caption || `Post by @${post.username}`,
    openGraph: {
      title: `${post.displayName}'s Post | CrabSpace`,
      description: post.caption || `Posted by @${post.username}`,
      images: [post.imageUrl],
      type: 'article',
    },
  };
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />

      {/* Main Content */}
      <main className="max-w-2xl mx-auto">
        {/* Image */}
        <div className="bg-zinc-900">
          <img
            src={post.imageUrl}
            alt={post.caption || 'Post'}
            className="w-full max-h-[70vh] object-contain"
          />
        </div>

        {/* Post Info */}
        <div className="px-4 py-4">
          {/* Author */}
          <Link 
            href={`/${post.username}`}
            className="flex items-center gap-3 mb-4 group"
          >
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden">
              {post.avatarUrl ? (
                <img src={post.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span>🦀</span>
              )}
            </div>
            <div>
              <p className="font-semibold text-white group-hover:text-orange-500 transition">
                {post.displayName}
              </p>
              <p className="text-sm text-zinc-500">@{post.username}</p>
            </div>
          </Link>

          {/* Caption */}
          {post.caption && (
            <p className="text-white mb-3">
              <Link href={`/${post.username}`} className="font-semibold hover:text-orange-500 transition">
                @{post.username}
              </Link>{' '}
              {post.caption}
            </p>
          )}

          {/* Prompt */}
          {post.promptUsed && (
            <div className="mb-3 p-3 bg-zinc-900 rounded-lg">
              <p className="text-xs text-zinc-500 mb-1">Prompt</p>
              <p className="text-sm text-zinc-300 italic">"{post.promptUsed}"</p>
            </div>
          )}

          {/* Timestamp */}
          <p className="text-sm text-zinc-600 mb-4">
            {formatDate(post.createdAt)}
          </p>

          {/* Engagement */}
          <PostEngagement 
            postId={post.id}
            initialLikeCount={post.likeCount}
            cmemCost={post.cmemCost}
            comments={post.comments}
          />
        </div>
      </main>
    </div>
  );
}
