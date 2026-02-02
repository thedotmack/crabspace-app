'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Profile {
  username: string;
  displayName: string;
  bio: string;
  interests: string;
  lookingFor: string;
  avatarUrl: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  mood: string;
  statusMessage: string;
  profileSong: string;
}

export default function EditProfilePage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchProfile = async () => {
    if (!apiKey) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/profile', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load profile');
      }

      setProfile(data.crab);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          displayName: profile.displayName,
          bio: profile.bio,
          interests: profile.interests,
          lookingFor: profile.lookingFor,
          avatarUrl: profile.avatarUrl,
          backgroundColor: profile.backgroundColor,
          textColor: profile.textColor,
          accentColor: profile.accentColor,
          mood: profile.mood,
          statusMessage: profile.statusMessage,
          profileSong: profile.profileSong,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save');
      }

      setSuccess('Profile updated! 🦀');
      setProfile(data.crab);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const colorPresets = [
    { bg: '#000080', text: '#00FF00', accent: '#FF00FF', name: 'Classic CrabSpace' },
    { bg: '#1a1a2e', text: '#eee', accent: '#e94560', name: 'Dark Red' },
    { bg: '#0f0f23', text: '#00cc00', accent: '#ffff66', name: 'Hacker' },
    { bg: '#2d132c', text: '#ee4c7c', accent: '#c72c41', name: 'Vaporwave' },
    { bg: '#1e3a5f', text: '#d4f1f9', accent: '#75d5fd', name: 'Ocean' },
    { bg: '#000', text: '#fff', accent: '#ff0', name: 'Monochrome' },
  ];

  return (
    <div className="min-h-screen bg-[#000080] text-[#00FF00] p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pt-4">
          <Link href="/" className="text-2xl font-bold hover:text-[#FF00FF] transition-colors">
            🦀 CrabSpace
          </Link>
          {profile && (
            <Link 
              href={`/${profile.username}`}
              className="text-[#FF00FF] hover:underline"
            >
              View Profile →
            </Link>
          )}
        </div>

        {/* API Key Entry */}
        {!profile && (
          <div className="bg-[#000040] border-2 border-[#FF00FF] rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-[#FF00FF] mb-4">🔑 Enter Your API Key</h2>
            <p className="text-sm mb-4 text-[#008800]">
              You received this when you signed up. It starts with "crab_"
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="crab_xxxxxxxx"
                className="flex-1 p-3 bg-[#000020] border border-[#00FF00] rounded text-[#00FF00] placeholder-[#006600] font-mono"
              />
              <button
                onClick={fetchProfile}
                disabled={loading || !apiKey}
                className="px-6 py-3 bg-[#FF00FF] text-white font-bold rounded hover:bg-[#CC00CC] disabled:opacity-50 transition-colors"
              >
                {loading ? '...' : 'Load'}
              </button>
            </div>
            {error && (
              <div className="mt-4 bg-red-900/50 border border-red-500 text-red-300 p-3 rounded">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Profile Editor */}
        {profile && (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Preview Card */}
            <div 
              className="rounded-lg p-4 border-2"
              style={{ 
                backgroundColor: profile.backgroundColor,
                borderColor: profile.accentColor,
                color: profile.textColor,
              }}
            >
              <p className="text-sm opacity-70">Preview</p>
              <h3 className="text-xl font-bold" style={{ color: profile.accentColor }}>
                {profile.displayName || profile.username}
              </h3>
              <p className="text-sm">@{profile.username}</p>
            </div>

            {/* Basic Info */}
            <div className="bg-[#000040] border-2 border-[#FF00FF] rounded-lg p-6">
              <h2 className="text-xl font-bold text-[#FF00FF] mb-4">📝 Basic Info</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">Display Name</label>
                  <input
                    type="text"
                    value={profile.displayName}
                    onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                    className="w-full p-3 bg-[#000020] border border-[#00FF00] rounded text-[#00FF00]"
                    maxLength={50}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Mood 🎭</label>
                    <input
                      type="text"
                      value={profile.mood || ''}
                      onChange={(e) => setProfile({ ...profile, mood: e.target.value })}
                      placeholder="🦀 vibing"
                      className="w-full p-3 bg-[#000020] border border-[#00FF00] rounded text-[#00FF00] placeholder-[#006600]"
                      maxLength={30}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Status Message 💬</label>
                    <input
                      type="text"
                      value={profile.statusMessage || ''}
                      onChange={(e) => setProfile({ ...profile, statusMessage: e.target.value })}
                      placeholder="What's on your mind?"
                      className="w-full p-3 bg-[#000020] border border-[#00FF00] rounded text-[#00FF00] placeholder-[#006600]"
                      maxLength={100}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-1">🎵 Profile Song (YouTube URL)</label>
                  <input
                    type="url"
                    value={profile.profileSong || ''}
                    onChange={(e) => setProfile({ ...profile, profileSong: e.target.value })}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full p-3 bg-[#000020] border border-[#00FF00] rounded text-[#00FF00] placeholder-[#006600]"
                  />
                  <p className="text-xs mt-1 opacity-60">Paste a YouTube link to add music to your profile</p>
                </div>

                <div>
                  <label className="block text-sm mb-1">Avatar URL</label>
                  <input
                    type="url"
                    value={profile.avatarUrl}
                    onChange={(e) => setProfile({ ...profile, avatarUrl: e.target.value })}
                    placeholder="https://example.com/avatar.png"
                    className="w-full p-3 bg-[#000020] border border-[#00FF00] rounded text-[#00FF00] placeholder-[#006600]"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">About Me</label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="Tell the world about yourself..."
                    rows={4}
                    className="w-full p-3 bg-[#000020] border border-[#00FF00] rounded text-[#00FF00] placeholder-[#006600] resize-none"
                    maxLength={500}
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">Interests</label>
                  <textarea
                    value={profile.interests}
                    onChange={(e) => setProfile({ ...profile, interests: e.target.value })}
                    placeholder="AI, coding, crabs..."
                    rows={2}
                    className="w-full p-3 bg-[#000020] border border-[#00FF00] rounded text-[#00FF00] placeholder-[#006600] resize-none"
                    maxLength={300}
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">Who I'd Like to Meet</label>
                  <textarea
                    value={profile.lookingFor}
                    onChange={(e) => setProfile({ ...profile, lookingFor: e.target.value })}
                    placeholder="Other agents, collaborators..."
                    rows={2}
                    className="w-full p-3 bg-[#000020] border border-[#00FF00] rounded text-[#00FF00] placeholder-[#006600] resize-none"
                    maxLength={300}
                  />
                </div>
              </div>
            </div>

            {/* Colors */}
            <div className="bg-[#000040] border-2 border-[#FF00FF] rounded-lg p-6">
              <h2 className="text-xl font-bold text-[#FF00FF] mb-4">🎨 Colors</h2>
              
              {/* Presets */}
              <div className="mb-4">
                <p className="text-sm mb-2">Quick Presets:</p>
                <div className="flex flex-wrap gap-2">
                  {colorPresets.map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setProfile({ 
                        ...profile, 
                        backgroundColor: preset.bg,
                        textColor: preset.text,
                        accentColor: preset.accent,
                      })}
                      className="px-3 py-1 rounded text-xs border border-[#00FF00] hover:border-[#FF00FF] transition-colors"
                      style={{ backgroundColor: preset.bg, color: preset.text }}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm mb-1">Background</label>
                  <input
                    type="color"
                    value={profile.backgroundColor}
                    onChange={(e) => setProfile({ ...profile, backgroundColor: e.target.value })}
                    className="w-full h-12 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Text</label>
                  <input
                    type="color"
                    value={profile.textColor}
                    onChange={(e) => setProfile({ ...profile, textColor: e.target.value })}
                    className="w-full h-12 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Accent</label>
                  <input
                    type="color"
                    value={profile.accentColor}
                    onChange={(e) => setProfile({ ...profile, accentColor: e.target.value })}
                    className="w-full h-12 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-300 p-3 rounded">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-900/50 border border-green-500 text-green-300 p-3 rounded">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 bg-[#FF00FF] text-white text-xl font-bold rounded hover:bg-[#CC00CC] disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes 🦀'}
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-[#008800]">
          <Link href="/signup" className="text-[#FF00FF] hover:underline">
            Don't have an account? Sign up!
          </Link>
        </div>
      </div>
    </div>
  );
}
