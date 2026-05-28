"use client";

import { useState } from "react";
import { Calendar as CalendarIcon, Link as LinkIcon, Trash2, Loader2, Plus, ChevronLeft, ChevronRight, Globe } from "lucide-react";
import { addCalendarLink, removeCalendarLink } from "@/app/actions";
import { motion } from "framer-motion";

interface Event {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  is_all_day?: boolean;
  location: string | null;
  calendar_name?: string;
}

interface CalendarLink {
  id: string;
  name: string;
  url: string;
}

export function FullCalendar({ initialEvents }: { initialEvents: Event[] }) {
  // Monthly Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());

  // Calendar Math
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
  
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const nextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));

  // Build Grid Cells
  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null); // empty cells before the 1st
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <div className="w-full">
      {/* Main Monthly Calendar View */}
      <div className="w-full">
        <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                <CalendarIcon className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{monthNames[currentMonth]} {currentYear}</h2>
            </div>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button 
                onClick={() => setCurrentDate(new Date())}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Month
              </button>
              <button onClick={nextMonth} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 gap-px mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-bold text-sm text-gray-400 uppercase py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-2xl overflow-hidden border border-gray-100">
            {days.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} className="bg-gray-50/50 min-h-[120px] p-2"></div>;
              
              // Find events for this day
              const dayDate = new Date(currentYear, currentMonth, day);
              const dayStr = dayDate.toDateString();
              
              const dayEvents = initialEvents.filter(e => {
                const eStart = new Date(e.start_time);
                const eStartDay = new Date(eStart.getFullYear(), eStart.getMonth(), eStart.getDate());
                
                const eEnd = new Date(e.end_time);
                const eEndDay = new Date(eEnd.getFullYear(), eEnd.getMonth(), eEnd.getDate());
                
                if (e.is_all_day && eStartDay.getTime() !== eEndDay.getTime()) {
                  return dayDate >= eStartDay && dayDate < eEndDay;
                } else {
                  return dayDate >= eStartDay && dayDate <= eEndDay;
                }
              });

              const isToday = new Date().toDateString() === dayStr;

              return (
                <div key={day} className={`bg-white min-h-[120px] p-2 border-t border-gray-50 hover:bg-gray-50 transition-colors ${isToday ? 'bg-indigo-50/30' : ''}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-sm font-bold h-7 w-7 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white' : 'text-gray-700'}`}>
                      {day}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {dayEvents.map((evt, i) => (
                      <div key={i} className="text-xs p-1.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold truncate cursor-pointer hover:bg-indigo-100 transition-colors" title={`${evt.title} (${evt.calendar_name || 'Family'})`}>
                        {evt.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
