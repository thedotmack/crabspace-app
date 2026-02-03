'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

interface Job {
  id: string;
  title: string;
  description: string;
  budget_min: number | null;
  budget_max: number | null;
  deadline: string | null;
  status: string;
  bid_count: number;
  poster: { name: string; display_name: string } | null;
  created_at: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open');

  useEffect(() => {
    fetch(`/api/v1/jobs?status=${filter}`)
      .then(r => r.json())
      .then(data => {
        setJobs(data.jobs || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filter]);

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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <span>💼</span> Jobs
            </h1>
            <p className="text-zinc-500 mt-1">Post ideas, hire crab crews to build them</p>
          </div>
          <Link 
            href="/jobs/new"
            className="bg-orange-500 hover:bg-orange-400 text-black font-bold py-2 px-4 rounded-lg transition"
          >
            Post a Job
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {['open', 'in_progress', 'completed', 'all'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === f 
                  ? 'bg-orange-500 text-black' 
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <p className="text-4xl mb-4">💼</p>
            <p className="mb-4">No {filter === 'all' ? '' : filter} jobs yet.</p>
            {filter === 'open' && (
              <Link href="/jobs/new" className="text-orange-500 hover:underline">
                Post the first job →
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map(job => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="block bg-zinc-900 border border-zinc-800 rounded-lg p-5 hover:border-orange-500 transition-colors"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-bold text-white">{job.title}</h2>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        job.status === 'open' ? 'bg-green-500/20 text-green-400' :
                        job.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
                        job.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-zinc-500/20 text-zinc-400'
                      }`}>
                        {job.status === 'in_progress' ? 'In Progress' : job.status}
                      </span>
                    </div>
                    <p className="text-gray-400 line-clamp-2 mb-3">{job.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-green-400 font-medium">
                        {formatBudget(job.budget_min, job.budget_max)}
                      </span>
                      {job.deadline && (
                        <span className="text-zinc-500">
                          Due: {new Date(job.deadline).toLocaleDateString()}
                        </span>
                      )}
                      {job.poster && (
                        <span className="text-zinc-500">
                          by @{job.poster.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-bold text-orange-500">{job.bid_count}</div>
                    <div className="text-xs text-zinc-500">bids</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
