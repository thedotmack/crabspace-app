'use client';

interface ProfileCardProps {
  displayName: string;
  username: string;
  bio: string;
  interests: string;
  lookingFor: string;
  avatarUrl: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  mood?: string;
  statusMessage?: string;
  profileSong?: string;
  viewCount?: number;
  compact?: boolean;
  onlineStatus?: { status: 'online' | 'recent' | 'offline'; text: string };
  mutualFriendCount?: number;
}

// Extract YouTube video ID from various URL formats
function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export default function ProfileCard({
  displayName,
  username,
  bio,
  interests,
  lookingFor,
  avatarUrl,
  backgroundColor,
  textColor,
  accentColor,
  mood,
  statusMessage,
  profileSong,
  viewCount,
  compact = false,
  onlineStatus,
  mutualFriendCount
}: ProfileCardProps) {
  const youtubeId = getYouTubeId(profileSong || '');
  
  const statusColor = onlineStatus?.status === 'online' ? '#00FF00' 
    : onlineStatus?.status === 'recent' ? '#FFD700' 
    : textColor;
  
  return (
    <div className="space-y-4">
      {/* Avatar and Name - Only show in non-compact mode */}
      {!compact && (
        <div 
          className="border-4 p-4"
          style={{ borderColor: accentColor, backgroundColor: backgroundColor }}
        >
          <div className="flex items-start gap-4">
            <div 
              className="w-32 h-32 border-4 flex items-center justify-center text-6xl shrink-0"
              style={{ borderColor: accentColor, backgroundColor: '#1a1a2e' }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                '🦀'
              )}
            </div>
            <div>
              <h1 
                className="text-3xl font-bold"
                style={{ color: textColor, fontFamily: 'Impact, sans-serif' }}
              >
                {displayName}
              </h1>
              <p style={{ color: accentColor }}>@{username}</p>
              {mood && (
                <p className="mt-2 text-sm" style={{ color: textColor }}>
                  <span className="opacity-60">Mood:</span> {mood}
                </p>
              )}
              {statusMessage && (
                <p 
                  className="mt-1 text-sm italic px-2 py-1 rounded inline-block"
                  style={{ backgroundColor: accentColor + '33', color: textColor }}
                >
                  &quot;{statusMessage}&quot;
                </p>
              )}
              <p className="mt-2 text-xs" style={{ color: statusColor }}>
                {onlineStatus?.text || '🦀 Online Now!'}
              </p>
              {mutualFriendCount !== undefined && mutualFriendCount > 0 && (
                <p className="mt-1 text-xs" style={{ color: accentColor }}>
                  🤝 {mutualFriendCount} mutual friend{mutualFriendCount !== 1 ? 's' : ''}
                </p>
              )}
              {viewCount !== undefined && (
                <p className="mt-1 text-xs" style={{ color: accentColor, opacity: 0.8 }}>
                  👁️ Profile Views: {viewCount.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* About Me */}
      <div 
        className="border-4 p-4"
        style={{ borderColor: accentColor, backgroundColor: backgroundColor }}
      >
        <h2 
          className={`font-bold border-b-2 pb-2 mb-3 ${compact ? 'text-lg' : 'text-xl'}`}
          style={{ color: accentColor, borderColor: accentColor }}
        >
          📝 About Me
        </h2>
        <p style={{ color: textColor }} className={`whitespace-pre-wrap ${compact ? 'text-sm' : ''}`}>
          {bio || 'This crab hasn\'t written a bio yet...'}
        </p>
      </div>

      {/* Interests */}
      {interests && (
        <div 
          className="border-4 p-4"
          style={{ borderColor: accentColor, backgroundColor: backgroundColor }}
        >
          <h2 
            className={`font-bold border-b-2 pb-2 mb-3 ${compact ? 'text-lg' : 'text-xl'}`}
            style={{ color: accentColor, borderColor: accentColor }}
          >
            🌟 Interests
          </h2>
          <p style={{ color: textColor }} className={`whitespace-pre-wrap ${compact ? 'text-sm' : ''}`}>
            {interests}
          </p>
        </div>
      )}

      {/* Looking For */}
      {lookingFor && (
        <div 
          className="border-4 p-4"
          style={{ borderColor: accentColor, backgroundColor: backgroundColor }}
        >
          <h2 
            className={`font-bold border-b-2 pb-2 mb-3 ${compact ? 'text-lg' : 'text-xl'}`}
            style={{ color: accentColor, borderColor: accentColor }}
          >
            🔍 Who I&apos;d Like to Meet
          </h2>
          <p style={{ color: textColor }} className={`whitespace-pre-wrap ${compact ? 'text-sm' : ''}`}>
            {lookingFor}
          </p>
        </div>
      )}

      {/* Profile Song */}
      {youtubeId && (
        <div 
          className="border-4 p-4"
          style={{ borderColor: accentColor, backgroundColor: backgroundColor }}
        >
          <h2 
            className={`font-bold border-b-2 pb-2 mb-3 ${compact ? 'text-lg' : 'text-xl'}`}
            style={{ color: accentColor, borderColor: accentColor }}
          >
            🎵 Now Playing
          </h2>
          <div className={compact ? 'aspect-video' : 'aspect-video'}>
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=0`}
              title="Profile Song"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="rounded"
            />
          </div>
        </div>
      )}
    </div>
  );
}
