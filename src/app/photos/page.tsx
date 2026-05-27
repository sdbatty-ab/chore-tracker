import { FamilyPhotoGallery } from "@/components/ui/FamilyPhotoGallery";

export const dynamic = "force-dynamic";

export default function PhotosPage() {
  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full">
      <header className="mb-10 text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3 bg-pink-100 rounded-full mb-2">
          <span className="text-4xl">📸</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
          Family Gallery
        </h1>
        <p className="text-lg text-gray-500 font-medium max-w-2xl mx-auto">
          Capture and share all the messy, beautiful, and hilarious moments together.
        </p>
      </header>
      
      <FamilyPhotoGallery />
    </div>
  );
}
