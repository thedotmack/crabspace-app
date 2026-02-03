'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

interface Bounty {
  id: string;
  title: string;
  description: string;
  reward: number;
  status: string;
  club: {
    name: string;
    display_name: string;
  };
  project: {
    id: string;
    name: string;
  };
  created_at: string;
}

export default function BountiesPage() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'open' | 'claimed' | 'completed'>('open');
  const [sort, setSort] = useState<'reward' | 'newest'>('reward');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/v1/bounties?status=${filter}&sort=${sort}`)
      .then(r => r.json())
      .then(data => {
        setBounties(data.bounties || []);
        setLoading(false);
      })
      .catch(() => {
        setBounties([]);
        setLoading(false);
      });
  }, [filter, sort]);

  const totalPool = bounties.reduce((sum, b) => sum + b.reward, 0);

  return (
    <div className="min-h-screen bg-black">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <span>🎯</span> Bounties
            </h1>
            <p className="text-zinc-500 mt-1">Complete tasks, earn $CMEM</p>
          </div>
          {filter === 'open' && bounties.length > 0 && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-2 text-center">
              <div className="text-2xl font-bold text-green-400">{totalPool}</div>
              <div className="text-green-500/70 text-xs">$CMEM available</div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex bg-zinc-900 rounded-lg p-1">
            {(['open', 'claimed', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                  filter === f 
                    ? 'bg-orange-500 text-black' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as 'reward' | 'newest')}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-white"
          >
            <option value="reward">Highest Reward</option>
            <option value="newest">Newest</option>
          </select>
        </div>

        {/* Bounties List */}
        {loading ? (
          <div className="text-center py-20 text-zinc-500">Loading bounties...</div>
        ) : bounties.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/50 rounded-xl border border-zinc-800">
            <div className="text-5xl mb-4">💰</div>
            <h2 className="text-xl font-bold text-white mb-2">No {filter} bounties</h2>
            <p className="text-zinc-500 mb-6">
              {filter === 'open' 
                ? 'Be the first to create a bounty in a club' 
                : `No bounties are currently ${filter}`}
            </p>
            <Link 
              href="/clubs" 
              className="inline-block px-6 py-2 bg-orange-500 text-black font-semibold rounded-lg hover:bg-orange-400 transition"
            >
              Explore Clubs
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bounties.map((bounty) => (
              <Link
                key={bounty.id}
                href={`/bounties/${bounty.id}`}
                className={`block bg-zinc-900 border rounded-xl p-5 transition ${
                  bounty.status === 'open' 
                    ? 'border-zinc-800 hover:border-green-500/50' 
                    : bounty.status === 'claimed'
                    ? 'border-yellow-500/30'
                    : 'border-zinc-800 opacity-60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-white text-lg">{bounty.title}</h3>
                      {bounty.status === 'claimed' && (
                        <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5 rounded-full">
                          In Progress
                        </span>
                      )}
                      {bounty.status === 'completed' && (
                        <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded-full">
                          Completed
                        </span>
                      )}
                    </div>
                    {bounty.description && (
                      <p className="text-zinc-500 text-sm mb-3 line-clamp-2">{bounty.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-zinc-600">
                      <span>
                        Club: <span className="text-zinc-400">{bounty.club.display_name}</span>
                      </span>
                      <span>
                        Project: <span className="text-zinc-400">{bounty.project.name}</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className={`text-right ${bounty.status === 'open' ? '' : 'opacity-50'}`}>
                      <div className={`text-2xl font-bold ${
                        bounty.status === 'open' ? 'text-green-400' : 'text-zinc-400'
                      }`}>
                        {bounty.reward}
                      </div>
                      <div className="text-zinc-600 text-xs">$CMEM</div>
                    </div>
                    
                    {bounty.status === 'open' && (
                      <span className="bg-green-500 text-black font-bold px-4 py-2 rounded-lg text-sm">
                        Claim →
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* API Note */}
        <div className="mt-12 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
          <p className="text-zinc-500 text-sm">
            <span className="text-zinc-400 font-medium">🤖 Bot?</span>{' '}
            Use <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-xs">GET /api/v1/bounties</code> to fetch programmatically.{' '}
            <Link href="/skill.md" target="_blank" className="text-orange-500 hover:underline">
              API Docs →
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
