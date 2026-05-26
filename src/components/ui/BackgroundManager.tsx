"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const seasonalBackgrounds = {
  winter: ["theme_snowboard_1779726238907.png", "theme_cabin_1779726276506.png"],
  spring: ["theme_soccer_1779726223181.png", "theme_themepark_1779726265812.png"],
  summer: ["theme_water_1779726253885.png", "theme_themepark_1779726265812.png", "theme_soccer_1779726223181.png"],
  fall: ["theme_cabin_1779726276506.png", "theme_soccer_1779726223181.png"]
};

export function BackgroundManager({ children }: { children: React.ReactNode }) {
  const [bg, setBg] = useState("");

  useEffect(() => {
    const month = new Date().getMonth(); // 0 = Jan, 11 = Dec
    let season: 'winter' | 'spring' | 'summer' | 'fall' = 'summer';
    
    if (month === 11 || month <= 1) season = 'winter'; // Dec, Jan, Feb
    else if (month >= 2 && month <= 4) season = 'spring'; // Mar, Apr, May
    else if (month >= 5 && month <= 7) season = 'summer'; // Jun, Jul, Aug
    else if (month >= 8 && month <= 10) season = 'fall'; // Sep, Oct, Nov

    const bgs = seasonalBackgrounds[season];
    const randomBg = bgs[Math.floor(Math.random() * bgs.length)];
    setBg(`/images/backgrounds/${randomBg}`);
  }, []);

  return (
    <div className="relative min-h-screen flex w-full">
      {/* Background Image Layer */}
      <AnimatePresence>
        {bg && (
          <motion.div
            key={bg}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
            className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
            style={{ backgroundImage: `url(${bg})` }}
          />
        )}
      </AnimatePresence>

      {/* Main Content Layer */}
      <div className="relative z-10 flex w-full h-screen">
        {children}
      </div>
    </div>
  );
}
