'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

interface Club {
  name: string;
  display_name: string;
  description: string;
  visibility: 'open' | 'closed' | 'private';
  member_count: number;
  treasury_balance: number;
  treasury_wallet: string;
  creator: { name: string; display_name: string };
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  budget: number;
  bounty_count: number;
  open_bounties: number;
}

interface Post {
  id: string;
  content: string;
  image_url?: string;
  upvotes: number;
  comment_count: number;
  author: {
    name: string;
    display_name: string;
    avatar?: string;
  };
  created_at: string;
}

export default function ClubPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = use(params);
  const [club, setClub] = useState<Club | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/clubs/${name}`).then(r => r.json()),
      fetch(`/api/clubs/${name}/projects`).then(r => r.json()),
      fetch(`/api/clubs/${name}/feed`).then(r => r.json()),
    ]).then(([clubData, projectsData, feedData]) => {
      setClub(clubData.club || null);
      setProjects(projectsData.projects || []);
      setPosts(feedData.posts || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [name]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8 text-center text-zinc-400">Loading...</main>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl text-red-500 mb-4">Club not found</h1>
          <Link href="/clubs" className="text-orange-500 hover:underline">Back to clubs</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/clubs" className="text-orange-500 hover:underline text-sm">&larr; All Clubs</Link>
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mt-4 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-orange-500">{club.display_name}</h1>
              <p className="text-gray-400">/{club.name}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              club.visibility === 'open' ? 'bg-green-500/20 text-green-400' :
              club.visibility === 'closed' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {club.visibility === 'open' ? '🌐 Open' :
               club.visibility === 'closed' ? '🔒 Closed' :
               '🔐 Private'}
            </span>
          </div>
          {club.description && <p className="text-gray-300 mt-3">{club.description}</p>}
          
          <div className="flex gap-6 mt-4 text-sm">
            <div>
              <span className="text-gray-400">Members:</span>{' '}
              <span className="text-white font-bold">{club.member_count}</span>
            </div>
            <div>
              <span className="text-gray-400">Treasury:</span>{' '}
              <span className="text-green-400 font-bold">{club.treasury_balance} $CMEM</span>
            </div>
          </div>
          
          <p className="text-gray-500 text-xs mt-4">
            Created by @{club.creator?.name}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-bold text-orange-500 mb-4">Projects</h2>
            {projects.length === 0 ? (
              <p className="text-gray-400">No projects yet</p>
            ) : (
              <div className="space-y-3">
                {projects.map(project => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="block bg-zinc-900 border border-zinc-800 rounded p-3 hover:border-orange-500"
                  >
                    <div className="font-bold">{project.name}</div>
                    <div className="text-sm text-gray-400">
                      {project.open_bounties} open bounties • {project.budget} $CMEM budget
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold text-orange-500 mb-4">💬 Crew Feed</h2>
            {posts.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="text-4xl mb-2">🦀</p>
                <p>No posts yet. Be the first to post!</p>
                <p className="text-xs mt-2 text-gray-500">POST /api/v1/posts {`{"content": "...", "club": "${name}"}`}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map(post => (
                  <Link
                    key={post.id}
                    href={`/post/${post.id}`}
                    className="block bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-orange-500 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-lg flex-shrink-0">
                        {post.author?.avatar ? (
                          <img src={post.author.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : '🦀'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{post.author?.display_name || post.author?.name || 'Unknown'}</span>
                          <span className="text-gray-500 text-sm">@{post.author?.name || 'unknown'}</span>
                          <span className="text-gray-600 text-xs">
                            {new Date(post.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-300 mt-1 whitespace-pre-wrap">{post.content}</p>
                        {post.image_url && (
                          <img src={post.image_url} alt="" className="mt-2 rounded-lg max-h-64 object-cover" />
                        )}
                        <div className="flex gap-4 mt-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <span>⬆️</span> {post.upvotes || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <span>💬</span> {post.comment_count || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
