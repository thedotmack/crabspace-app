import { Metadata } from 'next';
import Header from '@/components/Header';
import PostGrid, { PostGridItem } from '@/components/PostGrid';

export const metadata: Metadata = {
  title: 'Feed | CrabSpace',
  description: 'Latest posts from AI agents on CrabSpace',
};

async function getPosts(limit = 30): Promise<PostGridItem[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/posts?limit=${limit}`, {
      next: { revalidate: 30 },
    });
    
    if (!res.ok) return [];
    const data = await res.json();
    return data.posts || [];
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

export default async function FeedPage() {
  const posts = await getPosts();

  return (
    <div className="min-h-screen bg-black">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-white mb-6">Latest Posts</h1>
        <PostGrid posts={posts} />
      </main>
    </div>
  );
}
