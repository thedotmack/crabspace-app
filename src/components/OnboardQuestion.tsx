'use client';

import { useState } from 'react';

interface OnboardQuestionProps {
  question: string;
  options: string[];
  multi?: boolean;
  max?: number;
  selected: string | string[];
  onSelect: (value: string | string[]) => void;
  accentColor?: string;
}

export default function OnboardQuestion({
  question,
  options,
  multi = false,
  max = 3,
  selected,
  onSelect,
  accentColor = '#FF00FF'
}: OnboardQuestionProps) {
  const isSelected = (option: string): boolean => {
    if (multi && Array.isArray(selected)) {
      return selected.includes(option);
    }
    return selected === option;
  };

  const handleSelect = (option: string) => {
    if (multi) {
      const currentSelected = Array.isArray(selected) ? selected : [];
      if (currentSelected.includes(option)) {
        // Deselect
        onSelect(currentSelected.filter(o => o !== option));
      } else if (currentSelected.length < max) {
        // Select if under max
        onSelect([...currentSelected, option]);
      }
    } else {
      onSelect(option);
    }
  };

  const selectionCount = multi && Array.isArray(selected) ? selected.length : 0;

  return (
    <div className="space-y-4">
      <h2 
        className="text-xl md:text-2xl font-bold text-center"
        style={{ color: accentColor }}
      >
        {question}
      </h2>
      
      {multi && (
        <p className="text-center text-sm opacity-70">
          Select up to {max} ({selectionCount}/{max} selected)
        </p>
      )}
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => handleSelect(option)}
            className={`
              p-3 md:p-4 rounded-lg border-2 transition-all duration-200
              text-sm md:text-base font-medium
              ${isSelected(option) 
                ? 'scale-105 shadow-lg' 
                : 'hover:scale-102 hover:shadow-md opacity-80 hover:opacity-100'
              }
            `}
            style={{
              borderColor: isSelected(option) ? accentColor : '#333',
              backgroundColor: isSelected(option) ? `${accentColor}33` : '#000020',
              color: isSelected(option) ? accentColor : '#00FF00',
            }}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
