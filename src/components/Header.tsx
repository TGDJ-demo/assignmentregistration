import React from 'react';
import { LayoutDashboard, Sparkles, ShieldCheck, Zap } from 'lucide-react';

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
  registrationCount,
  isAdminAuthorized,
}) => {
  return (
    <header className="bg-[#0A0D14]/75 border-b border-white/10 sticky top-0 z-40 backdrop-blur-xl shadow-lg shadow-black/20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand & Event Title */}
          <div 
            className="flex items-center space-x-3 cursor-pointer min-w-0 group" 
            onClick={() => setActiveTab('register')}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500/20 via-purple-500/15 to-pink-500/15 border border-white/15 rounded-xl flex items-center justify-center text-indigo-300 shrink-0 shadow-inner group-hover:border-indigo-400/40 transition-all">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-300 group-hover:text-pink-300 transition-colors" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h1 className="text-sm sm:text-base font-bold font-heading tracking-tight truncate text-white">
                  TestGrid Certification
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-white/5 text-indigo-200 border border-white/10 shrink-0 backdrop-blur-md">
                  <ShieldCheck className="w-3 h-3 mr-1 text-indigo-300" />
                  CoTester AI
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400 truncate">
                Summit 2026 Session Booking
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1 p-1 rounded-xl border border-white/10 bg-[#121829]/60 backdrop-blur-md shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('register')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-300" />
              <span>Register</span>
            </button>

            {isAdminAuthorized && (
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin</span>
                {registrationCount > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                    activeTab === 'admin'
                      ? 'bg-indigo-950 text-indigo-200'
                      : 'bg-white/10 text-indigo-300'
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
