import React, { useState } from 'react';
import {
  Award,
  Bell,
  Utensils,
  BookOpen,
  Users,
  Moon,
  Sun,
  ChevronRight,
} from 'lucide-react';
import { useKitchen } from '../context/KitchenContext';

export const ProfileView: React.FC = () => {
  const { userSettings, updateUserSettings, setToastMessage, theme, toggleTheme } = useKitchen();
  const isDark = theme === 'dark';
  const [dietary, setDietary] = useState(userSettings.dietaryPreference);
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [activeGuideModal, setActiveGuideModal] = useState(false);

  const handleDietaryChange = (newPref: string) => {
    setDietary(newPref);
    updateUserSettings({ dietaryPreference: newPref });
    setToastMessage(`Dietary preference set to ${newPref}`);
  };

  const adjustMembers = (delta: number) => {
    const updated = Math.max(1, Math.min(8, userSettings.householdMembers + delta));
    updateUserSettings({ householdMembers: updated });
    setToastMessage(`Portion sizes set for ${updated} person${updated > 1 ? 's' : ''}`);
  };

  return (
    <div className={`space-y-6 pb-20 theme-transition ${isDark ? 'text-[#dbe4e8]' : 'text-[#24332D]'}`}>
      {/* 1. Profile Hero Card */}
      <div className={`p-6 rounded-3xl border flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left shadow-sm transition-all ${
        isDark ? 'bg-[#1c2529] border-white/10' : 'bg-[#FFFFFF] border-[#E4DED2]'
      }`}>
        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center font-display font-black text-2xl shadow-xl border-2 ${
          isDark
            ? 'bg-gradient-to-tr from-[#004f5e] via-[#a1e3f9] to-white text-[#002028] shadow-[#a1e3f9]/20 border-white/20'
            : 'bg-gradient-to-tr from-[#557A62] via-[#6FAF8F] to-[#EBF3EB] text-white shadow-[#557A62]/20 border-white'
        }`}>
          HC
        </div>

        <div className="space-y-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className={`font-display text-xl font-bold ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
              {userSettings.name}
            </h2>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold flex items-center gap-1 border ${
              isDark
                ? 'bg-[#a1e3f9]/20 text-[#a1e3f9] border-[#a1e3f9]/40'
                : 'bg-[#6FAF8F]/20 text-[#43634F] border-[#6FAF8F]/40'
            }`}>
              <Award className="w-3 h-3" />
              {userSettings.badge}
            </span>
          </div>
          <p className={`text-xs ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
            Home Cook • Smart Shelf Connected Kitchen
          </p>
        </div>
      </div>

      {/* 2. Key Metrics Trio */}
      <div className="grid grid-cols-3 gap-3">
        <div className={`p-4 rounded-2xl border text-center shadow-sm transition-all ${
          isDark ? 'bg-[#151d20] border-white/5' : 'bg-[#FFFFFF] border-[#E4DED2]'
        }`}>
          <p className={`text-[11px] font-medium ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>Food Saved</p>
          <p className={`font-display text-xl sm:text-2xl font-black mt-1 ${isDark ? 'text-emerald-400' : 'text-[#557A62]'}`}>
            {userSettings.wasteSavedKg} kg
          </p>
        </div>
        <div className={`p-4 rounded-2xl border text-center shadow-sm transition-all ${
          isDark ? 'bg-[#151d20] border-white/5' : 'bg-[#FFFFFF] border-[#E4DED2]'
        }`}>
          <p className={`text-[11px] font-medium ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>Money Saved</p>
          <p className={`font-display text-xl sm:text-2xl font-black mt-1 ${isDark ? 'text-[#ffb780]' : 'text-[#D9826B]'}`}>
            ₹{userSettings.moneySavedInr.toLocaleString('en-IN')}
          </p>
        </div>
        <div className={`p-4 rounded-2xl border text-center shadow-sm transition-all ${
          isDark ? 'bg-[#151d20] border-white/5' : 'bg-[#FFFFFF] border-[#E4DED2]'
        }`}>
          <p className={`text-[11px] font-medium ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>Recipes Cooked</p>
          <p className={`font-display text-xl sm:text-2xl font-black mt-1 ${isDark ? 'text-[#a1e3f9]' : 'text-[#4B8094]'}`}>
            {userSettings.recipesMastered}
          </p>
        </div>
      </div>

      {/* 3. Settings Menu */}
      <div className={`p-5 rounded-2xl border space-y-2 shadow-sm transition-all ${
        isDark ? 'bg-[#1c2529] border-white/10' : 'bg-[#FFFFFF] border-[#E4DED2]'
      }`}>
        <h3 className={`font-display text-sm font-bold uppercase tracking-wider mb-3 ${
          isDark ? 'text-white' : 'text-[#24332D]'
        }`}>
          Kitchen Preferences
        </h3>

        {/* Dietary Preferences */}
        <div className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
          isDark ? 'bg-[#151d20] border-white/5' : 'bg-[#F7F5EF] border-[#E4DED2]'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isDark ? 'bg-white/5 text-[#a1e3f9]' : 'bg-[#FFFFFF] text-[#557A62] shadow-sm'
            }`}>
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-[#24332D]'}`}>Dietary Preferences</p>
              <p className={`text-[11px] ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>{dietary}</p>
            </div>
          </div>
          <select
            value={dietary}
            onChange={(e) => handleDietaryChange(e.target.value)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium outline-none cursor-pointer ${
              isDark
                ? 'bg-[#1c2529] border-white/10 text-[#a1e3f9]'
                : 'bg-[#FFFFFF] border-[#E4DED2] text-[#24332D]'
            }`}
          >
            <option value="South Indian Vegetarian">South Indian Vegetarian</option>
            <option value="South Indian Mixed">South Indian Mixed</option>
            <option value="Vegan">Vegan</option>
            <option value="Low Salt">Low Salt</option>
          </select>
        </div>

        {/* Notification Settings */}
        <div className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
          isDark ? 'bg-[#151d20] border-white/5' : 'bg-[#F7F5EF] border-[#E4DED2]'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isDark ? 'bg-white/5 text-[#ffb780]' : 'bg-[#FFFFFF] text-[#D9826B] shadow-sm'
            }`}>
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-[#24332D]'}`}>Notifications</p>
              <p className={`text-[11px] ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>Expiry alerts, meal prep reminders</p>
            </div>
          </div>
          <button
            onClick={() => {
              const next = !notificationsOn;
              setNotificationsOn(next);
              setToastMessage(next ? 'Notifications enabled' : 'Notifications muted');
            }}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
              notificationsOn
                ? isDark ? 'bg-[#a1e3f9]' : 'bg-[#557A62]'
                : isDark ? 'bg-[#252f33]' : 'bg-[#E4DED2]'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full transition-transform ${
                notificationsOn
                  ? `translate-x-5 ${isDark ? 'bg-[#003642]' : 'bg-white'}`
                  : `translate-x-0 ${isDark ? 'bg-[#8e989b]' : 'bg-white'}`
              }`}
            />
          </button>
        </div>

        {/* Kitchen Storage Tips */}
        <button
          onClick={() => setActiveGuideModal(true)}
          className={`w-full p-3.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
            isDark
              ? 'bg-[#151d20] border-white/5 hover:border-white/15'
              : 'bg-[#F7F5EF] border-[#E4DED2] hover:border-[#6FAF8F]/40'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isDark ? 'bg-white/5 text-emerald-400' : 'bg-[#FFFFFF] text-[#557A62] shadow-sm'
            }`}>
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-[#24332D]'}`}>Food Storage Tips</p>
              <p className={`text-[11px] ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
                How to keep herbs, vegetables, and dairy fresh longer
              </p>
            </div>
          </div>
          <ChevronRight className={`w-4 h-4 ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`} />
        </button>

        {/* Household Members */}
        <div className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
          isDark ? 'bg-[#151d20] border-white/5' : 'bg-[#F7F5EF] border-[#E4DED2]'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isDark ? 'bg-white/5 text-[#a1e3f9]' : 'bg-[#FFFFFF] text-[#4B8094] shadow-sm'
            }`}>
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-[#24332D]'}`}>Household Members</p>
              <p className={`text-[11px] ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
                {userSettings.householdMembers} People • Recipe portion scaling
              </p>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 rounded-xl p-1 border ${
            isDark ? 'bg-[#1c2529] border-white/10' : 'bg-[#FFFFFF] border-[#E4DED2]'
          }`}>
            <button
              onClick={() => adjustMembers(-1)}
              className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer transition-all ${
                isDark
                  ? 'bg-[#252f33] hover:bg-[#323d42] text-white'
                  : 'bg-[#F7F5EF] hover:bg-[#EFE9DE] text-[#24332D]'
              }`}
            >
              -
            </button>
            <span className={`text-xs font-mono font-bold px-2 ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
              {userSettings.householdMembers}
            </span>
            <button
              onClick={() => adjustMembers(1)}
              className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer transition-all ${
                isDark
                  ? 'bg-[#252f33] hover:bg-[#323d42] text-[#a1e3f9]'
                  : 'bg-[#557A62] hover:bg-[#43634F] text-white'
              }`}
            >
              +
            </button>
          </div>
        </div>

        {/* App Theme Selector */}
        <div className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
          isDark ? 'bg-[#151d20] border-white/5' : 'bg-[#F7F5EF] border-[#E4DED2]'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isDark ? 'bg-white/5 text-[#a1e3f9]' : 'bg-[#FFFFFF] text-[#F5D98B] shadow-sm'
            }`}>
              {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-[#D5A84C]" />}
            </div>
            <div>
              <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-[#24332D]'}`}>Theme</p>
              <p className={`text-[11px] ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
                {isDark ? 'Dark kitchen control center' : 'Cozy light aesthetic kitchen'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
              isDark
                ? 'bg-[#1c2529] border-white/10 text-[#a1e3f9] hover:bg-[#252f33]'
                : 'bg-[#FFFFFF] border-[#E4DED2] text-[#24332D] hover:bg-[#FBF9F4]'
            }`}
          >
            <span>{isDark ? '🌙 Dark Mode' : '☀️ Light Mode'}</span>
            <span className="text-[10px] opacity-60">(click to switch)</span>
          </button>
        </div>
      </div>

      {/* Storage Tips Modal */}
      {activeGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-lg border rounded-2xl p-6 space-y-4 shadow-2xl ${
            isDark ? 'bg-[#1c2529] border-white/10' : 'bg-[#FFFFFF] border-[#E4DED2]'
          }`}>
            <h3 className={`font-display text-lg font-bold ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
              Easy Food Storage Tips
            </h3>
            <div className={`space-y-2.5 text-xs leading-relaxed ${isDark ? 'text-[#bfc8cc]' : 'text-[#68736D]'}`}>
              <p>
                🌿 <strong>Fresh Curry Leaves & Coriander:</strong> Wrap in a clean cloth or container with a paper towel. Stays fresh for up to 2 weeks.
              </p>
              <p>
                🥥 <strong>Grated Coconut:</strong> Portion into small bags and freeze immediately. Thaws in warm water in 3 minutes.
              </p>
              <p>
                🥣 <strong>Fermented Batter:</strong> Keep on the lower fridge shelf (around 4°C). If it turns sour, use it for crispy Kara Paniyaram!
              </p>
              <p>
                🍅 <strong>Tomatoes:</strong> Store at room temperature until ripe, then move to the vegetable drawer if not using within 2 days.
              </p>
            </div>
            <button
              onClick={() => setActiveGuideModal(false)}
              className={`w-full py-2.5 rounded-xl font-bold text-xs cursor-pointer transition-all shadow-sm ${
                isDark
                  ? 'bg-[#a1e3f9] hover:bg-[#c2effc] text-[#003642]'
                  : 'bg-[#557A62] hover:bg-[#43634F] text-white'
              }`}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
