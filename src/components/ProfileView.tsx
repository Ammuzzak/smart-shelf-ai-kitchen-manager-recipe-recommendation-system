import React, { useState } from 'react';
import {
  Award,
  Bell,
  Utensils,
  BookOpen,
  Users,
  Moon,
  ChevronRight,
} from 'lucide-react';
import { useKitchen } from '../context/KitchenContext';

export const ProfileView: React.FC = () => {
  const { userSettings, updateUserSettings, setToastMessage } = useKitchen();
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
    <div className="space-y-6 pb-20">
      {/* 1. Profile Hero Card */}
      <div className="p-6 rounded-3xl bg-[#1c2529] border border-white/10 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#004f5e] via-[#a1e3f9] to-white flex items-center justify-center text-[#002028] font-display font-black text-2xl shadow-xl shadow-[#a1e3f9]/20 border-2 border-white/20">
          HC
        </div>

        <div className="space-y-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="font-display text-xl font-bold text-white">{userSettings.name}</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#a1e3f9]/20 text-[#a1e3f9] border border-[#a1e3f9]/40 font-mono font-bold flex items-center gap-1">
              <Award className="w-3 h-3" />
              {userSettings.badge}
            </span>
          </div>
          <p className="text-xs text-[#8e989b]">Home Cook • Smart Shelf Connected Kitchen</p>
        </div>
      </div>

      {/* 2. Key Metrics Trio */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-[#151d20] border border-white/5 text-center">
          <p className="text-[11px] text-[#8e989b] font-medium">Food Saved</p>
          <p className="font-display text-xl sm:text-2xl font-black text-emerald-400 mt-1">
            {userSettings.wasteSavedKg} kg
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-[#151d20] border border-white/5 text-center">
          <p className="text-[11px] text-[#8e989b] font-medium">Money Saved</p>
          <p className="font-display text-xl sm:text-2xl font-black text-[#ffb780] mt-1">
            ₹{userSettings.moneySavedInr.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-[#151d20] border border-white/5 text-center">
          <p className="text-[11px] text-[#8e989b] font-medium">Recipes Cooked</p>
          <p className="font-display text-xl sm:text-2xl font-black text-[#a1e3f9] mt-1">
            {userSettings.recipesMastered}
          </p>
        </div>
      </div>

      {/* 3. Settings Menu */}
      <div className="p-5 rounded-2xl bg-[#1c2529] border border-white/10 space-y-2">
        <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider mb-3">
          Kitchen Preferences
        </h3>

        {/* Dietary Preferences */}
        <div className="p-3.5 rounded-xl bg-[#151d20] border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#a1e3f9]">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Dietary Preferences</p>
              <p className="text-[11px] text-[#8e989b]">{dietary}</p>
            </div>
          </div>
          <select
            value={dietary}
            onChange={(e) => handleDietaryChange(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-[#1c2529] border border-white/10 text-xs text-[#a1e3f9] font-medium outline-none cursor-pointer"
          >
            <option value="South Indian Vegetarian">South Indian Vegetarian</option>
            <option value="South Indian Mixed">South Indian Mixed</option>
            <option value="Vegan">Vegan</option>
            <option value="Low Salt">Low Salt</option>
          </select>
        </div>

        {/* Notification Settings */}
        <div className="p-3.5 rounded-xl bg-[#151d20] border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#ffb780]">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Notifications</p>
              <p className="text-[11px] text-[#8e989b]">Expiry alerts, meal prep reminders</p>
            </div>
          </div>
          <button
            onClick={() => {
              const next = !notificationsOn;
              setNotificationsOn(next);
              setToastMessage(next ? 'Notifications enabled' : 'Notifications muted');
            }}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
              notificationsOn ? 'bg-[#a1e3f9]' : 'bg-[#252f33]'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-[#003642] transition-transform ${
                notificationsOn ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Kitchen Storage Tips */}
        <button
          onClick={() => setActiveGuideModal(true)}
          className="w-full p-3.5 rounded-xl bg-[#151d20] border border-white/5 hover:border-white/15 flex items-center justify-between text-left transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-emerald-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Food Storage Tips</p>
              <p className="text-[11px] text-[#8e989b]">How to keep herbs, vegetables, and dairy fresh longer</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#8e989b]" />
        </button>

        {/* Household Members */}
        <div className="p-3.5 rounded-xl bg-[#151d20] border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#a1e3f9]">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Household Members</p>
              <p className="text-[11px] text-[#8e989b]">{userSettings.householdMembers} People • Recipe portion scaling</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-[#1c2529] border border-white/10 rounded-xl p-1">
            <button
              onClick={() => adjustMembers(-1)}
              className="w-6 h-6 rounded-lg bg-[#252f33] hover:bg-[#323d42] text-white flex items-center justify-center text-xs font-bold cursor-pointer"
            >
              -
            </button>
            <span className="text-xs font-mono font-bold text-white px-2">
              {userSettings.householdMembers}
            </span>
            <button
              onClick={() => adjustMembers(1)}
              className="w-6 h-6 rounded-lg bg-[#252f33] hover:bg-[#323d42] text-[#a1e3f9] flex items-center justify-center text-xs font-bold cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        {/* App Theme */}
        <div className="p-3.5 rounded-xl bg-[#151d20] border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Theme</p>
              <p className="text-[11px] text-[#8e989b]">Dark modern kitchen theme</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-[#a1e3f9] px-2.5 py-1 rounded bg-[#a1e3f9]/10">
            Dark Mode
          </span>
        </div>
      </div>

      {/* Storage Tips Modal */}
      {activeGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-[#1c2529] border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="font-display text-lg font-bold text-white">Easy Food Storage Tips</h3>
            <div className="space-y-2.5 text-xs text-[#bfc8cc] leading-relaxed">
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
              className="w-full py-2.5 rounded-xl bg-[#a1e3f9] hover:bg-[#c2effc] text-[#003642] font-bold text-xs cursor-pointer transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
