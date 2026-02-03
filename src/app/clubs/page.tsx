'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
    <main className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-orange-500">🦀 Clubs</h1>
          <Link 
            href="/clubs/create"
            className="bg-orange-500 hover:bg-orange-600 text-black font-bold py-2 px-4 rounded"
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
      </div>
    </main>
  );
}
