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
    shoppingItems,
  } = useKitchen();

  const navItems: Array<{ id: ActiveScreen; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'My Food', icon: Boxes },
    { id: 'shopping-list', label: 'Smart Shopping', icon: ShoppingCart },
    { id: 'rescue', label: 'Rescue Plan', icon: CalendarCheck },
    { id: 'recipes', label: 'Recipe Hub', icon: UtensilsCrossed },
    { id: 'analytics', label: 'Food Waste', icon: BarChart3 },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'profile', label: 'Kitchen Profile', icon: UserCheck },
  ];

  const pendingShoppingCount = shoppingItems.filter((s) => !s.completed).length;

  return (
    <aside className="hidden lg:flex flex-col w-64 xl:w-72 bg-[#FFFDF8] border-r border-[#E5DED2] shrink-0 h-screen sticky top-0 p-4 justify-between z-30 shadow-[2px_0_12px_rgba(50,60,45,0.03)]">
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-4 mb-3 border-b border-[#E5DED2]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#8BAE8B] flex items-center justify-center text-white shadow-sm shadow-[#8BAE8B]/30">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-extrabold text-sm tracking-wider text-[#24352F]">SMART SHELF</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#8BAE8B]/15 text-[#557A62] font-mono font-bold">OS</span>
              </div>
              <p className="text-[11px] text-[#68736D] font-medium">Cozy Smart Kitchen</p>
            </div>
          </div>
        </div>

        {/* Ambient Sensor Dock */}
        <button
          onClick={() => setToastMessage('Kitchen Climate: 22.4°C • Humidity 48% (Optimal for Food Storage)')}
          className="w-full p-2.5 rounded-2xl bg-[#F7F3EA] hover:bg-[#EFE8DC] border border-[#E5DED2] mb-4 flex items-center justify-between text-xs transition-all text-left cursor-pointer"
          title="Click to view sensor telemetry"
        >
          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-[#D9826B]" />
            <span className="text-[#24352F] font-semibold">22.4°C</span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#8BAE8B]/20 text-[#557A62] font-semibold">
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
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#8BAE8B]/20 text-[#24352F] shadow-sm font-bold border border-[#8BAE8B]/30'
                    : 'text-[#68736D] hover:bg-[#8BAE8B]/10 hover:text-[#24352F]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full transition-all ${isActive ? 'bg-[#557A62]' : 'bg-transparent'}`} />
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#557A62]' : 'text-[#68736D]'}`} />
                  <span>{item.label}</span>
                </div>

                {item.id === 'shopping-list' && pendingShoppingCount > 0 && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                    isActive ? 'bg-[#557A62] text-white' : 'bg-[#D9AE58]/20 text-[#D9AE58]'
                  }`}>
                    {pendingShoppingCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions & Voice Assistant */}
      <div className="space-y-2.5 pt-3 border-t border-[#E5DED2]">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-[#557A62] hover:bg-[#43634F] text-white text-xs font-bold transition-all shadow-sm cursor-pointer hover:-translate-y-0.5"
        >
          <PlusCircle className="w-4 h-4 text-[#F5EBDD]" />
          <span>+ Add Food</span>
        </button>

        <button
          onClick={() => setIsHeyChefOpen(true)}
          className="w-full relative overflow-hidden group flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-[#A99BCB]/15 via-[#91BDD0]/20 to-[#A99BCB]/15 border border-[#A99BCB]/40 hover:border-[#A99BCB] transition-all cursor-pointer hover:-translate-y-0.5 shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#A99BCB] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <Mic className="w-4 h-4 animate-pulse" />
            </div>
            <div className="text-left">
              <p className="text-[10px] uppercase font-bold text-[#A99BCB] tracking-wider">Voice Assistant</p>
              <p className="text-xs font-bold text-[#24352F]">"Hey Chef"</p>
            </div>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-[#8BAE8B] animate-ping" />
        </button>

        {chefTimerSeconds > 0 && (
          <div
            className="w-full p-2.5 rounded-xl bg-[#F7F3EA] border border-[#E5DED2] flex items-center justify-between text-[11px]"
          >
            <span className="text-[#68736D] font-medium">Kitchen Timer</span>
            <span className="font-mono font-bold text-[#D9826B]">
              {Math.floor(chefTimerSeconds / 60)
                .toString()
                .padStart(2, '0')}
              :{(chefTimerSeconds % 60).toString().padStart(2, '0')}
            </span>
          </div>
        )}
      </div>
    </aside>
  );
};
