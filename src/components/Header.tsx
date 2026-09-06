import React, { useState } from 'react';
import {
  Bell,
  Search,
  Mic,
  SlidersHorizontal,
  ChevronRight,
  Flame,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { useKitchen } from '../context/KitchenContext';

export const Header: React.FC = () => {
  const {
    activeScreen,
    setActiveScreen,
    setIsHeyChefOpen,
    setIsAddModalOpen,
    toastMessage,
    setToastMessage,
    userSettings,
    notifications,
    markNotificationRead,
    clearNotifications,
    isNotificationsOpen,
    setIsNotificationsOpen,
    inventory,
    recipes,
    setSelectedRecipeForDetail,
    setIsRecipeDetailOpen,
  } = useKitchen();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredSearchResults = searchQuery.trim()
    ? [
        ...inventory
          .filter((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((i) => ({ type: 'inventory' as const, item: i, title: i.name, sub: `${i.quantity} ${i.unit} in ${i.location}` })),
        ...recipes
          .filter((r) => r.title.toLowerCase().includes(searchQuery.toLowerCase()) || r.cuisine.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((r) => ({ type: 'recipe' as const, recipe: r, title: r.title, sub: `${r.cuisine} • Rescues ${r.rescueWeight}` })),
      ]
    : [];

  const getScreenTitle = () => {
    switch (activeScreen) {
      case 'dashboard':
        return 'Kitchen Overview';
      case 'inventory':
        return 'Live Inventory Calibration';
      case 'shopping-list':
        return 'Smart Shopping List';
      case 'rescue':
        return 'Daily Food Rescue Plan';
      case 'recipes':
        return 'South Indian Recipe Hub';
      case 'live-cooking':
        return 'Live Cooking Session';
      case 'analytics':
        return 'Waste Pattern Analyzer';
      case 'community':
        return 'Community Rescue Hub';
      case 'profile':
        return 'Kitchen Master Profile';
      default:
        return 'Kitchen OS';
    }
  };

  return (
    <header className="sticky top-0 z-30 glass-nav border-b border-white/10 px-4 lg:px-8 py-3 flex flex-col gap-2 relative">
      <div className="flex items-center justify-between gap-3">
        {/* Title and breadcrumbs */}
        <div className="flex items-center gap-3">
          <div className="lg:hidden flex items-center gap-2">
            <span className="font-display font-black text-sm tracking-wider text-[#a1e3f9]">SMART SHELF</span>
            <span className="text-[10px] text-[#8e989b] font-mono">OS V2.4</span>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs text-[#8e989b]">
            <span>Kitchen OS</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-white font-medium">{getScreenTitle()}</span>
          </div>
        </div>

        {/* Global Quick Search Field */}
        <div className="relative flex-1 max-w-xs hidden md:block">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#151d20] border border-white/10 focus-within:border-[#a1e3f9] transition-all">
            <Search className="w-3.5 h-3.5 text-[#8e989b]" />
            <input
              type="text"
              placeholder="Search pantry or recipes..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              className="bg-transparent text-xs text-white placeholder-[#5a6568] outline-none w-full"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="text-[#8e989b] hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Search Popover */}
          {isSearchOpen && filteredSearchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#1c2529] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 space-y-1">
              {filteredSearchResults.slice(0, 5).map((res, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (res.type === 'inventory') {
                      setActiveScreen('inventory');
                    } else if (res.type === 'recipe') {
                      setSelectedRecipeForDetail(res.recipe);
                      setIsRecipeDetailOpen(true);
                    }
                    setIsSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="w-full p-2 rounded-xl hover:bg-white/5 text-left flex items-center justify-between transition-all"
                >
                  <div>
                    <p className="text-xs font-semibold text-white">{res.title}</p>
                    <p className="text-[10px] text-[#8e989b]">{res.sub}</p>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 font-mono text-[#a1e3f9] uppercase">
                    {res.type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Controls & Notifications */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Voice Command pill */}
          <button
            onClick={() => setIsHeyChefOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1c2529] hover:bg-[#252f33] border border-[#a1e3f9]/30 text-xs text-white transition-all shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[#a1e3f9] font-medium">Voice Command:</span>
            <span className="font-semibold">"Hey Chef" •</span>
          </button>

          {/* Notifications Bell with unread counter */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 rounded-xl bg-[#1c2529] hover:bg-[#252f33] border border-white/10 hover:border-white/20 text-[#bfc8cc] hover:text-white transition-all"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Panel */}
            {isNotificationsOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#1c2529] border border-white/10 rounded-2xl shadow-2xl p-4 z-50 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-xs font-bold text-white uppercase tracking-wider">
                      Alerts & Telemetry
                    </span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearNotifications}
                      className="text-[10px] text-[#8e989b] hover:text-white hover:underline transition-all"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#8e989b]">
                      No active alerts. All shelf items optimal!
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          markNotificationRead(notif.id);
                          if (notif.linkScreen) {
                            setActiveScreen(notif.linkScreen);
                            setIsNotificationsOpen(false);
                          }
                        }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          notif.read
                            ? 'bg-[#151d20]/60 border-white/5 opacity-70'
                            : notif.type === 'alert'
                            ? 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50'
                            : 'bg-[#151d20] border-white/10 hover:border-[#a1e3f9]/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold text-white">{notif.title}</p>
                          <span className="text-[9px] font-mono text-[#8e989b] shrink-0">{notif.time}</span>
                        </div>
                        <p className="text-[11px] text-[#bfc8cc] mt-1 leading-snug">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-[#8e989b]">
                  <span>IoT Sensors: 4 Connected</span>
                  <span className="text-emerald-400 font-medium">Auto-Sync On</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Add Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#a1e3f9] hover:bg-[#c2effc] text-[#003642] text-xs font-bold transition-all shadow-md shadow-[#a1e3f9]/10"
          >
            <span>+ Add Item</span>
          </button>

          {/* User badge */}
          <button
            onClick={() => setActiveScreen('profile')}
            className="flex items-center gap-2 p-1.5 rounded-xl bg-[#1c2529] border border-white/10 hover:border-white/20 transition-all text-xs"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#ffb780] to-[#ffd7b2] flex items-center justify-center text-[#4a2800] font-bold text-[11px]">
              G
            </div>
            <span className="hidden md:inline font-medium text-white text-xs">{userSettings.name}</span>
          </button>
        </div>
      </div>

      {/* Global Completed Toast Banner if present (Image 9 style) */}
      {toastMessage && (
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1c2529] border border-emerald-500/30 text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-semibold uppercase">
              Saved To Log
            </span>
            <p className="line-clamp-1">{toastMessage}</p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-[#8e989b] hover:text-white text-xs font-bold px-2 py-0.5 rounded hover:bg-white/10"
          >
            ✕
          </button>
        </div>
      )}
    </header>
  );
};
