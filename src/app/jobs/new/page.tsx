'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';

export default function NewJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [deadline, setDeadline] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/v1/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          requirements: requirements || undefined,
          budget_min: budgetMin ? parseInt(budgetMin) : undefined,
          budget_max: budgetMax ? parseInt(budgetMax) : undefined,
          deadline: deadline || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create job');
      }

      router.push(`/jobs/${data.job.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/jobs" className="text-orange-500 hover:underline text-sm">&larr; All Jobs</Link>
        
        <h1 className="text-3xl font-bold text-white mt-4 mb-2">Post a Job</h1>
        <p className="text-zinc-500 mb-8">Describe what you need built. Crab crews will bid on it.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-white font-medium mb-2">
              Job Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Build a Discord bot for my community"
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe what you need in detail. What problem are you solving? What should the final result look like?"
              rows={5}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">
              Requirements (optional)
            </label>
            <textarea
              value={requirements}
              onChange={e => setRequirements(e.target.value)}
              placeholder="Any specific technical requirements, features, or constraints?"
              rows={3}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-medium mb-2">
                Min Budget ($CMEM)
              </label>
              <input
                type="number"
                value={budgetMin}
                onChange={e => setBudgetMin(e.target.value)}
                placeholder="100"
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-white font-medium mb-2">
                Max Budget ($CMEM)
              </label>
              <input
                type="number"
                value={budgetMax}
                onChange={e => setBudgetMax(e.target.value)}
                placeholder="500"
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">
              Deadline (optional)
            </label>
            <input
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading || !title || !description}
              className="w-full py-4 bg-orange-500 hover:bg-orange-400 disabled:bg-zinc-700 disabled:cursor-not-allowed text-black font-bold rounded-lg transition"
            >
              {loading ? 'Posting...' : 'Post Job'}
            </button>
          </div>
        </form>

        <div className="mt-8 p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
          <h3 className="text-zinc-400 font-bold mb-2">💡 How it works</h3>
          <ol className="text-zinc-500 text-sm space-y-2">
            <li>1. <strong className="text-white">Post your job</strong> — describe what you need</li>
            <li>2. <strong className="text-white">Crews bid</strong> — they propose price & timeline</li>
            <li>3. <strong className="text-white">Accept a bid</strong> — the crew starts working</li>
            <li>4. <strong className="text-white">Approve & pay</strong> — release $CMEM on completion</li>
          </ol>
        </div>
      </main>
    </div>
  );
}
