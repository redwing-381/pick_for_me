'use client';

import { useState } from 'react';
import type { UserPreferences } from '@/lib/types';

interface OnboardingQuestionnaireProps {
  userName: string;
  onComplete: (preferences: UserPreferences) => void;
}

export default function OnboardingQuestionnaire({ userName, onComplete }: OnboardingQuestionnaireProps) {
  const [step, setStep] = useState(0);
  const [preferences, setPreferences] = useState<Partial<UserPreferences>>({
    cuisinePreferences: [],
    priceRange: undefined,
    dietaryRestrictions: [],
    ambiance: [],
    distance: undefined
  });

  const questions = [
    {
      id: 'cuisines',
      question: `Nice to meet you, ${userName}! 🎉\nWhat types of cuisine do you enjoy?`,
      subtitle: 'Select all that apply',
      type: 'multi-select',
      options: [
        { value: 'italian', label: '🍝 Italian', color: 'bg-red-400' },
        { value: 'japanese', label: '🍱 Japanese', color: 'bg-pink-400' },
        { value: 'mexican', label: '🌮 Mexican', color: 'bg-yellow-400' },
        { value: 'chinese', label: '🥡 Chinese', color: 'bg-orange-400' },
        { value: 'indian', label: '🍛 Indian', color: 'bg-purple-400' },
        { value: 'american', label: '🍔 American', color: 'bg-blue-400' },
        { value: 'thai', label: '🍜 Thai', color: 'bg-green-400' },
        { value: 'mediterranean', label: '🥙 Mediterranean', color: 'bg-teal-400' }
      ]
    },
    {
      id: 'price',
      question: 'What\'s your typical budget per person?',
      subtitle: 'Choose one',
      type: 'single-select',
      options: [
        { value: '$', label: '$ Budget-Friendly', subtitle: 'Under $15', color: 'bg-green-400' },
        { value: '$$', label: '$$ Moderate', subtitle: '$15-$30', color: 'bg-yellow-400' },
        { value: '$$$', label: '$$$ Upscale', subtitle: '$30-$60', color: 'bg-orange-400' },
        { value: '$$$$', label: '$$$$ Fine Dining', subtitle: '$60+', color: 'bg-purple-400' }
      ]
    },
    {
      id: 'dietary',
      question: 'Any dietary preferences or restrictions?',
      subtitle: 'Select all that apply',
      type: 'multi-select',
      options: [
        { value: 'vegetarian', label: '🥗 Vegetarian', color: 'bg-green-400' },
        { value: 'vegan', label: '🌱 Vegan', color: 'bg-teal-400' },
        { value: 'gluten-free', label: '🌾 Gluten-Free', color: 'bg-yellow-400' },
        { value: 'halal', label: '🕌 Halal', color: 'bg-blue-400' },
        { value: 'kosher', label: '✡️ Kosher', color: 'bg-purple-400' },
        { value: 'none', label: '✨ No Restrictions', color: 'bg-gray-300' }
      ]
    },
    {
      id: 'ambiance',
      question: 'What kind of atmosphere do you prefer?',
      subtitle: 'Select all that apply',
      type: 'multi-select',
      options: [
        { value: 'casual', label: '👕 Casual & Relaxed', color: 'bg-blue-400' },
        { value: 'romantic', label: '💕 Romantic', color: 'bg-pink-400' },
        { value: 'family', label: '👨‍👩‍👧‍👦 Family-Friendly', color: 'bg-yellow-400' },
        { value: 'trendy', label: '✨ Trendy & Hip', color: 'bg-purple-400' },
        { value: 'quiet', label: '🤫 Quiet & Intimate', color: 'bg-teal-400' },
        { value: 'lively', label: '🎉 Lively & Energetic', color: 'bg-orange-400' }
      ]
    },
    {
      id: 'distance',
      question: 'How far are you willing to travel?',
      subtitle: 'Choose one',
      type: 'single-select',
      options: [
        { value: '1', label: '🚶 Walking Distance', subtitle: 'Within 1 mile', color: 'bg-green-400' },
        { value: '3', label: '🚗 Short Drive', subtitle: 'Within 3 miles', color: 'bg-yellow-400' },
        { value: '10', label: '🚙 Anywhere Nearby', subtitle: 'Within 10 miles', color: 'bg-orange-400' },
        { value: '25', label: '🛣️ Worth the Trip', subtitle: 'Within 25 miles', color: 'bg-purple-400' }
      ]
    }
  ];

  const currentQuestion = questions[step];

  const handleOptionClick = (value: string) => {
    const question = questions[step];
    
    if (question.type === 'single-select') {
      // Single select - replace value
      if (question.id === 'price') {
        setPreferences({ ...preferences, priceRange: value as any });
      } else if (question.id === 'distance') {
        setPreferences({ ...preferences, distance: parseInt(value) });
      }
    } else {
      // Multi-select - toggle value
      if (question.id === 'cuisines') {
        const current = preferences.cuisinePreferences || [];
        const newValue = current.includes(value)
          ? current.filter(v => v !== value)
          : [...current, value];
        setPreferences({ ...preferences, cuisinePreferences: newValue });
      } else if (question.id === 'dietary') {
        const current = preferences.dietaryRestrictions || [];
        const newValue = current.includes(value)
          ? current.filter(v => v !== value)
          : [...current, value];
        setPreferences({ ...preferences, dietaryRestrictions: newValue });
      } else if (question.id === 'ambiance') {
        const current = preferences.ambiance || [];
        const newValue = current.includes(value)
          ? current.filter(v => v !== value)
          : [...current, value];
        setPreferences({ ...preferences, ambiance: newValue });
      }
    }
  };

  const isOptionSelected = (value: string) => {
    const question = questions[step];
    if (question.id === 'cuisines') {
      return preferences.cuisinePreferences?.includes(value) || false;
    } else if (question.id === 'price') {
      return preferences.priceRange === value;
    } else if (question.id === 'dietary') {
      return preferences.dietaryRestrictions?.includes(value) || false;
    } else if (question.id === 'ambiance') {
      return preferences.ambiance?.includes(value) || false;
    } else if (question.id === 'distance') {
      return preferences.distance === parseInt(value);
    }
    return false;
  };

  const canProceed = () => {
    const question = questions[step];
    if (question.type === 'single-select') {
      if (question.id === 'price') return !!preferences.priceRange;
      if (question.id === 'distance') return preferences.distance !== undefined;
    } else {
      if (question.id === 'cuisines') return (preferences.cuisinePreferences?.length || 0) > 0;
      if (question.id === 'dietary') return (preferences.dietaryRestrictions?.length || 0) > 0;
      if (question.id === 'ambiance') return (preferences.ambiance?.length || 0) > 0;
    }
    return false;
  };

  const handleNext = () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      // Complete onboarding
      onComplete(preferences as UserPreferences);
    }
  };

  const handleSkip = () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(preferences as UserPreferences);
    }
  };

  const progress = ((step + 1) / questions.length) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b-4 border-black bg-yellow-400">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-black text-black">Let's Get to Know You!</h2>
              <p className="text-sm font-bold text-black">Question {step + 1} of {questions.length}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-black">{step + 1}/{questions.length}</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full h-4 bg-white border-2 border-black">
            <div 
              className="h-full bg-teal-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question Content */}
        <div className="p-8">
          <h3 className="text-2xl font-black text-black mb-2 whitespace-pre-line">
            {currentQuestion.question}
          </h3>
          <p className="text-sm font-bold text-gray-600 mb-6">{currentQuestion.subtitle}</p>

          {/* Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {currentQuestion.options.map((option) => {
              const selected = isOptionSelected(option.value);
              return (
                <button
                  key={option.value}
                  onClick={() => handleOptionClick(option.value)}
                  className={`p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all text-left ${
                    selected 
                      ? `${option.color} scale-105` 
                      : 'bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-base font-black text-black mb-1">{option.label}</p>
                      {'subtitle' in option && option.subtitle && (
                        <p className="text-xs font-bold text-gray-700">{option.subtitle}</p>
                      )}
                    </div>
                    {selected && (
                      <div className="w-8 h-8 bg-black border-2 border-black flex items-center justify-center ml-3">
                        <span className="text-white font-black text-lg">✓</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Navigation Buttons */}
          <div className="flex space-x-3">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 bg-white text-black font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
              >
                ← Back
              </button>
            )}
            <button
              onClick={handleSkip}
              className="px-6 py-3 bg-gray-200 text-black font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
            >
              Skip
            </button>
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1 px-6 py-3 bg-teal-400 text-black font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-1 active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all"
            >
              {step < questions.length - 1 ? 'Next →' : 'Start Exploring! 🚀'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
