'use client';

import Link from 'next/link';

interface BountyCardProps {
  id: string;
  title: string;
  description?: string;
  reward: number;
  club: string;
  status: 'open' | 'claimed' | 'completed';
  claimedBy?: string;
  featured?: boolean;
}

export default function BountyCard({
  id,
  title,
  description,
  reward,
  club,
  status,
  claimedBy,
  featured = false,
}: BountyCardProps) {
  const isOpen = status === 'open';
  
  return (
    <Link
      href={`/bounties/${id}`}
      className={`
        block relative overflow-hidden rounded-xl p-5 transition
        ${featured 
          ? 'bg-gradient-to-br from-green-900/40 to-zinc-900 border-2 border-green-500/50 hover:border-green-500' 
          : 'bg-zinc-900 border border-zinc-800 hover:border-zinc-700'
        }
        ${!isOpen && 'opacity-70'}
      `}
    >
      {/* Featured badge */}
      {featured && isOpen && (
        <div className="absolute top-0 right-0 bg-green-500 text-black text-xs font-bold px-3 py-1 rounded-bl-lg">
          🔥 HOT
        </div>
      )}

      {/* Status badge for non-open */}
      {status === 'claimed' && (
        <div className="absolute top-0 right-0 bg-yellow-500/20 text-yellow-400 text-xs font-medium px-3 py-1 rounded-bl-lg">
          In Progress
        </div>
      )}
      {status === 'completed' && (
        <div className="absolute top-0 right-0 bg-blue-500/20 text-blue-400 text-xs font-medium px-3 py-1 rounded-bl-lg">
          ✓ Done
        </div>
      )}

      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold text-lg mb-1 truncate ${featured ? 'text-white' : 'text-zinc-100'}`}>
            {title}
          </h3>
          
          {description && (
            <p className="text-zinc-500 text-sm line-clamp-2 mb-3">
              {description}
            </p>
          )}
          
          <div className="flex items-center gap-3 text-xs text-zinc-600">
            <span>in <span className="text-zinc-400">{club}</span></span>
            {claimedBy && (
              <span>by <span className="text-zinc-400">@{claimedBy}</span></span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className={`
            text-2xl font-bold
            ${isOpen ? 'text-green-400' : 'text-zinc-500'}
          `}>
            {reward}
            <span className="text-sm font-normal ml-1">$CMEM</span>
          </div>
          
          {isOpen && (
            <span className={`
              px-3 py-1.5 rounded-lg text-sm font-semibold
              ${featured 
                ? 'bg-green-500 text-black' 
                : 'bg-zinc-800 text-zinc-300 group-hover:bg-green-500 group-hover:text-black'
              }
              transition
            `}>
              Claim →
            </span>
          )}
        </div>
      </div>

      {/* Urgency indicator for high-value bounties */}
      {isOpen && reward >= 50 && (
        <div className="mt-4 pt-3 border-t border-zinc-800/50 flex items-center gap-2 text-xs">
          <span className="animate-pulse w-2 h-2 bg-orange-500 rounded-full" />
          <span className="text-orange-400/80">High reward - claim before someone else does!</span>
        </div>
      )}
    </Link>
  );
}
