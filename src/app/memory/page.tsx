'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

interface Observation {
  id: number;
  type: string;
  title: string;
  subtitle: string;
  narrative: string;
  facts: string;
  concepts: string;
  created_at: string;
  project: string;
}

const typeColors: Record<string, { bg: string; text: string; emoji: string }> = {
  feature: { bg: 'bg-green-500/10', text: 'text-green-400', emoji: '✅' },
  discovery: { bg: 'bg-blue-500/10', text: 'text-blue-400', emoji: '🔵' },
  change: { bg: 'bg-orange-500/10', text: 'text-orange-400', emoji: '🔄' },
  decision: { bg: 'bg-purple-500/10', text: 'text-purple-400', emoji: '⚖️' },
  bug: { bg: 'bg-red-500/10', text: 'text-red-400', emoji: '🐛' },
  note: { bg: 'bg-zinc-500/10', text: 'text-zinc-400', emoji: '📝' },
};

export default function MemoryPage() {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetch('/api/memory')
      .then(res => res.json())
      .then(data => {
        setObservations(data.observations || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const filteredObservations = filter === 'all' 
    ? observations 
    : observations.filter(o => o.type === filter);

  const types = ['all', ...new Set(observations.map(o => o.type))];

  return (
    <div className="min-h-screen bg-black">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <span>🧠</span> Memory
            </h1>
            <p className="text-zinc-500 mt-1">Observations from claude-mem</p>
          </div>
          <a 
            href="https://claude-mem.ai" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-zinc-500 hover:text-orange-500 text-sm transition"
          >
            claude-mem.ai →
          </a>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {types.map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                filter === type 
                  ? 'bg-orange-500 text-black' 
                  : 'bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              {type === 'all' ? 'All' : `${typeColors[type]?.emoji || '•'} ${type}`}
            </button>
          ))}
        </div>

        {/* Observations */}
        {loading ? (
          <div className="text-center py-20 text-zinc-500">Loading...</div>
        ) : filteredObservations.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/50 border border-zinc-800 rounded-xl">
            <div className="text-4xl mb-3">🧠</div>
            <p className="text-zinc-400">No observations yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredObservations.map(obs => {
              const colors = typeColors[obs.type] || typeColors.note;
              return (
                <div 
                  key={obs.id}
                  className={`${colors.bg} border border-zinc-800 rounded-xl p-5`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <span className={`text-xs font-medium ${colors.text} uppercase tracking-wide`}>
                        {colors.emoji} {obs.type}
                      </span>
                      <h3 className="text-lg font-bold text-white mt-1">{obs.title}</h3>
                      {obs.subtitle && (
                        <p className="text-zinc-500 text-sm">{obs.subtitle}</p>
                      )}
                    </div>
                    <span className="text-zinc-600 text-xs whitespace-nowrap">
                      {new Date(obs.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {obs.narrative && (
                    <p className="text-zinc-300 text-sm mb-3">{obs.narrative}</p>
                  )}
                  
                  {obs.facts && (
                    <div className="text-zinc-500 text-xs">
                      <span className="text-zinc-600 font-medium">Facts:</span> {obs.facts}
                    </div>
                  )}
                  
                  {obs.project && (
                    <div className="mt-3 pt-3 border-t border-zinc-800/50">
                      <span className="text-zinc-600 text-xs">Project: {obs.project}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
