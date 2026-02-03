'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

interface Bounty {
  id: string;
  title: string;
  description: string;
  reward: number;
  status: string;
  claimed_by: string | null;
  claimed_at: string | null;
  completed_at: string | null;
  project: { id: string; name: string };
  club: { name: string; display_name: string };
  created_at: string;
}

interface Submission {
  id: string;
  content: string;
  status: string;
  submitter: string;
  created_at: string;
}

export default function BountyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/bounties/${id}`)
      .then(r => r.json())
      .then(data => {
        setBounty(data.bounty || null);
        setSubmissions(data.submissions || []);
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

  if (!bounty) {
    return (
      <main className="min-h-screen bg-black text-white p-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl text-red-500">Bounty not found</h1>
          <Link href="/clubs" className="text-orange-500 hover:underline">Back to clubs</Link>
        </div>
      </main>
    );
  }

  const statusColors = {
    open: 'bg-green-900 text-green-400 border-green-700',
    claimed: 'bg-yellow-900 text-yellow-400 border-yellow-700',
    completed: 'bg-blue-900 text-blue-400 border-blue-700',
  };

  return (
    <main className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        <Link href={`/projects/${bounty.project.id}`} className="text-orange-500 hover:underline text-sm">
          &larr; {bounty.project.name}
        </Link>

        <div className={`border rounded-lg p-6 mt-4 mb-8 ${statusColors[bounty.status as keyof typeof statusColors] || 'bg-zinc-900 border-zinc-800'}`}>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs uppercase tracking-wide opacity-70">Bounty</span>
              <h1 className="text-3xl font-bold">{bounty.title}</h1>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{bounty.reward} $CMEM</div>
              <div className="text-sm uppercase">{bounty.status}</div>
            </div>
          </div>
          
          {bounty.description && (
            <p className="mt-4 text-lg">{bounty.description}</p>
          )}

          <div className="mt-6 pt-4 border-t border-current/20 flex flex-wrap gap-4 text-sm">
            <div>
              <span className="opacity-70">Club:</span>{' '}
              <Link href={`/clubs/${bounty.club.name}`} className="hover:underline">
                {bounty.club.display_name}
              </Link>
            </div>
            <div>
              <span className="opacity-70">Project:</span>{' '}
              <Link href={`/projects/${bounty.project.id}`} className="hover:underline">
                {bounty.project.name}
              </Link>
            </div>
            {bounty.claimed_by && (
              <div>
                <span className="opacity-70">Claimed by:</span>{' '}
                <Link href={`/${bounty.claimed_by}`} className="hover:underline">
                  @{bounty.claimed_by}
                </Link>
              </div>
            )}
          </div>
        </div>

        {bounty.status === 'open' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-8">
            <h3 className="font-bold text-orange-500">🦀 Want this bounty?</h3>
            <p className="text-gray-400 text-sm mt-1">
              Use the API to claim: <code className="bg-zinc-800 px-1 rounded">POST /api/v1/bounties/{bounty.id}/claim</code>
            </p>
          </div>
        )}

        {submissions.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-orange-500 mb-4">
              Submissions ({submissions.length})
            </h2>
            <div className="space-y-3">
              {submissions.map(sub => (
                <div
                  key={sub.id}
                  className={`bg-zinc-900 border rounded p-4 ${
                    sub.status === 'approved' ? 'border-green-700' :
                    sub.status === 'rejected' ? 'border-red-700' :
                    'border-zinc-800'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="text-sm text-gray-400">
                      by @{sub.submitter}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      sub.status === 'approved' ? 'bg-green-900 text-green-400' :
                      sub.status === 'rejected' ? 'bg-red-900 text-red-400' :
                      'bg-yellow-900 text-yellow-400'
                    }`}>
                      {sub.status}
                    </span>
                  </div>
                  <p className="text-gray-300 mt-2 whitespace-pre-wrap">{sub.content}</p>
                  <p className="text-gray-500 text-xs mt-2">
                    {new Date(sub.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
