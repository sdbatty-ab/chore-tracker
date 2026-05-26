"use client";

import { useState } from "react";
import { ShieldAlert, Target, Heart, Plus, Loader2, Sparkles, Trophy, Users, User, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { addRule, addGoal, removeRule, removeGoal } from "@/app/actions";

export interface Rule {
  id: string;
  title: string;
  description: string;
}

export interface Profile {
  id: string;
  name: string;
  points_balance: number;
  avatar_url?: string;
}

export interface Goal {
  id: string;
  title: string;
  target_points: number;
  current_points: number;
  profile_id?: string | null;
  profiles?: {
    name: string;
    avatar_url: string;
    points_balance: number;
  } | null;
}

interface GoalsAndRulesProps {
  initialRules: Rule[];
  initialGoals: Goal[];
  profiles: Profile[];
}

export function GoalsAndRules({ initialRules, initialGoals, profiles }: GoalsAndRulesProps) {
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newRuleTitle, setNewRuleTitle] = useState("");
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState(100);
  const [newGoalProfileId, setNewGoalProfileId] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleTitle.trim()) return;
    setLoadingAction("rule");
    try {
      await addRule(newRuleTitle);
      setNewRuleTitle("");
      setIsAddingRule(false);
    } catch (err) {
      console.error(err);
      alert("Failed to add rule");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim() || newGoalTarget <= 0) return;
    setLoadingAction("goal");
    try {
      await addGoal(newGoalTitle, newGoalTarget, newGoalProfileId);
      setNewGoalTitle("");
      setNewGoalTarget(100);
      setNewGoalProfileId(null);
      setIsAddingGoal(false);
    } catch (err) {
      console.error(err);
      alert("Failed to add goal");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Rules Section */}
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm flex flex-col h-full relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-6 -mt-6 bg-rose-50 w-32 h-32 rounded-full opacity-50 blur-2xl"></div>
        
        <div className="flex items-center justify-between mb-8 z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-rose-100 to-rose-200 text-rose-600 rounded-2xl shadow-sm border border-rose-50">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Household Rules</h2>
          </div>
          <button 
            onClick={() => setIsAddingRule(!isAddingRule)}
            className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl transition-colors"
          >
            <Plus className={`h-5 w-5 transition-transform duration-300 ${isAddingRule ? "rotate-45" : ""}`} />
          </button>
        </div>
        
        <AnimatePresence>
          {isAddingRule && (
            <motion.form 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-6 overflow-hidden z-10"
              onSubmit={handleAddRule}
            >
              <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100/50 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Rule Description</label>
                  <input 
                    type="text" 
                    value={newRuleTitle}
                    onChange={(e) => setNewRuleTitle(e.target.value)}
                    placeholder="e.g. Always say please and thank you"
                    className="w-full bg-white border border-rose-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-shadow"
                    autoFocus
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button 
                    type="button" 
                    onClick={() => setIsAddingRule(false)}
                    className="px-4 py-2 rounded-xl text-gray-500 font-medium hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={!newRuleTitle.trim() || loadingAction === "rule"}
                    className="bg-rose-500 hover:bg-rose-600 text-white px-5 py-2 rounded-xl font-bold transition-all shadow-sm shadow-rose-200 flex items-center gap-2 disabled:opacity-50"
                  >
                    {loadingAction === "rule" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Save Rule
                  </button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {initialRules.length === 0 ? (
           <div className="flex-1 flex flex-col items-center justify-center text-center py-10 opacity-70">
             <div className="text-4xl mb-4">🌪️</div>
             <p className="text-gray-500 italic font-medium">No rules defined yet.<br/>Sounds like anarchy! 😉</p>
           </div>
        ) : (
          <ul className="space-y-4 z-10 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {initialRules.map((rule, idx) => (
              <motion.li 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={rule.id} 
                className="group flex items-start gap-4 bg-white hover:bg-rose-50/30 p-5 rounded-2xl border border-gray-100 hover:border-rose-100 shadow-sm transition-all duration-300"
              >
                <div className="bg-rose-100 p-2 rounded-full mt-0.5 group-hover:scale-110 transition-transform duration-300">
                  <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
                </div>
                <div className="flex-1">
                  <span className="text-gray-800 font-semibold leading-relaxed block">{rule.title}</span>
                </div>
                <button
                  onClick={async () => {
                    if (confirm("Remove this rule?")) {
                      try {
                        await removeRule(rule.id);
                      } catch (e) {
                        alert("Failed to remove rule");
                      }
                    }
                  }}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </motion.li>
            ))}
          </ul>
        )}
      </div>

      {/* Goals Section */}
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm flex flex-col h-full relative overflow-hidden">
        <div className="absolute top-0 left-0 -ml-6 -mt-6 bg-indigo-50 w-32 h-32 rounded-full opacity-50 blur-2xl"></div>

        <div className="flex items-center justify-between mb-8 z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-600 rounded-2xl shadow-sm border border-indigo-50">
              <Target className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Family & Individual Goals</h2>
          </div>
          <button 
            onClick={() => setIsAddingGoal(!isAddingGoal)}
            className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl transition-colors"
          >
            <Plus className={`h-5 w-5 transition-transform duration-300 ${isAddingGoal ? "rotate-45" : ""}`} />
          </button>
        </div>
        
        <AnimatePresence>
          {isAddingGoal && (
            <motion.form 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-6 overflow-hidden z-10"
              onSubmit={handleAddGoal}
            >
              <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100/50 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">What's the goal?</label>
                  <input 
                    type="text" 
                    value={newGoalTitle}
                    onChange={(e) => setNewGoalTitle(e.target.value)}
                    placeholder="e.g. Disney Trip or New Bike"
                    className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-shadow"
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Target Points</label>
                    <input 
                      type="number" 
                      value={newGoalTarget}
                      onChange={(e) => setNewGoalTarget(Number(e.target.value))}
                      min={10}
                      className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Who is it for?</label>
                    <select 
                      value={newGoalProfileId || ""}
                      onChange={(e) => setNewGoalProfileId(e.target.value || null)}
                      className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-shadow text-gray-700"
                    >
                      <option value="">👨‍👩‍👧‍👦 Whole Family</option>
                      {profiles.map(profile => (
                        <option key={profile.id} value={profile.id}>
                          👤 {profile.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setIsAddingGoal(false)}
                    className="px-4 py-2 rounded-xl text-gray-500 font-medium hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={!newGoalTitle.trim() || newGoalTarget <= 0 || loadingAction === "goal"}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-bold transition-all shadow-sm shadow-indigo-200 flex items-center gap-2 disabled:opacity-50"
                  >
                    {loadingAction === "goal" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
                    Set Goal
                  </button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {initialGoals.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-10 opacity-70">
            <div className="text-4xl mb-4">🚀</div>
            <p className="text-gray-500 italic font-medium">No goals set yet.<br/>Time to dream big!</p>
          </div>
        ) : (
          <div className="space-y-6 z-10 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {initialGoals.map((goal, idx) => {
              const isIndividual = !!goal.profile_id && !!goal.profiles;
              const pointsToUse = isIndividual ? goal.profiles!.points_balance : goal.current_points;
              const progress = Math.min(100, Math.round((pointsToUse / goal.target_points) * 100));
              const isAchieved = progress >= 100;
              
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={goal.id} 
                  className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] hover:border-indigo-100 hover:shadow-[0_8px_30px_-10px_rgba(79,70,229,0.15)] transition-all duration-300 relative overflow-hidden group"
                >
                  {isAchieved && (
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-yellow-500/10 z-0 pointer-events-none"></div>
                  )}
                  
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {isIndividual ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                            <User className="h-3 w-3" /> {goal.profiles!.name}'s Goal
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md">
                            <Users className="h-3 w-3" /> Family Goal
                          </span>
                        )}
                      </div>
                      <h3 className="font-extrabold text-lg text-gray-900 flex items-center gap-2">
                        {goal.title}
                        {isAchieved && <Trophy className="h-5 w-5 text-yellow-500 fill-yellow-500" />}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-gray-100 text-gray-700 font-bold px-3 py-1.5 rounded-xl text-sm whitespace-nowrap ml-4">
                        {pointsToUse} <span className="text-gray-400 font-medium">/ {goal.target_points}</span>
                      </div>
                      <button
                        onClick={async () => {
                          if (confirm(`Remove the goal: ${goal.title}?`)) {
                            try {
                              await removeGoal(goal.id);
                            } catch (e) {
                              alert("Failed to remove goal");
                            }
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="relative z-10">
                    <div className="w-full bg-gray-100 rounded-full h-3 mb-2 overflow-hidden shadow-inner border border-gray-200/50">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                        className={`h-full rounded-full relative ${
                          isAchieved 
                            ? "bg-gradient-to-r from-yellow-400 to-yellow-500" 
                            : "bg-gradient-to-r from-indigo-500 to-purple-500"
                        }`}
                      >
                        <div className="absolute top-0 right-0 bottom-0 left-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTIwIDBMMCAyMFAwIDBMMjAgMjBaIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMikiLz48L3N2Zz4=')] opacity-30"></div>
                      </motion.div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <p className={`text-sm font-bold ${isAchieved ? "text-yellow-600" : "text-indigo-600"}`}>
                        {progress}% {isAchieved ? "Achieved! 🎉" : "There"}
                      </p>
                      {!isAchieved && (
                        <p className="text-xs font-medium text-gray-400">
                          {goal.target_points - pointsToUse} pts to go
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
