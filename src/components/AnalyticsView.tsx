import React, { useState } from 'react';
import {
  Sparkles,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { useKitchen } from '../context/KitchenContext';

export const AnalyticsView: React.FC = () => {
  const { setToastMessage, userSettings, theme } = useKitchen();
  const isDark = theme === 'dark';
  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year'>('month');
  const [isRuleApplied, setIsRuleApplied] = useState(false);

  const baseKg = userSettings.wasteSavedKg;
  const baseSaved = userSettings.moneySavedInr;

  const getMetrics = () => {
    switch (timeRange) {
      case 'quarter': {
        const qKg = +(baseKg * 3).toFixed(0);
        const qSaved = Math.round(baseSaved * 2.91);
        const qCarbon = Math.round(qKg * 1.295);
        return {
          financialLoss: '₹ 8,900',
          salvageable: '85%',
          targetSavings: '₹ 7,565',
          greens: 42,
          dairy: 32,
          bakery: 16,
          others: 10,
          salvagedKg: `${qKg} kg`,
          carbon: `${qCarbon} kg CO2e`,
          cumSaved: `₹ ${qSaved.toLocaleString('en-IN')}`,
        };
      }
      case 'year': {
        const yKg = +(baseKg * 10).toFixed(0);
        const ySaved = Math.round(baseSaved * 9.48);
        const yCarbon = Math.round(yKg * 1.295);
        return {
          financialLoss: '₹ 32,000',
          salvageable: '88%',
          targetSavings: '₹ 28,160',
          greens: 40,
          dairy: 35,
          bakery: 15,
          others: 10,
          salvagedKg: `${yKg.toLocaleString('en-IN')} kg`,
          carbon: `${yCarbon.toLocaleString('en-IN')} kg CO2e`,
          cumSaved: `₹ ${ySaved.toLocaleString('en-IN')}`,
        };
      }
      default: {
        const mCarbon = Math.round(baseKg * 1.295);
        return {
          financialLoss: '₹ 3,500',
          salvageable: '82%',
          targetSavings: '₹ 2,870 / mo',
          greens: 45,
          dairy: 30,
          bakery: 15,
          others: 10,
          salvagedKg: `${baseKg} kg`,
          carbon: `${mCarbon} kg CO2e`,
          cumSaved: `₹ ${baseSaved.toLocaleString('en-IN')}`,
        };
      }
    }
  };

  const metrics = getMetrics();

  const handleApplyRule = () => {
    setIsRuleApplied(true);
    setToastMessage('Smart Rule Applied: Automatic spinach shopping rescheduled to Thursdays');
  };

  return (
    <div className={`space-y-6 pb-20 theme-transition ${isDark ? 'text-[#dbe4e8]' : 'text-[#24332D]'}`}>
      {/* Top Header */}
      <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm transition-all ${
        isDark ? 'bg-[#1c2529] border-white/10' : 'bg-[#FFFFFF] border-[#E4DED2]'
      }`}>
        <div>
          <span className={`text-xs font-bold uppercase tracking-wider ${
            isDark ? 'text-[#a1e3f9]' : 'text-[#557A62]'
          }`}>
            Kitchen Statistics
          </span>
          <h2 className={`font-display text-xl font-bold mt-0.5 ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
            Food Waste & Savings
          </h2>
          <p className={`text-xs ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
            See what food gets wasted and how to save money on grocery shopping
          </p>
        </div>

        {/* Time range selector */}
        <div className={`flex items-center gap-1.5 p-1 rounded-xl border shrink-0 self-start sm:self-auto ${
          isDark ? 'bg-[#151d20] border-white/5' : 'bg-[#F7F5EF] border-[#E4DED2]'
        }`}>
          {(['month', 'quarter', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                timeRange === range
                  ? isDark
                    ? 'bg-[#1c2529] text-[#a1e3f9] font-bold border border-white/10'
                    : 'bg-[#FFFFFF] text-[#557A62] font-bold border border-[#E4DED2] shadow-sm'
                  : isDark
                  ? 'text-[#8e989b] hover:text-white'
                  : 'text-[#68736D] hover:text-[#24332D]'
              }`}
            >
              {range === 'month' ? 'This Month' : range === 'quarter' ? 'Last 90 Days' : 'All-Time'}
            </button>
          ))}
        </div>
      </div>

      {/* 1. Financial Impact Card */}
      <div className={`p-6 rounded-2xl border relative overflow-hidden shadow-md transition-all ${
        isDark
          ? 'bg-gradient-to-br from-[#1c2529] via-[#232b2e] to-[#1c2529] border-[#ffb780]/30 shadow-xl'
          : 'bg-gradient-to-br from-[#FFFDF8] via-[#FFFFFF] to-[#FFFDF8] border-[#D9826B]/30'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <span className={`text-xs font-bold uppercase tracking-wider ${
              isDark ? 'text-[#ffb780]' : 'text-[#D9826B]'
            }`}>
              Estimated Money Lost
            </span>
            <div className="flex items-baseline gap-2">
              <span className={`font-display text-4xl font-extrabold ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
                {metrics.financialLoss}
              </span>
              <span className={`text-xs font-medium ${isDark ? 'text-[#ffb780]' : 'text-[#D9826B]'}`}>
                avoidable loss
              </span>
            </div>
            <p className={`text-xs ${isDark ? 'text-[#bfc8cc]' : 'text-[#68736D]'}`}>
              Cost of food that expired before being cooked
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className={`p-3 rounded-xl border ${
              isDark ? 'bg-[#151d20] border-white/5' : 'bg-[#F7F5EF] border-[#E4DED2]'
            }`}>
              <p className={`text-[10px] ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>Can Be Saved</p>
              <p className={`text-sm font-bold ${isDark ? 'text-emerald-400' : 'text-[#557A62]'}`}>
                {metrics.salvageable} Savable
              </p>
            </div>
            <div className={`p-3 rounded-xl border ${
              isDark ? 'bg-[#151d20] border-white/5' : 'bg-[#F7F5EF] border-[#E4DED2]'
            }`}>
              <p className={`text-[10px] ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>Target Savings</p>
              <p className={`text-sm font-bold ${isDark ? 'text-[#a1e3f9]' : 'text-[#4B8094]'}`}>
                {metrics.targetSavings}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Most Wasted Food Types */}
      <div className={`p-5 rounded-2xl border space-y-4 shadow-sm transition-all ${
        isDark ? 'bg-[#1c2529] border-white/10' : 'bg-[#FFFFFF] border-[#E4DED2]'
      }`}>
        <h3 className={`font-display text-base font-bold ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
          Most Wasted Food Types
        </h3>

        <div className="space-y-3.5">
          {/* Leafy Greens */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className={`font-medium ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
                Leafy Greens (Spinach, Coriander, Methi)
              </span>
              <span className={`font-mono font-bold ${isDark ? 'text-[#ffb780]' : 'text-[#D9826B]'}`}>
                {metrics.greens}%
              </span>
            </div>
            <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-[#151d20]' : 'bg-[#EFE9DE]'}`}>
              <div
                style={{ width: `${metrics.greens}%` }}
                className={`h-full rounded-full transition-all duration-500 ${isDark ? 'bg-[#ffb780]' : 'bg-[#D9826B]'}`}
              />
            </div>
          </div>

          {/* Dairy */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className={`font-medium ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
                Dairy (Milk, Cream, Yogurt)
              </span>
              <span className={`font-mono font-bold ${isDark ? 'text-[#a1e3f9]' : 'text-[#4B8094]'}`}>
                {metrics.dairy}%
              </span>
            </div>
            <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-[#151d20]' : 'bg-[#EFE9DE]'}`}>
              <div
                style={{ width: `${metrics.dairy}%` }}
                className={`h-full rounded-full transition-all duration-500 ${isDark ? 'bg-[#a1e3f9]' : 'bg-[#8EC5D6]'}`}
              />
            </div>
          </div>

          {/* Bakery */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className={`font-medium ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
                Bakery & Batters
              </span>
              <span className={`font-mono font-bold ${isDark ? 'text-emerald-400' : 'text-[#557A62]'}`}>
                {metrics.bakery}%
              </span>
            </div>
            <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-[#151d20]' : 'bg-[#EFE9DE]'}`}>
              <div
                style={{ width: `${metrics.bakery}%` }}
                className={`h-full rounded-full transition-all duration-500 ${isDark ? 'bg-emerald-400' : 'bg-[#557A62]'}`}
              />
            </div>
          </div>

          {/* Others */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className={`font-medium ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
                Others (Sauces & Spreads, Fruit)
              </span>
              <span className={`font-mono font-bold ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
                {metrics.others}%
              </span>
            </div>
            <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-[#151d20]' : 'bg-[#EFE9DE]'}`}>
              <div
                style={{ width: `${metrics.others}%` }}
                className={`h-full rounded-full transition-all duration-500 ${isDark ? 'bg-[#8e989b]' : 'bg-[#A99BCB]'}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Helpful Suggestion */}
      <div className={`p-5 rounded-2xl border space-y-3 shadow-sm transition-all ${
        isDark ? 'bg-[#1c2529] border-[#a1e3f9]/30' : 'bg-[#FFFFFF] border-[#6FAF8F]/30'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className={`w-4 h-4 ${isDark ? 'text-[#a1e3f9]' : 'text-[#557A62]'}`} />
            <h3 className={`font-display text-base font-bold ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
              Smart Shopping Tip
            </h3>
          </div>
          {isRuleApplied && (
            <span className={`flex items-center gap-1 text-[11px] font-bold ${
              isDark ? 'text-emerald-400' : 'text-[#557A62]'
            }`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Rule Saved</span>
            </span>
          )}
        </div>
        <p className={`text-xs leading-relaxed ${isDark ? 'text-[#bfc8cc]' : 'text-[#68736D]'}`}>
          You often have leftover <strong className={isDark ? 'text-white' : 'text-[#24332D]'}>Spinach on Wednesdays</strong>. Try buying it fresh on{' '}
          <strong className={isDark ? 'text-[#a1e3f9]' : 'text-[#557A62]'}>Thursdays</strong> instead to match your weekend cooking habits.
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className={`flex items-center gap-2 ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
            <Calendar className={`w-3.5 h-3.5 ${isDark ? 'text-[#ffb780]' : 'text-[#D9826B]'}`} />
            <span>Next recommended shopping date: Thursday, Sep 15</span>
          </div>
          <button
            type="button"
            onClick={handleApplyRule}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              isRuleApplied
                ? isDark
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                  : 'bg-[#6FAF8F]/20 text-[#43634F] border border-[#6FAF8F]/30 cursor-default'
                : isDark
                ? 'bg-[#a1e3f9] hover:bg-[#c2effc] text-[#003642]'
                : 'bg-[#557A62] hover:bg-[#43634F] text-white shadow-sm'
            }`}
          >
            {isRuleApplied ? 'Shopping Date Shifted' : 'Apply Shopping Tip'}
          </button>
        </div>
      </div>

      {/* 4. Lifetime Environmental Impact */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`p-4 rounded-2xl border text-center shadow-sm transition-all ${
          isDark ? 'bg-[#1c2529] border-white/5' : 'bg-[#FFFFFF] border-[#E4DED2]'
        }`}>
          <p className={`text-xs ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>Total Food Saved</p>
          <p className={`font-display text-2xl font-extrabold mt-1 ${isDark ? 'text-emerald-400' : 'text-[#557A62]'}`}>
            {metrics.salvagedKg}
          </p>
        </div>
        <div className={`p-4 rounded-2xl border text-center shadow-sm transition-all ${
          isDark ? 'bg-[#1c2529] border-white/5' : 'bg-[#FFFFFF] border-[#E4DED2]'
        }`}>
          <p className={`text-xs ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>Carbon Prevented</p>
          <p className={`font-display text-2xl font-extrabold mt-1 ${isDark ? 'text-[#a1e3f9]' : 'text-[#4B8094]'}`}>
            {metrics.carbon}
          </p>
        </div>
        <div className={`p-4 rounded-2xl border text-center shadow-sm transition-all ${
          isDark ? 'bg-[#1c2529] border-white/5' : 'bg-[#FFFFFF] border-[#E4DED2]'
        }`}>
          <p className={`text-xs ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>Total Money Saved</p>
          <p className={`font-display text-2xl font-extrabold mt-1 ${isDark ? 'text-[#ffb780]' : 'text-[#D9826B]'}`}>
            {metrics.cumSaved}
          </p>
        </div>
      </div>
    </div>
  );
};
