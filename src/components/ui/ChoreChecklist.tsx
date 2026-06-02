"use client";

import { useState } from "react";
import { Check, Circle, ChevronDown, ChevronUp, User, Loader2, Calendar as CalendarIcon, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import { toggleChoreStatus, completeUnassignedChore } from "@/app/actions";

export interface Chore {
  id: string;
  title: string;
  description?: string;
  points: number;
  status: string;
  assigned_to: string | null;
  recurrence?: string;
  due_date?: string | null;
  recurrence_day?: string | null;
  profiles?: { name: string } | null;
}

interface Profile {
  id: string;
  name: string;
  avatar_url?: string;
}

interface ChoreChecklistProps {
  initialChores: Chore[];
  profiles: Profile[];
}

export function ChoreChecklist({ initialChores, profiles }: ChoreChecklistProps) {
  const [chores, setChores] = useState<Chore[]>(initialChores);
  const [showConfetti, setShowConfetti] = useState(false);
  const [expandedChoreId, setExpandedChoreId] = useState<string | null>(null);
  
  // Unassigned Chore Modal State
  const [selectedUnassignedChore, setSelectedUnassignedChore] = useState<Chore | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleChore = async (chore: Chore) => {
    // Check if the assigned_to ID actually matches a family member's profile ID
    const isAssignedToValidProfile = profiles.some(p => p.id === chore.assigned_to);

    // If it's pending and not assigned to a valid profile, prompt for user!
    if (chore.status === "pending" && !isAssignedToValidProfile) {
      setSelectedUnassignedChore(chore);
      return;
    }

    // Normal optimistic UI update
    setChores((prev) =>
      prev.map((c) => {
        if (c.id === chore.id) {
          const newStatus = chore.status === "completed" || chore.status === "approved" ? "pending" : "completed";
          if (newStatus === "completed") {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000);
          }
          return { ...c, status: newStatus };
        }
        return c;
      })
    );

    try {
      await toggleChoreStatus(chore.id, chore.status);
    } catch (e) {
      console.error("Failed to update chore", e);
      window.location.reload();
    }
  };

  const handleClaimUnassignedChore = async (profileId: string) => {
    if (!selectedUnassignedChore) return;
    setIsSubmitting(true);
    
    // Optimistic
    setChores((prev) =>
      prev.map((c) => {
        if (c.id === selectedUnassignedChore.id) {
          return { ...c, status: "completed", assigned_to: profileId, profiles: profiles.find(p => p.id === profileId) };
        }
        return c;
      })
    );
    
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
    
    try {
      await completeUnassignedChore(selectedUnassignedChore.id, profileId);
    } catch (e) {
      console.error(e);
      window.location.reload();
    } finally {
      setIsSubmitting(false);
      setSelectedUnassignedChore(null);
    }
  };

  if (chores.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col items-center justify-center text-center h-48">
        <p className="text-gray-500 font-medium">No chores assigned today. Enjoy your free time! 🎉</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm relative">
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden rounded-2xl">
          <Confetti width={500} height={500} recycle={false} numberOfPieces={200} />
        </div>
      )}

      {/* Unassigned Chore Modal */}
      <AnimatePresence>
        {selectedUnassignedChore && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedUnassignedChore(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 shadow-xl max-w-sm w-full relative"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-2">Who completed this?</h3>
              <p className="text-gray-500 text-sm mb-6 font-medium">"{selectedUnassignedChore.title}" was an open chore. Select who did it to award the points!</p>
              
              <div className="space-y-3">
                {profiles.map(profile => (
                  <button 
                    key={profile.id}
                    disabled={isSubmitting}
                    onClick={() => handleClaimUnassignedChore(profile.id)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
                      {profile.avatar_url ? <img src={profile.avatar_url} className="rounded-full w-full h-full object-cover" /> : profile.name.charAt(0)}
                    </div>
                    <span className="font-bold text-gray-900">{profile.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <h2 className="text-xl font-bold text-gray-900 mb-6">Today's Chores</h2>
      
      <div className="space-y-3">
        {chores.map((chore) => {
          const isCompleted = chore.status === "completed" || chore.status === "approved";
          return (
            <motion.div 
              key={chore.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col p-4 rounded-xl border transition-all overflow-hidden ${
                isCompleted 
                  ? "bg-gray-50 border-gray-100 opacity-60" 
                  : "bg-white border-gray-200 hover:border-indigo-300 shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleChore(chore); }}
                    className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors flex-shrink-0 ${
                      isCompleted 
                        ? "bg-green-500 text-white" 
                        : "bg-gray-100 text-gray-400 hover:bg-indigo-100 hover:text-indigo-600"
                    }`}
                  >
                    {isCompleted ? <Check className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                  </button>
                  <div 
                    className="flex-1 cursor-pointer flex items-center justify-between"
                    onClick={() => setExpandedChoreId(expandedChoreId === chore.id ? null : chore.id)}
                  >
                    <div className="flex flex-col">
                      <span className={`font-medium ${isCompleted ? "line-through text-gray-500" : "text-gray-900"}`}>
                        {chore.title}
                      </span>
                      {chore.profiles && !isCompleted && (
                        <span className="text-xs font-bold text-indigo-500 flex items-center gap-1 mt-0.5">
                          <User className="h-3 w-3" /> {chore.profiles.name}
                        </span>
                      )}
                    </div>
                    {expandedChoreId === chore.id ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </div>
                </div>
                <div className="flex items-center ml-2 flex-shrink-0">
                  <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-sm font-bold text-yellow-700">
                    +{chore.points} pts
                  </span>
                </div>
              </div>

              <AnimatePresence>
                {expandedChoreId === chore.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 pb-2 pl-12 pr-4 space-y-3">
                      {chore.description && (
                        <p className="text-sm text-gray-600 flex items-start gap-2">
                          <FileText className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                          {chore.description}
                        </p>
                      )}
                      
                      {(chore.due_date || chore.recurrence_day) && (
                        <p className="text-sm text-indigo-600 font-medium flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 shrink-0" />
                          Due: {chore.due_date || chore.recurrence_day}
                        </p>
                      )}
                      
                      {!chore.description && !chore.due_date && !chore.recurrence_day && (
                        <p className="text-sm text-gray-400 italic">No additional details.</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
