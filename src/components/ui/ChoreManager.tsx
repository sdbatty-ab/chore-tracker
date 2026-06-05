"use client";

import { useState } from "react";
import { Plus, CheckCircle, Clock, Trash2, Check, User, Loader2, Lock, Unlock, Edit2, X } from "lucide-react";
import { addChore, toggleChoreStatus, approveChore, verifyPin, deleteChore, editChore, manualAdjustPoints } from "@/app/actions";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";

interface Profile {
  id: string;
  name: string;
  points_balance: number;
}

interface Chore {
  id: string;
  title: string;
  points: number;
  status: string;
  assigned_to: string | null;
  recurrence?: string;
  is_daily?: boolean;
  due_date?: string | null;
  recurrence_day?: string | null;
  profiles?: { name: string } | null;
}

interface ChoreManagerProps {
  initialChores: Chore[];
  profiles: Profile[];
  requireApproval: boolean;
}

export function ChoreManager({ initialChores, profiles, requireApproval }: ChoreManagerProps) {
  const [isAddingChore, setIsAddingChore] = useState(false);
  const [newChoreTitle, setNewChoreTitle] = useState("");
  const [newChorePoints, setNewChorePoints] = useState(10);
  const [newChoreAssignedTo, setNewChoreAssignedTo] = useState<string | null>(null);
  const [newChoreRecurrence, setNewChoreRecurrence] = useState("none");
  const [newChoreDueDate, setNewChoreDueDate] = useState("");
  const [newChoreRecurrenceDay, setNewChoreRecurrenceDay] = useState("Monday");
  const [isSaving, setIsSaving] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [pinError, setPinError] = useState(false);

  const [editingChoreId, setEditingChoreId] = useState<string | null>(null);
  
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [adjustAmounts, setAdjustAmounts] = useState<Record<string, number>>({});
  const [isAdjustingPoints, setIsAdjustingPoints] = useState<Record<string, boolean>>({});

  const pendingApprovalChores = initialChores.filter(c => c.status === "completed");
  const pendingChores = initialChores.filter(c => c.status === "pending");
  const completedChores = initialChores.filter(c => c.status === "approved" || (!requireApproval && c.status === "completed"));

  const handleAddChore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChoreTitle.trim()) return;
    setIsSaving(true);
    try {
      await addChore(
        newChoreTitle, 
        "Daily chore", 
        newChorePoints, 
        newChoreAssignedTo || "", 
        newChoreRecurrence, 
        newChoreRecurrence === "none" && newChoreDueDate ? newChoreDueDate : null, 
        newChoreRecurrence === "weekly" ? newChoreRecurrenceDay : null
      );
      setNewChoreTitle("");
      setNewChorePoints(10);
      setNewChoreAssignedTo(null);
      setNewChoreRecurrence("none");
      setNewChoreDueDate("");
      setNewChoreRecurrenceDay("Monday");
      setIsAddingChore(false);
    } catch (err) {
      console.error(err);
      alert("Failed to add chore");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditChore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChoreTitle.trim() || !editingChoreId) return;
    setIsSaving(true);
    try {
      await editChore(
        editingChoreId,
        newChoreTitle,
        newChorePoints,
        newChoreAssignedTo || "",
        newChoreRecurrence,
        newChoreRecurrence === "none" && newChoreDueDate ? newChoreDueDate : null,
        newChoreRecurrence === "weekly" ? newChoreRecurrenceDay : null
      );
      setEditingChoreId(null);
      setIsAddingChore(false);
    } catch (err) {
      console.error(err);
      alert("Failed to edit chore");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteChore = async (id: string) => {
    if (!confirm("Are you sure you want to delete this chore?")) return;
    try {
      await deleteChore(id);
    } catch (err) {
      console.error(err);
      alert("Failed to delete chore");
    }
  };

  const startEditing = (chore: Chore) => {
    if (!isUnlocked) {
      setShowUnlockModal(true);
      return;
    }
    setEditingChoreId(chore.id);
    setNewChoreTitle(chore.title);
    setNewChorePoints(chore.points);
    setNewChoreAssignedTo(chore.assigned_to);
    setNewChoreRecurrence(chore.recurrence || "none");
    setNewChoreDueDate(chore.due_date || "");
    setNewChoreRecurrenceDay(chore.recurrence_day || "Monday");
    setIsAddingChore(true);
  };

  const handleVerifyPin = async () => {
    if (pinInput.length !== 4) return;
    setIsVerifyingPin(true);
    setPinError(false);
    try {
      const isValid = await verifyPin(pinInput);
      if (isValid) {
        setIsUnlocked(true);
        setShowUnlockModal(false);
        setPinInput("");
      } else {
        setPinError(true);
        setPinInput("");
      }
    } catch (e) {
      setPinError(true);
    } finally {
      setIsVerifyingPin(false);
    }
  };

  const handleToggle = async (id: string, status: string) => {
    try {
      if (status === "pending" && !requireApproval) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
      await toggleChoreStatus(id, status);
    } catch (err) {
      console.error(err);
      alert("Failed to update chore");
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      await approveChore(id);
    } catch (err) {
      console.error(err);
      alert("Failed to approve chore");
    }
  };

  const handleAdjustPoints = async (profileId: string, isDeduction: boolean) => {
    const amount = adjustAmounts[profileId] || 0;
    if (amount <= 0) return;
    
    setIsAdjustingPoints(prev => ({ ...prev, [profileId]: true }));
    try {
      const finalAmount = isDeduction ? -amount : amount;
      await manualAdjustPoints(profileId, finalAmount);
      setAdjustAmounts(prev => ({ ...prev, [profileId]: 0 }));
    } catch (err) {
      console.error(err);
      alert("Failed to adjust points");
    } finally {
      setIsAdjustingPoints(prev => ({ ...prev, [profileId]: false }));
    }
  };

  return (
    <div className="space-y-8 relative">
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <Confetti recycle={false} numberOfPieces={300} />
        </div>
      )}

      {/* Unlock Modal */}
      <AnimatePresence>
        {showUnlockModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 shadow-xl max-w-sm w-full relative"
            >
              <button onClick={() => setShowUnlockModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Lock className="h-5 w-5 text-teal-600" /> Parent Unlock
              </h3>
              <p className="text-gray-500 text-sm mb-6">Enter your PIN to manage chores.</p>
              <div className="flex gap-2">
                <input 
                  type="password" pattern="[0-9]*" inputMode="numeric" maxLength={4}
                  placeholder="PIN" value={pinInput} autoFocus
                  onChange={(e) => {
                    setPinInput(e.target.value.replace(/[^0-9]/g, ''));
                    setPinError(false);
                  }}
                  className={`flex-1 bg-gray-50 border rounded-xl px-4 py-3 text-center text-lg tracking-widest font-bold focus:ring-2 focus:ring-teal-500/50 ${pinError ? 'border-red-300 text-red-900 bg-red-50' : 'border-gray-200'}`}
                />
                <button 
                  onClick={handleVerifyPin} disabled={pinInput.length !== 4 || isVerifyingPin}
                  className="bg-gray-900 text-white px-6 rounded-xl hover:bg-gray-800 disabled:opacity-50 font-bold"
                >
                  {isVerifyingPin ? <Loader2 className="h-5 w-5 animate-spin" /> : "Unlock"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manage Points Modal */}
      <AnimatePresence>
        {showPointsModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 shadow-xl max-w-md w-full relative"
            >
              <button onClick={() => setShowPointsModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                Manage Points
              </h3>
              
              <div className="space-y-4">
                {profiles.map(profile => (
                  <div key={profile.id} className="flex flex-col gap-2 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-900">{profile.name}</span>
                      <span className="text-sm font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-lg">{profile.points_balance} pts</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <input 
                        type="number"
                        min="1"
                        placeholder="Amount"
                        value={adjustAmounts[profile.id] || ''}
                        onChange={(e) => setAdjustAmounts(prev => ({ ...prev, [profile.id]: Number(e.target.value) }))}
                        className="w-24 bg-white border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-teal-500"
                      />
                      <button 
                        onClick={() => handleAdjustPoints(profile.id, true)}
                        disabled={isAdjustingPoints[profile.id] || !adjustAmounts[profile.id]}
                        className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-bold py-2 rounded-xl transition-colors disabled:opacity-50"
                      >
                        Remove
                      </button>
                      <button 
                        onClick={() => handleAdjustPoints(profile.id, false)}
                        disabled={isAdjustingPoints[profile.id] || !adjustAmounts[profile.id]}
                        className="flex-1 bg-teal-100 hover:bg-teal-200 text-teal-700 font-bold py-2 rounded-xl transition-colors disabled:opacity-50"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Action Bar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex-wrap gap-4">
        {isUnlocked ? (
          <div className="flex items-center gap-2 text-teal-600 font-bold px-4 py-2 bg-teal-50 rounded-xl">
            <Unlock className="h-5 w-5" /> Parent Mode Unlocked
            <button onClick={() => setIsUnlocked(false)} className="ml-4 text-xs bg-teal-200 hover:bg-teal-300 text-teal-800 px-3 py-1 rounded-lg transition-colors">Lock</button>
          </div>
        ) : (
          <button onClick={() => setShowUnlockModal(true)} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold px-4 py-2 transition-colors">
            <Lock className="h-5 w-5" /> Parent Mode
          </button>
        )}
        <div className="flex gap-2 w-full sm:w-auto">
          {isUnlocked && (
            <button 
              onClick={() => setShowPointsModal(true)}
              className="bg-teal-100 hover:bg-teal-200 text-teal-700 px-6 py-3 rounded-2xl font-bold transition-colors flex-1 sm:flex-none"
            >
              Manage Points
            </button>
          )}
          <button 
            onClick={() => {
              if (!isUnlocked) {
                setShowUnlockModal(true);
                return;
              }
              if (!isAddingChore) {
                setEditingChoreId(null);
                setNewChoreTitle("");
                setNewChorePoints(10);
              }
              setIsAddingChore(!isAddingChore);
            }}
            className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-md flex-1 sm:flex-none"
          >
            <Plus className={`h-5 w-5 transition-transform ${isAddingChore ? "rotate-45" : ""}`} />
            {isAddingChore ? "Cancel" : "Add Chore"}
          </button>
        </div>
      </div>

      {/* Add Chore Form */}
      <AnimatePresence>
        {isAddingChore && (
          <motion.form 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
            onSubmit={editingChoreId ? handleEditChore : handleAddChore}
          >
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Chore Title</label>
                <input 
                  type="text" 
                  value={newChoreTitle}
                  onChange={(e) => setNewChoreTitle(e.target.value)}
                  placeholder="e.g. Empty the dishwasher"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500/50"
                  autoFocus
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Points</label>
                <input 
                  type="number" 
                  value={newChorePoints}
                  onChange={(e) => setNewChorePoints(Number(e.target.value))}
                  min={0}
                  className="w-full bg-gray-50 border border-teal-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500/50 outline-none"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Assign To</label>
                <select 
                  value={newChoreAssignedTo || ""}
                  onChange={(e) => setNewChoreAssignedTo(e.target.value || null)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500/50 text-gray-700"
                >
                  <option value="">Anyone</option>
                  {profiles.map(profile => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-4 flex items-center justify-between mt-2 gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Repeat</label>
                  <select 
                    value={newChoreRecurrence}
                    onChange={(e) => setNewChoreRecurrence(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500/50 text-gray-700"
                  >
                    <option value="none">Does Not Repeat</option>
                    <option value="daily">Daily (Every Day)</option>
                    <option value="weekdays">Weekdays (Mon-Fri)</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                
                {newChoreRecurrence === "none" && (
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Due Date (Optional)</label>
                    <input 
                      type="date"
                      value={newChoreDueDate}
                      onChange={(e) => setNewChoreDueDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500/50 text-gray-700"
                    />
                  </div>
                )}

                {newChoreRecurrence === "weekly" && (
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Day of Week</label>
                    <select 
                      value={newChoreRecurrenceDay}
                      onChange={(e) => setNewChoreRecurrenceDay(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-teal-500/50 text-gray-700"
                    >
                      {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={!newChoreTitle.trim() || isSaving}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 mt-auto ml-auto"
                >
                  {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : (editingChoreId ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />)}
                  {editingChoreId ? "Save Changes" : "Create Chore"}
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Pending Approval (Only if setting is ON) */}
        {requireApproval && (
          <div className="bg-orange-50/50 rounded-3xl border border-orange-100 p-6 lg:col-span-2">
            <h2 className="text-xl font-bold text-orange-900 mb-4 flex items-center gap-2">
              <Clock className="h-6 w-6 text-orange-500" />
              Needs Parent Approval
            </h2>
            {pendingApprovalChores.length === 0 ? (
              <p className="text-orange-600/70 italic text-sm">Nothing waiting for approval right now.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingApprovalChores.map(chore => (
                  <div key={chore.id} className="bg-white p-4 rounded-2xl border border-orange-200 shadow-sm flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">{chore.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-md">+{chore.points} pts</span>
                        {chore.profiles && <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md flex items-center gap-1"><User className="h-3 w-3"/> {chore.profiles.name}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleToggle(chore.id, chore.status)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors" title="Reject / Undo">
                        <Trash2 className="h-5 w-5" />
                      </button>
                      <button onClick={() => handleApprove(chore.id)} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold text-sm transition-colors flex items-center gap-1">
                        <Check className="h-4 w-4" /> Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* To Do List */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-indigo-500" />
            To Do
          </h2>
          {pendingChores.length === 0 ? (
            <p className="text-gray-500 italic text-center py-8">All caught up! 🎉</p>
          ) : (
            <div className="space-y-3">
              {pendingChores.map(chore => (
                <div key={chore.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-indigo-200 transition-colors bg-gray-50/50">
                  <div className="flex items-center gap-4">
                    <button onClick={() => handleToggle(chore.id, chore.status)} className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-indigo-500 focus:outline-none transition-colors"></button>
                    <div>
                      <p className="font-medium text-gray-900 flex items-center gap-2">
                        {chore.title}
                        {(chore.recurrence === "daily" || chore.recurrence === "weekdays" || chore.recurrence === "weekly" || chore.is_daily) && (
                          <span className="text-[10px] uppercase font-bold bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded flex items-center gap-1">
                            🔁 {chore.recurrence || 'daily'}
                          </span>
                        )}
                      </p>
                      {chore.profiles && (
                        <p className="text-xs font-semibold text-indigo-500 mt-0.5 flex items-center gap-1">
                          <User className="h-3 w-3" /> {chore.profiles.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full text-sm">+{chore.points}</span>
                    {isUnlocked && (
                      <div className="flex gap-1 ml-2">
                        <button onClick={() => startEditing(chore)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Edit">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDeleteChore(chore.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm opacity-80">
          <h2 className="text-xl font-bold text-gray-500 mb-6 flex items-center gap-2">
            <Check className="h-6 w-6 text-green-500" />
            Completed
          </h2>
          {completedChores.length === 0 ? (
            <p className="text-gray-400 italic text-center py-8">No completed chores yet.</p>
          ) : (
            <div className="space-y-3">
              {completedChores.map(chore => (
                <div key={chore.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-4">
                    <button onClick={() => handleToggle(chore.id, chore.status)} className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors">
                      <Check className="h-4 w-4" />
                    </button>
                    <div>
                      <p className="font-medium text-gray-500 line-through">{chore.title}</p>
                      {chore.profiles && (
                        <p className="text-xs font-semibold text-gray-400 mt-0.5">
                          {chore.profiles.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="font-bold text-gray-400 text-sm">{chore.points} pts</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
