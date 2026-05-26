"use client";

import { useState, useEffect } from "react";
import { Camera, Image as ImageIcon, Upload, Loader2, Trash2, X, Download } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

export function FamilyPhotoGallery() {
  const [photos, setPhotos] = useState<{name: string, url: string}[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<{name: string, url: string} | null>(null);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.storage.from("family-photos").list();
    if (error) {
      console.error("Error fetching photos:", error);
    } else if (data) {
      const files = data.filter(file => file.name !== ".emptyFolderPlaceholder");
      
      const photosWithUrls = files.map(file => {
        const { data: publicUrlData } = supabase.storage
          .from("family-photos")
          .getPublicUrl(file.name);
        return { name: file.name, url: publicUrlData.publicUrl };
      });
      setPhotos(photosWithUrls.reverse());
    }
    setIsLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsUploading(true);
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("family-photos")
      .upload(fileName, file);

    if (error) {
      console.error("Upload error:", error);
      alert("Failed to upload photo.");
    } else {
      fetchPhotos(); 
    }
    setIsUploading(false);
  };

  const deletePhoto = async (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this photo?")) return;
    const { error } = await supabase.storage.from("family-photos").remove([name]);
    if (!error) {
      if (selectedPhoto?.name === name) setSelectedPhoto(null);
      fetchPhotos();
    }
  };

  return (
    <div className="space-y-8">
      {/* Action Bar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 px-2">
          <div className="bg-pink-100 text-pink-600 p-2.5 rounded-2xl">
            <Camera className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 hidden sm:block">Memories</h2>
        </div>
        <label className={`cursor-pointer flex items-center gap-2 bg-gray-900 text-white hover:bg-gray-800 px-6 py-3 rounded-2xl font-bold transition-all shadow-md active:scale-95 ${isUploading ? 'opacity-70 cursor-wait' : ''}`}>
          {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
          {isUploading ? "Uploading..." : "Upload Photo"}
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileUpload}
            disabled={isUploading}
          />
        </label>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="h-96 flex flex-col items-center justify-center text-gray-400 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <Loader2 className="h-10 w-10 animate-spin text-pink-400 mb-4" />
          <p className="font-medium">Developing photos...</p>
        </div>
      ) : photos.length === 0 ? (
        <div className="h-96 flex flex-col items-center justify-center text-gray-400 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="bg-gray-50 p-6 rounded-full mb-4">
            <ImageIcon className="h-12 w-12 text-gray-300" />
          </div>
          <p className="font-bold text-xl text-gray-700 mb-1">No photos yet</p>
          <p className="font-medium">Upload your first family memory!</p>
        </div>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {photos.map((photo, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.05, 0.5) }}
              key={photo.name} 
              layoutId={`photo-container-${photo.name}`}
              className="relative rounded-2xl overflow-hidden cursor-pointer group break-inside-avoid shadow-sm hover:shadow-xl hover:shadow-pink-100/50 transition-all border border-gray-100/50 bg-white"
              onClick={() => setSelectedPhoto(photo)}
            >
              <motion.img 
                layoutId={`photo-${photo.name}`}
                src={photo.url} 
                alt="Family memory" 
                className="w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <button 
                onClick={(e) => deletePhoto(photo.name, e)}
                className="absolute top-3 right-3 bg-red-500/90 text-white p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-600 hover:scale-110 shadow-lg translate-y-2 group-hover:translate-y-0"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
          >
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer" 
              onClick={() => setSelectedPhoto(null)}
            />
            
            <motion.div 
              layoutId={`photo-container-${selectedPhoto.name}`}
              className="relative w-full max-w-5xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-full"
            >
              <div className="absolute top-4 right-4 flex gap-2 z-10">
                <a 
                  href={selectedPhoto.url} 
                  download 
                  target="_blank"
                  rel="noreferrer"
                  className="bg-black/50 hover:bg-black/80 backdrop-blur-md text-white p-3 rounded-2xl transition-colors"
                >
                  <Download className="h-5 w-5" />
                </a>
                <button 
                  onClick={() => setSelectedPhoto(null)}
                  className="bg-black/50 hover:bg-black/80 backdrop-blur-md text-white p-3 rounded-2xl transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="flex-1 bg-gray-100 flex items-center justify-center overflow-hidden min-h-[50vh]">
                <motion.img 
                  layoutId={`photo-${selectedPhoto.name}`}
                  src={selectedPhoto.url} 
                  alt="Fullscreen family memory" 
                  className="w-full h-full object-contain"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
