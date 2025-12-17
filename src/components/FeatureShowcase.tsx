'use client';

import { Card } from '@/components/ui/Card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function FeatureShowcase() {
  const features = [
    {
      title: "INTELLIGENT MATCHING",
      description: "Advanced algorithms analyze thousands of data points to find your perfect match.",
      metric: "99.2% accuracy"
    },
    {
      title: "REAL-TIME DATA",
      description: "Live integration with Yelp's comprehensive database of millions of businesses.",
      metric: "10M+ venues"
    },
    {
      title: "INSTANT DECISIONS",
      description: "Get recommendations in seconds with our optimized decision engine.",
      metric: "<2s response"
    },
    {
      title: "PERSONALIZED AI",
      description: "Machine learning adapts to your preferences for increasingly better results.",
      metric: "Self-learning"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Product Manager",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
      quote: "This platform has transformed how our team makes vendor decisions. The AI recommendations are consistently spot-on."
    },
    {
      name: "Michael Rodriguez",
      role: "Business Analyst",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
      quote: "The time saved on research is incredible. What used to take hours now takes minutes with better outcomes."
    },
    {
      name: "Emily Watson",
      role: "Operations Director",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
      quote: "The data-driven approach gives us confidence in every decision. It's like having an expert consultant on demand."
    }
  ];

  return (
    <>
      {/* Features Section */}
      <div className="bg-yellow-400 border-t-4 border-b-4 border-black py-20 relative overflow-hidden">
        <div className="absolute top-8 left-16 w-20 h-20 bg-red-500 border-4 border-black opacity-20 rotate-45 pointer-events-none"></div>
        <div className="absolute bottom-8 right-16 w-24 h-24 bg-blue-500 border-4 border-black opacity-20 -rotate-12 pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-4xl md:text-6xl font-black text-black text-center mb-4">
            ENTERPRISE-GRADE FEATURES
          </h2>
          <p className="text-xl font-bold text-black text-center mb-16 opacity-80">
            Built for scale, designed for simplicity
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="text-center p-8 bg-white hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all duration-300"
              >
                <div className="inline-block px-4 py-2 bg-teal-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4">
                  <span className="text-black font-black text-sm">{feature.metric}</span>
                </div>
                <h3 className="text-lg font-black text-black mb-4">{feature.title}</h3>
                <p className="text-gray-700 font-bold">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-20 bg-[#f5f5f5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-6xl font-black text-black text-center mb-4">
            TRUSTED BY PROFESSIONALS
          </h2>
          <p className="text-xl font-bold text-gray-700 text-center mb-16">
            Join thousands of decision-makers who rely on our platform
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card 
                key={index} 
                className="p-8 bg-white hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="w-16 h-16 border-4 border-black">
                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                    <AvatarFallback className="bg-teal-400 text-black font-black">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="text-lg font-black text-black">{testimonial.name}</h4>
                    <p className="text-sm font-bold text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-700 font-bold italic">"{testimonial.quote}"</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-black border-t-4 border-b-4 border-black py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-5xl font-black text-yellow-400 mb-2">10M+</div>
              <div className="text-lg font-bold text-white">Venues Analyzed</div>
            </div>
            <div>
              <div className="text-5xl font-black text-teal-400 mb-2">99.2%</div>
              <div className="text-lg font-bold text-white">Accuracy Rate</div>
            </div>
            <div>
              <div className="text-5xl font-black text-red-400 mb-2">2s</div>
              <div className="text-lg font-bold text-white">Avg Response Time</div>
            </div>
            <div>
              <div className="text-5xl font-black text-purple-400 mb-2">50K+</div>
              <div className="text-lg font-bold text-white">Active Users</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}