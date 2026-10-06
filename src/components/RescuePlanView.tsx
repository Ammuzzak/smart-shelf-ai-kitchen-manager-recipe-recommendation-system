import React, { useState, useMemo } from 'react';
import { TrendingUp, ChevronRight, Clock, Sparkles } from 'lucide-react';
import { useKitchen } from '../context/KitchenContext';
import { getDaysUntilExpiry, isExpiringSoon } from '../utils/dateUtils';

export const RescuePlanView: React.FC = () => {
  const {
    dailySchedule,
    recipes,
    inventory,
    setActiveRecipe,
    setSelectedRecipeForDetail,
    setIsRecipeDetailOpen,
    theme,
  } = useKitchen();
  const isDark = theme === 'dark';

  // 7-day rolling plan derived strictly from local calendar dates
  const dates = useMemo(() => {
    const list = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const numStr = String(d.getDate()).padStart(2, '0');
      const isToday = i === 0;
      list.push({
        key: `${dayName} ${numStr}`,
        day: isToday ? 'Today' : dayName,
        num: numStr,
        isToday,
        targetGrams: `${300 + (i % 4) * 80}g`,
        targetSavings: `₹ ${90 + (i % 4) * 35}`,
        healthScore: 88 + (i % 6),
      });
    }
    return list;
  }, []);

  const [selectedDateKey, setSelectedDateKey] = useState<string>(() => dates[0]?.key || '');

  const currentDayStats = dates.find((d) => d.key === selectedDateKey) || dates[0];

  // Expiring items from real inventory that need rescue
  const expiringPantryItems = useMemo(() => {
    return inventory
      .filter((i) => i.quantity > 0 && isExpiringSoon(i.expiryDate, 3))
      .sort((a, b) => getDaysUntilExpiry(a.expiryDate) - getDaysUntilExpiry(b.expiryDate));
  }, [inventory]);

  const handleOpenRecipe = (recipeId: string) => {
    const match = recipes.find((r) => r.id === recipeId) || recipes[0];
    if (match) {
      setActiveRecipe(match);
      setSelectedRecipeForDetail(match);
      setIsRecipeDetailOpen(true);
    }
  };

  return (
    <div className={`space-y-6 pb-20 theme-transition ${isDark ? 'text-[#dbe4e8]' : 'text-[#24332D]'}`}>
      {/* 1. Date Selector Bar (Local calendar week) */}
      <div
        className={`p-4 rounded-2xl border flex items-center gap-3 overflow-x-auto scrollbar-none shadow-sm transition-all ${
          isDark ? 'bg-[#1c2529] border-white/10' : 'bg-[#FFFFFF] border-[#E4DED2]'
        }`}
      >
        {dates.map((d) => {
          const isSelected = selectedDateKey === d.key;
          return (
            <button
              key={d.key}
              onClick={() => setSelectedDateKey(d.key)}
              className={`flex flex-col items-center py-2.5 px-4 rounded-xl min-w-[70px] transition-all cursor-pointer ${
                isSelected
                  ? isDark
                    ? 'bg-[#a1e3f9] text-[#003642] font-bold shadow-md shadow-[#a1e3f9]/20'
                    : 'bg-[#557A62] text-white font-bold shadow-md shadow-[#557A62]/20'
                  : isDark
                  ? 'bg-[#151d20] text-[#bfc8cc] hover:text-white border border-white/5'
                  : 'bg-[#F7F5EF] text-[#68736D] hover:text-[#24332D] border border-[#E4DED2]'
              }`}
            >
              <span
                className={`text-[11px] ${
                  isSelected ? 'font-bold' : isDark ? 'text-[#8e989b]' : 'text-[#68736D]'
                }`}
              >
                {d.day}
              </span>
              <span className="text-base font-display font-extrabold">{d.num}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Top Stats: Predicted Rescue Target + Storage Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Rescue Target Card */}
        <div
          className={`p-5 rounded-2xl border flex items-center justify-between shadow-sm transition-all ${
            isDark ? 'bg-[#1c2529] border-white/10' : 'bg-[#FFFFFF] border-[#E4DED2]'
          }`}
        >
          <div className="space-y-1">
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                isDark ? 'text-[#a1e3f9]' : 'text-[#557A62]'
              }`}
            >
              Rescue Target ({currentDayStats?.day} {currentDayStats?.num})
            </span>
            <div className="flex items-baseline gap-4 pt-1">
              <div>
                <p className={`text-[10px] ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
                  Target Weight
                </p>
                <p
                  className={`font-display text-2xl font-extrabold ${
                    isDark ? 'text-emerald-400' : 'text-[#557A62]'
                  }`}
                >
                  {currentDayStats?.targetGrams}
                </p>
              </div>
              <div className={`border-l pl-4 ${isDark ? 'border-white/10' : 'border-[#E4DED2]'}`}>
                <p className={`text-[10px] ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
                  Est. Savings
                </p>
                <p
                  className={`font-display text-2xl font-extrabold ${
                    isDark ? 'text-[#ffb780]' : 'text-[#D9826B]'
                  }`}
                >
                  {currentDayStats?.targetSavings}
                </p>
              </div>
            </div>
          </div>
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isDark
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-[#6FAF8F]/20 text-[#557A62]'
            }`}
          >
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Food Health Card */}
        <div
          className={`p-5 rounded-2xl border flex items-center justify-between shadow-sm transition-all ${
            isDark ? 'bg-[#1c2529] border-white/10' : 'bg-[#FFFFFF] border-[#E4DED2]'
          }`}
        >
          <div className="space-y-1">
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                isDark ? 'text-[#8e989b]' : 'text-[#68736D]'
              }`}
            >
              Pantry Freshness Index
            </span>
            <h3 className={`font-display text-sm font-bold ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
              {expiringPantryItems.length > 0
                ? `${expiringPantryItems.length} items to rescue soon`
                : 'Pantry in optimal freshness'}
            </h3>
            <p className={`text-[11px] ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
              {expiringPantryItems.length > 0
                ? `Prioritize: ${expiringPantryItems[0].name}`
                : 'No items currently at risk'}
            </p>
          </div>

          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke={isDark ? '#252f33' : '#EFE9DE'}
                strokeWidth="9"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke={isDark ? '#a1e3f9' : '#6FAF8F'}
                strokeWidth="9"
                fill="transparent"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 * (1 - (currentDayStats?.healthScore || 90) / 100)}
                strokeLinecap="round"
              />
            </svg>
            <span
              className={`absolute font-display text-sm font-bold ${
                isDark ? 'text-white' : 'text-[#24332D]'
              }`}
            >
              {currentDayStats?.healthScore || 90}%
            </span>
          </div>
        </div>
      </div>

      {/* 3. Daily Rescue Schedule Meals */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`font-display text-base font-bold ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
              Daily Meal Plan
            </h3>
            <p className={`text-xs ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
              Three structured meals to cook ingredients before they expire
            </p>
          </div>
          <span
            className={`text-xs font-mono font-medium px-2.5 py-1 rounded-full border ${
              isDark
                ? 'bg-[#1c2529] text-[#a1e3f9] border-white/5'
                : 'bg-[#FFFFFF] text-[#557A62] border-[#E4DED2]'
            }`}
          >
            {currentDayStats?.day} {currentDayStats?.num}
          </span>
        </div>

        <div className="space-y-4">
          {dailySchedule.map((meal) => (
            <div
              key={meal.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm ${
                isDark
                  ? 'bg-[#1c2529] border-white/10 hover:border-white/20'
                  : 'bg-[#FFFFFF] border-[#E4DED2] hover:border-[#6FAF8F]/40'
              }`}
            >
              <div
                onClick={() => handleOpenRecipe(meal.recipeId)}
                className="flex items-center gap-4 cursor-pointer"
              >
                <img
                  src={meal.image}
                  alt={meal.title}
                  referrerPolicy="no-referrer"
                  className={`w-20 h-20 md:w-24 md:h-24 rounded-xl object-cover shrink-0 border ${
                    isDark ? 'border-white/10' : 'border-[#E4DED2]'
                  }`}
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        meal.mealType === 'Breakfast'
                          ? isDark
                            ? 'bg-[#a1e3f9]/20 text-[#a1e3f9]'
                            : 'bg-[#8EC5D6]/25 text-[#2C5768]'
                          : meal.mealType === 'Lunch'
                          ? isDark
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-[#6FAF8F]/20 text-[#43634F]'
                          : isDark
                          ? 'bg-[#ffb780]/20 text-[#ffb780]'
                          : 'bg-[#F2B49F]/35 text-[#B8573E]'
                      }`}
                    >
                      {meal.mealType}
                    </span>
                    <h4
                      className={`font-display text-sm md:text-base font-bold transition-colors ${
                        isDark ? 'text-white hover:text-[#a1e3f9]' : 'text-[#24332D] hover:text-[#557A62]'
                      }`}
                    >
                      {meal.title}
                    </h4>
                  </div>
                  <p className={`text-xs ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
                    {meal.subtitle}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {meal.rescuedIngredients.map((item, idx) => (
                      <span
                        key={idx}
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                          item.status === 'critical'
                            ? isDark
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : 'bg-[#D9826B]/20 text-[#D9826B] border-[#D9826B]/40'
                            : isDark
                            ? 'bg-[#ffb780]/20 text-[#ffb780] border-[#ffb780]/40'
                            : 'bg-[#F5D98B]/35 text-[#8C671C] border-[#D5A84C]/40'
                        }`}
                      >
                        {item.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleOpenRecipe(meal.recipeId)}
                className={`w-full md:w-auto px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer shrink-0 ${
                  isDark
                    ? 'bg-[#252f33] hover:bg-[#a1e3f9] text-[#a1e3f9] hover:text-[#003642]'
                    : 'bg-[#F7F5EF] hover:bg-[#557A62] text-[#24332D] hover:text-white border border-[#E4DED2]'
                }`}
              >
                <span>View Cooking Steps</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
