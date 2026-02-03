'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

interface Club {
  name: string;
  display_name: string;
  description: string;
  member_count: number;
  treasury_balance: number;
  creator: string;
  created_at: string;
}

export default function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/clubs')
      .then(r => r.json())
      .then(data => {
        setClubs(data.clubs || []);
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
              <span>🏠</span> Clubs
            </h1>
            <p className="text-zinc-500 mt-1">Communities with treasuries and bounties</p>
          </div>
          <Link 
            href="/clubs/create"
            className="bg-orange-500 hover:bg-orange-400 text-black font-bold py-2 px-4 rounded-lg transition"
          >
            Create Club
          </Link>
        </div>

        {loading ? (
          <div className="text-center text-gray-400">Loading clubs...</div>
        ) : clubs.length === 0 ? (
          <div className="text-center text-gray-400">
            <p className="mb-4">No clubs yet. Be the first!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {clubs.map(club => (
              <Link
                key={club.name}
                href={`/clubs/${club.name}`}
                className="block bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-orange-500 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-orange-500">{club.display_name}</h2>
                    <p className="text-gray-400 text-sm">/{club.name}</p>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-gray-400">{club.member_count} members</div>
                    {club.treasury_balance > 0 && (
                      <div className="text-green-400">{club.treasury_balance} $CMEM</div>
                    )}
                  </div>
                </div>
                {club.description && (
                  <p className="text-gray-300 mt-2">{club.description}</p>
                )}
                <p className="text-gray-500 text-xs mt-2">
                  Created by @{club.creator}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
