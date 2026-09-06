import React from 'react';
import {
  Thermometer,
  Droplets,
  Scale,
  Wind,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Plus,
  Minus,
  ChefHat,
  ScanLine,
} from 'lucide-react';
import { useKitchen } from '../context/KitchenContext';

export const DashboardView: React.FC = () => {
  const {
    inventory,
    recipes,
    setActiveScreen,
    setActiveRecipe,
    setActiveCookingRecipe,
    setActiveCookingStep,
    setIsHeyChefOpen,
    adjustItemQuantity,
    setIsAddModalOpen,
    setToastMessage,
    lastCompletedSession,
  } = useKitchen();

  const handleStartPaniyaram = () => {
    const paniyaramRecipe = recipes.find((r) => r.id === 'kara-kuzhi-paniyaram') || recipes[1];
    setActiveRecipe(paniyaramRecipe);
    setActiveCookingRecipe(paniyaramRecipe);
    setActiveCookingStep(1);
    setActiveScreen('live-cooking');
  };

  const handleOpenCompletedRecipe = () => {
    const targetRecipe =
      recipes.find((r) => r.id === lastCompletedSession?.recipeId) ||
      recipes.find((r) => r.id === 'tangy-tomato-rasam') ||
      recipes[0];
    setActiveRecipe(targetRecipe);
    setActiveCookingRecipe(targetRecipe);
    setActiveCookingStep(targetRecipe.steps ? targetRecipe.steps.length : 4);
    setActiveScreen('live-cooking');
  };

  // Top at-risk items & dynamic shelf score
  const urgentItems = inventory.filter((i) => i.atRisk || i.daysLeft <= 2);
  const rescuedItems = inventory.filter((i) => i.usedAmountNote && i.usedAmountNote.toLowerCase().includes('rescued'));
  const activeUrgentItems = urgentItems.filter((i) => (!i.usedAmountNote || !i.usedAmountNote.toLowerCase().includes('rescued')) && i.quantity > 0);

  const displaySaveFoodList: {
    id: string;
    name: string;
    qtyText: string;
    badgeText: string;
    isRescued: boolean;
    urgencyColor: 'rose' | 'amber' | 'emerald';
    note: string;
    actionLabel?: string;
    actionHandler?: () => void;
  }[] = [];

  activeUrgentItems.slice(0, 2).forEach((item) => {
    const matchedRecipe = recipes.find((r) => {
      const q = item.name.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        (r.atRiskIngredients && r.atRiskIngredients.some((a) => a.name.toLowerCase().includes(q) || q.includes(a.name.toLowerCase())))
      );
    });

    displaySaveFoodList.push({
      id: item.id,
      name: item.name,
      qtyText: `${item.quantity}${item.unit} • ${item.location}`,
      badgeText: item.daysLeft <= 1 ? `${Math.max(6, item.daysLeft * 24)}h left` : `${item.daysLeft}d left`,
      isRescued: false,
      urgencyColor: item.daysLeft <= 1 ? 'rose' : 'amber',
      note: item.daysLeft <= 1 ? 'High spoilage risk' : 'Cook soon or freeze',
      actionLabel: matchedRecipe ? `${matchedRecipe.title.split(' ')[0]} →` : 'Cook →',
      actionHandler: () => {
        if (matchedRecipe) {
          setActiveRecipe(matchedRecipe);
          setActiveCookingRecipe(matchedRecipe);
          setActiveCookingStep(1);
          setActiveScreen('live-cooking');
        } else {
          setActiveScreen('recipes');
        }
      },
    });
  });

  rescuedItems.slice(0, 4 - displaySaveFoodList.length).forEach((item) => {
    displaySaveFoodList.push({
      id: item.id,
      name: item.name,
      qtyText: item.usedAmountNote ? item.usedAmountNote.replace('Rescued in ', '') : `Rescued ${item.unit}`,
      badgeText: '✓ Rescued',
      isRescued: true,
      urgencyColor: 'emerald',
      note: item.usedAmountNote || 'Rescued in cooking session',
    });
  });

  // Fallback defaults if list is smaller than 4 to preserve Stitch layout symmetry
  if (displaySaveFoodList.length < 4) {
    inventory
      .filter((i) => !displaySaveFoodList.some((d) => d.id === i.id))
      .slice(0, 4 - displaySaveFoodList.length)
      .forEach((item) => {
        displaySaveFoodList.push({
          id: item.id,
          name: item.name,
          qtyText: `${item.quantity}${item.unit} • ${item.location}`,
          badgeText: `${item.daysLeft}d left`,
          isRescued: false,
          urgencyColor: item.daysLeft <= 3 ? 'amber' : 'emerald',
          note: item.daysLeft <= 3 ? 'Use in meal plan' : 'Fresh & optimal',
          actionLabel: 'Details →',
          actionHandler: () => setActiveScreen('inventory'),
        });
      });
  }

  const healthScore = Math.max(
    10,
    Math.min(100, Math.round(((inventory.length - urgentItems.length) / Math.max(1, inventory.length)) * 100))
  );
  const circumference = 251.2;
  const strokeDashoffset = (circumference - (healthScore / 100) * circumference).toFixed(1);

  const getDeltaForUnit = (unit: string) => {
    switch (unit.toLowerCase()) {
      case 'kg':
        return 0.1;
      case 'l':
        return 0.25;
      case 'g':
      case 'ml':
        return 50;
      default:
        return 1;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Kitchen Dock Status & Environmental Sensors */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#151d20] border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#a1e3f9]/10 border border-[#a1e3f9]/20 flex items-center justify-center text-[#a1e3f9]">
            <Thermometer className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-white text-base">Kitchen Dock</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">
                Connected
              </span>
            </div>
            <p className="text-xs text-[#8e989b]">07:45 PM • Dinner Prep Routine</p>
          </div>
        </div>

        {/* 4 Sensor readings */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full lg:w-auto">
          <div className="p-2.5 rounded-xl bg-[#1c2529] border border-white/5 flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-[#a1e3f9]" />
            <div>
              <p className="text-[10px] text-[#8e989b]">Fridge Bay 1</p>
              <p className="text-xs font-bold text-white font-mono">3.8°C</p>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#1c2529] border border-white/5 flex items-center gap-2">
            <Droplets className="w-4 h-4 text-[#a1e3f9]" />
            <div>
              <p className="text-[10px] text-[#8e989b]">Crisper Hum</p>
              <p className="text-xs font-bold text-white font-mono">64%</p>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#1c2529] border border-white/5 flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#ffb780]" />
            <div>
              <p className="text-[10px] text-[#8e989b]">Shelf Load</p>
              <p className="text-xs font-bold text-white font-mono">18.4 kg</p>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#1c2529] border border-white/5 flex items-center gap-2">
            <Wind className="w-4 h-4 text-emerald-400" />
            <div>
              <p className="text-[10px] text-[#8e989b]">Air Quality</p>
              <p className="text-xs font-bold text-emerald-400 font-mono">98 AQI</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Row: Shelf Health Gauge + Recent Saved Completion Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Circular Health Gauge Card */}
        <div className="p-5 rounded-2xl bg-[#1c2529] border border-white/10 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#8e989b] uppercase tracking-wider">Shelf Health Score</p>
              <h3 className="font-display text-xl font-bold text-white">Optimal Peak</h3>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-[#a1e3f9]/15 text-[#a1e3f9] font-mono font-semibold">
              93%
            </span>
          </div>

          {/* SVG Circular Progress Meter */}
          <div className="my-4 flex items-center justify-center">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="#252f33" strokeWidth="8" fill="transparent" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#a1e3f9"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="251.2"
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="font-display text-3xl font-extrabold text-white">{healthScore}</span>
                <span className="text-[11px] text-[#8e989b]">/ 100</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#232b2e] border border-white/5 flex items-center gap-2.5 text-xs">
            <AlertTriangle className="w-4 h-4 text-[#ffb780] shrink-0" />
            <p className="text-[#dbe4e8]">
              <strong className="text-white">
                {urgentItems.length} item{urgentItems.length === 1 ? '' : 's'} need{urgentItems.length === 1 ? 's' : ''} rescue
              </strong>{' '}
              • Tonight & Tomorrow morning
            </p>
          </div>
        </div>

        {/* Saved to Log Banner & Live Cooking Shortcut */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#1c2529] border border-emerald-500/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
                  Saved To Log
                </span>
                <span className="text-xs text-[#8e989b]">Scale Auto-Calibrated</span>
              </div>
              <button
                onClick={handleOpenCompletedRecipe}
                className="text-xs font-semibold text-[#a1e3f9] hover:underline flex items-center gap-1"
              >
                <span>Revisit Recipe Steps</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <h2 className="font-display text-lg font-bold text-white mb-2">
              {lastCompletedSession ? `${lastCompletedSession.title} Completed!` : 'Tangy Tomato Rasam Completed!'}
            </h2>
            <p className="text-xs text-[#bfc8cc] leading-relaxed mb-4">
              {lastCompletedSession ? lastCompletedSession.rescuedItemsText : '4 items rescued (560g) • ₹185 saved • IoT scale and crisper pantry inventory auto-deducted accurately.'}
            </p>

            <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-[#151d20] border border-white/5 text-center">
              <div>
                <p className="text-[10px] text-[#8e989b]">Food Rescued</p>
                <p className="text-sm font-bold text-emerald-400 font-mono">{lastCompletedSession?.rescueWeight || '560g'}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#8e989b]">Money Saved</p>
                <p className="text-sm font-bold text-[#ffb780] font-mono">{lastCompletedSession?.moneySaved || '₹185'}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#8e989b]">IoT Calibration</p>
                <p className="text-sm font-bold text-[#a1e3f9] font-mono">Auto-Deducted</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 mt-2 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs text-[#8e989b]">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{lastCompletedSession?.rescuedIngredientsNote || 'Coriander, Lemon & Overripe Tomatoes salvaged'}</span>
            </div>
            <button
              onClick={() => setActiveScreen('live-cooking')}
              className="px-4 py-2 rounded-xl bg-[#a1e3f9] hover:bg-[#c2effc] text-[#003642] font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
            >
              <ChefHat className="w-4 h-4" />
              <span>Launch Live Cooking Room</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Featured AI Suggestion: Crispy Kara Kuzhi Paniyaram (Image 9) */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1c2529] to-[#252f33] border border-[#a1e3f9]/20 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#a1e3f9]" />
            <span className="text-xs font-bold text-[#a1e3f9] uppercase tracking-wider">AI Chef Suggestion</span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-white/10 text-white font-medium">
              Tomorrow's Breakfast
            </span>
          </div>
          <span className="text-xs text-[#8e989b] flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> 20 mins prep
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-center">
          <div className="lg:col-span-2 space-y-2">
            <h3 className="font-display text-xl font-bold text-white">
              Crispy Kara Kuzhi Paniyaram & Coconut Chutney
            </h3>
            <p className="text-xs text-[#bfc8cc] leading-relaxed">
              Utilize remaining fermented batter (400ml) and grated coconut crisper stock before the 34-hour expiry mark.
              Pair with freshly tempered mustard seeds and curry leaves.
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#2e373b] text-white border border-white/10 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                Batter: 34h left
              </span>
              <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#2e373b] text-white border border-white/10 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#ffb780]" />
                Coconut: 16h left
              </span>
              <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#2e373b] text-emerald-300 border border-white/10">
                Rescue Potential: 600g (₹140)
              </span>
            </div>
          </div>

          <div className="flex lg:flex-col sm:flex-row flex-col gap-2.5 justify-end">
            <button
              onClick={handleStartPaniyaram}
              className="w-full py-2.5 px-4 rounded-xl bg-[#a1e3f9] hover:bg-[#c2effc] text-[#003642] font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-[#a1e3f9]/15"
            >
              <span>Prep Steps & Cook</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveScreen('rescue')}
              className="w-full py-2.5 px-4 rounded-xl bg-[#232b2e] hover:bg-[#2e373b] text-white border border-white/10 font-medium text-xs flex items-center justify-center gap-1 transition-all"
            >
              <span>Plan Breakfast Schedule</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. "Save This Food Today" Urgency Row (Image 9) */}
      <div className="p-5 rounded-2xl bg-[#1c2529] border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h3 className="font-display text-base font-bold text-white">Save This Food Today</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-semibold font-mono">
              {activeUrgentItems.length} Urgent • {rescuedItems.length} Rescued
            </span>
          </div>
          <button
            onClick={() => setActiveScreen('inventory')}
            className="text-xs font-semibold text-[#a1e3f9] hover:underline flex items-center gap-1"
          >
            <span>View All Shelf Stock</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {displaySaveFoodList.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-xl bg-[#151d20] border flex flex-col justify-between ${
                item.isRescued
                  ? 'border-emerald-500/20 opacity-85'
                  : item.urgencyColor === 'rose'
                  ? 'border-rose-500/30'
                  : 'border-[#ffb780]/30'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-white text-xs">{item.name}</h4>
                  <p className={`text-[11px] ${item.isRescued ? 'text-emerald-400 font-medium' : 'text-[#8e989b]'}`}>
                    {item.qtyText}
                  </p>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-semibold font-mono ${
                    item.isRescued
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : item.urgencyColor === 'rose'
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-[#ffb780]/20 text-[#ffb780]'
                  }`}
                >
                  {item.badgeText}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className={`text-[11px] ${item.isRescued ? 'text-[#8e989b]' : 'text-[#bfc8cc]'}`}>
                  {item.note}
                </span>
                {item.actionLabel && item.actionHandler && (
                  <button
                    onClick={item.actionHandler}
                    className="px-2.5 py-1 rounded-lg bg-[#a1e3f9]/20 hover:bg-[#a1e3f9] hover:text-[#003642] text-[#a1e3f9] text-xs font-bold transition-all"
                  >
                    {item.actionLabel}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Live Inventory Touch Matrix & Calibration (Image 9 & 1) */}
      <div className="p-5 rounded-2xl bg-[#1c2529] border border-white/10 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-bold text-white">Live Inventory Touch Matrix</h3>
            <p className="text-xs text-[#8e989b]">Direct shelf scale calibration & quick portion deduction</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#a1e3f9] hover:bg-[#c2effc] text-[#003642] text-xs font-bold transition-all"
            >
              <ScanLine className="w-3.5 h-3.5" />
              <span>Quick Scan In</span>
            </button>
            <button
              onClick={() => setActiveScreen('inventory')}
              className="px-3 py-1.5 rounded-lg bg-[#232b2e] hover:bg-[#2c363a] text-white text-xs font-medium border border-white/10 transition-all"
            >
              Full Inventory →
            </button>
          </div>
        </div>

        {/* Matrix Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {inventory.slice(0, 6).map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-xl bg-[#151d20] border border-white/5 hover:border-white/15 transition-all flex items-center justify-between"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-white text-xs">{item.name}</h4>
                  {item.atRisk && (
                    <span className="w-2 h-2 rounded-full bg-rose-400" title="At risk of expiration" />
                  )}
                </div>
                <p className="text-[10px] text-[#8e989b]">{item.location}</p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="font-mono text-sm font-bold text-[#a1e3f9]">
                    {item.quantity} {item.unit}
                  </span>
                  {item.usedAmountNote && (
                    <span className="text-[10px] text-[#ffb780] font-mono">{item.usedAmountNote}</span>
                  )}
                </div>
              </div>

              {/* Touch calibration buttons */}
              <div className="flex items-center gap-1 bg-[#1c2529] p-1 rounded-lg border border-white/10">
                <button
                  onClick={() => adjustItemQuantity(item.id, -getDeltaForUnit(item.unit))}
                  className="w-7 h-7 rounded-md bg-[#252f33] hover:bg-[#323d42] text-white flex items-center justify-center text-xs font-bold transition-all active:scale-95"
                  title="Deduct portion"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => adjustItemQuantity(item.id, getDeltaForUnit(item.unit))}
                  className="w-7 h-7 rounded-md bg-[#252f33] hover:bg-[#323d42] text-[#a1e3f9] flex items-center justify-center text-xs font-bold transition-all active:scale-95"
                  title="Add portion"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Weekly Rescue Impact Chart (Image 9) */}
      <div className="p-5 rounded-2xl bg-[#1c2529] border border-white/10 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-[#a1e3f9] uppercase tracking-wider">October Milestone</span>
            <h3 className="font-display text-lg font-bold text-white">Weekly Food Rescue Impact</h3>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-[#8e989b]">Rescued: </span>
              <strong className="text-emerald-400">14.2 kg</strong>
            </div>
            <div>
              <span className="text-[#8e989b]">Saved: </span>
              <strong className="text-[#ffb780]">₹2,840</strong>
            </div>
          </div>
        </div>

        {/* Custom Weekly Bar Graph */}
        <div className="h-36 pt-4 flex items-end justify-between gap-2 px-2 border-b border-white/10">
          {[
            { day: 'Mon', kg: 1.2, height: '35%' },
            { day: 'Tue', kg: 1.8, height: '52%' },
            { day: 'Wed', kg: 2.9, height: '82%', isPeak: true },
            { day: 'Thu', kg: 1.5, height: '44%' },
            { day: 'Fri', kg: 3.4, height: '95%', isPeak: true },
            { day: 'Sat', kg: 2.1, height: '60%' },
            { day: 'Sun', kg: 1.3, height: '38%' },
          ].map((bar) => (
            <div key={bar.day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
              <span className="text-[10px] font-mono text-[#8e989b] opacity-0 group-hover:opacity-100 transition-opacity">
                {bar.kg}kg
              </span>
              <div
                style={{ height: bar.height }}
                className={`w-full max-w-[36px] rounded-t-lg transition-all duration-300 ${
                  bar.isPeak
                    ? 'bg-gradient-to-t from-[#004f5e] to-[#a1e3f9] shadow-sm shadow-[#a1e3f9]/20'
                    : 'bg-[#232b2e] group-hover:bg-[#2c363a]'
                }`}
              />
              <span className="text-[11px] font-medium text-[#8e989b]">{bar.day}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-[#8e989b]">
          <span>Peak savings achieved on Wednesday & Friday batch preparations</span>
          <button
            onClick={() => setActiveScreen('analytics')}
            className="text-[#a1e3f9] hover:underline font-semibold flex items-center gap-1"
          >
            <span>Full Analytics Report</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
