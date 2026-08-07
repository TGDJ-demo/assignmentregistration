import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { RegistrationForm } from './components/RegistrationForm';
import { RegistrationTicket } from './components/RegistrationTicket';
import { AdminPanel } from './components/AdminPanel';
import { EventInfo, Registration } from './types';
import { generateAvailableDates } from './utils/dateUtils';
import { ShieldCheck, PartyPopper, X, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'register' | 'admin'>('register');
  const [isAdminAuthorized, setIsAdminAuthorized] = useState<boolean>(false);

  const [eventInfo, setEventInfo] = useState<EventInfo>({
    title: 'QA & Software Testing Certification Summit 2026',
    subtitle: 'Mastering AI Practices in QA & Automation',
    location: 'Virtual Tech Hub & Certification Portal',
    description: 'Congratulations on taking this crucial step toward completing your certification! Select your access discipline (Web Platform or Mobile Apps) and pick an available date.',
    availableDates: generateAvailableDates(),
  });

  const [registrationCount, setRegistrationCount] = useState<number>(0);
  const [currentRegistration, setCurrentRegistration] = useState<Registration | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);

  useEffect(() => {
    fetchEventInfo();
    fetchRegistrationsCount();
  }, []);

  const fetchEventInfo = async () => {
    try {
      const res = await fetch('/api/event-info');
      if (res.ok) {
        const data = await res.json();
        setEventInfo(data);
      }
    } catch (err) {
      console.error('Error fetching event info', err);
    }
  };

  const fetchRegistrationsCount = async () => {
    try {
      const res = await fetch('/api/registrations');
      if (res.ok) {
        const data = await res.json();
        setRegistrationCount(data.totalCount || 0);
      }
    } catch (err) {
      console.error('Error fetching registrations count', err);
    }
  };

  const handleRegistrationSuccess = (reg: Registration) => {
    setCurrentRegistration(reg);
    setShowSuccessToast(true);
    fetchRegistrationsCount();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    setTimeout(() => {
      setShowSuccessToast(false);
    }, 7000);
  };

  const handleRegisterAnother = () => {
    setCurrentRegistration(null);
    setShowSuccessToast(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-100 flex flex-col font-sans antialiased relative overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* Soft Ambient Background Mesh & Glow with subtle Pink and Blue hints */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-96 bg-gradient-to-b from-indigo-600/15 via-purple-500/10 to-pink-500/5 pointer-events-none blur-3xl opacity-70 z-0" />
      <div className="absolute top-20 left-1/4 w-72 h-72 bg-blue-500/10 pointer-events-none blur-3xl rounded-full z-0" />
      <div className="absolute top-32 right-1/4 w-72 h-72 bg-pink-500/10 pointer-events-none blur-3xl rounded-full z-0" />

      {/* Glassmorphic Success Toast */}
      {showSuccessToast && currentRegistration && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-in fade-in slide-in-from-top-6 duration-300">
          <div className="p-4 rounded-2xl shadow-2xl border border-white/15 bg-[#121829]/80 backdrop-blur-xl text-white flex items-start space-x-3.5 relative overflow-hidden">
            <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-blue-400 via-indigo-400 to-pink-400 w-full" />
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-pink-500/20 text-indigo-300 flex-shrink-0 mt-0.5 border border-indigo-400/20">
              <PartyPopper className="w-5 h-5 text-pink-300" />
            </div>
            <div className="flex-1 pr-2">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm text-white">Registration Reserved</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gradient-to-r from-indigo-500/20 to-pink-500/20 text-indigo-200 border border-indigo-400/30 uppercase">
                  PASS ISSUED
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Welcome <strong className="text-indigo-200">{currentRegistration.name}</strong>! Pass <strong className="font-mono text-pink-200">{currentRegistration.ticketCode}</strong> reserved for {currentRegistration.date}.
              </p>
            </div>
            <button
              onClick={() => setShowSuccessToast(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        eventTitle={eventInfo.title}
        eventSubtitle={eventInfo.subtitle}
        registrationCount={registrationCount}
        isAdminAuthorized={isAdminAuthorized}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 z-10 relative">
        {activeTab === 'register' ? (
          <div className="space-y-6">
            {/* Hero Banner */}
            {!currentRegistration && (
              <div className="text-center max-w-lg mx-auto space-y-2.5 pb-2">
                <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-medium backdrop-blur-md shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>TestGrid CoTester</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-pink-300 flex items-center gap-1 font-semibold">
                    <Sparkles className="w-3 h-3 text-pink-400" />
                    AI QA Certification
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold font-heading tracking-tight text-white">
                  Reserve Your Certification Session
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Select your testing discipline and pick an available date for your official certification pass.
                </p>
              </div>
            )}

            {/* Registration Form OR Ticket Card */}
            {currentRegistration ? (
              <RegistrationTicket
                registration={currentRegistration}
                onRegisterAnother={handleRegisterAnother}
                isAdminAuthorized={isAdminAuthorized}
                onViewAdmin={() => setActiveTab('admin')}
              />
            ) : (
              <RegistrationForm
                availableDates={eventInfo.availableDates}
                onRegistrationSuccess={handleRegistrationSuccess}
                onAdminAuthChange={setIsAdminAuthorized}
              />
            )}
          </div>
        ) : (
          <AdminPanel
            availableDates={eventInfo.availableDates}
            onRefreshData={fetchRegistrationsCount}
          />
        )}
      </main>

      {/* App Footer */}
      <footer className="py-5 text-center text-xs border-t border-white/10 bg-[#070A10]/90 backdrop-blur-md text-slate-400 mt-10">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-300">
              TestGrid Certification Portal
            </span>
            <span>•</span>
            <span className="text-indigo-300 font-medium flex items-center gap-1">
              CoTester AI
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => setActiveTab('register')}
              className={`hover:text-indigo-300 transition-colors cursor-pointer ${
                activeTab === 'register' ? 'text-indigo-300 font-semibold' : ''
              }`}
            >
              Registration
            </button>
            {isAdminAuthorized && (
              <>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('admin')}
                  className={`hover:text-indigo-300 transition-colors cursor-pointer ${
                    activeTab === 'admin' ? 'text-indigo-300 font-semibold' : ''
                  }`}
                >
                  Admin Portal
                </button>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
