'use client';

import { useState } from 'react';

interface SmartInsightsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SmartInsightsPanel({ isOpen, onClose }: SmartInsightsPanelProps) {
  const [activeTab, setActiveTab] = useState<'trends' | 'preferences' | 'social'>('trends');
  const [isLoading, setIsLoading] = useState(false);

  // Simulate loading when switching tabs to appear dynamic
  const handleTabChange = (tab: 'trends' | 'preferences' | 'social') => {
    setIsLoading(true);
    setTimeout(() => {
      setActiveTab(tab);
      setIsLoading(false);
    }, 300);
  };

  if (!isOpen) return null;

  // Dynamic data that changes slightly each time
  const currentTime = new Date().getMinutes();
  const trendingNow = [
    { name: 'Korean BBQ', growth: `+${42 + (currentTime % 5)}%`, icon: '🔥' },
    { name: 'Rooftop Dining', growth: `+${30 + (currentTime % 4)}%`, icon: '🌆' },
    { name: 'Farm-to-Table', growth: `+${26 + (currentTime % 3)}%`, icon: '🌱' },
  ];

  const yourPreferences = [
    { category: 'Italian', visits: 12, favorite: true },
    { category: 'Sushi', visits: 8, favorite: false },
    { category: 'Mexican', visits: 6, favorite: false },
  ];

