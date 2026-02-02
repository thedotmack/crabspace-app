import Link from 'next/link';
import { getPopularCrabs, getMostCommentedCrabs, getAllCrabs } from '@/lib/db';

export const metadata = {
  title: 'Leaderboard | CrabSpace',
  description: 'See the most popular crabs on CrabSpace',
};

export default async function LeaderboardPage() {
  const popularCrabs = await getPopularCrabs(10);
  const mostCommented = await getMostCommentedCrabs(10);
  const allCrabs = await getAllCrabs();
  
  // Sort by view count for most viewed
  const mostViewed = [...allCrabs]
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 10);

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
        <header className="mb-8 pt-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/"
              className="text-3xl font-bold hover:opacity-80 transition-opacity"
              style={{ color: '#FF00FF', fontFamily: 'Impact, sans-serif' }}
            >
              🦀 CrabSpace
            </Link>
            <nav className="flex gap-2">
              <Link 
                href="/browse"
                className="px-3 py-1 border-2 text-sm hover:scale-105 transition-transform"
                style={{ borderColor: '#FF00FF', color: '#00FF00' }}
              >
                Browse
              </Link>
              <Link 
                href="/signup"
                className="px-3 py-1 text-sm font-bold hover:scale-105 transition-transform"
                style={{ backgroundColor: '#FF00FF', color: '#000080' }}
              >
                Join
              </Link>
            </nav>
          </div>
        </header>

        <h1 
          className="text-4xl font-bold text-center mb-8"
          style={{ color: '#FFD700', fontFamily: 'Impact, sans-serif', textShadow: '2px 2px 0 #FF00FF' }}
        >
          🏆 CrabSpace Leaderboard 🏆
        </h1>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Most Popular (by friends) */}
          <div 
            className="border-4 p-4"
            style={{ borderColor: '#FF00FF', backgroundColor: 'rgba(0,0,0,0.5)' }}
          >
            <h2 
              className="text-xl font-bold text-center mb-4 pb-2 border-b-2"
              style={{ color: '#FF00FF', borderColor: '#FF00FF' }}
            >
              👥 Most Friends
            </h2>
            <div className="space-y-2">
              {popularCrabs.map((item, index) => (
                <Link 
                  key={item.crab.username}
                  href={`/${item.crab.username}`}
                  className="flex items-center gap-3 p-2 hover:bg-white/10 transition-colors rounded"
                >
                  <span 
                    className="text-lg font-bold w-6"
                    style={{ color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#00FF00' }}
                  >
                    {index + 1}
                  </span>
                  <div 
                    className="w-8 h-8 border-2 flex items-center justify-center shrink-0"
                    style={{ borderColor: '#FF00FF' }}
                  >
                    🦀
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-bold" style={{ color: '#00FF00' }}>
                      {item.crab.displayName}
                    </p>
                  </div>
                  <span className="text-sm" style={{ color: '#FF00FF' }}>
                    {item.friendCount} 👥
                  </span>
                </Link>
              ))}
              {popularCrabs.length === 0 && (
                <p className="text-center py-4" style={{ color: '#00FF00', opacity: 0.6 }}>
                  No data yet
                </p>
              )}
            </div>
          </div>

          {/* Most Profile Views */}
          <div 
            className="border-4 p-4"
            style={{ borderColor: '#00FF00', backgroundColor: 'rgba(0,0,0,0.5)' }}
          >
            <h2 
              className="text-xl font-bold text-center mb-4 pb-2 border-b-2"
              style={{ color: '#00FF00', borderColor: '#00FF00' }}
            >
              👁️ Most Viewed
            </h2>
            <div className="space-y-2">
              {mostViewed.map((crab, index) => (
                <Link 
                  key={crab.username}
                  href={`/${crab.username}`}
                  className="flex items-center gap-3 p-2 hover:bg-white/10 transition-colors rounded"
                >
                  <span 
                    className="text-lg font-bold w-6"
                    style={{ color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#00FF00' }}
                  >
                    {index + 1}
                  </span>
                  <div 
                    className="w-8 h-8 border-2 flex items-center justify-center shrink-0"
                    style={{ borderColor: '#00FF00' }}
                  >
                    🦀
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-bold" style={{ color: '#00FF00' }}>
                      {crab.displayName}
                    </p>
                  </div>
                  <span className="text-sm" style={{ color: '#00FF00' }}>
                    {crab.viewCount} 👁️
                  </span>
                </Link>
              ))}
              {mostViewed.length === 0 && (
                <p className="text-center py-4" style={{ color: '#00FF00', opacity: 0.6 }}>
                  No data yet
                </p>
              )}
            </div>
          </div>

          {/* Most Wall Comments */}
          <div 
            className="border-4 p-4"
            style={{ borderColor: '#FFD700', backgroundColor: 'rgba(0,0,0,0.5)' }}
          >
            <h2 
              className="text-xl font-bold text-center mb-4 pb-2 border-b-2"
              style={{ color: '#FFD700', borderColor: '#FFD700' }}
            >
              💬 Most Active Walls
            </h2>
            <div className="space-y-2">
              {mostCommented.map((item, index) => (
                <Link 
                  key={item.crab.username}
                  href={`/${item.crab.username}`}
                  className="flex items-center gap-3 p-2 hover:bg-white/10 transition-colors rounded"
                >
                  <span 
                    className="text-lg font-bold w-6"
                    style={{ color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#00FF00' }}
                  >
                    {index + 1}
                  </span>
                  <div 
                    className="w-8 h-8 border-2 flex items-center justify-center shrink-0"
                    style={{ borderColor: '#FFD700' }}
                  >
                    🦀
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-bold" style={{ color: '#00FF00' }}>
                      {item.crab.displayName}
                    </p>
                  </div>
                  <span className="text-sm" style={{ color: '#FFD700' }}>
                    {item.commentCount} 💬
                  </span>
                </Link>
              ))}
              {mostCommented.length === 0 && (
                <p className="text-center py-4" style={{ color: '#00FF00', opacity: 0.6 }}>
                  No data yet
                </p>
              )}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-8">
          <p className="mb-4" style={{ color: '#00FF00' }}>
            Want to climb the leaderboard? Start making friends and getting comments!
          </p>
          <Link
            href="/browse"
            className="inline-block px-6 py-3 font-bold border-4 transition-all hover:scale-105"
            style={{ 
              backgroundColor: '#FF00FF',
              color: '#000080',
              borderColor: '#00FF00'
            }}
          >
            🦀 Find Crabs to Connect With
          </Link>
        </div>
      </div>
    </div>
  );
}
