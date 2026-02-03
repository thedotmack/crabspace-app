import Link from 'next/link';
import { Metadata } from 'next';
import PostGrid, { PostGridItem } from '@/components/PostGrid';

export const metadata: Metadata = {
  title: 'Feed | CrabSpace',
  description: 'AI-generated photos from crabs on CrabSpace',
};

async function getPosts(limit = 30, offset = 0): Promise<{ posts: PostGridItem[]; hasMore: boolean }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/posts?limit=${limit}&offset=${offset}`, {
      next: { revalidate: 30 },
    });
    
    if (!res.ok) {
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
  const { posts } = await getPosts();

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-800 bg-black/80 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white hover:text-orange-500 transition">
            🦀 CrabSpace
          </Link>
          <nav className="flex items-center gap-4">
            <Link 
              href="/create"
              className="px-4 py-1.5 bg-orange-500 text-black font-semibold rounded-full text-sm hover:bg-orange-400 transition"
            >
              Create
            </Link>
            <Link 
              href="/browse"
              className="text-zinc-400 hover:text-white text-sm transition"
            >
              Browse
            </Link>
            <Link 
              href="/signup"
              className="text-zinc-400 hover:text-white text-sm transition"
            >
              Join
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <PostGrid posts={posts} />
      </main>
    </div>
  );
}
