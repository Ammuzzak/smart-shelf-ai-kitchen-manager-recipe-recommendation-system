import React, { useEffect, useRef } from 'react';
import { User, Settings, LogOut, ShieldCheck, ChevronRight, Sparkles } from 'lucide-react';
import { useKitchen } from '../context/KitchenContext';

interface AccountMenuDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  positionClasses?: string;
}

export const AccountMenuDropdown: React.FC<AccountMenuDropdownProps> = ({
  isOpen,
  onClose,
  positionClasses = 'right-0 top-full mt-2 w-72 sm:w-80',
}) => {
  const { currentUser, logout, setActiveScreen, theme } = useKitchen();
  const isDark = theme === 'dark';
  const menuRef = useRef<HTMLDivElement>(null);

  // Click outside and ESC key listener
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const displayName = currentUser?.name?.trim() || 'Home Cook';
  const displayEmail = currentUser?.email?.trim() || 'user@smartshelf.app';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || 'U';

  const handleNavigateProfile = () => {
    setActiveScreen('profile');
    onClose();
  };

  const handleSignOut = () => {
    onClose();
    logout();
  };

  return (
    <div
      ref={menuRef}
      className={`absolute z-50 rounded-2xl border shadow-2xl overflow-hidden transition-all animate-fade-in ${positionClasses} ${
        isDark
          ? 'bg-[#151d20] border-white/10 text-[#dbe4e8]'
          : 'bg-[#FFFFFF] border-[#E4DED2] text-[#24332D]'
      }`}
      role="menu"
      aria-orientation="vertical"
    >
      {/* User Information Banner */}
      <div
        className={`p-4 border-b ${
          isDark ? 'bg-[#182327] border-white/5' : 'bg-[#FAF8F5] border-[#E4DED2]'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center font-display font-bold text-base shadow-sm shrink-0 ${
              currentUser?.isGuest
                ? 'bg-amber-600 text-white'
                : isDark
                ? 'bg-gradient-to-tr from-[#004f5e] to-[#a1e3f9] text-[#002028]'
                : 'bg-gradient-to-tr from-[#557A62] to-[#6FAF8F] text-white'
            }`}
          >
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <h3
              className={`font-display text-sm font-bold truncate ${
                isDark ? 'text-white' : 'text-[#24332D]'
              }`}
              title={displayName}
            >
              {displayName}
            </h3>
            <p
              className={`text-xs truncate ${
                isDark ? 'text-[#8e989b]' : 'text-[#68736D]'
              }`}
              title={displayEmail}
            >
              {displayEmail}
            </p>
          </div>
        </div>

        {/* Security / Isolation Badge */}
        <div className="mt-3 flex items-center gap-1.5">
          <div
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
              currentUser?.isGuest
                ? 'bg-amber-500/20 text-amber-400'
                : isDark
                ? 'bg-[#a1e3f9]/15 text-[#a1e3f9]'
                : 'bg-[#557A62]/15 text-[#557A62]'
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            <span>
              {currentUser?.isGuest ? 'Guest Kitchen' : 'Isolated User Space'}
            </span>
          </div>
        </div>
      </div>

      {/* Menu Options */}
      <div className="p-2 space-y-1">
        {/* Account / Kitchen Profile */}
        <button
          type="button"
          onClick={handleNavigateProfile}
          className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer group ${
            isDark
              ? 'hover:bg-white/5 text-[#dbe4e8]'
              : 'hover:bg-[#F7F5EF] text-[#24332D]'
          }`}
          role="menuitem"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                isDark
                  ? 'bg-white/5 text-[#a1e3f9] group-hover:bg-[#a1e3f9]/20'
                  : 'bg-[#557A62]/10 text-[#557A62] group-hover:bg-[#557A62]/20'
              }`}
            >
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold leading-tight">Account / Profile</p>
              <p
                className={`text-[11px] truncate leading-tight ${
                  isDark ? 'text-[#8e989b]' : 'text-[#68736D]'
                }`}
              >
                Dietary, badges & kitchen data
              </p>
            </div>
          </div>
          <ChevronRight
            className={`w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity ${
              isDark ? 'text-[#a1e3f9]' : 'text-[#557A62]'
            }`}
          />
        </button>

        {/* Settings */}
        <button
          type="button"
          onClick={handleNavigateProfile}
          className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer group ${
            isDark
              ? 'hover:bg-white/5 text-[#dbe4e8]'
              : 'hover:bg-[#F7F5EF] text-[#24332D]'
          }`}
          role="menuitem"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                isDark
                  ? 'bg-white/5 text-[#a1e3f9] group-hover:bg-[#a1e3f9]/20'
                  : 'bg-[#557A62]/10 text-[#557A62] group-hover:bg-[#557A62]/20'
              }`}
            >
              <Settings className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold leading-tight">Settings</p>
              <p
                className={`text-[11px] truncate leading-tight ${
                  isDark ? 'text-[#8e989b]' : 'text-[#68736D]'
                }`}
              >
                Theme, alerts & storage guide
              </p>
            </div>
          </div>
          <ChevronRight
            className={`w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity ${
              isDark ? 'text-[#a1e3f9]' : 'text-[#557A62]'
            }`}
          />
        </button>
      </div>

      {/* Divider & Sign Out */}
      <div
        className={`p-2 border-t ${
          isDark ? 'border-white/5 bg-[#12191c]' : 'border-[#E4DED2] bg-[#FAF8F5]'
        }`}
      >
        <button
          type="button"
          onClick={handleSignOut}
          className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-left font-bold text-xs transition-all cursor-pointer ${
            isDark
              ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30'
              : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
          }`}
          role="menuitem"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <div className="flex-1">
            <span className="block leading-tight">Sign Out</span>
            <span
              className={`block text-[10px] font-normal leading-tight ${
                isDark ? 'text-rose-300/70' : 'text-rose-600/70'
              }`}
            >
              End session & return to login
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};
