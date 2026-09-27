import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  ShoppingCart,
  CalendarCheck,
  UtensilsCrossed,
  ChefHat,
  BarChart3,
  Users,
  UserCheck,
  Mic,
  Thermometer,
  PlusCircle,
} from 'lucide-react';
import { useKitchen } from '../context/KitchenContext';
import { ActiveScreen } from '../types';

export const Sidebar: React.FC = () => {
  const {
    activeScreen,
    setActiveScreen,
    setIsHeyChefOpen,
    setIsAddModalOpen,
    chefTimerSeconds,
    setToastMessage,
  } = useKitchen();

  const navItems: Array<{ id: ActiveScreen; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'My Food', icon: Boxes },
    { id: 'shopping-list', label: 'Smart Shopping', icon: ShoppingCart },
    { id: 'rescue', label: 'Rescue Plan', icon: CalendarCheck },
    { id: 'recipes', label: 'Recipe Hub', icon: UtensilsCrossed },
    { id: 'live-cooking', label: 'Live Cooking', icon: ChefHat },
    { id: 'analytics', label: 'Food Waste', icon: BarChart3 },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'profile', label: 'Kitchen Profile', icon: UserCheck },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 xl:w-72 bg-[#121a1d] border-r border-white/10 shrink-0 h-screen sticky top-0 p-4 justify-between z-30">
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-4 mb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#a1e3f9]/15 border border-[#a1e3f9]/30 flex items-center justify-center text-[#a1e3f9] shadow-sm">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-extrabold text-sm tracking-wider text-white">SMART SHELF</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-[#a1e3f9] font-mono">v2.4</span>
              </div>
              <p className="text-[11px] text-[#8e989b] font-medium">Smart Kitchen</p>
            </div>
          </div>
        </div>

        {/* Ambient Sensor Dock */}
        <button
          onClick={() => setToastMessage('Kitchen Climate: 22.4°C • Humidity 48% (Optimal for Food Storage)')}
          className="w-full p-2.5 rounded-xl bg-[#1c2529] hover:bg-[#252f33] border border-white/5 mb-4 flex items-center justify-between text-xs transition-all text-left"
          title="Click to view sensor telemetry"
        >
          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-[#ffb780]" />
            <span className="text-white font-medium">22.4°C</span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">
            48% Optimal
          </span>
        </button>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveScreen(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#a1e3f9] text-[#003642] font-semibold shadow-md shadow-[#a1e3f9]/10'
                    : 'text-[#bfc8cc] hover:bg-[#1c2529] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#003642]' : 'text-[#8e989b]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.id === 'live-cooking' && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-[#003642]/20 text-[#003642]' : 'bg-[#ffb780]/20 text-[#ffb780]'
                  }`}>
                    Live
                  </span>
                )}
                {item.id === 'shopping-list' && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-[#003642]/20 text-[#003642]' : 'bg-white/10 text-[#bfc8cc]'
                  }`}>
                    7
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions & Voice Assistant */}
      <div className="space-y-2 pt-3 border-t border-white/10">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#1c2529] hover:bg-[#232b2e] border border-white/10 text-white text-xs font-semibold transition-all"
        >
          <PlusCircle className="w-4 h-4 text-[#a1e3f9]" />
          <span>+ Add Food</span>
        </button>

        <button
          onClick={() => setIsHeyChefOpen(true)}
          className="w-full relative overflow-hidden group flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-[#1c2529] to-[#252f33] border border-[#a1e3f9]/30 hover:border-[#a1e3f9] transition-all"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#a1e3f9]/20 flex items-center justify-center text-[#a1e3f9] group-hover:scale-105 transition-transform">
              <Mic className="w-4 h-4 animate-pulse" />
            </div>
            <div className="text-left">
              <p className="text-[10px] uppercase font-bold text-[#a1e3f9] tracking-wider">Voice Command</p>
              <p className="text-xs font-semibold text-white">"Hey Chef"</p>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </button>

        {chefTimerSeconds > 0 && (
          <button
            onClick={() => setActiveScreen('live-cooking')}
            className="w-full p-2 rounded-lg bg-[#182124] hover:bg-[#1f2a2e] border border-white/5 flex items-center justify-between text-[11px] transition-all"
            title="Click to view Live Cooking"
          >
            <span className="text-[#8e989b]">Kitchen Timer</span>
            <span className="font-mono font-bold text-[#ffb780]">
              {Math.floor(chefTimerSeconds / 60)
                .toString()
                .padStart(2, '0')}
              :{(chefTimerSeconds % 60).toString().padStart(2, '0')}
            </span>
          </button>
        )}
      </div>
    </aside>
  );
};
