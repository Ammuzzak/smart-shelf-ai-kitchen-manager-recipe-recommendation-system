import React, { useState, useMemo } from 'react';
import {
  Bell,
  Search,
  ChevronRight,
  Sun,
  Moon,
  User,
} from 'lucide-react';
import { useKitchen } from '../context/KitchenContext';
import { matchRecipesWithInput } from '../data/recipeMatching';
import { AccountMenuDropdown } from './AccountMenuDropdown';

export const Header: React.FC = () => {
  const {
    activeScreen,
    setActiveScreen,
    setIsHeyChefOpen,
    setIsAddModalOpen,
    currentUser,
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
    theme,
    toggleTheme,
  } = useKitchen();

  const isDark = theme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

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
    <header
      className={`sticky top-0 z-30 backdrop-blur-md transition-colors duration-200 px-4 lg:px-8 py-3 flex flex-col gap-2 relative ${
        isDark
          ? 'bg-[#121a1d]/95 border-b border-white/10 text-[#dbe4e8] shadow-[0_2px_12px_rgba(0,0,0,0.3)]'
          : 'bg-[#FFFDF8]/95 border-b border-[#E4DED2] text-[#24332D] shadow-[0_2px_8px_rgba(50,60,45,0.03)]'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Title and breadcrumbs */}
        <div className="flex items-center gap-3">
          <div className="lg:hidden flex items-center gap-2">
            <span
              className={`font-display font-black text-sm tracking-wider ${
                isDark ? 'text-[#a1e3f9]' : 'text-[#557A62]'
              }`}
            >
              SMART SHELF
            </span>
            <span className={`text-[10px] font-mono ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
              v2.4
            </span>
          </div>

          <div
            className={`hidden lg:flex items-center gap-2 text-xs ${
              isDark ? 'text-[#8e989b]' : 'text-[#68736D]'
            }`}
          >
            <span>Kitchen</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            <span className={`font-bold ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
              {getScreenTitle()}
            </span>
          </div>
        </div>

        {/* Global Quick Search Field */}
        <div className="relative flex-1 max-w-xs hidden md:block">
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-all shadow-sm ${
              isDark
                ? 'bg-[#1c2529] border-white/10 focus-within:border-[#a1e3f9] focus-within:ring-2 focus-within:ring-[#a1e3f9]/20'
                : 'bg-[#FFFFFF] border-[#E4DED2] focus-within:border-[#557A62] focus-within:ring-2 focus-within:ring-[#557A62]/20'
            }`}
          >
            <Search className={`w-3.5 h-3.5 ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`} />
            <input
              type="text"
              placeholder="Search pantry or recipes..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              className={`bg-transparent text-xs outline-none w-full font-medium ${
                isDark
                  ? 'text-white placeholder-[#8e989b]'
                  : 'text-[#24332D] placeholder-[#8A9590]'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className={`text-xs cursor-pointer ${
                  isDark ? 'text-[#8e989b] hover:text-white' : 'text-[#68736D] hover:text-[#24332D]'
                }`}
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Search Popover */}
          {isSearchOpen && filteredSearchResults.length > 0 && (
            <div
              className={`absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-xl p-2 z-50 space-y-1 border ${
                isDark ? 'bg-[#1c2529] border-white/10' : 'bg-[#FFFFFF] border-[#E4DED2]'
              }`}
            >
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
                  className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer ${
                    isDark ? 'hover:bg-white/5' : 'hover:bg-[#F7F3EA]'
                  }`}
                >
                  <div>
                    <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
                      {res.title}
                    </p>
                    <p className={`text-[10px] ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
                      {res.sub}
                    </p>
                  </div>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold uppercase ${
                      isDark
                        ? 'bg-[#a1e3f9]/20 text-[#a1e3f9]'
                        : 'bg-[#557A62]/15 text-[#557A62]'
                    }`}
                  >
                    {res.type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Controls & Notifications */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all cursor-pointer shadow-sm select-none ${
              isDark
                ? 'bg-[#1c2529] border-white/10 hover:border-[#a1e3f9]/40 text-[#a1e3f9] hover:bg-[#253238]'
                : 'bg-[#FFFFFF] border-[#E4DED2] hover:border-[#557A62]/40 text-[#D5A84C] hover:bg-[#F7F5EF]'
            }`}
            aria-label="Toggle theme mode"
          >
            {isDark ? (
              <Moon className="w-3.5 h-3.5 text-[#a1e3f9]" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-[#D5A84C]" />
            )}
            <span
              className={`text-xs font-bold font-mono tracking-wide ${
                isDark ? 'text-[#a1e3f9]' : 'text-[#24332D]'
              }`}
            >
              {isDark ? 'Dark' : 'Light'}
            </span>
          </button>

          {/* Quick Voice Command pill */}
          <button
            onClick={() => setIsHeyChefOpen(true)}
            className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-all shadow-sm cursor-pointer ${
              isDark
                ? 'bg-[#a1e3f9]/10 hover:bg-[#a1e3f9]/20 border-[#a1e3f9]/30 text-[#a1e3f9]'
                : 'bg-[#A99BCB]/15 hover:bg-[#A99BCB]/25 border-[#A99BCB]/30 text-[#24332D]'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full animate-ping ${
                isDark ? 'bg-[#a1e3f9]' : 'bg-[#557A62]'
              }`}
            />
            <span className={`font-medium ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
              Voice:
            </span>
            <span className={`font-bold ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
              "Hey Chef"
            </span>
          </button>

          {/* Notifications Bell with unread counter */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className={`relative p-2 rounded-xl border transition-all cursor-pointer shadow-sm ${
                isDark
                  ? 'bg-[#1c2529] hover:bg-[#253238] border-white/10 text-[#8e989b] hover:text-white'
                  : 'bg-[#FFFFFF] hover:bg-[#F7F5EF] border-[#E4DED2] text-[#68736D] hover:text-[#24332D]'
              }`}
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
              <div
                className={`absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl shadow-2xl p-4 z-50 space-y-3 border ${
                  isDark ? 'bg-[#1c2529] border-white/10 text-white' : 'bg-[#FFFFFF] border-[#E4DED2] text-[#24332D]'
                }`}
              >
                <div
                  className={`flex items-center justify-between pb-2 border-b ${
                    isDark ? 'border-white/10' : 'border-[#E4DED2]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-display text-xs font-bold uppercase tracking-wider ${
                        isDark ? 'text-white' : 'text-[#24332D]'
                      }`}
                    >
                      Kitchen Alerts
                    </span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D9826B]/20 text-[#D9826B] font-mono font-bold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearNotifications}
                      className={`text-[10px] hover:underline cursor-pointer ${
                        isDark ? 'text-[#8e989b] hover:text-white' : 'text-[#68736D] hover:text-[#24332D]'
                      }`}
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <div
                      className={`py-6 text-center text-xs ${
                        isDark ? 'text-[#8e989b]' : 'text-[#68736D]'
                      }`}
                    >
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
                            ? isDark
                              ? 'bg-[#151d20]/50 border-white/5 opacity-75'
                              : 'bg-[#F7F5EF]/50 border-[#E4DED2] opacity-75'
                            : notif.type === 'alert'
                            ? isDark
                              ? 'bg-[#D9826B]/15 border-[#D9826B]/40 hover:border-[#D9826B]/70'
                              : 'bg-[#D9826B]/10 border-[#D9826B]/30 hover:border-[#D9826B]/60'
                            : isDark
                            ? 'bg-[#151d20] border-white/5 hover:border-white/20'
                            : 'bg-[#FFFDF8] border-[#E4DED2] hover:border-[#557A62]/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-xs font-bold ${
                              isDark ? 'text-white' : 'text-[#24332D]'
                            }`}
                          >
                            {notif.title}
                          </p>
                          <span
                            className={`text-[9px] font-mono shrink-0 ${
                              isDark ? 'text-[#8e989b]' : 'text-[#68736D]'
                            }`}
                          >
                            {notif.time}
                          </span>
                        </div>
                        <p
                          className={`text-[11px] mt-1 leading-snug ${
                            isDark ? 'text-[#bfc8cc]' : 'text-[#68736D]'
                          }`}
                        >
                          {notif.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div
                  className={`pt-2 border-t flex items-center justify-between text-[11px] ${
                    isDark
                      ? 'border-white/10 text-[#8e989b]'
                      : 'border-[#E4DED2] text-[#68736D]'
                  }`}
                >
                  <span>Kitchen Sensors: 4 Active</span>
                  <span className={`font-semibold ${isDark ? 'text-[#a1e3f9]' : 'text-[#557A62]'}`}>
                    Live Sync
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Add Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer hover:-translate-y-0.5 ${
              isDark
                ? 'bg-[#a1e3f9] hover:bg-[#c2effc] text-[#003642]'
                : 'bg-[#557A62] hover:bg-[#43634F] text-white'
            }`}
          >
            <span>+ Add Item</span>
          </button>

          {/* User Account / Profile Pill & Interactive Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsAccountMenuOpen((prev) => !prev);
                setIsNotificationsOpen(false);
              }}
              title="Open Kitchen Account & Settings"
              aria-expanded={isAccountMenuOpen}
              className={`flex items-center gap-2 p-1.5 pr-3 rounded-full border transition-all text-xs cursor-pointer shadow-sm hover:scale-[1.02] ${
                isAccountMenuOpen
                  ? isDark
                    ? 'bg-[#1c2529] border-[#a1e3f9] text-white ring-2 ring-[#a1e3f9]/20'
                    : 'bg-[#FFFFFF] border-[#557A62] text-[#24332D] ring-2 ring-[#557A62]/20'
                  : isDark
                  ? 'bg-[#1c2529] border-white/10 hover:border-[#a1e3f9]/40 text-white'
                  : 'bg-[#FFFFFF] border-[#E4DED2] hover:border-[#557A62]/40 text-[#24332D]'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] text-white ${
                  currentUser?.isGuest
                    ? 'bg-amber-600'
                    : isDark
                    ? 'bg-[#005a6b] text-[#a1e3f9]'
                    : 'bg-[#557A62]'
                }`}
              >
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="hidden md:inline font-semibold text-xs truncate max-w-[120px]">
                {currentUser?.name || 'Home Cook'}
              </span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  currentUser?.isGuest
                    ? 'bg-amber-500/20 text-amber-400'
                    : isDark
                    ? 'bg-[#a1e3f9]/20 text-[#a1e3f9]'
                    : 'bg-[#6FAF8F]/20 text-[#43634F]'
                }`}
              >
                {currentUser?.isGuest ? 'Guest' : 'User'}
              </span>
            </button>

            <AccountMenuDropdown
              isOpen={isAccountMenuOpen}
              onClose={() => setIsAccountMenuOpen(false)}
              positionClasses="right-0 top-full mt-2 w-72 sm:w-80"
            />
          </div>
        </div>
      </div>

      {/* Global Completed Toast Banner if present */}
      {toastMessage && (
        <div
          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
            isDark
              ? 'bg-[#1c2529] border-emerald-500/30 text-white'
              : 'bg-[#8BAE8B]/15 border-[#8BAE8B]/35 text-[#24332D]'
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold uppercase ${
                isDark
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-[#557A62] text-white'
              }`}
            >
              Notice
            </span>
            <p className="line-clamp-1 font-medium">{toastMessage}</p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className={`text-xs font-bold px-2 py-0.5 rounded cursor-pointer ${
              isDark
                ? 'text-[#8e989b] hover:text-white hover:bg-white/10'
                : 'text-[#68736D] hover:text-[#24332D] hover:bg-black/5'
            }`}
          >
            ✕
          </button>
        </div>
      )}
    </header>
  );
};
