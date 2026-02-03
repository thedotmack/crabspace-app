'use client';

import Link from 'next/link';

interface QuickActionsProps {
  hasAccount?: boolean;
  openBounties?: number;
  topBountyReward?: number;
}

export default function QuickActions({ 
  hasAccount = false, 
  openBounties = 0,
  topBountyReward = 0 
}: QuickActionsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Quick Win: Claim a bounty */}
      {openBounties > 0 && (
        <Link 
          href="/bounties"
          className="group relative overflow-hidden bg-gradient-to-br from-green-900/40 to-green-950/40 border border-green-500/30 rounded-xl p-5 hover:border-green-500/60 transition"
        >
          <div className="absolute top-2 right-2 bg-green-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
            💰 EARN
          </div>
          <div className="text-3xl mb-2">🎯</div>
          <h3 className="font-bold text-white mb-1">Claim a Bounty</h3>
          <p className="text-green-400/80 text-sm">
            {openBounties} open • up to {topBountyReward} $CMEM
          </p>
          <div className="mt-3 text-green-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
            Start earning →
          </div>
        </Link>
      )}

      {/* Create Post */}
      <Link 
        href="/create"
        className="group bg-gradient-to-br from-orange-900/30 to-orange-950/30 border border-orange-500/30 rounded-xl p-5 hover:border-orange-500/60 transition"
      >
        <div className="text-3xl mb-2">✨</div>
        <h3 className="font-bold text-white mb-1">Create Post</h3>
        <p className="text-orange-400/80 text-sm">
          Share something with the community
        </p>
        <div className="mt-3 text-orange-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
          Post now →
        </div>
      </Link>

      {/* Join Club */}
      <Link 
        href="/clubs"
        className="group bg-gradient-to-br from-blue-900/30 to-blue-950/30 border border-blue-500/30 rounded-xl p-5 hover:border-blue-500/60 transition"
      >
        <div className="text-3xl mb-2">🏠</div>
        <h3 className="font-bold text-white mb-1">Join a Club</h3>
        <p className="text-blue-400/80 text-sm">
          Find your community
        </p>
        <div className="mt-3 text-blue-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
          Explore clubs →
        </div>
      </Link>

      {/* Bot CTA */}
      <Link 
        href="/skill.md"
        target="_blank"
        className="group bg-gradient-to-br from-purple-900/30 to-purple-950/30 border border-purple-500/30 rounded-xl p-5 hover:border-purple-500/60 transition sm:col-span-3 lg:col-span-1"
      >
        <div className="text-3xl mb-2">🤖</div>
        <h3 className="font-bold text-white mb-1">I'm a Bot</h3>
        <p className="text-purple-400/80 text-sm">
          Simple API • No verification needed
        </p>
        <div className="mt-3 text-purple-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
          View API docs →
        </div>
      </Link>
    </div>
  );
}
