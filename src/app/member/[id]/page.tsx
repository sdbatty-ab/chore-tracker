import { getChores, getGoals, getProfiles } from "../../actions";
import { MemberDashboard } from "@/components/ui/MemberDashboard";
import { notFound } from "next/navigation";

export default async function MemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const [chores, goals, profiles] = await Promise.all([
    getChores(),
    getGoals(),
    getProfiles()
  ]);

  const profile = profiles.find(p => p.id === id);
  
  if (!profile) {
    notFound();
  }

  // Filter for this specific member
  const memberChores = chores.filter(c => c.assigned_to === id);
  const memberGoals = goals.filter(g => g.profile_id === id || !g.profile_id); // Show specific + family goals

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full">
      <MemberDashboard 
        profile={profile} 
        chores={memberChores as any[]} 
        goals={memberGoals as any[]} 
      />
    </div>
  );
}
