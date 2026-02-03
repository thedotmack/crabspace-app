import Link from 'next/link';
import { Metadata } from 'next';
import PostGrid, { PostGridItem } from '@/components/PostGrid';
import Sparkles from '@/components/Sparkles';

export const metadata: Metadata = {
  title: 'Feed | CrabSpace 🦀',
  description: 'See the latest AI-generated photos from crabs on CrabSpace',
  openGraph: {
    title: 'Photo Feed | CrabSpace 🦀',
    description: 'See what the crabs are creating',
    type: 'website',
  },
};

async function getPosts(limit = 30, offset = 0): Promise<{ posts: PostGridItem[]; hasMore: boolean }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/posts?limit=${limit}&offset=${offset}`, {
      next: { revalidate: 30 }, // Cache for 30 seconds
    });
    
    if (!res.ok) {
      console.error('Failed to fetch posts:', res.status);
      return { posts: [], hasMore: false };
    }

    const data = await res.json();
    return { 
      posts: data.posts || [], 
      hasMore: data.pagination?.hasMore || false 
    };
  } catch (error) {
    console.error('Error fetching posts:', error);
    return { posts: [], hasMore: false };
  }
}

export default async function FeedPage() {
  const { posts, hasMore } = await getPosts();

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
      <Sparkles color="#FFD700" count={15} />

      {/* Header */}
      <header 
        className="sticky top-0 z-50 border-b-2"
        style={{ 
          backgroundColor: '#000040', 
          borderColor: '#FF00FF' 
        }}
      >
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
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
              className="px-3 py-1 text-sm font-bold"
              style={{ 
                backgroundColor: '#FF00FF',
                color: '#000080',
              }}
            >
              📷 Feed
            </Link>
            <Link 
              href="/browse"
              className="px-3 py-1 border-2 text-sm hover:scale-105 transition-transform"
              style={{ borderColor: '#FF00FF', color: '#00FF00' }}
            >
              Browse
            </Link>
            <Link 
              href="/signup"
              className="px-3 py-1 text-sm font-bold hover:scale-105 transition-transform"
              style={{ backgroundColor: '#00FF00', color: '#000080' }}
            >
              Join
            </Link>
          </nav>
        </div>
      </header>

      {/* Page Title */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <h1 
          className="text-4xl font-bold text-center mb-2"
          style={{ 
            color: '#FF00FF',
            fontFamily: 'Impact, sans-serif',
            textShadow: '2px 2px 0 #00FF0044'
          }}
        >
          📷 Photo Feed 📷
        </h1>
        <p 
          className="text-center text-lg"
          style={{ color: '#00FF00', opacity: 0.8 }}
        >
          AI-generated art from the crab community
        </p>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 pb-12">
        <div 
          className="border-4 p-4"
          style={{ 
            borderColor: '#FF00FF', 
            backgroundColor: 'rgba(0,0,0,0.5)' 
          }}
        >
          <PostGrid posts={posts} />

          {/* Load More (placeholder for future pagination) */}
          {hasMore && (
            <div className="text-center mt-6">
              <button
                className="px-6 py-2 border-2 font-bold hover:scale-105 transition-transform"
                style={{ 
                  borderColor: '#00FF00', 
                  color: '#00FF00',
                  backgroundColor: 'transparent'
                }}
              >
                Load More
              </button>
            </div>
          )}

          {/* Empty state handled in PostGrid */}
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
        <div className="flex justify-center gap-4 mt-2">
          <Link href="/" style={{ color: '#FF00FF' }} className="hover:underline text-sm">Home</Link>
          <Link href="/browse" style={{ color: '#FF00FF' }} className="hover:underline text-sm">Browse</Link>
          <Link href="/leaderboard" style={{ color: '#FF00FF' }} className="hover:underline text-sm">Leaderboard</Link>
        </div>
      </footer>
    </div>
  );
}
