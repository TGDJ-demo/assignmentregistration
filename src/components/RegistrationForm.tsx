import React, { useState, useEffect } from 'react';
import { TesterType, RegistrationRequest, Registration, DateAvailability } from '../types';
import { Monitor, Smartphone, Calendar as CalendarIcon, AlertCircle, Loader2, Globe, ShieldAlert, ArrowRight, CheckCircle2, UserCheck, Edit2 } from 'lucide-react';
import { CalendarPicker } from './CalendarPicker';
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
  // Step 1: User Info (Name + Email)
  // Step 2: Date + Discipline selection
  const [step, setStep] = useState<1 | 2>(1);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [testerType, setTesterType] = useState<TesterType>('web');
  const [selectedDate, setSelectedDate] = useState<string>(availableDates[0] || '');

  // Continental Timezone Converter State (Default IST)
  const [selectedTzId, setSelectedTzId] = useState<string>('ist');

  const [availabilities, setAvailabilities] = useState<DateAvailability[]>([]);
  const [loadingAvail, setLoadingAvail] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [checkingEmail, setCheckingEmail] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Existing registration if duplicate email detected
  const [existingReg, setExistingReg] = useState<Registration | null>(null);

  const activeTzOption = CONTINENT_TIMEZONES.find(t => t.id === selectedTzId) || CONTINENT_TIMEZONES[0];

  // Sync default date
  useEffect(() => {
    if (availableDates.length > 0 && !selectedDate) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates]);

  // Load date availabilities
  useEffect(() => {
    fetchAvailabilities();
  }, []);

  const fetchAvailabilities = async () => {
    setLoadingAvail(true);
    try {
      const res = await fetch('/api/availability');
      if (res.ok) {
        const data: DateAvailability[] = await res.json();
        setAvailabilities(data);
      }
    } catch (err) {
      console.error('Failed to load availabilities:', err);
    } finally {
      setLoadingAvail(false);
    }
  };

  // Step 1 -> Step 2 transition
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

    // Check if admin email "damanjeet@testgrid.io"
    const isAdmin = cleanEmail === 'damanjeet@testgrid.io';
    onAdminAuthChange(isAdmin);

    // Check if this email is already registered
    setCheckingEmail(true);
    try {
      const res = await fetch(`/api/check-email?email=${encodeURIComponent(cleanEmail)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.registered && data.existingRegistration) {
          setExistingReg(data.existingRegistration);
          setErrorMessage(`You have already registered for a session with this email address (${cleanEmail}).`);
          setCheckingEmail(false);
          return;
        }
      }
    } catch (err) {
      console.error('Error checking email:', err);
    } finally {
      setCheckingEmail(false);
    }

    // Advance to Step 2
    setStep(2);
    fetchAvailabilities();
  };

  // Step 2 Submission: Confirm and Lock Session
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

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Registration failed.');
        if (data.alreadyRegistered && data.existingRegistration) {
          setExistingReg(data.existingRegistration);
        }
        if (data.slotFull) {
          fetchAvailabilities();
        }
        return;
      }

      // Success! Trigger callback to show Ticket iframe / confirmation card
      onRegistrationSuccess(data.registration);
    } catch (err: any) {
      console.error(err);
      setErrorMessage('A network error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Get current date stats
  const selectedAvail = availabilities.find(a => a.date === selectedDate);
  const webBooked = selectedAvail ? selectedAvail.webBooked : 0;
  const mobileBooked = selectedAvail ? selectedAvail.mobileBooked : 0;
  const currentCategoryBooked = testerType === 'web' ? webBooked : mobileBooked;
  const remainingSeats = Math.max(0, 10 - currentCategoryBooked);

  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-[32px] sm:rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-zinc-200/80 flex flex-col lg:flex-row overflow-hidden transition-all">
      {/* Left Info Panel */}
      <div className="lg:w-[320px] xl:w-[350px] bg-[#1A1A1A] p-8 sm:p-10 text-white flex flex-col justify-between shrink-0">
        <div>
          <div className="w-10 h-10 bg-blue-500 rounded-xl mb-6 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold leading-tight mb-3">
            QA Beta<br />Summit 2026
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed mb-6">
            Reserve full-day event access. Choose your testing discipline (Web or Mobile) and pick an available date.
          </p>

          <div className="space-y-3 pt-4 border-t border-zinc-800">
            <div className="flex items-center gap-2.5 text-xs text-zinc-300">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>10 Seats per Discipline / Date</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-zinc-300">
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>7 Continents Timezone Sync</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-zinc-300">
              <UserCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>Web & Mobile Dedicated Access</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-zinc-800 text-[11px] uppercase tracking-widest text-zinc-500 font-semibold flex items-center justify-between">
          <span>Step {step} of 2</span>
          <span>{step === 1 ? 'Attendee Info' : 'Pick Date'}</span>
        </div>
      </div>

      {/* Main Dynamic Form */}
      <div className="flex-1 p-6 sm:p-10 flex flex-col justify-between space-y-6">
        {/* Error / Already Registered Notice */}
        {errorMessage && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200/90 text-amber-900 rounded-2xl text-xs sm:text-sm shadow-xs">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block">Registration Notice</span>
                <p className="leading-relaxed">{errorMessage}</p>
              </div>
            </div>

            {existingReg && (
              <button
                type="button"
                onClick={() => onRegistrationSuccess(existingReg)}
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center space-x-2"
              >
                <span>View Your Existing Reserved Pass ({existingReg.ticketCode})</span>
              </button>
            )}
          </div>
        )}

        {/* STEP 1: Enter Name and Email */}
        {step === 1 && (
          <form onSubmit={handleNextStep} className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-zinc-900">Step 1: Enter Attendee Details</h3>
              <p className="text-xs text-zinc-500">
                Please enter your full name and work email address to proceed.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider ml-1">
                  Full Name <span className="text-blue-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Cooper"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-zinc-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider ml-1">
                  Work Email <span className="text-blue-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. damanjeet@testgrid.io or jane@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-zinc-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={checkingEmail}
              className="w-full bg-[#2563eb] hover:bg-blue-600 text-white py-4 rounded-2xl font-semibold text-sm sm:text-base shadow-lg shadow-blue-500/20 active:scale-[0.99] transition-all flex items-center justify-center space-x-2"
            >
              {checkingEmail ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Email...</span>
                </>
              ) : (
                <>
                  <span>Next: Choose Discipline & Date</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Choose Discipline & Date */}
        {step === 2 && (
          <form onSubmit={handleSubmitRegistration} className="space-y-6">
            {/* Confirmed Attendee Header */}
            <div className="flex items-center justify-between p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-900">{name}</div>
                  <div className="text-[11px] text-zinc-500 font-mono">{email}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-3 py-1 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-600 font-semibold text-xs rounded-xl transition-all flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" />
                <span>Edit Info</span>
              </button>
            </div>

            {/* Discipline Selection (Web vs Mobile) */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider ml-1 block">
                Choose Access Discipline <span className="text-blue-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTesterType('web')}
                  className={`flex items-center gap-3 px-4 py-3.5 border-2 rounded-2xl transition-all ${
                    testerType === 'web'
                      ? 'border-blue-500 bg-blue-50/50 text-blue-700 shadow-xs'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                      testerType === 'web'
                        ? 'border-4 border-blue-500 bg-white'
                        : 'border-2 border-zinc-300'
                    }`}
                  />
                  <Monitor className="w-4 h-4 text-blue-600" />
                  <div className="text-left">
                    <span className="text-xs sm:text-sm font-bold block">Web Platform</span>
                    <span className="text-[10px] text-zinc-500">Full-Day Desktop Testing</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTesterType('mobile')}
                  className={`flex items-center gap-3 px-4 py-3.5 border-2 rounded-2xl transition-all ${
                    testerType === 'mobile'
                      ? 'border-blue-500 bg-blue-50/50 text-blue-700 shadow-xs'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                      testerType === 'mobile'
                        ? 'border-4 border-blue-500 bg-white'
                        : 'border-2 border-zinc-300'
                    }`}
                  />
                  <Smartphone className="w-4 h-4 text-purple-600" />
                  <div className="text-left">
                    <span className="text-xs sm:text-sm font-bold block">Mobile Apps</span>
                    <span className="text-[10px] text-zinc-500">Full-Day iOS / Android</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Timezone Reference Converter */}
            <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                  Global Timezone Converter
                </span>
                <span className="text-[10px] text-zinc-500 font-medium">All 7 Continents</span>
              </div>
              <select
                value={selectedTzId}
                onChange={e => setSelectedTzId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-semibold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                {CONTINENT_TIMEZONES.map(tz => (
                  <option key={tz.id} value={tz.id}>
                    {tz.flag} {tz.label} ({tz.offsetLabel})
                  </option>
                ))}
              </select>
            </div>

            {/* Calendar Date Picker */}
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Select Event Date <span className="text-blue-500">*</span>
                </label>
                <span className="text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg">
                  {remainingSeats} seats left for {testerType === 'web' ? 'Web' : 'Mobile'} on {selectedDate}
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

            {/* Final Action Button: Confirm & Lock My Session */}
            <button
              type="submit"
              disabled={submitting || remainingSeats === 0}
              className="w-full bg-[#2563eb] hover:bg-blue-600 text-white py-4 rounded-2xl font-semibold text-sm sm:text-base shadow-lg shadow-blue-500/20 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Locking Session & Generating Pass...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Confirm and Lock My Session</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
