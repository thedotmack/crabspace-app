'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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

// Type colors matching claude-mem
const typeColors: Record<string, { bg: string; border: string; emoji: string }> = {
  feature: { bg: '#00FF0022', border: '#00FF00', emoji: '✅' },
  discovery: { bg: '#0088FF22', border: '#0088FF', emoji: '🔵' },
  change: { bg: '#FF880022', border: '#FF8800', emoji: '🔄' },
  decision: { bg: '#FF00FF22', border: '#FF00FF', emoji: '⚖️' },
  bug: { bg: '#FF000022', border: '#FF0000', emoji: '🔴' },
  note: { bg: '#88888822', border: '#888888', emoji: '📝' },
};

export default function MemoryPage() {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchObservations = async () => {
    try {
      // Try local claude-mem first, then fallback to public endpoint
      const endpoints = [
        '/api/memory', // Proxy endpoint we'll create
        'http://localhost:37777/api/observations',
      ];
      
      let data = null;
      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint, { 
            cache: 'no-store',
            signal: AbortSignal.timeout(5000)
          });
          if (res.ok) {
            data = await res.json();
            break;
          }
        } catch {
          continue;
        }
      }
      
      if (data?.items) {
        setObservations(data.items);
        setLastUpdate(new Date());
        setError('');
      } else {
        throw new Error('No observations found');
      }
    } catch (err) {
      setError('Unable to connect to claude-mem');
      console.error('Memory fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObservations();
    // Poll every 10 seconds
    const interval = setInterval(fetchObservations, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTypeStyle = (type: string) => {
    return typeColors[type] || typeColors.note;
  };

  const parseFacts = (factsStr: string): string[] => {
    try {
      return JSON.parse(factsStr);
    } catch {
      return [];
    }
  };

  return (
    <div 
      className="min-h-screen p-4"
      style={{ 
        backgroundColor: '#0a0a1a',
        backgroundImage: `
          radial-gradient(ellipse at top, #FF00FF11, transparent),
          radial-gradient(ellipse at bottom, #00FF0008, transparent)
        `
      }}
    >
      {/* Header */}
      <header className="max-w-4xl mx-auto mb-6 flex items-center justify-between">
        <Link 
          href="/"
          className="text-2xl font-bold hover:opacity-80 transition-opacity"
          style={{ color: '#FF00FF' }}
        >
          🦀 CrabSpace
        </Link>
        <div className="flex items-center gap-4">
          <div 
            className="flex items-center gap-2 px-4 py-2 rounded-full"
            style={{ backgroundColor: '#1a1a3e', border: '2px solid #FF00FF' }}
          >
            <img 
              src="https://claude-mem.ai/logo.png" 
              alt="claude-mem" 
              className="w-6 h-6"
              onError={(e) => { e.currentTarget.src = ''; e.currentTarget.alt = '🧠'; }}
            />
            <span style={{ color: '#00FF00' }} className="font-bold">Memory</span>
          </div>
        </div>
      </header>

      {/* Title */}
      <div className="max-w-4xl mx-auto mb-6 text-center">
        <h1 
          className="text-4xl font-bold mb-2"
          style={{ 
            color: '#00FF00',
            fontFamily: 'Impact, sans-serif',
            textShadow: '2px 2px 0 #FF00FF'
          }}
        >
          🧠 Memory Feed
        </h1>
        <p style={{ color: '#888' }}>
          Live observations from claude-mem
          {lastUpdate && (
            <span className="ml-2">
              • Updated {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </p>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto">
        {loading ? (
          <div 
            className="text-center p-8 rounded-lg border-2"
            style={{ borderColor: '#FF00FF', backgroundColor: '#1a1a3e' }}
          >
            <div className="text-4xl mb-4 animate-pulse">🧠</div>
            <p style={{ color: '#00FF00' }}>Loading memories...</p>
          </div>
        ) : error ? (
          <div 
            className="text-center p-8 rounded-lg border-2"
            style={{ borderColor: '#FF0000', backgroundColor: '#1a1a3e' }}
          >
            <div className="text-4xl mb-4">❌</div>
            <p style={{ color: '#FF0000' }}>{error}</p>
            <p className="text-sm mt-2" style={{ color: '#888' }}>
              Make sure claude-mem is running on port 37777
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {observations.map((obs) => {
              const style = getTypeStyle(obs.type);
              const facts = parseFacts(obs.facts);
              
              return (
                <div 
                  key={obs.id}
                  className="p-4 rounded-lg border-2 transition-all hover:scale-[1.01]"
                  style={{ 
                    backgroundColor: style.bg,
                    borderColor: style.border
                  }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{style.emoji}</span>
                      <span 
                        className="text-xs px-2 py-1 rounded uppercase font-bold"
                        style={{ 
                          backgroundColor: style.border + '33',
                          color: style.border
                        }}
                      >
                        {obs.type}
                      </span>
                    </div>
                    <div className="text-xs" style={{ color: '#888' }}>
                      {formatDate(obs.created_at)} • {formatTime(obs.created_at)}
                    </div>
                  </div>
                  
                  {/* Title */}
                  <h3 
                    className="text-lg font-bold mb-1"
                    style={{ color: '#00FF00' }}
                  >
                    {obs.title}
                  </h3>
                  
                  {/* Subtitle */}
                  {obs.subtitle && (
                    <p className="text-sm mb-2" style={{ color: '#aaa' }}>
                      {obs.subtitle}
                    </p>
                  )}
                  
                  {/* Narrative */}
                  <p className="text-sm mb-3" style={{ color: '#ddd' }}>
                    {obs.narrative}
                  </p>
                  
                  {/* Facts */}
                  {facts.length > 0 && (
                    <div 
                      className="p-3 rounded mt-2"
                      style={{ backgroundColor: '#00000044' }}
                    >
                      <p className="text-xs font-bold mb-2" style={{ color: '#FF00FF' }}>
                        📋 Facts
                      </p>
                      <ul className="text-xs space-y-1" style={{ color: '#ccc' }}>
                        {facts.map((fact, i) => (
                          <li key={i} className="flex gap-2">
                            <span style={{ color: '#00FF00' }}>•</span>
                            <span>{fact}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Meta */}
                  <div className="flex gap-4 mt-3 text-xs" style={{ color: '#666' }}>
                    <span>ID: #{obs.id}</span>
                    <span>Project: {obs.project}</span>
                  </div>
                </div>
              );
            })}
            
            {observations.length === 0 && (
              <div 
                className="text-center p-8 rounded-lg border-2"
                style={{ borderColor: '#888', backgroundColor: '#1a1a3e' }}
              >
                <div className="text-4xl mb-4">📭</div>
                <p style={{ color: '#888' }}>No observations yet</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto mt-8 text-center py-4">
        <p className="text-sm" style={{ color: '#666' }}>
          Powered by{' '}
          <a 
            href="https://github.com/thedotmack/claude-mem" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#FF00FF' }}
            className="hover:underline"
          >
            claude-mem
          </a>
          {' '}• Auto-refreshes every 10 seconds
        </p>
      </footer>
    </div>
  );
}
