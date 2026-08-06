import React from 'react';
import { Calendar, LayoutDashboard, Sparkles, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  activeTab: 'register' | 'admin';
  setActiveTab: (tab: 'register' | 'admin') => void;
  eventTitle: string;
  eventSubtitle: string;
  registrationCount: number;
  isAdminAuthorized: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  eventTitle,
  eventSubtitle,
  registrationCount,
  isAdminAuthorized,
}) => {
  return (
    <header className="bg-white border-b border-zinc-200/80 sticky top-0 z-40 backdrop-blur-md bg-white/90">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand & Event Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('register')}>
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
                  {eventTitle}
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3 mr-1 text-green-600" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-medium line-clamp-1">
                {eventSubtitle}
              </p>
            </div>
          </div>

          {/* Navigation Tabs (Admin visible ONLY when damanjeet@testgrid.io is entered) */}
          <div className="flex items-center space-x-1.5 p-1 bg-zinc-100 rounded-2xl border border-zinc-200/60">
            <button
              onClick={() => setActiveTab('register')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold text-xs transition-all ${
                activeTab === 'register'
                  ? 'bg-white text-blue-600 shadow-sm border border-zinc-200/60'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Register</span>
            </button>

            {isAdminAuthorized && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold text-xs transition-all animate-fadeIn ${
                  activeTab === 'admin'
                    ? 'bg-white text-blue-600 shadow-sm border border-zinc-200/60'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Admin & Sheets</span>
                {registrationCount > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                    activeTab === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-zinc-200 text-zinc-700'
                  }`}>
                    {registrationCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
