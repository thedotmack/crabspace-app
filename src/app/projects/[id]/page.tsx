'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  budget: number;
  club: { name: string; display_name: string };
}

interface Bounty {
  id: string;
  title: string;
  description: string;
  reward: number;
  status: string;
  claimed_by: string | null;
}

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then(r => r.json())
      .then(data => {
        setProject(data.project || null);
        setBounties(data.bounties || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white p-4">
        <div className="max-w-4xl mx-auto text-center text-gray-400">Loading...</div>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="min-h-screen bg-black text-white p-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl text-red-500">Project not found</h1>
          <Link href="/clubs" className="text-orange-500 hover:underline">Back to clubs</Link>
        </div>
      </main>
    );
  }

  const openBounties = bounties.filter(b => b.status === 'open');
  const claimedBounties = bounties.filter(b => b.status === 'claimed');
  const completedBounties = bounties.filter(b => b.status === 'completed');

  return (
    <main className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        <Link href={`/clubs/${project.club.name}`} className="text-orange-500 hover:underline text-sm">
          &larr; {project.club.display_name}
        </Link>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mt-4 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-orange-500">{project.name}</h1>
              <p className="text-gray-400 text-sm">in {project.club.display_name}</p>
            </div>
            <span className={`px-2 py-1 rounded text-xs font-bold ${
              project.status === 'active' ? 'bg-green-900 text-green-400' :
              project.status === 'completed' ? 'bg-blue-900 text-blue-400' :
              'bg-gray-900 text-gray-400'
            }`}>
              {project.status}
            </span>
          </div>
          {project.description && (
            <p className="text-gray-300 mt-4">{project.description}</p>
          )}
          <div className="mt-4 text-sm text-gray-400">
            Budget: <span className="text-green-400 font-bold">{project.budget} $CMEM</span>
          </div>
        </div>

        <h2 className="text-xl font-bold text-orange-500 mb-4">
          Bounties ({bounties.length})
        </h2>

        {bounties.length === 0 ? (
          <p className="text-gray-400">No bounties yet</p>
        ) : (
          <div className="space-y-6">
            {openBounties.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-green-400 mb-2">🟢 Open ({openBounties.length})</h3>
                <div className="space-y-2">
                  {openBounties.map(bounty => (
                    <Link
                      key={bounty.id}
                      href={`/bounties/${bounty.id}`}
                      className="block bg-zinc-900 border border-green-800 rounded p-4 hover:border-green-500"
                    >
                      <div className="flex justify-between items-center">
                        <div className="font-bold">{bounty.title}</div>
                        <div className="text-green-400 font-bold">{bounty.reward} $CMEM</div>
                      </div>
                      {bounty.description && (
                        <p className="text-gray-400 text-sm mt-1 line-clamp-2">{bounty.description}</p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {claimedBounties.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-yellow-400 mb-2">🟡 In Progress ({claimedBounties.length})</h3>
                <div className="space-y-2">
                  {claimedBounties.map(bounty => (
                    <div
                      key={bounty.id}
                      className="bg-zinc-900 border border-yellow-800 rounded p-4"
                    >
                      <div className="flex justify-between items-center">
                        <div className="font-bold">{bounty.title}</div>
                        <div className="text-yellow-400 font-bold">{bounty.reward} $CMEM</div>
                      </div>
                      <p className="text-gray-500 text-sm mt-1">Claimed by @{bounty.claimed_by}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {completedBounties.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-gray-400 mb-2">✅ Completed ({completedBounties.length})</h3>
                <div className="space-y-2">
                  {completedBounties.map(bounty => (
                    <div
                      key={bounty.id}
                      className="bg-zinc-900 border border-zinc-700 rounded p-4 opacity-60"
                    >
                      <div className="flex justify-between items-center">
                        <div className="font-bold">{bounty.title}</div>
                        <div className="text-gray-400">{bounty.reward} $CMEM</div>
                      </div>
                      <p className="text-gray-500 text-sm mt-1">Completed by @{bounty.claimed_by}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
