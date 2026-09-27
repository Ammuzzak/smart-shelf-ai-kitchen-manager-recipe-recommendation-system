import React from 'react';
import { LayoutDashboard, Boxes, UtensilsCrossed, BarChart3, Mic, CalendarCheck } from 'lucide-react';
import { useKitchen } from '../context/KitchenContext';
import { ActiveScreen } from '../types';

export const MobileBottomNav: React.FC = () => {
  const { activeScreen, setActiveScreen, setIsHeyChefOpen } = useKitchen();

  const tabs: Array<{ id: ActiveScreen; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'inventory', label: 'My Food', icon: Boxes },
    { id: 'rescue', label: 'Rescue', icon: CalendarCheck },
    { id: 'recipes', label: 'Recipes', icon: UtensilsCrossed },
    { id: 'analytics', label: 'Food Waste', icon: BarChart3 },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass-nav border-t border-white/10 px-3 py-2">
      <div className="flex items-center justify-around relative">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeScreen === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveScreen(tab.id)}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg transition-all ${
                isActive ? 'text-[#a1e3f9]' : 'text-[#8e989b] hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
              <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-normal'}`}>{tab.label}</span>
            </button>
          );
        })}

        {/* Floating Voice Trigger Button */}
        <button
          onClick={() => setIsHeyChefOpen(true)}
          className="absolute -top-6 right-5 w-12 h-12 rounded-full bg-gradient-to-tr from-[#004f5e] to-[#a1e3f9] text-[#002028] shadow-lg shadow-[#a1e3f9]/20 flex items-center justify-center border-2 border-[#0d1518] active:scale-95 transition-transform"
          aria-label="Hey Chef Voice Assistant"
        >
          <Mic className="w-5 h-5 animate-pulse text-[#002028]" />
        </button>
      </div>
    </div>
  );
};
