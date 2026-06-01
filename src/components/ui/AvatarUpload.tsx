"use client";

import { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { uploadProfileImage } from "@/app/actions";

interface AvatarUploadProps {
  profileId: string;
  currentAvatarUrl: string | null;
  name: string;
  size?: "sm" | "lg";
}

export function AvatarUpload({ profileId, currentAvatarUrl, name, size = "sm" }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await uploadProfileImage(profileId, formData);
    } catch (err) {
      console.error("Failed to upload image", err);
      alert("Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  const containerClasses = size === "sm" 
    ? "h-16 w-16 text-xl border-2" 
    : "h-32 w-32 text-4xl border-4";

  return (
    <div className={`relative rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-md border-white transition-transform group ${containerClasses}`}>
      {currentAvatarUrl ? (
        <img src={currentAvatarUrl} className="rounded-full w-full h-full object-cover" alt={name} />
      ) : (
        <span>{name.charAt(0)}</span>
      )}

      {/* Overlay Upload Button */}
      <div 
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); fileInputRef.current?.click(); }}
        className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
      >
        {isUploading ? <Loader2 className="h-6 w-6 animate-spin text-white" /> : <Camera className="h-6 w-6 text-white" />}
      </div>

      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange}
      />
    </div>
  );
}
