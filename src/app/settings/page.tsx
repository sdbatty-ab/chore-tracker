import { FamilyMembersSettings } from "@/components/ui/FamilyMembersSettings";
import { CalendarSettings } from "@/components/ui/CalendarSettings";
import { PinLock } from "@/components/ui/PinLock";
import { getFamily, getProfiles, getCalendarLinks } from "../actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const family = await getFamily();
  const profiles = await getProfiles();
  const calendarLinks = await getCalendarLinks();
  
  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full">
      <header className="mb-10 text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3 bg-slate-100 rounded-full mb-2">
          <span className="text-4xl">⚙️</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
          Settings & Profiles
        </h1>
        <p className="text-lg text-gray-500 font-medium max-w-2xl mx-auto">
          Manage your family members and household preferences.
        </p>
      </header>
      <PinLock>
        <div className="mb-12">
          <FamilyMembersSettings initialFamily={family as any} initialProfiles={profiles as any[]} />
        </div>
        
        <div className="mb-12">
          <CalendarSettings initialLinks={calendarLinks as any[]} />
        </div>
      </PinLock>
    </div>
  );
}
