import { CalendarWidget } from "@/components/ui/CalendarWidget";
import { DailyAlerts } from "@/components/ui/DailyAlerts";
import { WeeklyQuote } from "@/components/ui/WeeklyQuote";
import { ChoreChecklist } from "@/components/ui/ChoreChecklist";
import { CheckSquare, Trophy, User } from "lucide-react";
import { getChores, getEvents, getProfiles } from "./actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Home() {
  const chores = await getChores();
  const events = await getEvents();
  const profiles = await getProfiles();
  
  // Calculate completed tasks based on real data
  const completedCount = chores.filter(c => c.status === "completed" || c.status === "approved").length;
  const totalCount = chores.length;

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <header className="mb-8 inline-block bg-white/70 backdrop-blur-md px-8 py-5 rounded-3xl border border-white/50 shadow-sm">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Family First Dashboard</h1>
        <p className="text-gray-600 font-medium mt-1">Welcome back! Here is what's happening today.</p>
      </header>

      <WeeklyQuote />

      {/* Family Roster */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Family Roster</h2>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {profiles.map(profile => (
            <Link key={profile.id} href={`/member/${profile.id}`} className="flex flex-col items-center gap-2 group min-w-[80px]">
              <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl shadow-md border-2 border-white group-hover:scale-110 transition-transform">
                {profile.avatar_url ? <img src={profile.avatar_url} className="rounded-full w-full h-full object-cover" /> : profile.name.charAt(0)}
              </div>
              <span className="text-sm font-bold text-gray-700 group-hover:text-indigo-600 transition-colors">{profile.name}</span>
            </Link>
          ))}
        </div>
      </div>

      <DailyAlerts chores={chores as any[]} events={events as any[]} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="col-span-1 lg:col-span-2 space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="bg-green-100 text-green-600 p-4 rounded-xl">
                <CheckSquare className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Tasks Completed</p>
                <p className="text-2xl font-bold text-gray-900">{completedCount} / {totalCount}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="bg-yellow-100 text-yellow-600 p-4 rounded-xl">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Points Earned</p>
                <p className="text-2xl font-bold text-gray-900">450 pts</p>
              </div>
            </div>
          </div>
          
          {/* Chore Checklist Feed */}
          <ChoreChecklist initialChores={chores as any[]} />
        </div>

        <div className="col-span-1 space-y-8">
          <CalendarWidget initialEvents={events as any[]} />
        </div>
      </div>
    </div>
  );
}
