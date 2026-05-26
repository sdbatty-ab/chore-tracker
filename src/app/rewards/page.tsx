import { RewardsStore } from "@/components/ui/RewardsStore";
import { getRewards } from "../actions";

export default async function RewardsPage() {
  const rewards = await getRewards();
  const mockPoints = 450; // Temporarily mocked until we build the real points query
  
  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full">
      <header className="mb-10 text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3 bg-purple-100 rounded-full mb-2">
          <span className="text-4xl">🎁</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
          Rewards Store
        </h1>
        <p className="text-lg text-gray-500 font-medium max-w-2xl mx-auto">
          You've worked hard! Now it's time to treat yourself. Spend your earned points on awesome prizes.
        </p>
      </header>
      
      <RewardsStore initialRewards={rewards as any[]} initialPoints={mockPoints} />
    </div>
  );
}
