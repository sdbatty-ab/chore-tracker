"use client";

import { useState } from "react";
import { Lock, Loader2, ArrowRight } from "lucide-react";
import { verifyPin } from "@/app/actions";

export function PinLock({ children }: { children: React.ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) return;
    
    setIsVerifying(true);
    setError(false);
    
    try {
      const isValid = await verifyPin(pin);
      if (isValid) {
        setIsUnlocked(true);
      } else {
        setError(true);
        setPin("");
      }
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setIsVerifying(false);
    }
  };

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-lg max-w-sm w-full text-center">
        <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-500">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Parent Access</h2>
        <p className="text-gray-500 mb-8">Enter your 4-digit PIN to continue.</p>
        
        <form onSubmit={handleSubmit}>
          <input 
            type="password" 
            pattern="[0-9]*" 
            inputMode="numeric" 
            maxLength={4}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/[^0-9]/g, ''));
              setError(false);
            }}
            placeholder="••••"
            className={`w-full text-center text-4xl tracking-[1em] font-bold bg-gray-50 border rounded-2xl py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
              error ? "border-red-300 bg-red-50 text-red-900" : "border-gray-200"
            }`}
            autoFocus
          />
          {error && <p className="text-red-500 text-sm font-bold mt-3">Incorrect PIN</p>}
          
          <button 
            type="submit" 
            disabled={pin.length !== 4 || isVerifying}
            className="w-full mt-6 bg-gray-900 hover:bg-indigo-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : "Unlock"}
            {!isVerifying && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
