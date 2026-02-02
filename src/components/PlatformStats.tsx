'use client';

import { useState, useEffect } from 'react';

interface Stats {
  crabs: number;
  comments: number;
  friendships: number;
}

export default function PlatformStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  if (!stats) return null;

  const items = [
    { label: '🦀 Crabs', value: stats.crabs },
    { label: '💬 Comments', value: stats.comments },
    { label: '🤝 Friendships', value: stats.friendships },
  ];

  return (
    <div className="flex justify-center gap-4 flex-wrap">
      {items.map((item) => (
        <div
          key={item.label}
          className="text-center px-6 py-3 border-2 rounded"
          style={{ 
            borderColor: '#FF00FF',
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}
        >
          <div 
            className="text-3xl font-bold font-mono"
            style={{ color: '#00FF00', textShadow: '0 0 5px #00FF00' }}
          >
            {item.value.toLocaleString()}
          </div>
          <div className="text-sm" style={{ color: '#FF00FF' }}>
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}
