"use client";

import { Bell, X } from "lucide-react";
import { useState } from "react";
import { format, isToday } from "date-fns";

export function DailyAlerts({ chores = [], events = [] }: { chores?: any[], events?: any[] }) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const pendingChoresCount = chores.filter(c => c.status === "pending").length;
  
  // Find the next event today
  const todayEvents = events.filter(e => {
    if (!e.start) return false;
    try {
      return isToday(new Date(e.start));
    } catch {
      return false;
    }
  });
  
  let eventText = "";
  if (todayEvents.length > 0) {
    const nextEvent = todayEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0];
    const isAllDay = nextEvent.all_day;
    if (isAllDay) {
       eventText = ` Don't forget, today is ${nextEvent.title}!`;
    } else {
       eventText = ` ${nextEvent.title} is at ${format(new Date(nextEvent.start), 'h:mm a')}!`;
    }
  }

  const message = `You have ${pendingChoresCount} chore${pendingChoresCount === 1 ? '' : 's'} pending today.${eventText}`;

  if (pendingChoresCount === 0 && todayEvents.length === 0) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-100 to-orange-100 p-6 shadow-sm border border-orange-200 mb-8">
      <button 
        onClick={() => setIsVisible(false)}
        className="absolute top-4 right-4 text-orange-500 hover:text-orange-700 transition-colors"
      >
        <X className="h-5 w-5" />
      </button>
      <div className="flex items-start gap-4">
        <div className="rounded-full bg-orange-200 p-3 text-orange-600">
          <Bell className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-orange-800">Good Morning, Family!</h2>
          <p className="mt-1 text-sm font-medium text-orange-700">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
