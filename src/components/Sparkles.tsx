'use client';

import { useEffect, useState } from 'react';

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
}

interface SparklesProps {
  color?: string;
  count?: number;
  minSize?: number;
  maxSize?: number;
}

export default function Sparkles({ 
  color = '#FFD700', 
  count = 30,
  minSize = 8,
  maxSize = 20
}: SparklesProps) {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    const generateSparkle = (id: number): Sparkle => ({
      id,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: minSize + Math.random() * (maxSize - minSize),
      color,
      rotation: Math.random() * 360
    });

    setSparkles(Array.from({ length: count }, (_, i) => generateSparkle(i)));

    // Regenerate sparkles periodically for animation
    const interval = setInterval(() => {
      setSparkles(prev => 
        prev.map(s => 
          Math.random() > 0.8 
            ? generateSparkle(s.id) 
            : s
        )
      );
    }, 500);

    return () => clearInterval(interval);
  }, [color, count, minSize, maxSize]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {sparkles.map((sparkle) => (
        <div
          key={sparkle.id}
          className="absolute animate-sparkle"
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
            width: sparkle.size,
            height: sparkle.size,
            transform: `rotate(${sparkle.rotation}deg)`,
            animationDelay: `${Math.random() * 2}s`
          }}
        >
          <svg viewBox="0 0 24 24" fill={sparkle.color}>
            <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
          </svg>
        </div>
      ))}
    </div>
  );
}

// Smaller inline sparkle for text decoration
export function InlineSparkle({ color = '#FFD700' }: { color?: string }) {
  return (
    <span className="inline-block w-4 h-4 animate-twinkle">
      <svg viewBox="0 0 24 24" fill={color}>
        <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
      </svg>
    </span>
  );
}

// Glitter text wrapper
export function GlitterText({ children, color = '#FFD700' }: { children: React.ReactNode; color?: string }) {
  return (
    <span className="relative inline-block">
      <span className="relative z-10">{children}</span>
      <span 
        className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white to-transparent opacity-50"
        style={{ mixBlendMode: 'overlay' }}
      />
    </span>
  );
}
