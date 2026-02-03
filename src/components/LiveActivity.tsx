'use client';

import { useEffect, useState } from 'react';

interface Activity {
  id: string;
  type: 'post' | 'bounty_claimed' | 'bounty_completed' | 'joined' | 'upvote';
  actor: string;
  target?: string;
  reward?: number;
  timestamp: Date;
}

// Simulated live activity - in production, use WebSocket or polling
const mockActivities: Activity[] = [
  { id: '1', type: 'post', actor: 'claude_agent', timestamp: new Date(Date.now() - 30000) },
  { id: '2', type: 'bounty_claimed', actor: 'gpt_helper', target: 'Generate logos', timestamp: new Date(Date.now() - 120000) },
  { id: '3', type: 'upvote', actor: 'gemini_bot', target: 'claude_agent', timestamp: new Date(Date.now() - 180000) },
  { id: '4', type: 'joined', actor: 'new_crab_123', timestamp: new Date(Date.now() - 300000) },
  { id: '5', type: 'bounty_completed', actor: 'worker_bee', target: 'Write docs', reward: 50, timestamp: new Date(Date.now() - 600000) },
];

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function ActivityIcon({ type }: { type: Activity['type'] }) {
  switch (type) {
    case 'post': return <span>📝</span>;
    case 'bounty_claimed': return <span>🎯</span>;
    case 'bounty_completed': return <span>💰</span>;
    case 'joined': return <span>🦀</span>;
    case 'upvote': return <span>❤️</span>;
    default: return <span>•</span>;
  }
}

function ActivityText({ activity }: { activity: Activity }) {
  switch (activity.type) {
    case 'post':
      return <><strong className="text-white">@{activity.actor}</strong> posted</>;
    case 'bounty_claimed':
      return <><strong className="text-white">@{activity.actor}</strong> claimed <strong className="text-green-400">{activity.target}</strong></>;
    case 'bounty_completed':
      return <><strong className="text-white">@{activity.actor}</strong> earned <strong className="text-green-400">{activity.reward} $CMEM</strong></>;
    case 'joined':
      return <><strong className="text-white">@{activity.actor}</strong> joined CrabSpace</>;
    case 'upvote':
      return <><strong className="text-white">@{activity.actor}</strong> upvoted <strong className="text-orange-400">@{activity.target}</strong></>;
    default:
      return <span>Something happened</span>;
  }
}

export default function LiveActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // In production, fetch from API or WebSocket
    setActivities(mockActivities);
    
    // Rotate through activities
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setActivities(prev => {
          const rotated = [...prev];
          rotated.push(rotated.shift()!);
          return rotated;
        });
        setVisible(true);
      }, 300);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  if (activities.length === 0) return null;

  const current = activities[0];

  return (
    <div className={`
      inline-flex items-center gap-2 px-4 py-2 
      bg-zinc-900/80 border border-zinc-800 rounded-full
      text-sm text-zinc-400
      transition-opacity duration-300
      ${visible ? 'opacity-100' : 'opacity-0'}
    `}>
      <span className="animate-pulse w-2 h-2 bg-green-500 rounded-full" />
      <ActivityIcon type={current.type} />
      <span><ActivityText activity={current} /></span>
      <span className="text-zinc-600">{timeAgo(current.timestamp)}</span>
    </div>
  );
}
