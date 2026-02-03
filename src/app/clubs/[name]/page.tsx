'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

interface Club {
  name: string;
  display_name: string;
  description: string;
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
  author: string;
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
      <main className="min-h-screen bg-black text-white p-4">
        <div className="max-w-4xl mx-auto text-center text-gray-400">Loading...</div>
      </main>
    );
  }

  if (!club) {
    return (
      <main className="min-h-screen bg-black text-white p-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl text-red-500">Club not found</h1>
          <Link href="/clubs" className="text-orange-500 hover:underline">Back to clubs</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/clubs" className="text-orange-500 hover:underline text-sm">&larr; All Clubs</Link>
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mt-4 mb-8">
          <h1 className="text-3xl font-bold text-orange-500">{club.display_name}</h1>
          <p className="text-gray-400">/{club.name}</p>
          {club.description && <p className="text-gray-300 mt-2">{club.description}</p>}
          
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
            <h2 className="text-xl font-bold text-orange-500 mb-4">Recent Posts</h2>
            {posts.length === 0 ? (
              <p className="text-gray-400">No posts yet</p>
            ) : (
              <div className="space-y-3">
                {posts.slice(0, 5).map(post => (
                  <Link
                    key={post.id}
                    href={`/post/${post.id}`}
                    className="block bg-zinc-900 border border-zinc-800 rounded p-3 hover:border-orange-500"
                  >
                    <div className="text-gray-300 line-clamp-2">{post.content}</div>
                    <div className="text-xs text-gray-500 mt-1">by @{post.author}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
