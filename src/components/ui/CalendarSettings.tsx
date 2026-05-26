"use client";

import { useState } from "react";
import { Link as LinkIcon, Trash2, Loader2, Plus, Globe } from "lucide-react";
import { addCalendarLink, removeCalendarLink } from "@/app/actions";

interface CalendarLink {
  id: string;
  name: string;
  url: string;
}

export function CalendarSettings({ initialLinks }: { initialLinks: CalendarLink[] }) {
  const [newUrl, setNewUrl] = useState("");
  const [newName, setNewName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleAddUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim() || !newName.trim()) return;
    
    setIsSaving(true);
    try {
      await addCalendarLink(newName, newUrl);
      setNewUrl("");
      setNewName("");
    } catch (error) {
      console.error(error);
      alert("Failed to add calendar URL.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Remove this synced calendar?")) return;
    try {
      await removeCalendarLink(id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm mt-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
          <LinkIcon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Synced Calendars</h2>
          <p className="text-sm text-gray-500">Automatically sync events from Apple or Google Calendar.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="space-y-3">
            {initialLinks.map(link => (
              <div key={link.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Globe className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                  <p className="font-bold text-gray-700 truncate text-sm">{link.name}</p>
                </div>
                <button onClick={() => handleRemove(link.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {initialLinks.length === 0 && (
              <p className="text-sm text-gray-500 italic py-2">No calendars synced yet.</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-3 border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-6">Add New Calendar</h3>
          <form onSubmit={handleAddUrl} className="space-y-3 md:pl-6">
            <input 
              type="text" 
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Mom's Work"
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/50 text-sm"
              required
            />
            <input 
              type="url" 
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://.../basic.ics"
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/50 text-sm"
              required
            />
            <button 
              type="submit"
              disabled={isSaving || !newUrl.trim() || !newName.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add Calendar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
