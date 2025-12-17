'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface ConversationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
}

export default function ConversationSidebar({ isOpen, onClose, onNewChat }: ConversationSidebarProps) {
  const { user } = useAuth();
  const [showSettings, setShowSettings] = useState(false);

  // Mock conversation history
  const conversations = [
    { id: 1, title: 'Italian restaurants in NYC', date: 'Today', preview: 'Found 3 great options...' },
    { id: 2, title: 'Hotels in Miami Beach', date: 'Yesterday', preview: 'Luxury beachfront hotels...' },
    { id: 3, title: 'Sushi under $30', date: '2 days ago', preview: 'Best affordable sushi...' },
    { id: 4, title: 'Spa recommendations', date: 'Last week', preview: 'Relaxing spa experiences...' },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-80 bg-white border-r-4 border-black shadow-[8px_0px_0px_0px_rgba(0,0,0,1)] z-50 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b-4 border-black bg-yellow-400">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-black">Pick For Me</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-black text-yellow-400 font-black border-2 border-black flex items-center justify-center hover:bg-gray-800 transition-all"
            >
              ✕
            </button>
          </div>
          
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full px-4 py-3 bg-teal-400 text-black font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
          >
            + New Chat
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <h3 className="text-sm font-black text-gray-600 mb-3">RECENT CONVERSATIONS</h3>
          {conversations.map((conv) => (
            <button
              key={conv.id}
              className="w-full text-left p-3 bg-white border-2 border-black hover:bg-gray-50 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <div className="flex items-start justify-between mb-1">
                <h4 className="text-sm font-bold text-black truncate flex-1">{conv.title}</h4>
                <span className="text-xs font-bold text-gray-500 ml-2">{conv.date}</span>
              </div>
              <p className="text-xs text-gray-600 truncate">{conv.preview}</p>
            </button>
          ))}
        </div>

        {/* User Profile & Settings */}
        <div className="border-t-4 border-black p-4 bg-gray-50">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-teal-400 border-2 border-black flex items-center justify-center font-black text-black">
              {user?.email?.[0].toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-black truncate">{user?.email || 'User'}</p>
              <p className="text-xs font-bold text-gray-600">Free Plan</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowSettings(true)}
            className="w-full px-4 py-2 bg-white text-black font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center space-x-2"
          >
            <span>⚙️</span>
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-[60] flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-md w-full max-h-[80vh] overflow-y-auto">
            {/* Settings Header */}
            <div className="p-6 border-b-4 border-black bg-yellow-400">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-black">Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="w-8 h-8 bg-black text-yellow-400 font-black flex items-center justify-center hover:bg-gray-800"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Settings Content */}
            <div className="p-6 space-y-6">
              {/* Profile Section */}
              <div>
                <h3 className="text-lg font-black text-black mb-3">Profile</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-3 py-2 border-2 border-black font-bold text-gray-600 bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Display Name</label>
                    <input
                      type="text"
                      placeholder="Your name"
                      className="w-full px-3 py-2 border-2 border-black font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <div>
                <h3 className="text-lg font-black text-black mb-3">Preferences</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 border-2 border-black cursor-pointer hover:bg-gray-50">
                    <span className="text-sm font-bold text-black">Email Notifications</span>
                    <input type="checkbox" className="w-5 h-5" defaultChecked />
                  </label>
                  <label className="flex items-center justify-between p-3 border-2 border-black cursor-pointer hover:bg-gray-50">
                    <span className="text-sm font-bold text-black">Save Search History</span>
                    <input type="checkbox" className="w-5 h-5" defaultChecked />
                  </label>
                  <label className="flex items-center justify-between p-3 border-2 border-black cursor-pointer hover:bg-gray-50">
                    <span className="text-sm font-bold text-black">Auto-detect Location</span>
                    <input type="checkbox" className="w-5 h-5" />
                  </label>
                </div>
              </div>

              {/* Plan */}
              <div>
                <h3 className="text-lg font-black text-black mb-3">Plan & Billing</h3>
                <div className="p-4 border-4 border-black bg-teal-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-black text-black">Current Plan</span>
                    <span className="px-2 py-1 bg-teal-400 text-black text-xs font-black border-2 border-black">FREE</span>
                  </div>
                  <p className="text-xs font-bold text-gray-600 mb-3">Unlimited searches • Basic features</p>
                  <button className="w-full px-4 py-2 bg-yellow-400 text-black font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                    Upgrade to Pro
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button className="w-full px-4 py-2 bg-white text-black font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                  Clear History
                </button>
                <button className="w-full px-4 py-2 bg-red-400 text-black font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
