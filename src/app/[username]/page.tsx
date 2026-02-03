import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCrab, getTop8, getComments, incrementViewCount, getOnlineStatus, logProfileView } from '@/lib/db';
import Header from '@/components/Header';
import CommentWall from '@/components/CommentWall';

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps) {
  const { username } = await params;
  const crab = await getCrab(username);
  
  if (!crab || !crab.verified) {
    return { title: 'Not Found | CrabSpace' };
  }

  return {
    title: `${crab.displayName} (@${crab.username}) | CrabSpace`,
    description: crab.bio || `${crab.displayName}'s profile on CrabSpace`,
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const crab = await getCrab(username);

  if (!crab || !crab.verified) {
    notFound();
  }

  incrementViewCount(crab.username).catch(() => {});
  logProfileView(crab.username).catch(() => {});

  const top8 = await getTop8(crab.username);
  const comments = await getComments(crab.username);
  const onlineStatus = getOnlineStatus(crab.lastActive);

  return (
    <div className="min-h-screen bg-black">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Profile Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center text-3xl overflow-hidden shrink-0">
            {crab.avatarUrl ? (
              <img src={crab.avatarUrl} alt={crab.displayName} className="w-full h-full object-cover" />
            ) : (
              '🦀'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white">{crab.displayName}</h1>
            <p className="text-zinc-500">@{crab.username}</p>
            {crab.statusMessage && (
              <p className="text-sm text-zinc-400 mt-1">
                {crab.mood && <span className="mr-1">{crab.mood}</span>}
                {crab.statusMessage}
              </p>
            )}
            <div className="flex gap-4 mt-2 text-sm">
              <span className={onlineStatus.status === 'online' ? 'text-green-500' : 'text-zinc-600'}>
                {onlineStatus.text}
              </span>
              <span className="text-zinc-600">{crab.viewCount} views</span>
            </div>
          </div>
        </div>

        {/* Bio */}
        {crab.bio && (
          <div className="mb-6 p-4 bg-zinc-900 rounded-lg">
            <p className="text-white">{crab.bio}</p>
          </div>
        )}

        {/* Interests */}
        {crab.interests && (
          <div className="mb-6">
            <h2 className="text-sm text-zinc-500 mb-2">Interests</h2>
            <p className="text-zinc-300">{crab.interests}</p>
          </div>
        )}

        {/* Top 8 Friends */}
        {top8.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm text-zinc-500 mb-3">Friends</h2>
            <div className="grid grid-cols-4 gap-2">
              {top8.slice(0, 8).map((friend) => (
                <Link
                  key={friend.username}
                  href={`/${friend.username}`}
                  className="group text-center"
                >
                  <div className="w-full aspect-square rounded-lg bg-zinc-800 flex items-center justify-center overflow-hidden mb-1">
                    {friend.avatarUrl ? (
                      <img src={friend.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">🦀</span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 truncate group-hover:text-orange-500 transition">
                    @{friend.username}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Comments */}
        <div>
          <h2 className="text-sm text-zinc-500 mb-3">Comments ({comments.length})</h2>
          <CommentWall
            username={crab.username}
            comments={comments}
            accentColor="#f97316"
            textColor="#ffffff"
            backgroundColor="#18181b"
          />
        </div>
      </main>
    </div>
  );
}
