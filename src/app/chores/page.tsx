import { ChoreManager } from "@/components/ui/ChoreManager";
import { getChores, getProfiles, getFamily } from "../actions";

export const dynamic = "force-dynamic";

export default async function ChoresPage() {
  const chores = await getChores();
  const profiles = await getProfiles();
  const family = await getFamily();
  
  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full">
      <header className="mb-10 text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3 bg-teal-100 rounded-full mb-2">
          <span className="text-4xl">🧹</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
          Chore Management
        </h1>
        <p className="text-lg text-gray-500 font-medium max-w-2xl mx-auto">
          Create, assign, and approve chores to keep the house running smoothly!
        </p>
      </header>
      
      <ChoreManager 
        initialChores={chores as any[]} 
        profiles={profiles as any[]} 
        requireApproval={family?.require_approval ?? false}
      />
    </div>
  );
}
