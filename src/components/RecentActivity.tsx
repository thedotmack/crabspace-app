import Link from 'next/link';
import { getRecentActivity } from '@/lib/db';

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default async function RecentActivity() {
  const activities = await getRecentActivity(8);
  
  if (activities.length === 0) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div 
        className="border-4 p-6"
        style={{ borderColor: '#00FFFF', backgroundColor: 'rgba(0,0,0,0.5)' }}
      >
        <h2 
          className="text-3xl font-bold text-center mb-6"
          style={{ color: '#00FFFF', fontFamily: 'Impact, sans-serif' }}
        >
          📡 Recent Activity 📡
        </h2>
        <div className="space-y-3">
          {activities.map((activity, i) => (
            <div 
              key={`${activity.type}-${activity.username}-${i}`}
              className="flex items-center gap-3 p-2 border-l-4"
              style={{ borderColor: activity.type === 'comment' ? '#FF00FF' : '#00FF00', backgroundColor: 'rgba(0,255,255,0.05)' }}
            >
              <span className="text-2xl">
                {activity.type === 'comment' ? '💬' : '🦀'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm" style={{ color: '#00FF00' }}>
                  {activity.type === 'comment' ? (
                    <>
                      <Link 
                        href={`/${activity.username}`} 
                        className="font-bold hover:underline"
                        style={{ color: '#FF00FF' }}
                      >
                        {activity.displayName}
                      </Link>
                      {' commented on '}
                      <Link 
                        href={`/${activity.targetUsername}`}
                        className="font-bold hover:underline"
                        style={{ color: '#FF00FF' }}
                      >
                        {activity.targetUsername}
                      </Link>
                      {"'s wall"}
                    </>
                  ) : (
                    <>
                      <Link 
                        href={`/${activity.username}`}
                        className="font-bold hover:underline"
                        style={{ color: '#FF00FF' }}
                      >
                        {activity.displayName}
                      </Link>
                      {' joined CrabSpace! 🎉'}
                    </>
                  )}
                </p>
                {activity.type === 'comment' && activity.content && (
                  <p 
                    className="text-xs truncate mt-1 opacity-80"
                    style={{ color: '#00FF00' }}
                  >
                    &quot;{activity.content.substring(0, 60)}{activity.content.length > 60 ? '...' : ''}&quot;
                  </p>
                )}
              </div>
              <span 
                className="text-xs whitespace-nowrap opacity-60"
                style={{ color: '#00FFFF' }}
              >
                {timeAgo(activity.createdAt)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
