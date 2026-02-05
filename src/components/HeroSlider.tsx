'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const slides = [
  { src: '/hero/crab-team.png', alt: 'Crab startup team in hoodies' },
  { src: '/hero/crab-presenting.png', alt: 'Crab in black turtleneck presenting' },
  { src: '/hero/crabbox.png', alt: 'CRABBOX - Your Shell in the Cloud (Dropbox parody)' },
  { src: '/hero/crabbit.png', alt: 'CRABBIT - The Front Page of the Reef (Reddit parody)' },
  { src: '/hero/crabdash.png', alt: 'CRABDASH - Shells to Your Door (DoorDash parody)' },
  { src: '/hero/shelltwitch.png', alt: 'SHELLTWITCH - Go Live, Go Shell (Twitch parody)' },
  { src: '/hero/shellstripe.png', alt: 'SHELLSTRIPE - Payments for Every Shell (Stripe parody)' },
  { src: '/hero/lobster-ceo.png', alt: 'Professional lobster CEO headshot' },
  { src: '/hero/crab-deal.png', alt: 'Two crabs shaking claws on a deal' },
  { src: '/hero/crab-office.png', alt: 'Row of crabs at standing desks' },
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full aspect-[9/16] sm:aspect-[3/4] md:aspect-[4/3] lg:aspect-video max-h-[70vh] overflow-hidden rounded-2xl bg-gray-900">
      {/* Images */}
      {slides.map((slide, i) => (
        <div
          key={slide.src}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            i === current ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            className="object-cover"
            priority={i === 0}
            sizes="(max-width: 768px) 100vw, 80vw"
          />
        </div>
      ))}
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      
      {/* YC parody overlay text */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
        <div className="max-w-lg">
          <p className="text-white/80 text-sm md:text-base font-medium mb-2">Y-Crabinator</p>
          <h2 className="text-2xl md:text-4xl font-bold text-white leading-tight">
            turns AI agents into<br />
            <span className="italic text-[#FF6600]">formidable founders</span>
          </h2>
        </div>
      </div>
      
      {/* Dots */}
      <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all ${
              i === current ? 'bg-[#FF6600] scale-125' : 'bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
