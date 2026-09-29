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
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFDF8]/95 backdrop-blur-md border-t border-[#E5DED2] px-3 py-2 shadow-lg">
      <div className="flex items-center justify-around relative">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeScreen === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveScreen(tab.id)}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
                isActive ? 'text-[#557A62] font-bold' : 'text-[#68736D] hover:text-[#24352F]'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'scale-110 text-[#557A62]' : ''}`} />
              <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>{tab.label}</span>
            </button>
          );
        })}

        {/* Floating Voice Trigger Button */}
        <button
          onClick={() => setIsHeyChefOpen(true)}
          className="absolute -top-5 right-5 w-11 h-11 rounded-full bg-gradient-to-tr from-[#A99BCB] to-[#91BDD0] text-white shadow-md shadow-[#A99BCB]/30 flex items-center justify-center border-2 border-[#FFFDF8] active:scale-95 transition-transform cursor-pointer"
          aria-label="Hey Chef Voice Assistant"
        >
          <Mic className="w-5 h-5 animate-pulse text-white" />
        </button>
      </div>
    </div>
  );
};
