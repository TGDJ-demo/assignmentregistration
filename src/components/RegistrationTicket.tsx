import React from 'react';
import { Registration } from '../types';
import { CheckCircle2, Calendar, Monitor, Smartphone, Download, User, Mail, QrCode, ArrowLeft, Ticket, ShieldCheck } from 'lucide-react';

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
        'PRODID:-//Event Registration App//EN',
        'BEGIN:VEVENT',
        `SUMMARY:QA Summit 2026 (${registration.testerType === 'web' ? 'Web Platform' : 'Mobile Apps'})`,
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
      link.setAttribute('download', `Event_Ticket_${registration.ticketCode}.ics`);
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
    <div className="max-w-xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-500">
      {/* Success Notification & Congratulatory Banner */}
      <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-3xl space-y-2 text-emerald-900 shadow-sm">
        <div className="flex items-center space-x-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <h3 className="font-bold text-sm sm:text-base">Congratulations on Completing Your Certification Registration!</h3>
        </div>
        <p className="text-xs text-emerald-800 leading-relaxed pl-7">
          We are thrilled to partner with you! This assignment will bring you right up to speed with the best AI practices in the QA and software testing world, boosting your skills, strengthening our technical partnership, and giving your career a powerful boost.
        </p>
      </div>

      {/* Ticket Pass Card */}
      <div className="bg-white border border-zinc-200/80 rounded-[32px] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.07)] overflow-hidden">
        {/* Pass Top Header */}
        <div className="bg-[#1A1A1A] text-white p-6 sm:p-8 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Ticket className="w-4 h-4 text-blue-400" />
              <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Official Access Pass</span>
            </div>
            <span className="font-mono text-xs bg-zinc-800 border border-zinc-700 text-blue-300 px-3 py-1 rounded-xl font-bold">
              {registration.ticketCode}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold mt-4 text-white">QA & Software Testing Summit</h2>
          <p className="text-zinc-400 text-xs mt-1">Virtual Tech Hub • Full-Day Event Pass</p>
        </div>

        {/* Pass Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4 pb-6 border-b border-zinc-100">
            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Attendee</span>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-zinc-900 text-sm truncate">{registration.name}</span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-zinc-500 mt-1">
                <Mail className="w-3.5 h-3.5 text-zinc-400" />
                <span className="truncate">{registration.email}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Access Discipline</span>
              <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 font-bold text-xs">
                {registration.testerType === 'web' ? (
                  <>
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Web Platform</span>
                  </>
                ) : (
                  <>
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Mobile Apps</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-zinc-100">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-zinc-100 text-zinc-700 mt-0.5">
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <span className="text-[11px] text-zinc-400 font-medium block">Reserved Event Date</span>
                <span className="font-bold text-zinc-900 text-xs sm:text-sm">{formatDateLabel(registration.date)}</span>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-green-50 text-green-700 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] text-zinc-400 font-medium block">Access Duration</span>
                <span className="font-bold text-green-700 text-xs sm:text-sm">Full-Day Event Pass</span>
              </div>
            </div>
          </div>

          {/* Verification Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white rounded-xl border border-zinc-200">
                <QrCode className="w-8 h-8 text-zinc-800" />
              </div>
              <div>
                <span className="text-xs font-bold text-zinc-900 block">Digital Verification</span>
                <span className="text-[10px] text-zinc-500">Present this pass at event check-in</span>
              </div>
            </div>

            <button
              onClick={downloadCalendarFile}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Add to Calendar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onRegisterAnother}
          className="flex-1 py-3.5 px-4 bg-[#2563eb] hover:bg-blue-600 text-white font-semibold rounded-2xl text-xs sm:text-sm transition-all flex items-center justify-center space-x-2 shadow-md shadow-blue-500/20"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Register Another Person</span>
        </button>

        {isAdminAuthorized && onViewAdmin && (
          <button
            onClick={onViewAdmin}
            className="py-3.5 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold rounded-2xl text-xs sm:text-sm transition-all border border-zinc-200/60"
          >
            View Admin Dashboard
          </button>
        )}
      </div>
    </div>
  );
};
