'use client';

import { useState, useEffect } from 'react';

export default function VisitorCounter() {
  const [count, setCount] = useState(1337);
  
  useEffect(() => {
    // Fake but fun - increment by random amount each "visit"
    const base = 1337;
    const sessionVisits = Math.floor(Math.random() * 100) + 1;
    setCount(base + sessionVisits);
  }, []);
  
  // Format number as retro counter digits
  const digits = count.toString().padStart(6, '0').split('');
  
  return (
    <div className="inline-flex flex-col items-center">
      <p className="text-xs mb-1" style={{ color: '#FF00FF' }}>
        🌟 VISITORS 🌟
      </p>
      <div 
        className="flex gap-px border-2 p-1"
        style={{ 
          borderColor: '#00FF00',
          backgroundColor: '#000',
        }}
      >
        {digits.map((digit, i) => (
          <div
            key={i}
            className="w-6 h-8 flex items-center justify-center font-mono text-lg font-bold"
            style={{
              backgroundColor: '#001100',
              color: '#00FF00',
              textShadow: '0 0 5px #00FF00',
              border: '1px solid #004400',
            }}
          >
            {digit}
          </div>
        ))}
      </div>
      <p className="text-xs mt-1 blink" style={{ color: '#FF00FF' }}>
        ✨ YOU ARE VISITOR #{count} ✨
      </p>
    </div>
  );
}
