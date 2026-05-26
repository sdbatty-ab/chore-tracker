"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CheckSquare, Gift, ShieldAlert, Settings, Calendar, Image as ImageIcon } from "lucide-react";
import clsx from "clsx";

const navItems = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Chores", href: "/chores", icon: CheckSquare },
  { name: "Rewards", href: "/rewards", icon: Gift },
  { name: "Rules & Goals", href: "/rules", icon: ShieldAlert },
  { name: "Photos", href: "/photos", icon: ImageIcon },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-screen w-64 flex-col border-r border-white/40 bg-white/60 backdrop-blur-xl shadow-lg relative z-20">
        <div className="flex h-16 items-center px-6 border-b border-white/40">
        <div className="flex items-center gap-2 font-bold text-xl text-indigo-600">
          <Gift className="h-6 w-6" />
          <span>Family First</span>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-4 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition-all duration-200",
                isActive
                  ? "bg-white/80 text-indigo-700 shadow-sm border border-white/50"
                  : "text-gray-700 hover:bg-white/50 hover:text-indigo-900"
              )}
            >
              <Icon className={clsx("h-5 w-5", isActive ? "text-indigo-600" : "text-gray-400")} />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
            P
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Parent User</p>
            <p className="text-xs text-gray-500">Admin</p>
          </div>
        </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-t border-white/40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 flex items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                isActive ? "text-indigo-600" : "text-gray-500 hover:text-indigo-400"
              )}
            >
              <Icon className={clsx("h-5 w-5", isActive && "fill-indigo-100")} />
              <span className="text-[10px] font-bold">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
