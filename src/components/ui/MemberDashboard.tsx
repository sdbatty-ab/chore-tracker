"use client";

import { CheckSquare, Target, Award, Trophy, Star, Shield, Crown, User, Loader2, Calendar as CalendarIcon, AlertCircle } from "lucide-react";
import { logGoalProgress, toggleChoreStatus } from "@/app/actions";
import { useState } from "react";
import Confetti from "react-confetti";
import { CalendarWidget } from "./CalendarWidget";

interface Profile {
  id: string;
  name: string;
  points_balance: number;
  lifetime_points: number;
}

interface Chore {
  id: string;
  title: string;
  points: number;
  status: string;
  is_daily: boolean;
  recurrence?: string;
  due_date?: string | null;
  recurrence_day?: string | null;
  created_at?: string;
}

interface Goal {
  id: string;
  title: string;
  target_points: number;
  current_points: number;
}

interface RewardClaim {
  id: string;
  created_at: string;
  status: string;
  rewards?: {
    title: string;
    points_cost: number;
  }
}

export function MemberDashboard({ profile, chores, goals, claims = [], events = [] }: { profile: Profile, chores: Chore[], goals: Goal[], claims?: RewardClaim[], events?: any[] }) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({});

  const pendingChores = chores.filter(c => c.status === "pending");
  const completedChores = chores.filter(c => c.status === "completed" || c.status === "approved");

  const classifyChore = (chore: Chore) => {
    if (chore.recurrence === 'daily' || chore.is_daily || chore.recurrence === 'weekdays') return 'today';
    
    if (chore.recurrence === 'weekly' && chore.recurrence_day) {
      const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      if (chore.recurrence_day === todayStr) return 'today';
      return 'upcoming';
    }

    if (chore.due_date) {
      const today = new Date();
      const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      if (chore.due_date <= localDate) return 'today'; // Overdue or today
      return 'upcoming';
    }
    
    return 'flexible';
  };

  const dueToday = pendingChores.filter(c => classifyChore(c) === 'today');
  const upcoming = pendingChores.filter(c => classifyChore(c) === 'upcoming');
  const flexible = pendingChores.filter(c => classifyChore(c) === 'flexible');

  const lifetime = profile.lifetime_points || 0;
  
  // Medallion Logic
  const medals = [
    { name: "Bronze Medal", threshold: 100, icon: Award, color: "text-amber-700", bg: "bg-amber-100", border: "border-amber-300" },
    { name: "Silver Medal", threshold: 500, icon: Shield, color: "text-slate-400", bg: "bg-slate-100", border: "border-slate-300" },
    { name: "Gold Medal", threshold: 1000, icon: Trophy, color: "text-yellow-500", bg: "bg-yellow-100", border: "border-yellow-300" },
    { name: "Platinum Star", threshold: 5000, icon: Star, color: "text-cyan-500", bg: "bg-cyan-100", border: "border-cyan-300" },
    { name: "Diamond Crown", threshold: 10000, icon: Crown, color: "text-indigo-500", bg: "bg-indigo-100", border: "border-indigo-300" },
  ];

  // Build Ledger timeline
  const ledgerItems = [
    ...completedChores.map(c => ({
      id: c.id,
      title: c.title,
      points: c.points,
      type: 'earned',
      date: c.created_at || new Date().toISOString()
    })),
    ...claims.map(c => ({
      id: c.id,
      title: c.rewards?.title || 'Reward',
      points: c.rewards?.points_cost || 0,
      type: 'spent',
      date: c.created_at
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleChoreComplete = async (id: string, currentStatus: string) => {
    setLoadingItems(prev => ({ ...prev, [id]: true }));
    try {
      if (currentStatus === "pending") {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
      await toggleChoreStatus(id, currentStatus);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingItems(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleLogProgress = async (id: string) => {
    setLoadingItems(prev => ({ ...prev, [id]: true }));
    try {
      await logGoalProgress(id, profile.id);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingItems(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="space-y-8 relative">
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <Confetti recycle={false} numberOfPieces={300} />
        </div>
      )}

      {/* Header Profile Section */}
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-8">
        <div className="h-32 w-32 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex flex-col items-center justify-center text-white shadow-lg border-4 border-white">
          <User className="h-12 w-12 mb-1" />
          <span className="font-bold">{profile.name}</span>
        </div>
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{profile.name}'s Dashboard</h1>
          <p className="text-gray-500 text-lg">Keep up the great work!</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-indigo-50 px-6 py-4 rounded-2xl border border-indigo-100 text-center">
            <p className="text-sm font-bold text-indigo-600 mb-1">Spendable Points</p>
            <p className="text-3xl font-black text-indigo-900">{profile.points_balance}</p>
          </div>
          <div className="bg-purple-50 px-6 py-4 rounded-2xl border border-purple-100 text-center">
            <p className="text-sm font-bold text-purple-600 mb-1">Lifetime Points</p>
            <p className="text-3xl font-black text-purple-900">{lifetime}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Calendar, Medals & Goals */}
        <div className="lg:col-span-1 space-y-8">
          
          <CalendarWidget initialEvents={events} />
          
          {/* Medallions Section */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Medallions
            </h2>
            <div className="space-y-4">
              {medals.map(medal => {
                const isUnlocked = lifetime >= medal.threshold;
                const Icon = medal.icon;
                return (
                  <div key={medal.name} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${isUnlocked ? `${medal.bg} ${medal.border} shadow-sm` : 'bg-gray-50 border-gray-100 opacity-60 grayscale'}`}>
                    <div className={`p-3 rounded-full bg-white shadow-sm ${isUnlocked ? medal.color : 'text-gray-400'}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className={`font-bold ${isUnlocked ? 'text-gray-900' : 'text-gray-500'}`}>{medal.name}</p>
                      <p className="text-xs font-semibold text-gray-500">Unlocks at {medal.threshold} pts</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Goals Progress */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Target className="h-6 w-6 text-pink-500" />
              My Goals
            </h2>
            {goals.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No goals assigned yet.</p>
            ) : (
              <div className="space-y-6">
                {goals.map(goal => {
                  const percent = Math.min(100, Math.round(((goal.current_points || 0) / goal.target_points) * 100));
                  return (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <p className="font-bold text-gray-800">{goal.title}</p>
                        <span className="text-xs font-bold text-pink-600 bg-pink-50 px-2 py-1 rounded-md">{percent}%</span>
                      </div>
                      <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden flex">
                        <div className="h-full bg-pink-500 rounded-full transition-all duration-1000" style={{ width: `${percent}%` }}></div>
                      </div>
                      <button 
                        onClick={() => handleLogProgress(goal.id)}
                        disabled={loadingItems[goal.id] || percent >= 100}
                        className="mt-2 w-full py-2 bg-gray-50 hover:bg-pink-50 text-pink-600 font-bold text-sm rounded-xl border border-gray-200 hover:border-pink-200 transition-colors flex justify-center items-center gap-2"
                      >
                        {loadingItems[goal.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log Progress"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Chores Feed */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <CheckSquare className="h-7 w-7 text-indigo-500" />
              My To-Do List
            </h2>
            
            {pendingChores.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-block p-4 bg-green-50 rounded-full text-green-500 mb-4">
                  <Star className="h-12 w-12" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">All Caught Up!</h3>
                <p className="text-gray-500">You've finished all your chores. Great job!</p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Due Today / Overdue */}
                {dueToday.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><AlertCircle className="h-4 w-4"/> Due Today</h3>
                    <div className="space-y-3">
                      {dueToday.map(chore => (
                        <div key={chore.id} className="flex items-center justify-between p-4 rounded-2xl border-2 border-red-100 hover:border-red-300 transition-colors bg-red-50/30 group">
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => handleChoreComplete(chore.id, chore.status)} 
                              disabled={loadingItems[chore.id]}
                              className="w-8 h-8 rounded-full border-2 border-red-300 hover:border-red-500 focus:outline-none transition-colors flex items-center justify-center bg-white"
                            >
                              {loadingItems[chore.id] && <Loader2 className="h-4 w-4 text-red-500 animate-spin" />}
                            </button>
                            <div>
                              <p className="font-bold text-gray-900 text-lg">{chore.title}</p>
                              <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-md mt-1 inline-block">High Priority</span>
                            </div>
                          </div>
                          <span className="font-black text-red-700 bg-red-100 px-4 py-2 rounded-xl">+{chore.points}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upcoming */}
                {upcoming.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-indigo-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><CalendarIcon className="h-4 w-4"/> Upcoming</h3>
                    <div className="space-y-3">
                      {upcoming.map(chore => (
                        <div key={chore.id} className="flex items-center justify-between p-4 rounded-2xl border border-indigo-100 hover:border-indigo-300 transition-colors bg-indigo-50/30 group">
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => handleChoreComplete(chore.id, chore.status)} 
                              disabled={loadingItems[chore.id]}
                              className="w-8 h-8 rounded-full border-2 border-indigo-200 hover:border-indigo-500 focus:outline-none transition-colors flex items-center justify-center bg-white"
                            >
                              {loadingItems[chore.id] && <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />}
                            </button>
                            <div>
                              <p className="font-bold text-gray-900 text-lg">{chore.title}</p>
                              {chore.due_date && <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md mt-1 inline-block">Due {chore.due_date}</span>}
                              {chore.recurrence_day && <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md mt-1 inline-block">Due {chore.recurrence_day}</span>}
                            </div>
                          </div>
                          <span className="font-black text-indigo-700 bg-indigo-100 px-4 py-2 rounded-xl">+{chore.points}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Flexible */}
                {flexible.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><CheckSquare className="h-4 w-4"/> Flexible (No Date)</h3>
                    <div className="space-y-3">
                      {flexible.map(chore => (
                        <div key={chore.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-gray-300 transition-colors bg-gray-50/50 group">
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => handleChoreComplete(chore.id, chore.status)} 
                              disabled={loadingItems[chore.id]}
                              className="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-gray-500 focus:outline-none transition-colors flex items-center justify-center bg-white"
                            >
                              {loadingItems[chore.id] && <Loader2 className="h-4 w-4 text-gray-500 animate-spin" />}
                            </button>
                            <div>
                              <p className="font-bold text-gray-900 text-lg">{chore.title}</p>
                              <span className="text-xs font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-md mt-1 inline-block">Anytime</span>
                            </div>
                          </div>
                          <span className="font-black text-yellow-600 bg-yellow-100 px-4 py-2 rounded-xl">+{chore.points}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

          {/* Point Ledger */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Award className="h-7 w-7 text-indigo-500" />
              Point Ledger
            </h2>
            
            {ledgerItems.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No point history yet. Start doing chores to earn points!</p>
            ) : (
              <div className="space-y-3">
                {ledgerItems.slice(0, 15).map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="font-bold text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-400">{new Date(item.date).toLocaleDateString()}</p>
                    </div>
                    {item.type === 'earned' ? (
                      <span className="font-bold text-green-600 bg-green-50 px-3 py-1 rounded-lg">+{item.points}</span>
                    ) : (
                      <span className="font-bold text-red-500 bg-red-50 px-3 py-1 rounded-lg">-{item.points}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
