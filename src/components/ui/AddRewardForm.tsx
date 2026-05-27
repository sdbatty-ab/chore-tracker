"use client";

import { useState, useRef } from "react";
import { Plus, Loader2, Image as ImageIcon, X } from "lucide-react";
import { addReward, uploadRewardImage } from "@/app/actions";

export function AddRewardForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState(100);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      let imageUrl = null;
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        imageUrl = await uploadRewardImage(formData);
      }
      
      await addReward(title, description, points, imageUrl);
      setTitle("");
      setDescription("");
      setPoints(100);
      setImageFile(null);
      setImagePreview(null);
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

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Reward Image (Optional)</label>
          {imagePreview ? (
            <div className="relative inline-block">
              <img src={imagePreview} alt="Preview" className="h-32 w-32 object-cover rounded-2xl border-2 border-indigo-100 shadow-sm" />
              <button 
                type="button"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="absolute -top-2 -right-2 bg-white text-gray-500 hover:text-red-500 rounded-full p-1 shadow-md border border-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-32 w-32 bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-500 hover:bg-gray-100 hover:border-indigo-300 hover:text-indigo-500 transition-colors"
            >
              <ImageIcon className="h-6 w-6" />
              <span className="text-xs font-bold">Upload Image</span>
            </button>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageChange} 
            accept="image/*" 
            className="hidden" 
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
