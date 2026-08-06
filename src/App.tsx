import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { RegistrationForm } from './components/RegistrationForm';
import { RegistrationTicket } from './components/RegistrationTicket';
import { AdminPanel } from './components/AdminPanel';
import { EventInfo, Registration } from './types';
import { generateAvailableDates } from './utils/dateUtils';
import { Monitor, Smartphone, ShieldCheck, Sparkles, CheckCircle2, PartyPopper, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'register' | 'admin'>('register');
  const [isAdminAuthorized, setIsAdminAuthorized] = useState<boolean>(false);

  const [eventInfo, setEventInfo] = useState<EventInfo>({
    title: 'QA & Software Testing Certification Summit 2026',
    subtitle: 'Mastering AI Practices in QA & Automation',
    location: 'Virtual Tech Hub & Certification Portal',
    description: 'Congratulations on taking this crucial step toward completing your certification! This assignment is designed to help you get up to speed with best AI practices in the QA and testing world, strengthening our partnership and advancing your career. Select your access discipline (Web Platform or Mobile Apps) and pick an available date.',
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

    // Auto dismiss toast after 7s
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 7000);
  };

  const handleRegisterAnother = () => {
    setCurrentRegistration(null);
    setShowSuccessToast(false);
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-zinc-900 flex flex-col font-sans antialiased relative">
      {/* Fancy Celebratory Success Popup / Toast */}
      {showSuccessToast && currentRegistration && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-in fade-in slide-in-from-top-6 duration-500">
          <div className="bg-zinc-900 text-white p-4 sm:p-5 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-start space-x-3.5 relative overflow-hidden group">
            <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 w-full animate-pulse" />
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 flex-shrink-0 mt-0.5 animate-bounce">
              <PartyPopper className="w-6 h-6" />
            </div>
            <div className="flex-1 pr-4">
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-sm sm:text-base text-white">Registration Successful!</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  PASS ISSUED
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                Welcome <strong className="text-emerald-300">{currentRegistration.name}</strong>! Ticket Code{' '}
                <strong className="font-mono text-emerald-300">{currentRegistration.ticketCode}</strong> reserved for{' '}
                {currentRegistration.date} ({currentRegistration.testerType === 'web' ? 'Web Platform' : 'Mobile Apps'}).
              </p>
            </div>
            <button
              onClick={() => setShowSuccessToast(false)}
              className="text-zinc-400 hover:text-white p-1 rounded-lg transition-colors"
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
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {activeTab === 'register' ? (
          <div className="space-y-8">
            {/* Hero Banner */}
            {!currentRegistration && (
              <div className="text-center max-w-2xl mx-auto space-y-3">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white border border-zinc-200/80 text-blue-600 text-xs font-bold shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Full-Day Access • Professional Certification & AI Testing</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900">
                  Reserve Your Certification Session
                </h2>
                <p className="text-zinc-500 text-xs sm:text-sm leading-relaxed">
                  {eventInfo.description}
                </p>

                {/* Feature Highlights Pill Bar */}
                <div className="pt-1 flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-zinc-600">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-zinc-200/80 shadow-2xs">
                    <Monitor className="w-3.5 h-3.5 text-blue-600" /> Web Platform
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-zinc-200/80 shadow-2xs">
                    <Smartphone className="w-3.5 h-3.5 text-purple-600" /> Mobile Apps
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-zinc-200/80 shadow-2xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> AI QA Best Practices
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-zinc-200/80 shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Instant Pass Generation
                  </span>
                </div>
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
      <footer className="bg-white border-t border-zinc-200/80 py-6 text-center text-xs text-zinc-500 mt-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-zinc-800">Event Registration & Session Booking</span>
            <span>•</span>
            <span>Official Portal</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setActiveTab('register')}
              className="hover:text-blue-600 transition-colors"
            >
              Registration
            </button>
            {isAdminAuthorized && (
              <>
                <span>•</span>
                <button
                  onClick={() => setActiveTab('admin')}
                  className="hover:text-blue-600 transition-colors"
                >
                  Google Sheets & Admin
                </button>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
