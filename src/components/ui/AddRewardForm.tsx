"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { addReward } from "@/app/actions";

export function AddRewardForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState(100);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      await addReward(title, description, points);
      setTitle("");
      setDescription("");
      setPoints(100);
      setIsOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to add reward.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full mb-8 bg-indigo-50 border border-indigo-200 text-indigo-700 py-4 rounded-3xl font-bold flex justify-center items-center gap-2 hover:bg-indigo-100 transition-colors"
      >
        <Plus className="h-5 w-5" />
        Add New Reward (Parent Only)
      </button>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Create New Reward</h2>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Reward Title</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Ice Cream Trip, Stay up 1hr later"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/50"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Description (Optional)</label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add details about the reward..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/50 resize-none h-24"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Points Cost</label>
          <input 
            type="number" 
            value={points}
            onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
            min="1"
            className="w-full max-w-xs bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/50"
            required
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button 
            type="button" 
            onClick={() => setIsOpen(false)}
            className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isSaving || !title.trim() || points < 1}
            className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Save Reward
          </button>
        </div>
      </form>
    </div>
  );
}
