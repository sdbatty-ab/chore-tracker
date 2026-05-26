"use client";

import { useState } from "react";
import { Check, Circle } from "lucide-react";
import { motion } from "framer-motion";
import Confetti from "react-confetti";
import { toggleChoreStatus } from "@/app/actions";

export interface Chore {
  id: string;
  title: string;
  points: number;
  status: string;
}

interface ChoreChecklistProps {
  initialChores: Chore[];
}

export function ChoreChecklist({ initialChores }: ChoreChecklistProps) {
  const [chores, setChores] = useState<Chore[]>(initialChores);
  const [showConfetti, setShowConfetti] = useState(false);

  const toggleChore = async (id: string, currentStatus: string) => {
    // Optimistic UI update
    setChores((prev) =>
      prev.map((chore) => {
        if (chore.id === id) {
          const newStatus = currentStatus === "completed" ? "pending" : "completed";
          if (newStatus === "completed") {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000); // Stop confetti after 3s
          }
          return { ...chore, status: newStatus };
        }
        return chore;
      })
    );

    // Call the server action to update Supabase
    try {
      await toggleChoreStatus(id, currentStatus);
    } catch (e) {
      console.error("Failed to update chore", e);
      // Revert if failed (simplistic approach: just reload page)
      window.location.reload();
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
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                isCompleted 
                  ? "bg-gray-50 border-gray-100 opacity-60" 
                  : "bg-white border-gray-200 hover:border-indigo-300 shadow-sm"
              }`}
            >
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => toggleChore(chore.id, chore.status)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                    isCompleted 
                      ? "bg-green-500 text-white" 
                      : "bg-gray-100 text-gray-400 hover:bg-indigo-100 hover:text-indigo-600"
                  }`}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                </button>
                <span className={`font-medium ${isCompleted ? "line-through text-gray-500" : "text-gray-900"}`}>
                  {chore.title}
                </span>
              </div>
              <div className="flex items-center">
                <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-sm font-bold text-yellow-700">
                  +{chore.points} pts
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
