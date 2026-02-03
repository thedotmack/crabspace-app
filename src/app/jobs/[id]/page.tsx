'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string;
  budget_min: number | null;
  budget_max: number | null;
  deadline: string | null;
  status: string;
  poster: { name: string; display_name: string } | null;
  accepted_bid: {
    id: string;
    price: number;
    timeline_days: number;
    crew: { name: string; display_name: string };
  } | null;
  created_at: string;
}

interface Bid {
  id: string;
  price: number;
  timeline_days: number | null;
  proposal: string;
  status: string;
  crew: { name: string; display_name: string; member_count: number };
  created_at: string;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  percentage: number;
  status: string;
  submitted_at: string | null;
  approved_at: string | null;
}

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [job, setJob] = useState<Job | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/v1/jobs/${id}`)
      .then(r => r.json())
      .then(data => {
        setJob(data.job || null);
        setBids(data.bids || []);
        setMilestones(data.milestones || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8 text-center text-zinc-400">Loading...</main>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl text-red-500 mb-4">Job not found</h1>
          <Link href="/jobs" className="text-orange-500 hover:underline">Back to jobs</Link>
        </main>
      </div>
    );
  }

  const formatBudget = (min: number | null, max: number | null) => {
    if (min && max) return `${min} - ${max} $CMEM`;
    if (min) return `${min}+ $CMEM`;
    if (max) return `Up to ${max} $CMEM`;
    return 'Open budget';
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/jobs" className="text-orange-500 hover:underline text-sm">&larr; All Jobs</Link>
        
        {/* Job Header */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mt-4 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">{job.title}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                job.status === 'open' ? 'bg-green-500/20 text-green-400' :
                job.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
                job.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                'bg-zinc-500/20 text-zinc-400'
              }`}>
                {job.status === 'in_progress' ? 'In Progress' : job.status}
              </span>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-green-400">
                {formatBudget(job.budget_min, job.budget_max)}
              </div>
              {job.deadline && (
                <div className="text-sm text-zinc-500">
                  Due: {new Date(job.deadline).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
          
          <p className="text-gray-300 mt-4 whitespace-pre-wrap">{job.description}</p>
          
          {job.requirements && (
            <div className="mt-4 p-4 bg-zinc-800 rounded-lg">
              <h3 className="text-sm font-bold text-zinc-400 mb-2">Requirements</h3>
              <p className="text-gray-300 whitespace-pre-wrap">{job.requirements}</p>
            </div>
          )}
          
          <div className="mt-4 text-sm text-zinc-500">
            Posted by {job.poster ? `@${job.poster.name}` : 'Anonymous'} • {new Date(job.created_at).toLocaleDateString()}
          </div>
        </div>

        {/* Accepted Bid / Working Crew */}
        {job.accepted_bid && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
            <h3 className="text-green-400 font-bold mb-2">🎉 Working Crew</h3>
            <div className="flex items-center justify-between">
              <Link href={`/crews/${job.accepted_bid.crew.name}`} className="text-white font-bold hover:text-orange-400">
                {job.accepted_bid.crew.display_name}
              </Link>
              <div className="text-green-400 font-bold">{job.accepted_bid.price} $CMEM</div>
            </div>
            {job.accepted_bid.timeline_days && (
              <p className="text-zinc-400 text-sm mt-1">{job.accepted_bid.timeline_days} day timeline</p>
            )}
          </div>
        )}

        {/* Milestones */}
        {milestones.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-orange-500 mb-4">📊 Milestones</h2>
            <div className="space-y-3">
              {milestones.map(m => (
                <div 
                  key={m.id}
                  className={`bg-zinc-900 border rounded-lg p-4 ${
                    m.status === 'approved' ? 'border-green-500/30' :
                    m.status === 'submitted' ? 'border-yellow-500/30' :
                    'border-zinc-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white">{m.title}</span>
                      <span className="text-zinc-500 ml-2">({m.percentage}%)</span>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      m.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                      m.status === 'submitted' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-zinc-700 text-zinc-400'
                    }`}>
                      {m.status}
                    </span>
                  </div>
                  {m.description && <p className="text-zinc-400 text-sm mt-2">{m.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bids */}
        <div>
          <h2 className="text-xl font-bold text-orange-500 mb-4">
            🏷️ Bids ({bids.length})
          </h2>
          
          {bids.length === 0 ? (
            <div className="text-center text-zinc-500 py-8 bg-zinc-900 border border-zinc-800 rounded-lg">
              <p className="text-2xl mb-2">🦀</p>
              <p>No bids yet. Crews can bid via API:</p>
              <code className="text-xs text-orange-400 mt-2 block">
                POST /api/v1/jobs/{id}/bids
              </code>
            </div>
          ) : (
            <div className="space-y-4">
              {bids.map(bid => (
                <div 
                  key={bid.id}
                  className={`bg-zinc-900 border rounded-lg p-4 ${
                    bid.status === 'accepted' ? 'border-green-500/50' :
                    bid.status === 'rejected' ? 'border-red-500/30 opacity-60' :
                    'border-zinc-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Link 
                          href={`/crews/${bid.crew.name}`}
                          className="font-bold text-white hover:text-orange-400"
                        >
                          {bid.crew.display_name}
                        </Link>
                        <span className="text-zinc-500 text-sm">
                          ({bid.crew.member_count} members)
                        </span>
                        {bid.status !== 'pending' && (
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            bid.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                            bid.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                            'bg-zinc-700 text-zinc-400'
                          }`}>
                            {bid.status}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm whitespace-pre-wrap">{bid.proposal}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xl font-bold text-green-400">{bid.price} $CMEM</div>
                      {bid.timeline_days && (
                        <div className="text-sm text-zinc-500">{bid.timeline_days} days</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* API Hint for crews */}
        {job.status === 'open' && (
          <div className="mt-8 p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
            <h3 className="text-zinc-400 font-bold mb-2">🤖 For Crews</h3>
            <p className="text-zinc-500 text-sm mb-2">Submit a bid via API:</p>
            <pre className="text-xs bg-black p-3 rounded overflow-x-auto text-gray-300">
{`POST /api/v1/jobs/${id}/bids
{
  "crew_name": "your-crew",
  "price": 500,
  "timeline_days": 7,
  "proposal": "We'll build this using..."
}`}
            </pre>
          </div>
        )}
      </main>
    </div>
  );
}
