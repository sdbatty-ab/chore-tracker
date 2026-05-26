import { GoalsAndRules } from "@/components/ui/GoalsAndRules";
import { getGoals, getRules, getProfiles } from "../actions";

export default async function RulesPage() {
  const rules = await getRules();
  const goals = await getGoals();
  const profiles = await getProfiles();
  
  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full">
      <header className="mb-10 text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3 bg-rose-100 rounded-full mb-2">
          <span className="text-4xl">📜</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
          Rules & Goals
        </h1>
        <p className="text-lg text-gray-500 font-medium max-w-2xl mx-auto">
          Our family guidelines to live by, and the big goals we're working towards together!
        </p>
      </header>
      
      <GoalsAndRules 
        initialRules={rules as any[]} 
        initialGoals={goals as any[]} 
        profiles={profiles as any[]} 
      />
    </div>
  );
}
