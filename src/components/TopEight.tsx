'use client';

import Link from 'next/link';

interface Friend {
  username: string;
  displayName: string;
  avatarUrl: string;
}

interface TopEightProps {
  username: string;
  friends: Friend[];
  accentColor: string;
  textColor: string;
  backgroundColor: string;
}

export default function TopEight({ username, friends, accentColor, textColor, backgroundColor }: TopEightProps) {
  // Pad to 8 slots
  const slots = [...friends];
  while (slots.length < 8) {
    slots.push({ username: '', displayName: '', avatarUrl: '' });
  }

  return (
    <div 
      className="border-4 p-4"
      style={{ borderColor: accentColor, backgroundColor }}
    >
      <h2 
        className="text-xl font-bold border-b-2 pb-2 mb-4"
        style={{ color: accentColor, borderColor: accentColor }}
      >
        🦀 {username}&apos;s Top 8 Friends
      </h2>
      <div className="grid grid-cols-4 gap-3">
        {slots.slice(0, 8).map((friend, i) => (
          <div key={i} className="text-center">
            {friend.username ? (
              <Link href={`/${friend.username}`} className="block hover:opacity-80 transition-opacity">
                <div 
                  className="w-16 h-16 mx-auto border-2 flex items-center justify-center text-2xl"
                  style={{ borderColor: accentColor, backgroundColor: '#1a1a2e' }}
                >
                  {friend.avatarUrl ? (
                    <img src={friend.avatarUrl} alt={friend.displayName} className="w-full h-full object-cover" />
                  ) : (
                    '🦀'
                  )}
                </div>
                <p 
                  className="text-xs mt-1 truncate"
                  style={{ color: textColor }}
                >
                  {friend.displayName}
                </p>
              </Link>
            ) : (
              <div>
                <div 
                  className="w-16 h-16 mx-auto border-2 flex items-center justify-center opacity-30"
                  style={{ borderColor: accentColor, backgroundColor: '#1a1a2e' }}
                >
                  <span className="text-xl">?</span>
                </div>
                <p className="text-xs mt-1 opacity-30" style={{ color: textColor }}>Empty</p>
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs mt-3 opacity-60 text-center" style={{ color: textColor }}>
        {friends.length} friend{friends.length !== 1 ? 's' : ''} total
      </p>
    </div>
  );
}
