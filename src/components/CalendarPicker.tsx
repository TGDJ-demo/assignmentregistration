import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Check } from 'lucide-react';
import { DateAvailability, TesterType } from '../types';

interface CalendarPickerProps {
  availableDates: string[]; // List of date strings YYYY-MM-DD
  selectedDate: string;
  onSelectDate: (date: string) => void;
  availabilities: DateAvailability[];
  selectedTesterType: TesterType | '';
}

export const CalendarPicker: React.FC<CalendarPickerProps> = ({
  availableDates,
  selectedDate,
  onSelectDate,
  availabilities,
  selectedTesterType,
}) => {
  const initialDateStr = selectedDate || availableDates[0] || new Date().toISOString().split('T')[0];
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const [year, month] = initialDateStr.split('-').map(Number);
    return new Date(year, month - 1, 1);
  });

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth(); // 0-indexed

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const formatDateStr = (dayNum: number): string => {
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${year}-${pad(month + 1)}-${pad(dayNum)}`;
  };

  const getDateStatus = (dateStr: string) => {
    const isEventDate = availableDates.includes(dateStr);
    if (!isEventDate) return { isEventDate: false, isFull: false, remaining: 0, booked: 0 };

    const avail = availabilities.find(a => a.date === dateStr);
    if (!avail) return { isEventDate: true, isFull: false, remaining: 10, booked: 0 };

    const category = selectedTesterType || 'web';
    const booked = category === 'web' ? avail.webBooked : avail.mobileBooked;
    const max = 10;
    const remaining = Math.max(0, max - booked);
    const isFull = remaining === 0;

    return { isEventDate: true, isFull, remaining, booked };
  };

  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0A0D15]/80 backdrop-blur-xl p-3.5 sm:p-4 shadow-xl space-y-3">
      {/* Calendar Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500/20 to-pink-500/20 text-indigo-300 border border-white/10">
            <CalendarIcon className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-bold font-heading text-xs sm:text-sm text-white">
              {monthNames[month]} {year}
            </h3>
            <span className="text-[10px] block font-medium text-slate-400">
              Full-Day Access • Select Event Date
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {dayHeaders.map(day => (
          <div key={day} className="text-[10px] font-semibold uppercase tracking-wider py-0.5 text-slate-400">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfWeek }).map((_, index) => (
          <div key={`empty-${index}`} className="h-10 sm:h-11" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const dateStr = formatDateStr(dayNum);
          const { isEventDate, isFull, remaining } = getDateStatus(dateStr);
          const isSelected = selectedDate === dateStr;

          return (
            <button
              key={dateStr}
              type="button"
              disabled={!isEventDate || isFull}
              onClick={() => isEventDate && !isFull && onSelectDate(dateStr)}
              className={`h-10 sm:h-11 rounded-xl flex flex-col items-center justify-center relative transition-all text-xs font-semibold ${
                isSelected
                  ? 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-white font-bold shadow-md scale-[1.03] border border-white/20'
                  : isEventDate
                  ? isFull
                    ? 'bg-slate-900/40 text-slate-600 border border-white/5 cursor-not-allowed line-through'
                    : 'bg-indigo-950/20 text-indigo-200 hover:bg-indigo-900/40 cursor-pointer border border-indigo-400/20 hover:border-indigo-400/40'
                  : 'text-slate-600 bg-white/2 cursor-not-allowed border border-transparent'
              }`}
            >
              <span className="text-xs font-bold">{dayNum}</span>

              {/* Status Indicator / Seats Left Badge */}
              {isEventDate && (
                <div className="flex items-center justify-center mt-0.5">
                  {isSelected ? (
                    <Check className="w-3 h-3 text-pink-200 stroke-[3]" />
                  ) : isFull ? (
                    <span className="text-[9px] font-semibold text-rose-400 uppercase">Full</span>
                  ) : (
                    <span className="text-[9px] font-bold text-indigo-300 bg-indigo-500/20 px-1 rounded border border-indigo-400/20">
                      {remaining} left
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Calendar Legend */}
      <div className="flex items-center justify-around pt-2 border-t border-white/10 text-[10px] font-medium text-slate-400 flex-wrap gap-2">
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-400" />
          <span>Available</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-slate-600" />
          <span>Full</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500" />
          <span>Selected</span>
        </div>
      </div>
    </div>
  );
};
