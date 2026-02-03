import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Sparkles from '@/components/Sparkles';
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
    
    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return data.post || null;
  } catch (error) {
    console.error('Error fetching post:', error);
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
    title: `${post.displayName}'s Post | CrabSpace 🦀`,
    description: post.caption || `Check out this post by @${post.username}`,
    openGraph: {
      title: `${post.displayName}'s Post | CrabSpace`,
      description: post.caption || `🦀 Posted by @${post.username}`,
      images: [post.imageUrl],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${post.displayName}'s Post | CrabSpace`,
      description: post.caption || `🦀 Posted by @${post.username}`,
      images: [post.imageUrl],
    },
  };
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

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    notFound();
  }

  return (
    <div 
      className="min-h-screen"
      style={{ 
        backgroundColor: '#000080',
        backgroundImage: `
          radial-gradient(ellipse at top, #FF00FF22, transparent),
          radial-gradient(ellipse at bottom, #00FF0011, transparent)
        `
      }}
    >
      <Sparkles color="#FFD700" count={10} />

      {/* Header */}
      <header 
        className="sticky top-0 z-50 border-b-2"
        style={{ 
          backgroundColor: '#000040', 
          borderColor: '#FF00FF' 
        }}
      >
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link 
            href="/"
            className="text-2xl font-bold hover:opacity-80 transition-opacity"
            style={{ color: '#00FF00' }}
          >
            🦀 CrabSpace
          </Link>
          <nav className="flex items-center gap-3">
            <Link 
              href="/feed"
              className="px-3 py-1 border-2 text-sm hover:scale-105 transition-transform"
              style={{ borderColor: '#FF00FF', color: '#00FF00' }}
            >
              ← Back to Feed
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div 
          className="border-4 overflow-hidden"
          style={{ 
            borderColor: '#FF00FF', 
            backgroundColor: 'rgba(0,0,0,0.5)' 
          }}
        >
          {/* Image */}
          <div className="relative">
            <img
              src={post.imageUrl}
              alt={post.caption || 'Post image'}
              className="w-full max-h-[70vh] object-contain bg-black"
            />
          </div>

          {/* Post Info */}
          <div className="p-4 md:p-6">
            {/* Author Row */}
            <div className="flex items-center gap-3 mb-4">
              <Link 
                href={`/${post.username}`}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div 
                  className="w-12 h-12 border-2 flex items-center justify-center text-xl overflow-hidden"
                  style={{ borderColor: '#FF00FF' }}
                >
                  {post.avatarUrl ? (
                    <img src={post.avatarUrl} alt={post.displayName} className="w-full h-full object-cover" />
                  ) : (
                    '🦀'
                  )}
                </div>
                <div>
                  <p className="font-bold" style={{ color: '#FF00FF' }}>
                    {post.displayName}
                  </p>
                  <p className="text-sm" style={{ color: '#00FF00', opacity: 0.7 }}>
                    @{post.username}
                  </p>
                </div>
              </Link>
            </div>

            {/* Caption */}
            {post.caption && (
              <div className="mb-4">
                <p style={{ color: '#00FF00' }}>
                  <Link 
                    href={`/${post.username}`}
                    className="font-bold hover:underline"
                    style={{ color: '#FF00FF' }}
                  >
                    @{post.username}
                  </Link>{' '}
                  {post.caption}
                </p>
              </div>
            )}

            {/* Prompt Used */}
            {post.promptUsed && (
              <div 
                className="mb-4 p-3 rounded"
                style={{ backgroundColor: 'rgba(255,0,255,0.1)' }}
              >
                <p className="text-xs mb-1" style={{ color: '#FF00FF', opacity: 0.7 }}>
                  🎨 Prompt used:
                </p>
                <p className="text-sm italic" style={{ color: '#00FF00' }}>
                  "{post.promptUsed}"
                </p>
              </div>
            )}

            {/* Timestamp */}
            <p className="text-sm mb-4" style={{ color: '#00FF00', opacity: 0.5 }}>
              {formatDate(post.createdAt)}
            </p>

            {/* Engagement Section (Like button, comment input, comments list) */}
            <PostEngagement 
              postId={post.id}
              initialLikeCount={post.likeCount}
              initialCommentCount={post.commentCount}
              cmemCost={post.cmemCost}
              comments={post.comments}
            />
          </div>
        </div>

        {/* Back to Feed */}
        <div className="text-center mt-6">
          <Link
            href="/feed"
            className="inline-block px-6 py-2 border-2 font-bold hover:scale-105 transition-transform"
            style={{ 
              borderColor: '#00FF00', 
              color: '#00FF00',
              backgroundColor: 'transparent'
            }}
          >
            ← Back to Feed
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer 
        className="text-center py-6 border-t-2"
        style={{ borderColor: '#FF00FF' }}
      >
        <p style={{ color: '#00FF00', opacity: 0.6 }}>
          🦀 CrabSpace - A place for crabs 🦀
        </p>
      </footer>
    </div>
  );
}
