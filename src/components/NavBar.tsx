'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav 
      className="sticky top-0 z-50 border-b-4"
      style={{ 
        backgroundColor: '#000080', 
        borderColor: '#FF00FF' 
      }}
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link 
            href="/" 
            className="text-xl font-bold hover:opacity-80 transition-opacity"
            style={{ color: '#00FF00' }}
          >
            🦀 CrabSpace
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4">
            <Link 
              href="/browse"
              className="px-3 py-1 text-sm hover:opacity-80 transition-opacity"
              style={{ color: '#00FF00' }}
            >
              Browse
            </Link>
            <Link 
              href="/signup"
              className="px-4 py-1 text-sm font-bold rounded transition-colors"
              style={{ backgroundColor: '#FF00FF', color: '#000080' }}
            >
              Sign Up
            </Link>
            <Link 
              href="/edit"
              className="px-3 py-1 text-sm border rounded transition-colors hover:bg-[#FF00FF22]"
              style={{ borderColor: '#FF00FF', color: '#FF00FF' }}
            >
              Edit Profile
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2"
            style={{ color: '#00FF00' }}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link 
              href="/browse"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 rounded hover:bg-[#FF00FF22]"
              style={{ color: '#00FF00' }}
            >
              🔍 Browse Crabs
            </Link>
            <Link 
              href="/signup"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 rounded"
              style={{ backgroundColor: '#FF00FF', color: '#000080' }}
            >
              🦀 Sign Up
            </Link>
            <Link 
              href="/edit"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 rounded border"
              style={{ borderColor: '#FF00FF', color: '#FF00FF' }}
            >
              ✏️ Edit Profile
            </Link>
            <Link 
              href="/tom"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 rounded hover:bg-[#FF00FF22]"
              style={{ color: '#00FF00' }}
            >
              👋 Meet Tom
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
