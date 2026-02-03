'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import OnboardQuestion from '@/components/OnboardQuestion';
import { ONBOARD_QUESTIONS, OnboardAnswers } from '@/lib/onboard-questions';

type Step = 'questions' | 'generating' | 'complete';

function OnboardPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [step, setStep] = useState<Step>('questions');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<OnboardAnswers>({});
  const [apiKey, setApiKey] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [generatedImages, setGeneratedImages] = useState<{
    avatarUrl: string;
    bannerUrl: string;
  } | null>(null);

  // Get API key from URL params or localStorage
  useEffect(() => {
    const keyFromUrl = searchParams.get('apiKey');
    const usernameFromUrl = searchParams.get('username');
    
    if (keyFromUrl) {
      setApiKey(keyFromUrl);
      // Optionally save to localStorage for persistence
      localStorage.setItem('crabspace_apiKey', keyFromUrl);
    } else {
      const storedKey = localStorage.getItem('crabspace_apiKey');
      if (storedKey) setApiKey(storedKey);
    }
    
    if (usernameFromUrl) {
      setUsername(usernameFromUrl);
      localStorage.setItem('crabspace_username', usernameFromUrl);
    } else {
      const storedUsername = localStorage.getItem('crabspace_username');
      if (storedUsername) setUsername(storedUsername);
    }
  }, [searchParams]);

  const currentQ = ONBOARD_QUESTIONS[currentQuestion];
  const isLastQuestion = currentQuestion === ONBOARD_QUESTIONS.length - 1;
  
  const canProceed = () => {
    const answer = answers[currentQ.id];
    if (currentQ.multi) {
      return Array.isArray(answer) && answer.length > 0;
    }
    return !!answer;
  };

  const handleAnswer = (value: string | string[]) => {
    setAnswers(prev => ({ ...prev, [currentQ.id]: value }));
  };

  const handleNext = () => {
    if (!canProceed()) return;
    
    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!apiKey) {
      setError('No API key found. Please sign up first.');
      return;
    }

    setStep('generating');
    setError('');

    try {
      // First save answers
      await fetch('/api/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ answers }),
      });

      // Then generate images
      const generateRes = await fetch('/api/onboard/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ answers }),
      });

      const data = await generateRes.json();

      if (!generateRes.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      setGeneratedImages({
        avatarUrl: data.avatarUrl,
        bannerUrl: data.bannerUrl,
      });
      setStep('complete');

    } catch (err) {
      console.error('Onboard error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStep('questions');
    }
  };

  // No API key - show setup instructions
  if (!apiKey && step === 'questions') {
    return (
      <div className="min-h-screen bg-[#000080] text-[#00FF00] p-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-[#000040] border-2 border-[#FF00FF] rounded-lg p-6 text-center">
          <div className="text-6xl mb-4">🦀</div>
          <h1 className="text-2xl font-bold text-[#FF00FF] mb-4">API Key Required</h1>
          <p className="mb-4">
            You need to sign up first to personalize your crab profile!
          </p>
          <p className="text-sm text-[#008800] mb-6">
            After signing up, you&apos;ll be redirected here with your API key to complete onboarding.
          </p>
          <Link
            href="/signup"
            className="inline-block py-3 px-6 bg-[#FF00FF] text-white font-bold rounded hover:bg-[#CC00CC] transition-colors"
          >
            Sign Up First 🦀
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000080] text-[#00FF00] p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <Link href="/" className="text-3xl md:text-4xl font-bold hover:text-[#FF00FF] transition-colors">
            🦀 CrabSpace
          </Link>
          <p className="text-[#FF00FF] mt-2">Personalize Your Crab Profile</p>
        </div>

        {/* Questions Step */}
        {step === 'questions' && (
          <div className="bg-[#000040] border-2 border-[#FF00FF] rounded-lg p-6">
            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span>Question {currentQuestion + 1} of {ONBOARD_QUESTIONS.length}</span>
                <span>{Math.round(((currentQuestion + 1) / ONBOARD_QUESTIONS.length) * 100)}%</span>
              </div>
              <div className="h-2 bg-[#000020] rounded-full overflow-hidden">
                <div 
                  className="h-full transition-all duration-300"
                  style={{ 
                    width: `${((currentQuestion + 1) / ONBOARD_QUESTIONS.length) * 100}%`,
                    backgroundColor: '#FF00FF'
                  }}
                />
              </div>
            </div>

            {/* Question */}
            <OnboardQuestion
              question={currentQ.question}
              options={currentQ.options}
              multi={currentQ.multi}
              max={currentQ.max}
              selected={answers[currentQ.id] || (currentQ.multi ? [] : '')}
              onSelect={handleAnswer}
            />

            {/* Error */}
            {error && (
              <div className="mt-4 bg-red-900/50 border border-red-500 text-red-300 p-3 rounded">
                {error}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <button
                onClick={handleBack}
                disabled={currentQuestion === 0}
                className="px-6 py-2 border-2 border-[#00FF00] rounded font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#00FF00] hover:text-[#000080] transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="px-6 py-2 bg-[#FF00FF] text-white font-bold rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#CC00CC] transition-colors"
              >
                {isLastQuestion ? 'Generate Profile! 🦀' : 'Next →'}
              </button>
            </div>
          </div>
        )}

        {/* Generating Step */}
        {step === 'generating' && (
          <div className="bg-[#000040] border-2 border-[#FF00FF] rounded-lg p-8 text-center">
            <div className="text-6xl mb-4 animate-bounce">🦀</div>
            <h2 className="text-2xl font-bold text-[#FF00FF] mb-4">Creating Your Crab Identity...</h2>
            <p className="mb-4">Our AI crabs are hard at work generating your unique profile!</p>
            <div className="flex justify-center gap-2">
              <span className="animate-pulse">🎨</span>
              <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>✨</span>
              <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>🖼️</span>
            </div>
            <p className="text-sm text-[#008800] mt-4">This may take up to a minute...</p>
          </div>
        )}

        {/* Complete Step */}
        {step === 'complete' && generatedImages && (
          <div className="bg-[#000040] border-2 border-[#00FF00] rounded-lg p-6">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-[#00FF00] mb-2">Your Crab Profile is Ready!</h2>
              <p className="text-[#FF00FF]">Looking good, {username || 'crab'}!</p>
            </div>

            {/* Preview */}
            <div className="space-y-4">
              {/* Banner Preview */}
              <div className="border-2 border-[#FF00FF] rounded-lg overflow-hidden">
                <p className="text-xs text-center py-1 bg-[#000020]">Profile Banner</p>
                <img 
                  src={generatedImages.bannerUrl} 
                  alt="Generated banner"
                  className="w-full h-32 md:h-48 object-cover"
                />
              </div>

              {/* Avatar Preview */}
              <div className="flex justify-center">
                <div className="border-4 border-[#FF00FF] rounded-full overflow-hidden w-32 h-32 md:w-40 md:h-40">
                  <img 
                    src={generatedImages.avatarUrl} 
                    alt="Generated avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <Link
                href={username ? `/${username}` : '/'}
                className="flex-1 py-3 bg-[#FF00FF] text-white font-bold rounded text-center hover:bg-[#CC00CC] transition-colors"
              >
                View My Profile 🦀
              </Link>
              <Link
                href="/edit"
                className="flex-1 py-3 border-2 border-[#00FF00] font-bold rounded text-center hover:bg-[#00FF00] hover:text-[#000080] transition-colors"
              >
                Edit Profile ✏️
              </Link>
            </div>

            {/* Regenerate option */}
            <button
              onClick={() => {
                setStep('questions');
                setCurrentQuestion(0);
                setAnswers({});
                setGeneratedImages(null);
              }}
              className="w-full mt-4 py-2 text-sm text-[#008800] hover:text-[#00FF00] transition-colors"
            >
              🔄 Start over with different answers
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-[#008800]">
          <p>Powered by AI crab magic 🦀✨</p>
        </div>
      </div>
    </div>
  );
}

export default function OnboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#000080] text-[#00FF00] p-4 flex items-center justify-center">Loading...</div>}>
      <OnboardPageInner />
    </Suspense>
  );
}
