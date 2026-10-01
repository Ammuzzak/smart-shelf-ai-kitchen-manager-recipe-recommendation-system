import React, { useState } from 'react';
import { TrendingUp, ChevronRight } from 'lucide-react';
import { useKitchen } from '../context/KitchenContext';

export const RescuePlanView: React.FC = () => {
  const {
    dailySchedule,
    recipes,
    setActiveRecipe,
    setSelectedRecipeForDetail,
    setIsRecipeDetailOpen,
    theme,
  } = useKitchen();
  const isDark = theme === 'dark';

  const [selectedDate, setSelectedDate] = useState('Wed 14');

  const dates = [
    { day: 'Mon', num: '12', waste: '380g', saved: '₹ 110', health: 82 },
    { day: 'Tue', num: '13', waste: '520g', saved: '₹ 145', health: 88 },
    { day: 'Wed', num: '14', waste: '560g', saved: '₹ 185', health: 85 },
    { day: 'Thu', num: '15', waste: '410g', saved: '₹ 120', health: 91 },
    { day: 'Fri', num: '16', waste: '620g', saved: '₹ 210', health: 86 },
    { day: 'Sat', num: '17', waste: '480g', saved: '₹ 130', health: 93 },
    { day: 'Sun', num: '18', waste: '590g', saved: '₹ 195', health: 89 },
  ];

  const currentDayStats = dates.find((d) => `${d.day} ${d.num}` === selectedDate) || dates[2];

  const handleOpenRecipe = (recipeId: string) => {
    const match = recipes.find((r) => r.id === recipeId) || recipes[0];
    setActiveRecipe(match);
    setSelectedRecipeForDetail(match);
    setIsRecipeDetailOpen(true);
  };

  return (
    <div className={`space-y-6 pb-20 theme-transition ${isDark ? 'text-[#dbe4e8]' : 'text-[#24332D]'}`}>
      {/* 1. Date Selector Bar */}
      <div className={`p-4 rounded-2xl border flex items-center gap-3 overflow-x-auto scrollbar-none shadow-sm transition-all ${
        isDark ? 'bg-[#1c2529] border-white/10' : 'bg-[#FFFFFF] border-[#E4DED2]'
      }`}>
        {dates.map((d) => {
          const key = `${d.day} ${d.num}`;
          const isSelected = selectedDate === key;
          return (
            <button
              key={key}
              onClick={() => setSelectedDate(key)}
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
              <span className={`text-[11px] ${isSelected ? 'font-bold' : isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
                {d.day}
              </span>
              <span className="text-base font-display font-extrabold">{d.num}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Top Stats: Food Saved + Food Health Ring */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Food Saved Card */}
        <div className={`p-5 rounded-2xl border flex items-center justify-between shadow-sm transition-all ${
          isDark ? 'bg-[#1c2529] border-white/10' : 'bg-[#FFFFFF] border-[#E4DED2]'
        }`}>
          <div className="space-y-1">
            <span className={`text-xs font-bold uppercase tracking-wider ${
              isDark ? 'text-[#a1e3f9]' : 'text-[#557A62]'
            }`}>
              Food Saved ({selectedDate})
            </span>
            <div className="flex items-baseline gap-4 pt-1">
              <div>
                <p className={`text-[10px] ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>Food Saved</p>
                <p className={`font-display text-2xl font-extrabold ${
                  isDark ? 'text-emerald-400' : 'text-[#557A62]'
                }`}>
                  {currentDayStats.waste}
                </p>
              </div>
              <div className={`border-l pl-4 ${isDark ? 'border-white/10' : 'border-[#E4DED2]'}`}>
                <p className={`text-[10px] ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>Money Saved</p>
                <p className={`font-display text-2xl font-extrabold ${
                  isDark ? 'text-[#ffb780]' : 'text-[#D9826B]'
                }`}>
                  {currentDayStats.saved}
                </p>
              </div>
            </div>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isDark
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-[#6FAF8F]/20 text-[#557A62]'
          }`}>
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Food Health Card */}
        <div className={`p-5 rounded-2xl border flex items-center justify-between shadow-sm transition-all ${
          isDark ? 'bg-[#1c2529] border-white/10' : 'bg-[#FFFFFF] border-[#E4DED2]'
        }`}>
          <div className="space-y-1">
            <span className={`text-xs font-bold uppercase tracking-wider ${
              isDark ? 'text-[#8e989b]' : 'text-[#68736D]'
            }`}>
              Food Health
            </span>
            <h3 className={`font-display text-sm font-bold ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
              Food storage in great condition
            </h3>
            <p className={`text-[11px] ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
              No food wasted on {selectedDate}
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
                strokeDashoffset={251.2 * (1 - currentDayStats.health / 100)}
                strokeLinecap="round"
              />
            </svg>
            <span className={`absolute font-display text-sm font-bold ${
              isDark ? 'text-white' : 'text-[#24332D]'
            }`}>
              {currentDayStats.health}%
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
              Three planned meals to use food before it expires
            </p>
          </div>
          <span className={`text-xs font-mono font-medium px-2.5 py-1 rounded-full border ${
            isDark
              ? 'bg-[#1c2529] text-[#a1e3f9] border-white/5'
              : 'bg-[#FFFFFF] text-[#557A62] border-[#E4DED2]'
          }`}>
            {selectedDate}
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
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${
                    isDark ? 'text-[#ffb780]' : 'text-[#D9826B]'
                  }`}>
                    {meal.mealType}
                  </span>
                  <h4 className={`font-display text-base font-bold transition-colors ${
                    isDark ? 'text-white hover:text-[#a1e3f9]' : 'text-[#24332D] hover:text-[#557A62]'
                  }`}>
                    {meal.title}
                  </h4>
                  <p className={`text-xs line-clamp-1 ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
                    {meal.subtitle}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {meal.rescuedIngredients.map((ing, i) => (
                      <span
                        key={i}
                        className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                          ing.status === 'critical'
                            ? isDark
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-[#F2B49F]/30 text-[#B8573E] border border-[#F2B49F]/50'
                            : isDark
                            ? 'bg-[#ffb780]/15 text-[#ffb780] border border-[#ffb780]/20'
                            : 'bg-[#F5D98B]/30 text-[#8C671C] border border-[#F5D98B]/50'
                        }`}
                      >
                        Uses: {ing.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="w-full md:w-auto flex md:flex-col sm:flex-row flex-col gap-2 shrink-0">
                <button
                  onClick={() => handleOpenRecipe(meal.recipeId)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm ${
                    isDark
                      ? 'bg-[#232b2e] hover:bg-[#a1e3f9] hover:text-[#003642] text-white border-white/10'
                      : 'bg-[#F7F5EF] hover:bg-[#557A62] hover:text-white text-[#24332D] border-[#E4DED2]'
                  }`}
                >
                  <span>View Recipe</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
