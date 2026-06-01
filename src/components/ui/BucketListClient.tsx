"use client";

import { useState } from "react";
import { Plus, Trash2, CheckSquare, Square, Loader2 } from "lucide-react";
import { addBucketListItem, toggleBucketListItem, deleteBucketListItem } from "@/app/actions";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";

interface BucketListItem {
  id: string;
  title: string;
  is_completed: boolean;
}

export function BucketListClient({ initialItems }: { initialItems: BucketListItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;
    setIsAdding(true);
    
    // Optimistic
    const fakeId = `temp-${Date.now()}`;
    setItems([{ id: fakeId, title: newItemTitle, is_completed: false }, ...items]);
    const title = newItemTitle;
    setNewItemTitle("");
    
    try {
      await addBucketListItem(title);
    } catch (e) {
      console.error(e);
      window.location.reload();
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggle = async (item: BucketListItem) => {
    const newStatus = !item.is_completed;
    if (newStatus) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
    
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_completed: newStatus } : i));
    
    try {
      await toggleBucketListItem(item.id, newStatus);
    } catch (e) {
      console.error(e);
      window.location.reload();
    }
  };

  const handleDelete = async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    try {
      await deleteBucketListItem(id);
    } catch (e) {
      console.error(e);
      window.location.reload();
    }
  };

  const uncompleted = items.filter(i => !i.is_completed);
  const completed = items.filter(i => i.is_completed);

  return (
    <div className="space-y-8 relative">
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          <Confetti width={typeof window !== 'undefined' ? window.innerWidth : 500} height={typeof window !== 'undefined' ? window.innerHeight : 500} recycle={false} numberOfPieces={300} />
        </div>
      )}

      {/* Add New Item Form */}
      <form onSubmit={handleAdd} className="bg-white rounded-3xl p-6 shadow-sm border-2 border-cyan-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-400 via-yellow-400 to-pink-400"></div>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <input
            type="text"
            placeholder="e.g. Go to the beach, Build a fort..."
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            className="flex-1 bg-cyan-50 border-cyan-100 focus:border-cyan-400 focus:ring-cyan-400 text-lg rounded-2xl w-full px-4 py-3 outline-none transition-all placeholder:text-cyan-300 font-medium text-cyan-900"
          />
          <button 
            type="submit"
            disabled={isAdding || !newItemTitle.trim()}
            className="w-full sm:w-auto px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-2xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
          >
            {isAdding ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-6 w-6" />}
            Add Idea
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Uncompleted Items */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="bg-yellow-100 text-yellow-600 w-8 h-8 rounded-full flex items-center justify-center">🎯</span>
            To Do
          </h2>
          {uncompleted.length === 0 ? (
            <p className="text-gray-500 italic text-center py-8">Add some fun ideas to your bucket list!</p>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {uncompleted.map(item => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                    key={item.id} 
                    className="flex items-center justify-between p-4 rounded-2xl border-2 border-dashed border-gray-200 hover:border-cyan-300 hover:bg-cyan-50/50 transition-all group"
                  >
                    <button onClick={() => handleToggle(item)} className="flex items-center gap-4 flex-1 text-left">
                      <Square className="h-6 w-6 text-gray-300 group-hover:text-cyan-500 transition-colors flex-shrink-0" />
                      <span className="font-bold text-gray-800 text-lg">{item.title}</span>
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Completed Items */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 opacity-80">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="bg-green-100 text-green-600 w-8 h-8 rounded-full flex items-center justify-center">🎉</span>
            Completed
          </h2>
          {completed.length === 0 ? (
            <p className="text-gray-500 italic text-center py-8">Check items off to see them here!</p>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {completed.map(item => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                    key={item.id} 
                    className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50 transition-all group"
                  >
                    <button onClick={() => handleToggle(item)} className="flex items-center gap-4 flex-1 text-left opacity-60 hover:opacity-100">
                      <CheckSquare className="h-6 w-6 text-green-500 flex-shrink-0" />
                      <span className="font-bold text-gray-500 text-lg line-through">{item.title}</span>
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
