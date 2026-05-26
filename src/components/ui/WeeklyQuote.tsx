"use client";

import { useState, useEffect } from "react";
import { Quote, Sparkles } from "lucide-react";

const quotes = [
  // Inspirational / Family
  { text: "Family is not an important thing. It's everything.", author: "Michael J. Fox" },
  { text: "The most important thing in the world is family and love.", author: "John Wooden" },
  { text: "Other things may change us, but we start and end with the family.", author: "Anthony Brandt" },
  { text: "Rejoice with your family in the beautiful land of life.", author: "Albert Einstein" },
  { text: "Families are the compass that guides us. They are the inspiration to reach great heights.", author: "Brad Henry" },
  
  // LDS / Spiritual
  { text: "No other success can compensate for failure in the home.", author: "David O. McKay" },
  { text: "The family is the center of life, and it is the key to eternal happiness.", author: "L. Tom Perry" },
  { text: "Happiness in family life is most likely to be achieved when founded upon the teachings of the Lord Jesus Christ.", author: "The Family: A Proclamation to the World" },
  { text: "The greatest work you will ever do will be within the walls of your own home.", author: "Harold B. Lee" },
  { text: "As we make our homes a sanctuary of faith, we will find peace.", author: "Russell M. Nelson" }
];

export function WeeklyQuote() {
  const [quote, setQuote] = useState(quotes[0]);

  useEffect(() => {
    // Pick a quote based on the current week of the year
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    const weekNo = Math.ceil(( ( (d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
    
    const index = weekNo % quotes.length;
    setQuote(quotes[index]);
  }, []);

  return (
    <div className="relative rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8 text-white shadow-xl overflow-hidden mb-8">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10 blur-2xl"></div>
      <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-white opacity-10 blur-xl"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
        <div className="flex-shrink-0 bg-white/20 p-4 rounded-2xl backdrop-blur-sm border border-white/30">
          <Quote className="h-8 w-8 text-white" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <p className="text-xl md:text-2xl font-bold leading-snug mb-3 text-white shadow-sm">
            "{quote.text}"
          </p>
          <div className="flex items-center justify-center md:justify-start gap-2 text-indigo-100 font-medium">
            <Sparkles className="h-4 w-4" />
            <span>{quote.author}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
