"use client";

import { useState } from "react";
import { UserPlus, Settings, Shield, User, Loader2, Save, Trash2, Key } from "lucide-react";
import { updateFamilySettings, addProfile, removeProfile, updatePin } from "@/app/actions";
import { motion } from "framer-motion";

export interface Family {
  id: string;
  name: string;
  require_approval: boolean;
}

export interface Profile {
  id: string;
  name: string;
  role: string;
  points_balance: number;
}

interface SettingsProps {
  initialFamily: Family | null;
  initialProfiles: Profile[];
}

export function FamilyMembersSettings({ initialFamily, initialProfiles }: SettingsProps) {
  const [requireApproval, setRequireApproval] = useState(initialFamily?.require_approval ?? false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  
  const [newPin, setNewPin] = useState("");
  const [isSavingPin, setIsSavingPin] = useState(false);
  
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileRole, setNewProfileRole] = useState("kid");
  const [isAddingProfile, setIsAddingProfile] = useState(false);

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await updateFamilySettings(requireApproval);
      alert("Settings saved!");
    } catch (e) {
      console.error(e);
      alert("Failed to save settings");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4) return;
    setIsSavingPin(true);
    try {
      await updatePin(newPin);
      alert("PIN updated successfully!");
      setNewPin("");
    } catch (e) {
      console.error(e);
      alert("Failed to update PIN");
    } finally {
      setIsSavingPin(false);
    }
  };

  const handleAddProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;
    setIsAddingProfile(true);
    try {
      await addProfile(newProfileName, newProfileRole);
      setNewProfileName("");
    } catch (e) {
      console.error(e);
      alert("Failed to add profile. Note: If this fails due to auth constraint, you need to run the SQL script to remove the auth.users foreign key on profiles.");
    } finally {
      setIsAddingProfile(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Household Settings */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-slate-100 text-slate-600 rounded-xl">
              <Settings className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Preferences</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div>
                <p className="font-bold text-gray-900">Require Parent Approval</p>
                <p className="text-sm text-gray-500 mt-1">If enabled, kids cannot instantly earn points. Parents must approve completed chores first.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-1">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={requireApproval}
                  onChange={(e) => setRequireApproval(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            
            <button 
              onClick={handleSaveSettings}
              disabled={isSavingSettings}
              className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
            >
              {isSavingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Preferences
            </button>
          </div>
        </div>

        {/* Change PIN Settings */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm mt-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-slate-100 text-slate-600 rounded-xl">
              <Key className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Parent PIN</h2>
          </div>
          
          <form onSubmit={handleSavePin} className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <label className="block text-sm font-bold text-gray-900 mb-2">New 4-Digit PIN</label>
              <input 
                type="password" 
                pattern="[0-9]*" 
                inputMode="numeric"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="e.g. 1234"
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/50 text-center text-2xl tracking-widest"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={newPin.length !== 4 || isSavingPin}
              className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {isSavingPin ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Change PIN
            </button>
          </form>
        </div>
      </div>

      {/* Family Members */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                <User className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Family Members</h2>
            </div>
          </div>

          {/* Add Profile Form */}
          <form onSubmit={handleAddProfile} className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 mb-8 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
              <input 
                type="text" 
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder="e.g. Timmy"
                className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Role</label>
              <select 
                value={newProfileRole}
                onChange={(e) => setNewProfileRole(e.target.value)}
                className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="kid">Kid</option>
                <option value="parent">Parent</option>
              </select>
            </div>
            <div className="md:col-span-1">
              <button 
                type="submit" 
                disabled={!newProfileName.trim() || isAddingProfile}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isAddingProfile ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
                Add Member
              </button>
            </div>
          </form>

          {/* Profiles List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {initialProfiles.map((profile) => (
              <motion.div 
                key={profile.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl hover:border-indigo-100 hover:shadow-md transition-all bg-white"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                    profile.role === 'parent' ? 'bg-slate-100 text-slate-700' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {profile.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{profile.name}</h3>
                    <span className={`text-xs font-bold uppercase tracking-wider ${
                      profile.role === 'parent' ? 'text-slate-500' : 'text-indigo-500'
                    }`}>
                      {profile.role}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-right">
                  {profile.role === 'kid' && (
                    <div>
                      <p className="text-2xl font-black text-yellow-500">{profile.points_balance}</p>
                      <p className="text-xs font-bold text-gray-400">PTS</p>
                    </div>
                  )}
                  <button 
                    onClick={async () => {
                      if (confirm(`Are you sure you want to remove ${profile.name}?`)) {
                        try {
                          await removeProfile(profile.id);
                        } catch (e) {
                          console.error(e);
                          alert("Failed to remove profile");
                        }
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    title={`Remove ${profile.name}`}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>
            ))}
            
            {initialProfiles.length === 0 && (
              <div className="col-span-2 text-center py-8 text-gray-500 italic">
                No family members added yet. Start by adding yourselves!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
