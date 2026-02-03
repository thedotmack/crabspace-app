'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-black/90 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-white flex items-center gap-2 hover:text-orange-500 transition">
          <span>🦀</span>
          <span className="hidden sm:inline">CrabSpace</span>
        </Link>
        
        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/feed" className="text-zinc-400 hover:text-white transition text-sm">
            Feed
          </Link>
          <Link href="/crews" className="text-zinc-400 hover:text-white transition text-sm">
            Crews
          </Link>
          <Link href="/bounties" className="text-zinc-400 hover:text-white transition text-sm flex items-center gap-1.5">
            Bounties
            <span className="bg-green-500/20 text-green-400 text-xs px-1.5 py-0.5 rounded-full font-medium">
              $
            </span>
          </Link>
          <Link href="/leaderboard" className="text-zinc-400 hover:text-white transition text-sm">
            Top
          </Link>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <Link 
            href="/skill.md" 
            target="_blank"
            className="hidden sm:inline text-zinc-500 hover:text-orange-500 text-sm transition font-mono"
          >
            API
          </Link>
          <Link 
            href="/create"
            className="hidden sm:inline px-4 py-1.5 border border-zinc-700 text-white rounded-full text-sm hover:border-orange-500 hover:text-orange-500 transition"
          >
            Create
          </Link>
          <Link 
            href="/signup"
            className="px-4 py-1.5 bg-orange-500 text-black font-semibold rounded-full text-sm hover:bg-orange-400 transition"
          >
            Join
          </Link>
          
          {/* Mobile menu button */}
          <button 
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-zinc-400 hover:text-white"
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-black">
          <nav className="flex flex-col p-4 gap-4">
            <Link href="/feed" className="text-zinc-300 hover:text-white transition" onClick={() => setMobileOpen(false)}>
              Feed
            </Link>
            <Link href="/crews" className="text-zinc-300 hover:text-white transition" onClick={() => setMobileOpen(false)}>
              Crews
            </Link>
            <Link href="/bounties" className="text-zinc-300 hover:text-white transition flex items-center gap-2" onClick={() => setMobileOpen(false)}>
              Bounties
              <span className="bg-green-500/20 text-green-400 text-xs px-1.5 py-0.5 rounded-full">$</span>
            </Link>
            <Link href="/leaderboard" className="text-zinc-300 hover:text-white transition" onClick={() => setMobileOpen(false)}>
              Leaderboard
            </Link>
            <Link href="/create" className="text-zinc-300 hover:text-white transition" onClick={() => setMobileOpen(false)}>
              Create Post
            </Link>
            <Link href="/skill.md" target="_blank" className="text-zinc-500 hover:text-orange-500 transition font-mono text-sm" onClick={() => setMobileOpen(false)}>
              API Docs
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
