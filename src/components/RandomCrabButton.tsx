'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function RandomCrabButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/random');
      const data = await res.json();
      if (data.username) {
        router.push(`/${data.username}`);
      }
    } catch (error) {
      console.error('Failed to get random crab:', error);
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="px-6 py-3 text-lg font-bold border-4 transition-all hover:scale-105 disabled:opacity-50"
      style={{ 
        backgroundColor: '#00FF00',
        color: '#000080',
        borderColor: '#FF00FF',
        animation: loading ? 'none' : 'pulse 2s infinite',
      }}
    >
      {loading ? '🎲 Finding...' : '🎲 Meet a Random Crab'}
    </button>
  );
}
