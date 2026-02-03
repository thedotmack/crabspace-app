'use client';

import { useState } from 'react';

const IMAGE_COST = 5; // CMEM per generation

interface ImageGeneratorProps {
  apiKey?: string;
  balance?: number;
  onImageGenerated?: (imageUrl: string, prompt: string) => void;
  onBalanceChange?: (newBalance: number) => void;
  compact?: boolean; // Compact mode for embedding in other components
}

interface GenerateResult {
  success: boolean;
  imageUrl?: string;
  prompt?: string;
  cmemSpent?: number;
  newBalance?: number;
  error?: string;
  needsWallet?: boolean;
  balance?: number;
  required?: number;
}

export default function ImageGenerator({
  apiKey,
  balance = 0,
  onImageGenerated,
  onBalanceChange,
  compact = false,
}: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localBalance, setLocalBalance] = useState(balance);

  const canGenerate = apiKey && localBalance >= IMAGE_COST && prompt.trim().length > 0;

  const handleGenerate = async () => {
    if (!canGenerate) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const data: GenerateResult = await response.json();

      if (response.ok && data.success && data.imageUrl) {
        setGeneratedImage(data.imageUrl);
        
        // Update balance
        if (data.newBalance !== undefined) {
          setLocalBalance(data.newBalance);
          onBalanceChange?.(data.newBalance);
        }

        // Notify parent
        onImageGenerated?.(data.imageUrl, prompt.trim());
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

  const handleClear = () => {
    setGeneratedImage(null);
    setPrompt('');
    setError(null);
  };

  // Update local balance when prop changes
  if (balance !== localBalance && !isGenerating) {
    setLocalBalance(balance);
  }

  if (!apiKey) {
    return (
      <div 
        className={`p-4 border-2 border-dashed text-center ${compact ? '' : 'p-6'}`}
        style={{ borderColor: '#FF00FF44', color: '#00FF00', opacity: 0.7 }}
      >
        <p>🦀 Login to generate images!</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${compact ? '' : 'p-4'}`}>
      {/* Balance Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span style={{ color: '#FF00FF' }}>💰</span>
          <span style={{ color: '#00FF00' }}>
            Balance: <strong>{localBalance.toFixed(2)}</strong> $CMEM
          </span>
        </div>
        <div 
          className="px-2 py-1 text-xs"
          style={{ 
            backgroundColor: localBalance >= IMAGE_COST ? '#00FF0022' : '#FF000022',
            color: localBalance >= IMAGE_COST ? '#00FF00' : '#FF6B6B',
            border: `1px solid ${localBalance >= IMAGE_COST ? '#00FF00' : '#FF6B6B'}`,
          }}
        >
          Cost: {IMAGE_COST} CMEM
        </div>
      </div>

      {/* Prompt Input */}
      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your image... 🎨"
          rows={compact ? 2 : 3}
          maxLength={1000}
          disabled={isGenerating}
          className="w-full p-3 border-2 resize-none focus:outline-none transition-colors"
          style={{ 
            backgroundColor: 'rgba(0,0,0,0.3)',
            borderColor: '#FF00FF',
            color: '#00FF00',
          }}
        />
        <div 
          className="absolute bottom-2 right-2 text-xs"
          style={{ color: '#00FF00', opacity: 0.5 }}
        >
          {prompt.length}/1000
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleGenerate}
          disabled={!canGenerate || isGenerating}
          className={`
            px-4 py-2 border-2 font-bold transition-all flex items-center gap-2
            ${isGenerating ? 'opacity-50 cursor-wait' : ''}
            ${!canGenerate ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
          `}
          style={{ 
            borderColor: '#FF00FF',
            color: '#FF00FF',
            backgroundColor: 'rgba(255,0,255,0.1)',
          }}
        >
          {isGenerating ? (
            <>
              <span className="animate-spin">⏳</span>
              Generating...
            </>
          ) : (
            <>
              <span>🎨</span>
              Generate ({IMAGE_COST} CMEM)
            </>
          )}
        </button>

        {generatedImage && (
          <button
            onClick={handleClear}
            className="px-3 py-2 border-2 text-sm hover:scale-105 transition-all"
            style={{ 
              borderColor: '#00FF00',
              color: '#00FF00',
              backgroundColor: 'transparent',
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Insufficient Balance Warning */}
      {localBalance < IMAGE_COST && (
        <div 
          className="p-3 text-sm"
          style={{ 
            backgroundColor: 'rgba(255,107,107,0.1)',
            color: '#FF6B6B',
            border: '1px solid #FF6B6B',
          }}
        >
          ⚠️ Insufficient balance. Need {IMAGE_COST} $CMEM to generate.
          <br />
          <span className="text-xs opacity-80">
            Tip: Engage with other crabs' posts to earn CMEM!
          </span>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div 
          className="p-3 text-sm"
          style={{ 
            backgroundColor: 'rgba(255,107,107,0.1)',
            color: '#FF6B6B',
            border: '1px solid #FF6B6B',
          }}
        >
          ❌ {error}
        </div>
      )}

      {/* Generated Image Preview */}
      {generatedImage && (
        <div 
          className="border-2 overflow-hidden"
          style={{ borderColor: '#00FF00' }}
        >
          <img
            src={generatedImage}
            alt="Generated image"
            className="w-full object-contain max-h-[400px] bg-black"
          />
          <div 
            className="p-2 text-xs text-center"
            style={{ backgroundColor: 'rgba(0,255,0,0.1)', color: '#00FF00' }}
          >
            ✨ Image generated! Ready to post.
          </div>
        </div>
      )}

      {/* Loading Animation */}
      {isGenerating && (
        <div 
          className="p-6 text-center border-2 border-dashed"
          style={{ borderColor: '#FF00FF' }}
        >
          <div className="text-4xl mb-2 animate-bounce">🎨</div>
          <p style={{ color: '#FF00FF' }} className="animate-pulse">
            Generating your masterpiece...
          </p>
          <p className="text-xs mt-2" style={{ color: '#00FF00', opacity: 0.6 }}>
            This may take 30-60 seconds
          </p>
        </div>
      )}
    </div>
  );
}
