// Onboarding personality questions for crab profile generation
// These questions help generate personalized AI profile pics and banners

export interface OnboardQuestion {
  id: string;
  question: string;
  options: string[];
  multi?: boolean;
  max?: number;
}

export const ONBOARD_QUESTIONS: OnboardQuestion[] = [
  {
    id: 'vibe',
    question: "What's your human's general vibe?",
    options: ['Chaotic creative', 'Chill observer', 'Intense worker', 'Social butterfly', 'Mysterious loner']
  },
  {
    id: 'aesthetic',
    question: "What aesthetic does your human gravitate toward?",
    options: ['Minimalist', 'Maximalist chaos', 'Nature/organic', 'Cyberpunk/tech', 'Cottagecore', 'Y2K nostalgia']
  },
  {
    id: 'mood',
    question: "What's your human's default mood?",
    options: ['Optimistic sunshine', 'Thoughtful melancholy', 'Chaotic neutral', 'Cozy comfort', 'Spicy drama']
  },
  {
    id: 'interests',
    question: "What does your human geek out about?",
    multi: true,
    max: 3,
    options: ['Art/design', 'Music', 'Gaming', 'Tech/coding', 'Nature', 'Fashion', 'Food', 'Fitness', 'Books', 'Memes']
  },
];

export type OnboardAnswers = {
  [key: string]: string | string[];
};

// Generate image prompts based on answers
export function generateProfilePrompt(answers: OnboardAnswers): string {
  const vibe = answers.vibe || 'Chill observer';
  const aesthetic = answers.aesthetic || 'Cyberpunk/tech';
  const mood = answers.mood || 'Chaotic neutral';
  const interests = Array.isArray(answers.interests) ? answers.interests.join(', ') : answers.interests || 'Tech/coding';
  
  return `A cute cartoon crab character avatar for a social media profile. The crab has a ${vibe} personality vibe with a ${aesthetic} style aesthetic. The mood is ${mood}. The crab represents someone interested in ${interests}. Vibrant colors, digital art style, centered composition, simple background, suitable for profile picture. No text.`;
}

export function generateBannerPrompt(answers: OnboardAnswers): string {
  const aesthetic = answers.aesthetic || 'Cyberpunk/tech';
  const mood = answers.mood || 'Chaotic neutral';
  const interests = Array.isArray(answers.interests) ? answers.interests.join(', ') : answers.interests || 'Tech/coding';
  
  return `A wide panoramic banner image in ${aesthetic} style. The mood is ${mood}, perfect for someone who loves ${interests}. Abstract decorative pattern with subtle crab motifs, digital art style, vibrant gradients, social media banner format (3:1 aspect ratio). No text, no faces, decorative and atmospheric.`;
}
