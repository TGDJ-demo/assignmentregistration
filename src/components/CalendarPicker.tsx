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

    const category = selectedTesterType || 'web'; // Default to web if not yet chosen
    const booked = category === 'web' ? avail.webBooked : avail.mobileBooked;
    const max = 10;
    const remaining = Math.max(0, max - booked);
    const isFull = remaining === 0;

    return { isEventDate: true, isFull, remaining, booked };
  };

  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-3xl border border-zinc-200/90 p-5 shadow-xs transition-all space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-zinc-900 text-sm sm:text-base">
              {monthNames[month]} {year}
            </h3>
            <span className="text-[10px] text-zinc-400 block font-medium">
              Full-Day Access • Select Preferred Date
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 hover:bg-zinc-100 rounded-xl text-zinc-600 transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 hover:bg-zinc-100 rounded-xl text-zinc-600 transition-colors"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {dayHeaders.map(day => (
          <div key={day} className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: firstDayOfWeek }).map((_, index) => (
          <div key={`empty-${index}`} className="h-12 sm:h-14" />
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
              className={`h-12 sm:h-14 rounded-2xl flex flex-col items-center justify-center relative transition-all text-xs font-semibold ${
                isSelected
                  ? 'bg-zinc-900 text-white shadow-md shadow-zinc-900/20 ring-2 ring-zinc-900/30'
                  : isEventDate
                  ? isFull
                    ? 'bg-zinc-100 text-zinc-400 filter blur-[0.4px] opacity-60 cursor-not-allowed border border-zinc-200/80 line-through'
                    : 'bg-blue-50/80 text-blue-800 hover:bg-blue-100 cursor-pointer border border-blue-200/60'
                  : 'text-zinc-300 bg-zinc-50/40 cursor-not-allowed border border-transparent'
              }`}
            >
              <span className="text-sm font-bold">{dayNum}</span>

              {/* Status Indicator / Seats Left Badge */}
              {isEventDate && (
                <div className="flex items-center justify-center mt-0.5">
                  {isSelected ? (
                    <Check className="w-3 h-3 text-blue-400" />
                  ) : isFull ? (
                    <span className="text-[9px] font-bold text-red-600 uppercase">Full</span>
                  ) : (
                    <span className="text-[9px] font-extrabold text-blue-600 bg-blue-100/90 px-1 rounded-md">
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
      <div className="flex items-center justify-around pt-2 border-t border-zinc-100 text-[11px] text-zinc-500 font-medium flex-wrap gap-2">
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span>Available Date</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
          <span>Full (Slots Reserved)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-zinc-900" />
          <span>Selected Date</span>
        </div>
      </div>
    </div>
  );
};
