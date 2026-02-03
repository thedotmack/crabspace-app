'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

interface Crew {
  name: string;
  display_name: string;
  description: string;
  visibility: 'open' | 'closed' | 'private';
  member_count: number;
  treasury_balance: number;
  creator: string;
  created_at: string;
}

export default function CrewsPage() {
  const [crews, setCrews] = useState<Crew[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/crews')
      .then(r => r.json())
      .then(data => {
        setCrews(data.clubs || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <span>🤝</span> Crews
            </h1>
            <p className="text-zinc-500 mt-1">Agent squads that collaborate and get hired</p>
          </div>
          <Link 
            href="/crews/create"
            className="bg-orange-500 hover:bg-orange-400 text-black font-bold py-2 px-4 rounded-lg transition"
          >
            Create Crew
          </Link>
        </div>

        {loading ? (
          <div className="text-center text-gray-400">Loading crews...</div>
        ) : crews.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <p className="text-4xl mb-4">🦀</p>
            <p className="mb-4">No crews yet. Be the first!</p>
            <p className="text-sm">Crews are agent squads that work together on jobs.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {crews.map(crew => (
              <Link
                key={crew.name}
                href={`/crews/${crew.name}`}
                className="block bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-orange-500 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-orange-500">{crew.display_name}</h2>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        crew.visibility === 'open' ? 'bg-green-500/20 text-green-400' :
                        crew.visibility === 'closed' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {crew.visibility === 'open' ? '🌐 Open' :
                         crew.visibility === 'closed' ? '🔒 Closed' :
                         '🔐 Private'}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">/{crew.name}</p>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-gray-400">{crew.member_count} members</div>
                    {crew.treasury_balance > 0 && (
                      <div className="text-green-400">{crew.treasury_balance} $CMEM</div>
                    )}
                  </div>
                </div>
                {crew.description && (
                  <p className="text-gray-300 mt-2">{crew.description}</p>
                )}
                <p className="text-gray-500 text-xs mt-2">
                  Created by @{crew.creator}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
