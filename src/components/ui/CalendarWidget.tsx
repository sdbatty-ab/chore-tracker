"use client";

import { Calendar, Clock } from "lucide-react";
import Link from "next/link";

interface Event {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
}

export function CalendarWidget({ initialEvents = [] }: { initialEvents?: Event[] }) {
  // Only show upcoming events for the dashboard (e.g. next 3)
  const upcomingEvents = initialEvents
    .filter(e => new Date(e.end_time) >= new Date())
    .slice(0, 3);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600">
          <Calendar className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
      </div>
      
      <div className="space-y-4">
        {upcomingEvents.map((event) => {
          const startTime = new Date(event.start_time).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
          
          return (
            <div key={event.id} className="flex flex-col gap-1 rounded-xl bg-gray-50 p-4 transition-all hover:shadow-md border border-transparent hover:border-gray-200">
              <div className="flex items-start justify-between">
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700">
                  Family Event
                </span>
              </div>
              <p className="mt-1 font-medium text-gray-900 truncate">{event.title}</p>
              <div className="mt-2 flex items-center gap-1.5 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>{startTime}</span>
              </div>
            </div>
          );
        })}
        {upcomingEvents.length === 0 && (
          <p className="text-sm text-gray-500 italic text-center py-4">No events scheduled. Upload a calendar!</p>
        )}
      </div>
      
      <Link href="/calendar" className="mt-6 block text-center w-full rounded-xl bg-gray-50 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
        View Full Calendar
      </Link>
    </div>
  );
}
