import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { RegistrationForm } from './components/RegistrationForm';
import { RegistrationTicket } from './components/RegistrationTicket';
import { AdminPanel } from './components/AdminPanel';
import { EventInfo, Registration } from './types';
import { Monitor, Smartphone, FileSpreadsheet, ShieldCheck, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'register' | 'admin'>('register');
  const [isAdminAuthorized, setIsAdminAuthorized] = useState<boolean>(false);

  const [eventInfo, setEventInfo] = useState<EventInfo>({
    title: 'QA & Software Testing Certification Summit 2026',
    subtitle: 'Mastering AI Practices in QA & Automation',
    location: 'Virtual Tech Hub & Certification Portal',
    description: 'Congratulations on taking this crucial step toward completing your certification! This assignment is designed to help you get up to speed with best AI practices in the QA and testing world, strengthening our partnership and advancing your career. Select your access discipline (Web Platform or Mobile Apps) and pick an available date.',
    availableDates: ['2026-08-10', '2026-08-11', '2026-08-12', '2026-08-13', '2026-08-14'],
  });

  const [registrationCount, setRegistrationCount] = useState<number>(0);
  const [currentRegistration, setCurrentRegistration] = useState<Registration | null>(null);

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
    fetchRegistrationsCount();
  };

  const handleRegisterAnother = () => {
    setCurrentRegistration(null);
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-zinc-900 flex flex-col font-sans antialiased">
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
            <span>Live Sync</span>
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
