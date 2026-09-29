import React, { useState, useMemo } from 'react';
import {
  Bell,
  Search,
  Mic,
  ChevronRight,
} from 'lucide-react';
import { useKitchen } from '../context/KitchenContext';
import { matchRecipesWithInput } from '../data/recipeMatching';

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

  const filteredSearchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const invMatches = inventory
      .filter((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .map((i) => ({ type: 'inventory' as const, item: i, title: i.name, sub: `${i.quantity} ${i.unit} in ${i.location}` }));

    const recipeResults = matchRecipesWithInput(searchQuery, recipes, inventory);
    const combined = [...recipeResults.canMakeNow, ...recipeResults.almostReady];
    const recipeMatches = combined.slice(0, 5).map(({ recipe, matchPercentage }) => ({
      type: 'recipe' as const,
      recipe,
      title: recipe.title,
      sub: `${matchPercentage}% Match • ${recipe.cuisine}`,
    }));

    return [...invMatches.slice(0, 3), ...recipeMatches];
  }, [searchQuery, inventory, recipes]);

  const getScreenTitle = () => {
    switch (activeScreen) {
      case 'dashboard':
        return 'Dashboard';
      case 'inventory':
        return 'My Food';
      case 'shopping-list':
        return 'Smart Shopping';
      case 'rescue':
        return 'Rescue Plan';
      case 'recipes':
      case 'live-cooking':
        return 'Recipe Hub';
      case 'analytics':
        return 'Food Waste';
      case 'community':
        return 'Community';
      case 'profile':
        return 'Kitchen Profile';
      default:
        return 'Kitchen';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FFFDF8]/95 backdrop-blur-md border-b border-[#E5DED2] px-4 lg:px-8 py-3 flex flex-col gap-2 relative shadow-[0_2px_8px_rgba(50,60,45,0.03)]">
      <div className="flex items-center justify-between gap-3">
        {/* Title and breadcrumbs */}
        <div className="flex items-center gap-3">
          <div className="lg:hidden flex items-center gap-2">
            <span className="font-display font-black text-sm tracking-wider text-[#557A62]">SMART SHELF</span>
            <span className="text-[10px] text-[#68736D] font-mono">v2.4</span>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs text-[#68736D]">
            <span>Kitchen</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#A6AEA9]" />
            <span className="text-[#24352F] font-bold">{getScreenTitle()}</span>
          </div>
        </div>

        {/* Global Quick Search Field (White rounded pill) */}
        <div className="relative flex-1 max-w-xs hidden md:block">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFFFFF] border border-[#E5DED2] focus-within:border-[#8BAE8B] focus-within:ring-2 focus-within:ring-[#8BAE8B]/20 transition-all shadow-sm">
            <Search className="w-3.5 h-3.5 text-[#68736D]" />
            <input
              type="text"
              placeholder="Search pantry or recipes..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              className="bg-transparent text-xs text-[#24352F] placeholder-[#8A9590] outline-none w-full font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="text-[#68736D] hover:text-[#24352F] text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Search Popover */}
          {isSearchOpen && filteredSearchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#FFFFFF] border border-[#E5DED2] rounded-2xl shadow-xl p-2 z-50 space-y-1">
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
                  className="w-full p-2.5 rounded-xl hover:bg-[#F7F3EA] text-left flex items-center justify-between transition-all cursor-pointer"
                >
                  <div>
                    <p className="text-xs font-bold text-[#24352F]">{res.title}</p>
                    <p className="text-[10px] text-[#68736D]">{res.sub}</p>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#8BAE8B]/15 font-mono text-[#557A62] font-bold uppercase">
                    {res.type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Controls & Notifications */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Voice Command pill (Soft lavender & sage) */}
          <button
            onClick={() => setIsHeyChefOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#A99BCB]/15 hover:bg-[#A99BCB]/25 border border-[#A99BCB]/30 text-xs text-[#24352F] transition-all shadow-sm cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-[#8BAE8B] animate-ping" />
            <span className="text-[#68736D] font-medium">Voice:</span>
            <span className="font-bold text-[#24352F]">"Hey Chef"</span>
          </button>

          {/* Notifications Bell with unread counter (Terracotta badge) */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 rounded-xl bg-[#FFFFFF] hover:bg-[#F7F3EA] border border-[#E5DED2] text-[#68736D] hover:text-[#24352F] transition-all cursor-pointer shadow-sm"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#D9826B] text-white font-mono text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Panel */}
            {isNotificationsOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#FFFFFF] border border-[#E5DED2] rounded-2xl shadow-2xl p-4 z-50 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#E5DED2]">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-xs font-bold text-[#24352F] uppercase tracking-wider">
                      Kitchen Alerts
                    </span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D9826B]/15 text-[#D9826B] font-mono font-bold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearNotifications}
                      className="text-[10px] text-[#68736D] hover:text-[#24352F] hover:underline cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#68736D]">
                      No active alerts. All food is fresh!
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
                            ? 'bg-[#F7F3EA]/50 border-[#E5DED2] opacity-75'
                            : notif.type === 'alert'
                            ? 'bg-[#D9826B]/10 border-[#D9826B]/30 hover:border-[#D9826B]/60'
                            : 'bg-[#FFFDF8] border-[#E5DED2] hover:border-[#8BAE8B]/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold text-[#24352F]">{notif.title}</p>
                          <span className="text-[9px] font-mono text-[#68736D] shrink-0">{notif.time}</span>
                        </div>
                        <p className="text-[11px] text-[#68736D] mt-1 leading-snug">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-2 border-t border-[#E5DED2] flex items-center justify-between text-[11px] text-[#68736D]">
                  <span>Kitchen Sensors: 4 Active</span>
                  <span className="text-[#557A62] font-semibold">Live Sync</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Add Button (Sage button) */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#557A62] hover:bg-[#43634F] text-white text-xs font-bold transition-all shadow-sm cursor-pointer hover:-translate-y-0.5"
          >
            <span>+ Add Item</span>
          </button>

          {/* User Profile Pill */}
          <button
            onClick={() => setActiveScreen('profile')}
            className="flex items-center gap-2 p-1.5 pr-3 rounded-full bg-[#FFFFFF] border border-[#E5DED2] hover:border-[#8BAE8B] transition-all text-xs cursor-pointer shadow-sm"
          >
            <div className="w-6 h-6 rounded-full bg-[#D9826B] text-white flex items-center justify-center font-bold text-[11px]">
              G
            </div>
            <span className="hidden md:inline font-semibold text-[#24352F] text-xs">{userSettings.name}</span>
          </button>
        </div>
      </div>

      {/* Global Completed Toast Banner if present */}
      {toastMessage && (
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#8BAE8B]/15 border border-[#8BAE8B]/35 text-xs text-[#24352F]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#557A62] text-white font-mono font-semibold uppercase">
              Notice
            </span>
            <p className="line-clamp-1 font-medium">{toastMessage}</p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-[#68736D] hover:text-[#24352F] text-xs font-bold px-2 py-0.5 rounded hover:bg-black/5 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </header>
  );
};
