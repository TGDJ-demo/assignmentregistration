import React from 'react';
import { Registration } from '../types';
import { CheckCircle2, Calendar, Monitor, Smartphone, Download, User, Mail, QrCode, ArrowLeft, Ticket, ShieldCheck, Sparkles } from 'lucide-react';

interface RegistrationTicketProps {
  registration: Registration;
  onRegisterAnother: () => void;
  isAdminAuthorized?: boolean;
  onViewAdmin?: () => void;
}

export const RegistrationTicket: React.FC<RegistrationTicketProps> = ({
  registration,
  onRegisterAnother,
  isAdminAuthorized = false,
  onViewAdmin,
}) => {
  const downloadCalendarFile = () => {
    try {
      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//TestGrid Registration//EN',
        'BEGIN:VEVENT',
        `SUMMARY:TestGrid QA Summit 2026 (${registration.testerType === 'web' ? 'Web Platform' : 'Mobile Apps'})`,
        `DESCRIPTION:Registration Ticket: ${registration.ticketCode}\\nParticipant: ${registration.name}\\nRole: ${registration.testerType.toUpperCase()}`,
        `LOCATION:Virtual Tech Hub`,
        `DTSTART:${registration.date.replace(/-/g, '')}T090000Z`,
        `DTEND:${registration.date.replace(/-/g, '')}T180000Z`,
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\r\n');

      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', `TestGrid_Pass_${registration.ticketCode}.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to generate calendar file', err);
    }
  };

  const formatDateLabel = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-');
      const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-4 animate-in fade-in duration-300">
      {/* Congratulatory Banner */}
      <div className="p-4 rounded-2xl border border-white/15 bg-[#121829]/80 backdrop-blur-xl text-slate-200 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 w-full" />
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-pink-300" />
          <h3 className="font-bold font-heading text-xs sm:text-sm text-white">Registration Reserved!</h3>
          <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
        </div>
        <p className="text-xs text-slate-300 leading-relaxed mt-1 pl-6">
          Your official pass for TestGrid CoTester Certification Summit 2026 has been issued.
        </p>
      </div>

      {/* Ticket Pass Card */}
      <div className="rounded-2xl border border-white/10 bg-[#101728]/70 backdrop-blur-xl text-slate-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-[#0A0D15]/80 border-b border-white/10 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-1.5">
              <Ticket className="w-4 h-4 text-pink-300" />
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Access Pass</span>
            </div>
            <h2 className="text-base font-bold font-heading mt-0.5 text-white">
              TestGrid CoTester
            </h2>
          </div>
          <span className="font-mono text-xs bg-gradient-to-r from-indigo-500/20 to-pink-500/20 border border-indigo-400/30 text-indigo-200 px-3 py-1 rounded-xl font-bold">
            {registration.ticketCode}
          </span>
        </div>

        {/* Body Details */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 pb-3 border-b border-white/10">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">Attendee</span>
              <div className="flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-indigo-300" />
                <span className="font-semibold text-xs text-white truncate">{registration.name}</span>
              </div>
              <div className="flex items-center space-x-1 text-[11px] mt-0.5 text-slate-400">
                <Mail className="w-3 h-3 text-slate-400" />
                <span className="truncate">{registration.email}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">Discipline</span>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl font-semibold text-xs bg-white/5 text-indigo-200 border border-white/10 backdrop-blur-md">
                {registration.testerType === 'web' ? (
                  <>
                    <Monitor className="w-3.5 h-3.5 text-indigo-300" />
                    <span>Web Platform</span>
                  </>
                ) : (
                  <>
                    <Smartphone className="w-3.5 h-3.5 text-pink-300" />
                    <span>Mobile Apps</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pb-3 border-b border-white/10">
            <div className="flex items-start space-x-2">
              <Calendar className="w-4 h-4 text-indigo-300 mt-0.5" />
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Event Date</span>
                <span className="font-semibold text-xs text-white">{formatDateLabel(registration.date)}</span>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 text-pink-300 mt-0.5" />
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Duration</span>
                <span className="font-semibold text-xs text-indigo-200">Full-Day Access</span>
              </div>
            </div>
          </div>

          {/* Verification Box */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-[#0A0D15]/80">
            <div className="flex items-center space-x-2.5">
              <QrCode className="w-6 h-6 text-pink-300" />
              <div>
                <span className="text-xs font-bold block text-white">Digital Check-in Code</span>
                <span className="text-[10px] text-slate-400">Present upon session entry</span>
              </div>
            </div>

            <button
              type="button"
              onClick={downloadCalendarFile}
              className="flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-gradient-to-r from-indigo-500/20 to-pink-500/20 hover:from-indigo-500/30 hover:to-pink-500/30 text-indigo-200 border border-indigo-400/30 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-pink-300" />
              <span>Calendar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={onRegisterAnother}
          className="flex-1 py-2.5 px-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Register Another Attendee</span>
        </button>

        {isAdminAuthorized && onViewAdmin && (
          <button
            type="button"
            onClick={onViewAdmin}
            className="py-2.5 px-3 font-semibold rounded-xl text-xs sm:text-sm bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors cursor-pointer"
          >
            Admin Panel
          </button>
        )}
      </div>
    </div>
  );
};
