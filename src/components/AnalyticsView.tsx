import React, { useState } from 'react';
import {
  Sparkles,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { useKitchen } from '../context/KitchenContext';

export const AnalyticsView: React.FC = () => {
  const { setToastMessage, userSettings } = useKitchen();
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
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="p-5 rounded-2xl bg-[#1c2529] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#a1e3f9] uppercase tracking-wider">Kitchen Statistics</span>
          <h2 className="font-display text-xl font-bold text-white mt-0.5">Food Waste & Savings</h2>
          <p className="text-xs text-[#8e989b]">
            See what food gets wasted and how to save money on grocery shopping
          </p>
        </div>

        {/* Time range selector */}
        <div className="flex items-center gap-1.5 p-1 bg-[#151d20] rounded-xl border border-white/5 shrink-0 self-start sm:self-auto">
          {(['month', 'quarter', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                timeRange === range
                  ? 'bg-[#1c2529] text-[#a1e3f9] font-bold border border-white/10'
                  : 'text-[#8e989b] hover:text-white'
              }`}
            >
              {range === 'month' ? 'This Month' : range === 'quarter' ? 'Last 90 Days' : 'All-Time'}
            </button>
          ))}
        </div>
      </div>

      {/* 1. Financial Impact Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[#1c2529] via-[#232b2e] to-[#1c2529] border border-[#ffb780]/30 relative overflow-hidden shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-[#ffb780] uppercase tracking-wider">Estimated Money Lost</span>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-4xl font-extrabold text-white">{metrics.financialLoss}</span>
              <span className="text-xs text-[#ffb780] font-medium">avoidable loss</span>
            </div>
            <p className="text-xs text-[#bfc8cc]">Cost of food that expired before being cooked</p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="p-3 rounded-xl bg-[#151d20] border border-white/5">
              <p className="text-[10px] text-[#8e989b]">Can Be Saved</p>
              <p className="text-sm font-bold text-emerald-400">{metrics.salvageable} Savable</p>
            </div>
            <div className="p-3 rounded-xl bg-[#151d20] border border-white/5">
              <p className="text-[10px] text-[#8e989b]">Target Savings</p>
              <p className="text-sm font-bold text-[#a1e3f9]">{metrics.targetSavings}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Most Wasted Food Types */}
      <div className="p-5 rounded-2xl bg-[#1c2529] border border-white/10 space-y-4">
        <h3 className="font-display text-base font-bold text-white">Most Wasted Food Types</h3>

        <div className="space-y-3.5">
          {/* Leafy Greens */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-white font-medium">Leafy Greens (Spinach, Coriander, Methi)</span>
              <span className="font-mono font-bold text-[#ffb780]">{metrics.greens}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-[#151d20] overflow-hidden">
              <div style={{ width: `${metrics.greens}%` }} className="h-full rounded-full bg-[#ffb780] transition-all duration-500" />
            </div>
          </div>

          {/* Dairy */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-white font-medium">Dairy (Milk, Cream, Yogurt)</span>
              <span className="font-mono font-bold text-[#a1e3f9]">{metrics.dairy}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-[#151d20] overflow-hidden">
              <div style={{ width: `${metrics.dairy}%` }} className="h-full rounded-full bg-[#a1e3f9] transition-all duration-500" />
            </div>
          </div>

          {/* Bakery */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-white font-medium">Bakery & Batters</span>
              <span className="font-mono font-bold text-emerald-400">{metrics.bakery}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-[#151d20] overflow-hidden">
              <div style={{ width: `${metrics.bakery}%` }} className="h-full rounded-full bg-emerald-400 transition-all duration-500" />
            </div>
          </div>

          {/* Others */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-white font-medium">Others (Sauces & Spreads, Fruit)</span>
              <span className="font-mono font-bold text-[#8e989b]">{metrics.others}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-[#151d20] overflow-hidden">
              <div style={{ width: `${metrics.others}%` }} className="h-full rounded-full bg-[#8e989b] transition-all duration-500" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Helpful Suggestion */}
      <div className="p-5 rounded-2xl bg-[#1c2529] border border-[#a1e3f9]/30 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#a1e3f9]" />
            <h3 className="font-display text-base font-bold text-white">Smart Shopping Tip</h3>
          </div>
          {isRuleApplied && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Rule Saved</span>
            </span>
          )}
        </div>
        <p className="text-xs text-[#bfc8cc] leading-relaxed">
          You often have leftover <strong className="text-white">Spinach on Wednesdays</strong>. Try buying it fresh on{' '}
          <strong className="text-[#a1e3f9]">Thursdays</strong> instead to match your weekend cooking habits.
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#8e989b]">
            <Calendar className="w-3.5 h-3.5 text-[#ffb780]" />
            <span>Next recommended shopping date: Thursday, Sep 15</span>
          </div>
          <button
            type="button"
            onClick={handleApplyRule}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              isRuleApplied
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                : 'bg-[#a1e3f9] hover:bg-[#c2effc] text-[#003642]'
            }`}
          >
            {isRuleApplied ? 'Shopping Date Shifted' : 'Apply Shopping Tip'}
          </button>
        </div>
      </div>

      {/* 4. Lifetime Environmental Impact */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#1c2529] border border-white/5 text-center">
          <p className="text-xs text-[#8e989b]">Total Food Saved</p>
          <p className="font-display text-2xl font-extrabold text-emerald-400 mt-1">{metrics.salvagedKg}</p>
        </div>
        <div className="p-4 rounded-2xl bg-[#1c2529] border border-white/5 text-center">
          <p className="text-xs text-[#8e989b]">Carbon Prevented</p>
          <p className="font-display text-2xl font-extrabold text-[#a1e3f9] mt-1">{metrics.carbon}</p>
        </div>
        <div className="p-4 rounded-2xl bg-[#1c2529] border border-white/5 text-center">
          <p className="text-xs text-[#8e989b]">Total Money Saved</p>
          <p className="font-display text-2xl font-extrabold text-[#ffb780] mt-1">{metrics.cumSaved}</p>
        </div>
      </div>
    </div>
  );
};
