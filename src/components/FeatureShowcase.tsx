'use client';

import { Card } from '@/components/ui/Card';

export function FeatureShowcase() {
  const features = [
    {
      icon: "🎯",
      title: "NO MORE CHOICE PARALYSIS",
      description: "Stop spending hours comparing options. We pick the best one instantly."
    },
    {
      icon: "🧠",
      title: "SMART AI DECISIONS",
      description: "Our AI considers hundreds of factors to make the perfect choice for you."
    },
    {
      icon: "⚡",
      title: "INSTANT RESULTS",
      description: "Get your answer in seconds, not hours of research."
    },
    {
      icon: "🎉",
      title: "ALWAYS SATISFIED",
      description: "Our recommendations are so good, you'll wonder why you ever decided for yourself."
    }
  ];

  return (
    <div className="bg-yellow-400 border-t-4 border-b-4 border-black py-20 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-8 left-16 w-20 h-20 bg-red-500 border-4 border-black opacity-20 rotate-45 pointer-events-none"></div>
      <div className="absolute bottom-8 right-16 w-24 h-24 bg-blue-500 border-4 border-black opacity-20 -rotate-12 pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <h2 className="text-4xl md:text-6xl font-black text-black text-center mb-16">
          WHY PEOPLE LOVE US
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="text-center p-8 bg-white hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all duration-300"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-black text-black mb-4">{feature.title}</h3>
              <p className="text-gray-700 font-bold">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}