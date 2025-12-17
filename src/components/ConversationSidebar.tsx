'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LogoutButton } from '@/components/auth/LogoutButton';

interface ConversationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
}

export default function ConversationSidebar({ isOpen, onClose, onNewChat }: ConversationSidebarProps) {
  const { user } = useAuth();
  const [showSettings, setShowSettings] = useState(false);

  // Dynamic conversation history - includes current session
  const currentTime = new Date();
  const conversations = [
    { 
      id: 1, 
      title: 'Current Session', 
      date: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
      preview: 'Active conversation...',
      active: true 
    },
    { id: 2, title: 'Italian restaurants in NYC', date: 'Today', preview: 'Found 3 great options...' },
    { id: 3, title: 'Hotels in Miami Beach', date: 'Yesterday', preview: 'Luxury beachfront hotels...' },
    { id: 4, title: 'Sushi under $30', date: '2 days ago', preview: 'Best affordable sushi...' },
    { id: 5, title: 'Spa recommendations', date: 'Last week', preview: 'Relaxing spa experiences...' },
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
      <div className="fixed left-0 top-0 h-full w-full sm:w-80 bg-white border-r-4 border-black shadow-[8px_0px_0px_0px_rgba(0,0,0,1)] z-50 flex flex-col">
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
            className="w-full px-4 py-3 bg-teal-400 text-black font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>NEW CHAT</span>
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <h3 className="text-sm font-black text-gray-600 mb-3">RECENT CONVERSATIONS</h3>
          {conversations.map((conv) => (
            <button
              key={conv.id}
              className={`w-full text-left p-3 border-2 border-black hover:bg-gray-50 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all ${
                conv.active ? 'bg-teal-50 border-teal-600' : 'bg-white'
              }`}
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center space-x-2 flex-1">
                  <h4 className="text-sm font-bold text-black truncate">{conv.title}</h4>
                  {conv.active && (
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  )}
                </div>
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
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>SETTINGS</span>
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

              {/* Actions */}
              <div className="space-y-2">
                <button 
                  onClick={() => {
                    // Show confirmation toast
                    alert('History cleared! (Demo mode)');
                  }}
                  className="w-full px-4 py-2 bg-white text-black font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  Clear History
                </button>
                <LogoutButton 
                  variant="danger"
                  size="md"
                  showConfirmation={true}
                  redirectTo="/"
                  className="w-full"
                >
                  <span>SIGN OUT</span>
                </LogoutButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
