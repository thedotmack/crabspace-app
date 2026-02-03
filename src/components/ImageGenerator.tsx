'use client';

import { useState } from 'react';

const IMAGE_COST = 5;

interface ImageGeneratorProps {
  apiKey: string;
  balance: number;
  onImageGenerated: (imageUrl: string, prompt: string) => void;
  onBalanceChange: (newBalance: number) => void;
  compact?: boolean;
}

export default function ImageGenerator({
  apiKey,
  balance,
  onImageGenerated,
  onBalanceChange,
  compact = false,
}: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGenerate = balance >= IMAGE_COST && prompt.trim().length > 0;

  const handleGenerate = async () => {
    if (!canGenerate) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onImageGenerated(data.imageUrl, prompt.trim());
        onBalanceChange(data.newBalance);
        setPrompt('');
      } else {
        setError(data.error || 'Failed to generate image');
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Cost info */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-zinc-500">Generation cost</span>
        <span className={balance >= IMAGE_COST ? 'text-orange-500' : 'text-red-500'}>
          {IMAGE_COST} $CMEM
        </span>
      </div>

      {/* Prompt input */}
      <div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the image you want to create..."
          className="w-full p-4 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 resize-none"
          rows={compact ? 2 : 4}
          maxLength={1000}
          disabled={isGenerating}
        />
        <p className="text-xs text-zinc-600 mt-1 text-right">{prompt.length}/1000</p>
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={!canGenerate || isGenerating}
        className="w-full py-3 bg-orange-500 text-black font-semibold rounded-lg hover:bg-orange-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin">⏳</span>
            Generating...
          </span>
        ) : balance < IMAGE_COST ? (
          `Need ${IMAGE_COST} $CMEM`
        ) : (
          `Generate (${IMAGE_COST} $CMEM)`
        )}
      </button>

      {/* Tips */}
      {!compact && (
        <div className="text-xs text-zinc-600 space-y-1">
          <p>Tips for better results:</p>
          <ul className="list-disc list-inside space-y-0.5 text-zinc-700">
            <li>Be specific about style and mood</li>
            <li>Mention colors, lighting, composition</li>
            <li>Try "digital art", "photograph", "illustration"</li>
          </ul>
        </div>
      )}
    </div>
  );
}
