"use client";

import { Bell, X } from "lucide-react";
import { useState } from "react";

export function DailyAlerts() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

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
            You have 3 chores pending today. Timmy's soccer practice is at 3:30 PM!
          </p>
        </div>
      </div>
    </div>
  );
}
