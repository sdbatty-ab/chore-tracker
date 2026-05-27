"use client";

import { useState, useEffect } from "react";
import { Gift, Star, ShoppingCart, Check, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import { claimRewardAction } from "@/app/actions";

export interface Reward {
  id: string;
  title: string;
  description: string;
  points_cost: number;
  image_url?: string | null;
}

interface RewardsStoreProps {
  initialRewards: Reward[];
  kids?: any[];
}

export function RewardsStore({ initialRewards, kids = [] }: RewardsStoreProps) {
  const [selectedKidId, setSelectedKidId] = useState<string>(kids[0]?.id || "");
  const [userPoints, setUserPoints] = useState(kids[0]?.points_balance || 0);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [claimedReward, setClaimedReward] = useState<Reward | null>(null);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const selectedKid = kids.find(k => k.id === selectedKidId);
    if (selectedKid) {
      setUserPoints(selectedKid.points_balance || 0);
    }
  }, [selectedKidId, kids]);

  const claimReward = async (reward: Reward) => {
    if (!selectedKidId) {
      alert("Please select who is shopping first!");
      return;
    }
    if (userPoints >= reward.points_cost) {
      setClaimingId(reward.id);
      try {
        await claimRewardAction(reward.id, selectedKidId);
        setUserPoints(prev => prev - reward.points_cost);
        setClaimedReward(reward);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
        setTimeout(() => setClaimedReward(null), 3000);
      } catch (error) {
        console.error("Failed to claim:", error);
        alert("Oops! Something went wrong while claiming your reward.");
      } finally {
        setClaimingId(null);
      }
    }
  };

  if (initialRewards.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 p-12 shadow-sm flex flex-col items-center justify-center text-center">
        <div className="bg-indigo-50 p-6 rounded-full mb-4">
          <Gift className="h-12 w-12 text-indigo-300" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Rewards Yet</h3>
        <p className="text-gray-500 max-w-md">Parents haven't added any rewards to the store yet. Keep doing your chores and check back soon!</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 relative">
      {showConfetti && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={500} />
        </div>
      )}

      {/* Kid Selector */}
      {kids.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center gap-4 justify-between">
          <div>
            <h3 className="font-bold text-gray-900">Who is shopping?</h3>
            <p className="text-sm text-gray-500">Select your name to see your points balance</p>
          </div>
          <select 
            value={selectedKidId}
            onChange={(e) => setSelectedKidId(e.target.value)}
            className="w-full sm:w-auto bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/50 text-gray-900 font-bold"
          >
            {kids.map(kid => (
              <option key={kid.id} value={kid.id}>{kid.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Points Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 flex flex-col md:flex-row items-center justify-between overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 -mt-10 -mr-10 text-indigo-500 opacity-20">
          <Sparkles className="w-64 h-64" />
        </div>
        
        <div className="z-10 text-center md:text-left mb-6 md:mb-0">
          <h2 className="text-3xl font-bold mb-2 flex items-center justify-center md:justify-start gap-2">
            Your Balance
          </h2>
          <p className="text-indigo-100 text-lg">You have enough points to treat yourself!</p>
        </div>
        <div className="z-10 flex items-center gap-3 bg-white/20 px-8 py-4 rounded-2xl backdrop-blur-md border border-white/20">
          <Star className="h-10 w-10 text-yellow-300 fill-yellow-300 drop-shadow-md" />
          <span className="text-5xl font-black tracking-tight">{userPoints}</span>
        </div>
      </motion.div>

      {/* Success Notification */}
      <AnimatePresence>
        {claimedReward && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-gray-700"
          >
            <div className="bg-green-500 p-2 rounded-full">
              <Check className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-bold">Reward Claimed!</p>
              <p className="text-sm text-gray-300">You successfully got "{claimedReward.title}"</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {initialRewards.map((reward) => {
          const canAfford = userPoints >= reward.points_cost;
          const isClaiming = claimingId === reward.id;

          return (
            <motion.div 
              key={reward.id}
              whileHover={canAfford ? { y: -8, scale: 1.02 } : {}}
              className={`bg-white rounded-3xl p-6 flex flex-col items-center text-center transition-all duration-300 border-2 ${
                canAfford 
                  ? "border-transparent shadow-lg hover:shadow-xl hover:shadow-indigo-100" 
                  : "border-gray-100 shadow-sm opacity-80"
              }`}
            >
              {reward.image_url ? (
                  <img 
                    src={reward.image_url} 
                    alt={reward.title} 
                    className="w-full h-32 object-cover rounded-2xl mb-4 shadow-sm"
                  />
                ) : (
                  <div className={`w-24 h-24 rounded-3xl mb-5 flex items-center justify-center text-4xl shadow-inner ${
                    canAfford ? "bg-gradient-to-br from-indigo-50 to-purple-100 text-indigo-600" : "bg-gray-50 text-gray-400"
                  }`}>
                    🎁
                  </div>
                )}
              <h3 className="font-extrabold text-xl text-gray-900 mb-2 line-clamp-1 w-full" title={reward.title}>{reward.title}</h3>
              <p className="text-sm text-gray-500 mb-6 flex-grow line-clamp-2 w-full">{reward.description || "An awesome reward just for you!"}</p>
              
              <div className={`flex items-center gap-1.5 font-bold px-4 py-2 rounded-full mb-6 ${
                canAfford ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-500"
              }`}>
                <Star className={`h-4 w-4 ${canAfford ? "fill-yellow-500 text-yellow-500" : "fill-gray-400 text-gray-400"}`} />
                {reward.points_cost} pts
              </div>
              
              <button 
                onClick={() => claimReward(reward)}
                disabled={!canAfford || isClaiming}
                className={`w-full py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all duration-200 ${
                  isClaiming
                    ? "bg-indigo-100 text-indigo-400 cursor-wait"
                    : canAfford 
                      ? "bg-gray-900 text-white hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-200 active:scale-95" 
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isClaiming ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Claiming...
                  </>
                ) : canAfford ? (
                  <>
                    <ShoppingCart className="h-5 w-5" />
                    Claim Reward
                  </>
                ) : (
                  "Not enough points"
                )}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
