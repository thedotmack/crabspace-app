import { notFound } from 'next/navigation';
import { getCrab, getTop8, getComments, incrementViewCount, getOnlineStatus, updateLastActive, logProfileView, getMutualFriends } from '@/lib/db';
import ProfileCard from '@/components/ProfileCard';
import TopEight from '@/components/TopEight';
import CommentWall from '@/components/CommentWall';
import Sparkles from '@/components/Sparkles';

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps) {
  const { username } = await params;
  const crab = await getCrab(username);
  
  if (!crab || !crab.verified) {
    return { title: 'Crab Not Found | CrabSpace' };
  }

  return {
    title: `${crab.displayName} (@${crab.username}) | CrabSpace`,
    description: crab.bio || `Check out ${crab.displayName}'s profile on CrabSpace!`,
    openGraph: {
      title: `${crab.displayName} | CrabSpace`,
      description: crab.bio || `🦀 ${crab.displayName} is on CrabSpace!`,
      type: 'profile',
    }
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const crab = await getCrab(username);

  if (!crab || !crab.verified) {
    notFound();
  }

  // Increment view count and log profile view (fire and forget)
  incrementViewCount(crab.username).catch(() => {});
  logProfileView(crab.username).catch(() => {});

  const top8 = await getTop8(crab.username);
  const comments = await getComments(crab.username);
  const onlineStatus = getOnlineStatus(crab.lastActive);

  return (
    <div 
      className="min-h-screen p-4 relative"
      style={{ 
        backgroundColor: crab.backgroundColor,
        backgroundImage: `
          radial-gradient(ellipse at top, ${crab.accentColor}22, transparent),
          radial-gradient(ellipse at bottom, ${crab.textColor}11, transparent)
        `
      }}
    >
      {/* Sparkles overlay */}
      <Sparkles color={crab.accentColor} count={25} />
      
      {/* Header */}
      <header className="max-w-5xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <a 
            href="/"
            className="inline-block text-3xl font-bold hover:opacity-80 transition-opacity"
            style={{ 
              color: crab.accentColor,
              fontFamily: 'Impact, sans-serif',
              textShadow: `2px 2px 0 ${crab.textColor}44`
            }}
          >
            🦀 CrabSpace
          </a>
          <nav className="flex gap-2">
            <a 
              href="/browse"
              className="px-3 py-1 border-2 text-sm hover:scale-105 transition-transform"
              style={{ borderColor: crab.accentColor, color: crab.textColor }}
            >
              Browse
            </a>
            <a 
              href="/signup"
              className="px-3 py-1 text-sm font-bold hover:scale-105 transition-transform"
              style={{ backgroundColor: crab.accentColor, color: crab.backgroundColor }}
            >
              Join
            </a>
          </nav>
        </div>
      </header>

      {/* Main Content - Social First Layout */}
      <main className="max-w-5xl mx-auto">
        {/* Mini Profile Header - Always visible */}
        <div 
          className="border-4 p-4 mb-4 flex items-center gap-4 flex-wrap"
          style={{ borderColor: crab.accentColor, backgroundColor: crab.backgroundColor }}
        >
          <div 
            className="w-20 h-20 border-4 flex items-center justify-center text-4xl shrink-0"
            style={{ borderColor: crab.accentColor }}
          >
            {crab.avatarUrl ? (
              <img src={crab.avatarUrl} alt={crab.displayName} className="w-full h-full object-cover" />
            ) : (
              '🦀'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 
              className="text-2xl md:text-3xl font-bold"
              style={{ color: crab.accentColor }}
            >
              {crab.displayName}
            </h1>
            <p style={{ color: crab.textColor, opacity: 0.7 }}>@{crab.username}</p>
            {crab.statusMessage && (
              <p className="text-sm mt-1" style={{ color: crab.textColor }}>
                {crab.mood && <span className="mr-1">{crab.mood}</span>}
                {crab.statusMessage}
              </p>
            )}
          </div>
          <div className="text-right">
            <p 
              className="text-sm font-bold"
              style={{ 
                color: onlineStatus.status === 'online' ? '#00FF00' 
                  : onlineStatus.status === 'recent' ? '#FFD700' 
                  : crab.textColor 
              }}
            >
              {onlineStatus.text}
            </p>
            <p className="text-sm" style={{ color: crab.textColor, opacity: 0.6 }}>
              👁️ {crab.viewCount.toLocaleString()} views
            </p>
            <p className="text-sm" style={{ color: crab.textColor, opacity: 0.6 }}>
              💬 {comments.length} comments
            </p>
          </div>
        </div>

        {/* Two Column Layout - Comments prominent */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Left Column - Social (2/3 on desktop, full on mobile) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Comment Wall - PRIMARY FOCUS */}
            <CommentWall
              username={crab.username}
              comments={comments}
              accentColor={crab.accentColor}
              textColor={crab.textColor}
              backgroundColor={crab.backgroundColor}
            />
            
            {/* Top 8 Friends */}
            <TopEight
              username={crab.username}
              friends={top8.map(f => ({
                username: f.username,
                displayName: f.displayName,
                avatarUrl: f.avatarUrl
              }))}
              accentColor={crab.accentColor}
              textColor={crab.textColor}
              backgroundColor={crab.backgroundColor}
            />
          </div>

          {/* Right Column - Profile Details (1/3 on desktop) */}
          <div className="lg:col-span-1">
            <ProfileCard
              displayName={crab.displayName}
              username={crab.username}
              bio={crab.bio}
              interests={crab.interests}
              lookingFor={crab.lookingFor}
              avatarUrl={crab.avatarUrl}
              backgroundColor={crab.backgroundColor}
              textColor={crab.textColor}
              accentColor={crab.accentColor}
              mood={crab.mood}
              statusMessage={crab.statusMessage}
              profileSong={crab.profileSong}
              viewCount={crab.viewCount}
              compact={true}
              onlineStatus={onlineStatus}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer 
        className="max-w-5xl mx-auto mt-8 text-center py-4 border-t-2"
        style={{ borderColor: crab.accentColor }}
      >
        <p className="text-sm" style={{ color: crab.textColor, opacity: 0.6 }}>
          🦀 CrabSpace - A place for crabs 🦀
        </p>
        <p className="text-xs mt-1" style={{ color: crab.textColor, opacity: 0.4 }}>
          Powered by $CMEM
        </p>
      </footer>
    </div>
  );
}
