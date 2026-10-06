import React, { useState } from 'react';
import {
  LayoutDashboard,
  Boxes,
  CalendarCheck,
  UtensilsCrossed,
  BarChart3,
  Users,
  UserCheck,
  ShoppingCart,
  PlusCircle,
  Mic,
  User,
} from 'lucide-react';
import { useKitchen } from '../context/KitchenContext';
import { ActiveScreen } from '../types';
import { AccountMenuDropdown } from './AccountMenuDropdown';

export const Sidebar: React.FC = () => {
  const {
    activeScreen,
    setActiveScreen,
    setIsHeyChefOpen,
    setIsAddModalOpen,
    currentUser,
    chefTimerSeconds,
    shoppingItems,
    theme,
  } = useKitchen();

  const isDark = theme === 'dark';
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

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

  const pendingShoppingCount = shoppingItems.filter((s: any) => !s.checked && !s.completed).length;

  return (
    <aside className={`hidden lg:flex flex-col w-64 xl:w-72 shrink-0 h-screen sticky top-0 p-4 justify-between z-30 theme-transition ${
      isDark
        ? 'bg-[#121a1d] border-r border-white/10 text-[#dbe4e8]'
        : 'bg-[#FFFDF8] border-r border-[#E4DED2] text-[#24332D] shadow-[2px_0_12px_rgba(50,60,45,0.03)]'
    }`}>
      <div>
        {/* Brand Header */}
        <div className={`flex items-center justify-between pb-4 mb-3 border-b ${isDark ? 'border-white/10' : 'border-[#E4DED2]'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${
              isDark
                ? 'bg-[#a1e3f9]/15 border border-[#a1e3f9]/30 text-[#a1e3f9]'
                : 'bg-[#6FAF8F] text-white shadow-[#6FAF8F]/30'
            }`}>
              <span className="font-display font-black text-xl">S</span>
            </div>
            <div>
              <h1 className={`font-display text-base font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
                Smart Shelf
              </h1>
              <p className={`text-[10px] font-mono tracking-wider uppercase font-semibold ${
                isDark ? 'text-[#a1e3f9]' : 'text-[#557A62]'
              }`}>
                Kitchen OS
              </p>
            </div>
          </div>
        </div>

        {/* User Account Switcher Strip */}
        <div className="relative mb-3">
          <div
            onClick={() => setIsAccountMenuOpen((prev) => !prev)}
            className={`p-2.5 rounded-2xl border flex items-center justify-between transition-all cursor-pointer shadow-sm hover:scale-[1.01] ${
              isAccountMenuOpen
                ? isDark
                  ? 'bg-[#182327] border-[#a1e3f9] ring-2 ring-[#a1e3f9]/20'
                  : 'bg-[#F7F5EF] border-[#557A62] ring-2 ring-[#557A62]/20'
                : isDark
                ? 'bg-[#182327] hover:bg-[#1f2d32] border-white/10'
                : 'bg-[#F7F5EF] hover:bg-[#EFE9DE] border-[#E4DED2]'
            }`}
            title="Open Kitchen Account & Settings"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setIsAccountMenuOpen((prev) => !prev);
              }
            }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                  currentUser?.isGuest
                    ? 'bg-amber-600'
                    : isDark
                    ? 'bg-[#005a6b] text-[#a1e3f9]'
                    : 'bg-[#557A62]'
                }`}
              >
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
                  {currentUser?.name || 'Home Cook'}
                </p>
                <p className={`text-[10px] truncate ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
                  {currentUser?.isGuest ? 'Guest Kitchen' : 'Isolated Account'}
                </p>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              currentUser?.isGuest
                ? 'bg-amber-500/20 text-amber-400'
                : isDark
                ? 'bg-[#a1e3f9]/20 text-[#a1e3f9]'
                : 'bg-[#6FAF8F]/20 text-[#43634F]'
            }`}>
              Account
            </span>
          </div>

          <AccountMenuDropdown
            isOpen={isAccountMenuOpen}
            onClose={() => setIsAccountMenuOpen(false)}
            positionClasses="left-0 top-full mt-2 w-72"
          />
        </div>

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
                    ? isDark
                      ? 'bg-[#a1e3f9] text-[#003642] font-bold shadow-md shadow-[#a1e3f9]/15'
                      : 'bg-[#6FAF8F]/20 text-[#24332D] font-bold border border-[#6FAF8F]/30 shadow-sm'
                    : isDark
                    ? 'text-[#bfc8cc] hover:bg-[#1c2529] hover:text-white'
                    : 'text-[#68736D] hover:bg-[#6FAF8F]/10 hover:text-[#24332D]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full transition-all ${
                    isActive
                      ? isDark ? 'bg-[#003642]' : 'bg-[#557A62]'
                      : 'bg-transparent'
                  }`} />
                  <Icon className={`w-4 h-4 ${
                    isActive
                      ? isDark ? 'text-[#003642]' : 'text-[#557A62]'
                      : isDark ? 'text-[#8e989b]' : 'text-[#68736D]'
                  }`} />
                  <span>{item.label}</span>
                </div>

                {item.id === 'shopping-list' && pendingShoppingCount > 0 && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                    isActive
                      ? isDark ? 'bg-[#003642]/20 text-[#003642]' : 'bg-[#557A62] text-white'
                      : isDark ? 'bg-[#ffb780]/20 text-[#ffb780]' : 'bg-[#D5A84C]/25 text-[#8C671C]'
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
      <div className={`space-y-2.5 pt-3 border-t ${isDark ? 'border-white/10' : 'border-[#E4DED2]'}`}>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer hover:-translate-y-0.5 ${
            isDark
              ? 'bg-[#a1e3f9] hover:bg-[#c2effc] text-[#003642]'
              : 'bg-[#557A62] hover:bg-[#43634F] text-white'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Food Item</span>
        </button>

        <button
          onClick={() => setIsHeyChefOpen(true)}
          className={`w-full relative overflow-hidden group flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer hover:-translate-y-0.5 shadow-sm ${
            isDark
              ? 'bg-gradient-to-r from-[#1c2529] to-[#252f33] border-[#a1e3f9]/30 hover:border-[#a1e3f9]'
              : 'bg-gradient-to-r from-[#A99BCB]/15 via-[#8EC5D6]/20 to-[#A99BCB]/15 border-[#A99BCB]/40 hover:border-[#A99BCB]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform ${
              isDark
                ? 'bg-[#a1e3f9]/20 text-[#a1e3f9]'
                : 'bg-[#A99BCB] text-white'
            }`}>
              <Mic className="w-4 h-4 animate-pulse" />
            </div>
            <div className="text-left">
              <p className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-[#a1e3f9]' : 'text-[#63538C]'}`}>
                Voice Assistant
              </p>
              <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
                "Hey Chef"
              </p>
            </div>
          </div>
          <span className={`w-2.5 h-2.5 rounded-full animate-ping ${isDark ? 'bg-emerald-400' : 'bg-[#6FAF8F]'}`} />
        </button>

        {chefTimerSeconds > 0 && (
          <div
            className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-[11px] ${
              isDark
                ? 'bg-[#182124] border-white/5 text-[#8e989b]'
                : 'bg-[#F7F5EF] border-[#E4DED2] text-[#68736D]'
            }`}
          >
            <span className="font-medium">Kitchen Timer</span>
            <span className={`font-mono font-bold ${isDark ? 'text-[#ffb780]' : 'text-[#D9826B]'}`}>
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
