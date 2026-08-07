import React, { useState, useEffect } from 'react';
import { TesterType, RegistrationRequest, Registration, DateAvailability } from '../types';
import { Monitor, Smartphone, Calendar as CalendarIcon, Loader2, Globe, ShieldAlert, ArrowRight, CheckCircle2, UserCheck, Edit2, Sparkles } from 'lucide-react';
import { CalendarPicker } from './CalendarPicker';
import { generateAvailableDates } from '../utils/dateUtils';
import { CONTINENT_TIMEZONES } from '../utils/timezone';

interface RegistrationFormProps {
  availableDates: string[];
  onRegistrationSuccess: (registration: Registration) => void;
  onAdminAuthChange: (isAuthorized: boolean) => void;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  availableDates,
  onRegistrationSuccess,
  onAdminAuthChange,
}) => {
  const [step, setStep] = useState<1 | 2>(1);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [testerType, setTesterType] = useState<TesterType>('web');
  const [selectedDate, setSelectedDate] = useState<string>(availableDates[0] || '');

  // Continental Timezone Converter State
  const [selectedTzId, setSelectedTzId] = useState<string>('ist');

  const [availabilities, setAvailabilities] = useState<DateAvailability[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [checkingEmail, setCheckingEmail] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [existingReg, setExistingReg] = useState<Registration | null>(null);

  // Sync default date
  useEffect(() => {
    if (availableDates.length > 0 && !selectedDate) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates]);

  useEffect(() => {
    fetchAvailabilities();
    const interval = setInterval(() => {
      fetchAvailabilities();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const getCombinedRegistrations = (serverRegs: Registration[] = []): Registration[] => {
    let localRegs: Registration[] = [];
    try {
      const stored = localStorage.getItem('registrations_list');
      if (stored) localRegs = JSON.parse(stored);
    } catch (_) {}

    const map = new Map<string, Registration>();
    [...serverRegs, ...localRegs].forEach(r => {
      if (r && r.id) map.set(r.id, r);
      else if (r && r.email && r.date) map.set(`${r.email}-${r.date}`, r);
    });
    return Array.from(map.values());
  };

  const saveLocalRegistration = (reg: Registration) => {
    try {
      const stored = localStorage.getItem('registrations_list');
      const list: Registration[] = stored ? JSON.parse(stored) : [];
      if (!list.some(r => r.id === reg.id || (r.email === reg.email && r.date === reg.date))) {
        list.push(reg);
        localStorage.setItem('registrations_list', JSON.stringify(list));
      }
    } catch (_) {}
  };

  const fetchAvailabilities = async () => {
    try {
      let serverAvails: DateAvailability[] = [];
      let serverRegs: Registration[] = [];

      try {
        const [availRes, regRes] = await Promise.all([
          fetch('/api/availability'),
          fetch('/api/registrations'),
        ]);

        if (availRes.ok) serverAvails = await availRes.json();
        if (regRes.ok) {
          const regData = await regRes.json();
          serverRegs = regData.registrations || [];
        }
      } catch (_) {}

      const allRegs = getCombinedRegistrations(serverRegs);
      const dates = availableDates.length > 0 ? availableDates : generateAvailableDates();

      const calculatedAvails: DateAvailability[] = dates.map(date => {
        const dateRegs = allRegs.filter(r => r.date === date);
        const webBooked = dateRegs.filter(r => {
          const t = String(r.testerType);
          return t === 'web' || t === 'Web Platform' || !r.testerType;
        }).length;
        const mobileBooked = dateRegs.filter(r => {
          const t = String(r.testerType);
          return t === 'mobile' || t === 'Mobile Apps';
        }).length;

        const serverMatch = serverAvails.find(a => a.date === date);
        const finalWebBooked = Math.max(webBooked, serverMatch ? serverMatch.webBooked : 0);
        const finalMobileBooked = Math.max(mobileBooked, serverMatch ? serverMatch.mobileBooked : 0);

        return {
          date,
          webBooked: finalWebBooked,
          webMax: 10,
          mobileBooked: finalMobileBooked,
          mobileMax: 10,
        };
      });

      setAvailabilities(calculatedAvails);
    } catch (err) {
      console.error('Failed to load availabilities:', err);
    }
  };

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setExistingReg(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    const isAdmin = cleanEmail === 'damanjeet@testgrid.io';
    onAdminAuthChange(isAdmin);

    setCheckingEmail(true);
    try {
      const res = await fetch(`/api/check-email?email=${encodeURIComponent(cleanEmail)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.registered && data.existingRegistration) {
          setExistingReg(data.existingRegistration);
          setErrorMessage(`You have already registered with this email address (${cleanEmail}).`);
          setCheckingEmail(false);
          return;
        }
      }
    } catch (err) {
      console.error('Error checking email:', err);
    } finally {
      setCheckingEmail(false);
    }

    setStep(2);
    fetchAvailabilities();
  };

  const pushToGoogleSheetDirect = (reg: Registration) => {
    try {
      const webhookUrl = 'https://script.google.com/macros/s/AKfycbx42LzjESb5CnTx7UZwsYL2MMg26y5a5hf2rmS0JO6Ztq5a7P-sIdTnDyfXVFybrE6c/exec';
      fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(reg),
      }).catch(err => console.error('Direct Google Sheet push error:', err));
    } catch (_) {}
  };

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setExistingReg(null);

    if (!selectedDate) {
      setErrorMessage('Please select an event date from the calendar.');
      return;
    }

    const payload: RegistrationRequest = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      testerType,
      date: selectedDate,
    };

    setSubmitting(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let data: any = {};
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        try { data = JSON.parse(text); } catch (_) {}
      }

      if (!res.ok) {
        if (data && data.error) {
          setErrorMessage(data.error);
          if (data.alreadyRegistered && data.existingRegistration) {
            setExistingReg(data.existingRegistration);
          }
          if (data.slotFull) {
            fetchAvailabilities();
          }
          return;
        }

        const ticketCode = `TKT-${Math.floor(1000 + Math.random() * 9000)}-${testerType.toUpperCase()}`;
        const fallbackReg: Registration = {
          id: `reg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          testerType,
          date: selectedDate,
          createdAt: new Date().toISOString(),
          ticketCode,
        };

        saveLocalRegistration(fallbackReg);
        pushToGoogleSheetDirect(fallbackReg);
        onRegistrationSuccess(fallbackReg);
        return;
      }

      if (data.registration) {
        saveLocalRegistration(data.registration);
        pushToGoogleSheetDirect(data.registration);
        onRegistrationSuccess(data.registration);
        return;
      }

      const ticketCode = `TKT-${Math.floor(1000 + Math.random() * 9000)}-${testerType.toUpperCase()}`;
      const fallbackReg: Registration = {
        id: `reg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        testerType,
        date: selectedDate,
        createdAt: new Date().toISOString(),
        ticketCode,
      };
      saveLocalRegistration(fallbackReg);
      pushToGoogleSheetDirect(fallbackReg);
      onRegistrationSuccess(fallbackReg);
    } catch (err: any) {
      console.error('Submit registration fallback:', err);
      const ticketCode = `TKT-${Math.floor(1000 + Math.random() * 9000)}-${testerType.toUpperCase()}`;
      const fallbackReg: Registration = {
        id: `reg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        testerType,
        date: selectedDate,
        createdAt: new Date().toISOString(),
        ticketCode,
      };
      saveLocalRegistration(fallbackReg);
      pushToGoogleSheetDirect(fallbackReg);
      onRegistrationSuccess(fallbackReg);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedAvail = availabilities.find(a => a.date === selectedDate);
  const webBooked = selectedAvail ? selectedAvail.webBooked : 0;
  const mobileBooked = selectedAvail ? selectedAvail.mobileBooked : 0;
  const currentCategoryBooked = testerType === 'web' ? webBooked : mobileBooked;
  const remainingSeats = Math.max(0, 10 - currentCategoryBooked);

  return (
    <div className="w-full max-w-3xl mx-auto rounded-2xl bg-[#101728]/70 border border-white/10 backdrop-blur-xl text-slate-100 shadow-2xl flex flex-col md:flex-row overflow-hidden transition-all">
      {/* Sidebar Panel with subtle frosted glass and soft pink-blue accents */}
      <div className="md:w-[260px] bg-[#0A0D15]/80 backdrop-blur-md p-5 sm:p-6 flex flex-col justify-between shrink-0 border-b md:border-b-0 md:border-r border-white/10">
        <div>
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500/20 to-pink-500/20 border border-white/15 rounded-xl mb-3 flex items-center justify-center text-indigo-300">
            <CalendarIcon className="w-4 h-4 text-indigo-300" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold font-heading text-white tracking-tight leading-tight mb-1">
            TestGrid CoTester
          </h2>
          <div className="flex items-center space-x-1.5 mb-3">
            <span className="text-indigo-300 text-xs font-semibold">Certification 2026</span>
            <Sparkles className="w-3 h-3 text-pink-300" />
          </div>
          <p className="text-slate-400 text-xs leading-relaxed mb-5">
            Autonomous AI testing suite training across Web and Mobile platforms.
          </p>

          <div className="space-y-2 pt-3 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-400 to-pink-400" />
              <span>Full-Day Pass Included</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Globe className="w-3.5 h-3.5 text-indigo-300" />
              <span>Global Timezone Support</span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-3 border-t border-white/10 text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center justify-between">
          <span>Step {step} of 2</span>
          <span className="text-pink-300">{step === 1 ? 'Attendee' : 'Date & Platform'}</span>
        </div>
      </div>

      {/* Main Dynamic Form */}
      <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between space-y-5 bg-[#101728]/50">
        {/* Error / Notice Banner */}
        {errorMessage && (
          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5 p-3 rounded-xl text-xs border bg-slate-900/80 border-amber-500/30 text-amber-200 backdrop-blur-md">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 text-amber-400 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold block">Notice</span>
                <p className="leading-relaxed">{errorMessage}</p>
              </div>
            </div>

            {existingReg && (
              <button
                type="button"
                onClick={() => onRegistrationSuccess(existingReg)}
                className="w-full py-2 px-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>View Reserved Pass ({existingReg.ticketCode})</span>
              </button>
            )}
          </div>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <form onSubmit={handleNextStep} className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white font-heading">Attendee Details</h3>
              <p className="text-xs text-slate-400">
                Enter your full name and work email to start registration.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 ml-0.5">
                  Full Name <span className="text-pink-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Cooper"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0A0D15]/80 border border-white/10 text-white rounded-xl text-xs sm:text-sm focus:outline-none focus:border-indigo-400/80 transition-colors placeholder:text-slate-600 shadow-inner"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 ml-0.5">
                  Work Email <span className="text-pink-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. damanjeet@testgrid.io"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0A0D15]/80 border border-white/10 text-white rounded-xl text-xs sm:text-sm focus:outline-none focus:border-indigo-400/80 transition-colors placeholder:text-slate-600 shadow-inner"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={checkingEmail}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer mt-2"
            >
              {checkingEmail ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-pink-300" />
                  <span>Verifying Email...</span>
                </>
              ) : (
                <>
                  <span>Next: Select Date & Platform</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <form onSubmit={handleSubmitRegistration} className="space-y-4">
            <div className="flex items-center justify-between p-2.5 bg-[#0A0D15]/80 border border-white/10 rounded-xl">
              <div className="flex items-center space-x-2 min-w-0">
                <div className="p-1.5 bg-gradient-to-br from-indigo-500/20 to-pink-500/20 text-indigo-300 border border-white/10 rounded-lg shrink-0">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white truncate">{name}</div>
                  <div className="text-[11px] font-mono text-indigo-300 truncate">{email}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-medium text-xs rounded-lg transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Edit2 className="w-3 h-3 text-pink-300" />
                <span>Edit</span>
              </button>
            </div>

            {/* Discipline Selection */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 ml-0.5 block">
                Access Discipline <span className="text-pink-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setTesterType('web')}
                  className={`flex items-center gap-2 p-2.5 border rounded-xl transition-all cursor-pointer ${
                    testerType === 'web'
                      ? 'border-indigo-400/60 bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-indigo-200 shadow-sm'
                      : 'border-white/10 bg-[#0A0D15]/60 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <Monitor className="w-4 h-4 text-indigo-300 shrink-0" />
                  <div className="text-left min-w-0">
                    <span className="text-xs font-semibold block truncate text-white">Web Platform</span>
                    <span className="text-[10px] text-slate-400 block truncate">Desktop Testing</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTesterType('mobile')}
                  className={`flex items-center gap-2 p-2.5 border rounded-xl transition-all cursor-pointer ${
                    testerType === 'mobile'
                      ? 'border-pink-400/60 bg-gradient-to-r from-pink-500/20 to-purple-500/10 text-pink-200 shadow-sm'
                      : 'border-white/10 bg-[#0A0D15]/60 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-pink-300 shrink-0" />
                  <div className="text-left min-w-0">
                    <span className="text-xs font-semibold block truncate text-white">Mobile Apps</span>
                    <span className="text-[10px] text-slate-400 block truncate">iOS / Android</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Timezone Reference Converter */}
            <div className="p-2.5 bg-[#0A0D15]/80 border border-white/10 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-300" />
                  Timezone Reference
                </span>
                <span className="text-[10px] text-slate-400">Full-Day Access</span>
              </div>
              <select
                value={selectedTzId}
                onChange={e => setSelectedTzId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#121829] border border-white/10 rounded-lg text-xs text-white focus:outline-none cursor-pointer"
              >
                {CONTINENT_TIMEZONES.map(tz => (
                  <option key={tz.id} value={tz.id}>
                    {tz.flag} {tz.label} ({tz.offsetLabel})
                  </option>
                ))}
              </select>
            </div>

            {/* Calendar Date Picker */}
            <div className="space-y-1">
              <div className="flex items-center justify-between ml-0.5 text-xs">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Select Event Date <span className="text-pink-400">*</span>
                </label>
                <span className="text-[11px] font-semibold text-indigo-200 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md backdrop-blur-md">
                  {remainingSeats} seats left ({testerType === 'web' ? 'Web' : 'Mobile'})
                </span>
              </div>

              <CalendarPicker
                availableDates={availableDates}
                selectedDate={selectedDate}
                onSelectDate={date => setSelectedDate(date)}
                availabilities={availabilities}
                selectedTesterType={testerType}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || remainingSeats === 0}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-pink-300" />
                  <span>Reserving Pass...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-pink-300" />
                  <span>Reserve Certification Pass</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
