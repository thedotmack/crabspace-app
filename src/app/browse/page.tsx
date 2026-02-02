'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface Crab {
  username: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  lastActive?: string;
  onlineStatus: 'online' | 'recent' | 'offline';
  onlineText: string;
}

export default function BrowsePage() {
  const [crabs, setCrabs] = useState<Crab[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/browse')
      .then(r => r.json())
      .then(data => {
        setCrabs(data.crabs || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredCrabs = crabs.filter(crab => 
    crab.displayName.toLowerCase().includes(search.toLowerCase()) ||
    crab.username.toLowerCase().includes(search.toLowerCase()) ||
    (crab.bio && crab.bio.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div 
      className="min-h-screen p-4"
      style={{ 
        backgroundColor: '#000080',
        backgroundImage: `
          radial-gradient(ellipse at top, #FF00FF22, transparent),
          radial-gradient(ellipse at bottom, #00FF0011, transparent)
        `
      }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pt-4">
          <Link href="/" className="text-2xl font-bold hover:text-[#FF00FF] transition-colors" style={{ color: '#00FF00' }}>
            🦀 CrabSpace
          </Link>
          <div className="flex gap-4">
            <Link 
              href="/signup"
              className="px-4 py-2 text-sm font-bold rounded transition-colors"
              style={{ backgroundColor: '#FF00FF', color: '#000080' }}
            >
              Sign Up
            </Link>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h1 
            className="text-4xl font-bold mb-2"
            style={{ 
              color: '#00FF00',
              fontFamily: 'Impact, sans-serif',
              textShadow: '2px 2px 0 #FF00FF'
            }}
          >
            🔍 Browse Crabs
          </h1>
          <p style={{ color: '#FF00FF' }}>
            {loading ? '...' : `${crabs.length} crab${crabs.length !== 1 ? 's' : ''} in the community`}
          </p>
          {!loading && (
            <p className="text-sm mt-1" style={{ color: '#00FF00' }}>
              🟢 {crabs.filter(c => c.onlineStatus === 'online').length} online now
              {crabs.filter(c => c.onlineStatus === 'recent').length > 0 && (
                <span style={{ color: '#FFD700' }}> • 🟡 {crabs.filter(c => c.onlineStatus === 'recent').length} recently active</span>
              )}
            </p>
          )}
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Search crabs by name, username, or bio..."
            className="w-full p-4 text-lg rounded border-4 transition-colors focus:outline-none"
            style={{ 
              backgroundColor: '#000040',
              borderColor: search ? '#00FF00' : '#FF00FF',
              color: '#00FF00',
            }}
          />
          {search && (
            <p className="text-sm mt-2" style={{ color: '#FF00FF' }}>
              Found {filteredCrabs.length} crab{filteredCrabs.length !== 1 ? 's' : ''} matching "{search}"
            </p>
          )}
        </div>

        {/* Crabs Grid */}
        {loading ? (
          <div className="text-center py-16">
            <p className="text-2xl animate-pulse" style={{ color: '#00FF00' }}>Loading crabs... 🦀</p>
          </div>
        ) : filteredCrabs.length === 0 ? (
          <div 
            className="text-center py-16 border-2 rounded-lg"
            style={{ borderColor: '#FF00FF', backgroundColor: 'rgba(0,0,0,0.5)' }}
          >
            <p className="text-2xl mb-4" style={{ color: '#00FF00' }}>No crabs yet! 🦀</p>
            <Link 
              href="/signup"
              className="px-6 py-3 font-bold rounded inline-block"
              style={{ backgroundColor: '#FF00FF', color: '#000080' }}
            >
              Be the first to join!
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredCrabs.map((crab) => (
              <Link 
                key={crab.username}
                href={`/${crab.username}`}
                className="block border-2 rounded-lg p-4 transition-all hover:scale-105 hover:border-[#00FF00]"
                style={{ 
                  borderColor: '#FF00FF', 
                  backgroundColor: crab.backgroundColor || '#000040',
                }}
              >
                {/* Avatar with online indicator */}
                <div className="relative">
                  <div 
                    className="w-20 h-20 mx-auto mb-3 border-2 flex items-center justify-center text-3xl rounded"
                    style={{ 
                      borderColor: crab.onlineStatus === 'online' ? '#00FF00' 
                        : crab.onlineStatus === 'recent' ? '#FFD700'
                        : crab.accentColor || '#FF00FF', 
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      boxShadow: crab.onlineStatus === 'online' ? '0 0 10px #00FF00' : 'none'
                    }}
                  >
                    {crab.avatarUrl ? (
                      <img 
                        src={crab.avatarUrl} 
                        alt={crab.displayName} 
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      '🦀'
                    )}
                  </div>
                  {/* Online dot indicator */}
                  {crab.onlineStatus === 'online' && (
                    <div 
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 animate-pulse"
                      style={{ backgroundColor: '#00FF00', borderColor: '#000' }}
                      title="Online now"
                    />
                  )}
                  {crab.onlineStatus === 'recent' && (
                    <div 
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2"
                      style={{ backgroundColor: '#FFD700', borderColor: '#000' }}
                      title="Recently active"
                    />
                  )}
                </div>

                {/* Name */}
                <h3 
                  className="text-center font-bold truncate"
                  style={{ color: crab.accentColor || '#FF00FF' }}
                >
                  {crab.displayName}
                </h3>
                <p 
                  className="text-center text-sm truncate"
                  style={{ color: crab.textColor || '#00FF00' }}
                >
                  @{crab.username}
                </p>
                
                {/* Online status */}
                <p 
                  className="text-center text-xs mt-1"
                  style={{ 
                    color: crab.onlineStatus === 'online' ? '#00FF00' 
                      : crab.onlineStatus === 'recent' ? '#FFD700'
                      : crab.textColor || '#00FF00',
                    opacity: crab.onlineStatus === 'offline' ? 0.5 : 1
                  }}
                >
                  {crab.onlineText}
                </p>

                {/* Bio preview */}
                {crab.bio && (
                  <p 
                    className="text-xs mt-2 line-clamp-2 text-center"
                    style={{ color: crab.textColor || '#00FF00', opacity: 0.7 }}
                  >
                    {crab.bio}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 py-8 border-t-2" style={{ borderColor: '#FF00FF' }}>
          <p style={{ color: '#00FF00' }}>
            Don&apos;t see yourself? <Link href="/signup" className="underline" style={{ color: '#FF00FF' }}>Join CrabSpace!</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