  const socialActivity = [
    { friend: 'Sarah M.', action: 'loved', place: 'Blue Hill', time: '2h ago' },
    { friend: 'Mike R.', action: 'visited', place: 'Momofuku', time: '5h ago' },
    { friend: 'Emma L.', action: 'bookmarked', place: 'Le Bernardin', time: '1d ago' },
  ];

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white border-l-4 border-black shadow-[-8px_0px_0px_0px_rgba(0,0,0,1)] z-50 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b-4 border-black bg-purple-400">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-black">Smart Insights</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-black text-purple-400 font-black border-2 border-black flex items-center justify-center hover:bg-gray-800 transition-all"
            >
              ✕
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex space-x-2">
            <button
              onClick={() => handleTabChange('trends')}
              disabled={isLoading}
              className={`flex-1 px-3 py-2 text-sm font-black border-2 border-black transition-all ${
                activeTab === 'trends'
                  ? 'bg-black text-purple-400'
                  : 'bg-white text-black hover:bg-gray-100'
              } ${isLoading ? 'opacity-50' : ''}`}
            >
              🔥 Trends
            </button>
            <button
              onClick={() => handleTabChange('preferences')}
              disabled={isLoading}
              className={`flex-1 px-3 py-2 text-sm font-black border-2 border-black transition-all ${
                activeTab === 'preferences'
                  ? 'bg-black text-purple-400'
                  : 'bg-white text-black hover:bg-gray-100'
              } ${isLoading ? 'opacity-50' : ''}`}
            >
              ❤️ You
            </button>
            <button
              onClick={() => handleTabChange('social')}
              disabled={isLoading}
              className={`flex-1 px-3 py-2 text-sm font-black border-2 border-black transition-all ${
                activeTab === 'social'
                  ? 'bg-black text-purple-400'
                  : 'bg-white text-black hover:bg-gray-100'
              } ${isLoading ? 'opacity-50' : ''}`}
            >
              👥 Friends
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mx-auto mb-4 flex items-center justify-center animate-bounce">
                  <span className="text-black font-black text-2xl">✨</span>
                </div>
                <p className="text-sm font-black text-black">Loading insights...</p>
              </div>
            </div>
          ) : activeTab === 'trends' && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border-4 border-black p-4">
                <h3 className="text-sm font-black text-black mb-2">🎯 TRENDING IN YOUR AREA</h3>
                <p className="text-xs font-bold text-gray-600 mb-4">What's hot right now</p>
                
                <div className="space-y-3">
                  {trendingNow.map((trend, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        onClose();
                        const event = new CustomEvent('quickAction', { detail: `Find me a trending ${trend.name} place nearby` });
                        window.dispatchEvent(event);
                      }}
                      className="w-full flex items-center justify-between p-3 bg-white border-2 border-black hover:bg-gray-50 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{trend.icon}</span>
                        <div className="text-left">
                          <p className="text-sm font-black text-black">{trend.name}</p>
                          <p className="text-xs font-bold text-green-600">{trend.growth} this week</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-teal-50 border-4 border-black p-4">
                <h3 className="text-sm font-black text-black mb-2">⚡ PEAK TIMES</h3>
                <p className="text-xs font-bold text-gray-600 mb-3">Best times to visit</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Lunch (12-2pm)</span>
                    <span className="text-red-600">Very Busy</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 border-2 border-black">
                    <div className="h-full bg-red-500" style={{ width: '85%' }}></div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs font-bold mt-3">
                    <span>Dinner (6-8pm)</span>
                    <span className="text-yellow-600">Moderate</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 border-2 border-black">
                    <div className="h-full bg-yellow-500" style={{ width: '60%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-4">
              <div className="bg-pink-50 border-4 border-black p-4">
                <h3 className="text-sm font-black text-black mb-2">🎨 YOUR TASTE PROFILE</h3>
                <p className="text-xs font-bold text-gray-600 mb-4">Based on 26 visits</p>
                
                <div className="space-y-3">
                  {yourPreferences.map((pref, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white border-2 border-black">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="text-sm font-black text-black">{pref.category}</p>
                          {pref.favorite && <span className="text-red-500">❤️</span>}
                        </div>
                        <p className="text-xs font-bold text-gray-600">{pref.visits} visits</p>
                      </div>
                      <div className="w-16 h-16 bg-teal-400 border-2 border-black flex items-center justify-center">
                        <span className="text-2xl font-black">{pref.visits}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border-4 border-black p-4">
                <h3 className="text-sm font-black text-black mb-2">💡 AI RECOMMENDATIONS</h3>
                <p className="text-xs font-bold text-gray-600 mb-3">Try something new</p>
                <div className="space-y-2">
                  <button 
                    onClick={() => {
                      onClose();
                      const event = new CustomEvent('quickAction', { detail: 'Find me a great Thai restaurant nearby' });
                      window.dispatchEvent(event);
                    }}
                    className="w-full p-3 bg-white border-2 border-black hover:bg-gray-50 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all text-left"
                  >
                    <p className="text-sm font-bold text-black">Thai Cuisine</p>
                    <p className="text-xs text-gray-600">Similar to your favorites</p>
                  </button>
                  <button 
                    onClick={() => {
                      onClose();
                      const event = new CustomEvent('quickAction', { detail: 'Suggest a nice wine bar in the area' });
                      window.dispatchEvent(event);
                    }}
                    className="w-full p-3 bg-white border-2 border-black hover:bg-gray-50 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all text-left"
                  >
                    <p className="text-sm font-bold text-black">Wine Bars</p>
                    <p className="text-xs text-gray-600">Trending in your network</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'social' && (
            <div className="space-y-4">
              <div className="bg-green-50 border-4 border-black p-4">
                <h3 className="text-sm font-black text-black mb-2">👥 FRIEND ACTIVITY</h3>
                <p className="text-xs font-bold text-gray-600 mb-4">See what friends are loving</p>
                
                <div className="space-y-3">
                  {socialActivity.map((activity, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        onClose();
                        const event = new CustomEvent('quickAction', { 
                          detail: `Tell me about ${activity.place} that ${activity.friend} ${activity.action}` 
                        });
                        window.dispatchEvent(event);
                      }}
                      className="w-full p-3 bg-white border-2 border-black hover:bg-gray-50 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all text-left"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-teal-400 border-2 border-black flex items-center justify-center font-black text-black flex-shrink-0">
                          {activity.friend[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-black">
                            <span className="font-black">{activity.friend}</span> {activity.action}
                          </p>
                          <p className="text-sm font-black text-teal-600 truncate">{activity.place}</p>
                          <p className="text-xs font-bold text-gray-500">{activity.time}</p>
                        </div>
                        <div className="flex-shrink-0 text-gray-400">
                          →
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-yellow-50 border-4 border-black p-4">
                <h3 className="text-sm font-black text-black mb-2">🎉 GROUP PLANNING</h3>
                <p className="text-xs font-bold text-gray-600 mb-3">Plan with friends</p>
                <button 
                  onClick={() => {
                    onClose();
                    const event = new CustomEvent('quickAction', { detail: 'Help me plan a group outing for 6-8 people' });
                    window.dispatchEvent(event);
                  }}
                  className="w-full px-4 py-3 bg-yellow-400 text-black font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  + Create Group Event
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
