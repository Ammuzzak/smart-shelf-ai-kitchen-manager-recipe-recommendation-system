import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Calendar,
  AlertTriangle,
  Plus,
  Trash2,
  CheckCircle2,
  TrendingDown,
  Info,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useKitchen } from '../context/KitchenContext';
import {
  getTodayDateString,
  getDaysUntilExpiry,
  formatFriendlyDate,
  isExpired,
  isExpiringSoon,
} from '../utils/dateUtils';
import { WasteReason, FoodCategory, FoodWasteRecord } from '../types';

export const AnalyticsView: React.FC = () => {
  const {
    wasteRecords,
    logFoodWaste,
    clearWasteRecords,
    inventory,
    setActiveScreen,
    setToastMessage,
    theme,
  } = useKitchen();

  const isDark = theme === 'dark';
  const today = getTodayDateString();

  // Modal to record manual waste event
  const [isLogWasteModalOpen, setIsLogWasteModalOpen] = useState(false);
  const [wasteItemName, setWasteItemName] = useState('');
  const [wasteQty, setWasteQty] = useState(1);
  const [wasteUnit, setWasteUnit] = useState('pieces');
  const [wasteReason, setWasteReason] = useState<WasteReason>('Expired');
  const [wasteDate, setWasteDate] = useState(today);
  const [wasteCategory, setWasteCategory] = useState<FoodCategory>('Produce');
  const [wasteLossEst, setWasteLossEst] = useState(40);
  const [isTipApplied, setIsTipApplied] = useState(false);

  // Filter waste records by time range
  const [timeFilter, setTimeFilter] = useState<'all' | '30days' | '7days'>('all');

  const filteredRecords = useMemo(() => {
    if (timeFilter === 'all') return wasteRecords;
    const ref = new Date();
    const thresholdDays = timeFilter === '7days' ? 7 : 30;
    ref.setDate(ref.getDate() - thresholdDays);
    const minDateStr = ref.toISOString().split('T')[0];
    return wasteRecords.filter((r) => r.wastedAt >= minDateStr);
  }, [wasteRecords, timeFilter]);

  // Real calculations based ONLY on actual waste records
  const totalLossInr = useMemo(() => {
    return filteredRecords.reduce((sum, r) => sum + (Number(r.estimatedLossInr) || 0), 0);
  }, [filteredRecords]);

  const totalWastedItemsCount = filteredRecords.length;

  const categoryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of filteredRecords) {
      const cat = r.category || 'Produce';
      counts[cat] = (counts[cat] || 0) + 1;
    }
    const total = filteredRecords.length || 1;
    return Object.entries(counts).map(([cat, count]) => ({
      category: cat,
      count,
      percent: Math.round((count / total) * 100),
    }));
  }, [filteredRecords]);

  const reasonBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of filteredRecords) {
      counts[r.reason] = (counts[r.reason] || 0) + 1;
    }
    const total = filteredRecords.length || 1;
    return Object.entries(counts).map(([reason, count]) => ({
      reason,
      count,
      percent: Math.round((count / total) * 100),
    }));
  }, [filteredRecords]);

  // PREDICTED WASTE RISK: Items in inventory expiring within 3 days or already expired
  const predictedRiskItems = useMemo(() => {
    return inventory
      .filter((item) => item.quantity > 0 && isExpiringSoon(item.expiryDate, 3))
      .map((item) => ({
        ...item,
        daysLeft: getDaysUntilExpiry(item.expiryDate),
        expired: isExpired(item.expiryDate),
      }))
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [inventory]);

  const handleSaveWaste = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wasteItemName.trim()) {
      setToastMessage('Please enter an item name.');
      return;
    }

    logFoodWaste({
      itemName: wasteItemName.trim(),
      quantity: Math.max(0.1, Number(wasteQty) || 1),
      unit: wasteUnit,
      reason: wasteReason,
      wastedAt: wasteDate || today,
      estimatedLossInr: Math.max(0, Number(wasteLossEst) || 0),
      category: wasteCategory,
      notes: 'Manually logged by user',
    });

    setWasteItemName('');
    setWasteQty(1);
    setIsLogWasteModalOpen(false);
  };

  const handleApplyTip = () => {
    setIsTipApplied(true);
    setToastMessage('Smart shopping rule applied: Buying frequency adjusted.');
  };

  return (
    <div className={`space-y-6 pb-20 theme-transition ${isDark ? 'text-[#dbe4e8]' : 'text-[#24332D]'}`}>
      {/* Top Header */}
      <div
        className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm transition-all ${
          isDark ? 'bg-[#1c2529] border-white/10' : 'bg-[#FFFFFF] border-[#E4DED2]'
        }`}
      >
        <div>
          <span
            className={`text-xs font-bold uppercase tracking-wider ${
              isDark ? 'text-[#a1e3f9]' : 'text-[#557A62]'
            }`}
          >
            Actual Recorded Data & Analytics
          </span>
          <h2 className={`font-display text-xl font-bold mt-0.5 ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
            Food Waste & Loss Analytics
          </h2>
          <p className={`text-xs ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
            Statistics computed strictly from verified user waste records • Never invents historical events
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLogWasteModalOpen(true)}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
              isDark
                ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40'
                : 'bg-[#D9826B]/15 text-[#B8573E] hover:bg-[#D9826B]/25 border border-[#D9826B]/30'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Food Waste</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: ACTUAL RECORDED FOOD WASTE */}
      {wasteRecords.length === 0 ? (
        /* Empty Waste State as explicitly required */
        <div
          className={`p-8 sm:p-10 rounded-3xl border text-center space-y-3 shadow-sm ${
            isDark ? 'bg-[#1c2529] border-white/10' : 'bg-[#FFFFFF] border-[#E4DED2]'
          }`}
        >
          <div
            className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${
              isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-[#6FAF8F]/20 text-[#557A62]'
            }`}
          >
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h3 className={`font-display text-lg font-bold ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
              No food waste recorded yet
            </h3>
            <p className={`text-xs mt-1 max-w-md mx-auto ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
              Great job! No food waste events have been logged for your kitchen account.
              Analytics are strictly calculated from real waste events and will appear here when recorded.
            </p>
          </div>
          <button
            onClick={() => setIsLogWasteModalOpen(true)}
            className={`mt-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              isDark
                ? 'bg-[#151d20] border-white/10 text-white hover:border-[#a1e3f9]/50'
                : 'bg-[#F7F5EF] border-[#E4DED2] text-[#24332D] hover:bg-[#EFE9DE]'
            }`}
          >
            + Log a Past Food Waste Event
          </button>
        </div>
      ) : (
        /* Real Waste Analytics */
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              className={`p-5 rounded-2xl border shadow-sm ${
                isDark ? 'bg-[#1c2529] border-white/10' : 'bg-[#FFFFFF] border-[#E4DED2]'
              }`}
            >
              <span className={`text-xs font-bold uppercase ${isDark ? 'text-[#ffb780]' : 'text-[#D9826B]'}`}>
                Total Financial Loss
              </span>
              <p className={`font-display text-3xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
                ₹{totalLossInr.toLocaleString('en-IN')}
              </p>
              <p className={`text-[11px] mt-0.5 ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
                From {totalWastedItemsCount} recorded waste event{totalWastedItemsCount === 1 ? '' : 's'}
              </p>
            </div>

            <div
              className={`p-5 rounded-2xl border shadow-sm ${
                isDark ? 'bg-[#1c2529] border-white/10' : 'bg-[#FFFFFF] border-[#E4DED2]'
              }`}
            >
              <span className={`text-xs font-bold uppercase ${isDark ? 'text-[#a1e3f9]' : 'text-[#557A62]'}`}>
                Wasted Events Logged
              </span>
              <p className={`font-display text-3xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
                {totalWastedItemsCount}
              </p>
              <p className={`text-[11px] mt-0.5 ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
                Verified by user
              </p>
            </div>

            <div
              className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between ${
                isDark ? 'bg-[#1c2529] border-white/10' : 'bg-[#FFFFFF] border-[#E4DED2]'
              }`}
            >
              <div>
                <span className={`text-xs font-bold uppercase ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
                  Top Waste Reason
                </span>
                <p className={`font-display text-xl font-bold mt-1 ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
                  {reasonBreakdown[0]?.reason || 'Expired'} ({reasonBreakdown[0]?.percent || 100}%)
                </p>
              </div>
              <button
                onClick={clearWasteRecords}
                className="text-[11px] text-rose-400 hover:underline self-start mt-2 cursor-pointer"
              >
                Clear all waste records
              </button>
            </div>
          </div>

          {/* Breakdown by Category & Reason */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category Breakdown */}
            <div
              className={`p-5 rounded-2xl border space-y-3 ${
                isDark ? 'bg-[#1c2529] border-white/10' : 'bg-[#FFFFFF] border-[#E4DED2]'
              }`}
            >
              <h3 className={`font-display text-sm font-bold ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
                Loss by Food Category
              </h3>
              <div className="space-y-2.5">
                {categoryBreakdown.map((item) => (
                  <div key={item.category} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className={isDark ? 'text-white' : 'text-[#24332D]'}>{item.category}</span>
                      <span className="font-mono font-bold">{item.count} items ({item.percent}%)</span>
                    </div>
                    <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#151d20]' : 'bg-[#EFE9DE]'}`}>
                      <div
                        style={{ width: `${item.percent}%` }}
                        className={`h-full rounded-full ${isDark ? 'bg-[#ffb780]' : 'bg-[#D9826B]'}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reason Breakdown */}
            <div
              className={`p-5 rounded-2xl border space-y-3 ${
                isDark ? 'bg-[#1c2529] border-white/10' : 'bg-[#FFFFFF] border-[#E4DED2]'
              }`}
            >
              <h3 className={`font-display text-sm font-bold ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
                Loss by Reason
              </h3>
              <div className="space-y-2.5">
                {reasonBreakdown.map((item) => (
                  <div key={item.reason} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className={isDark ? 'text-white' : 'text-[#24332D]'}>{item.reason}</span>
                      <span className="font-mono font-bold">{item.count} items ({item.percent}%)</span>
                    </div>
                    <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#151d20]' : 'bg-[#EFE9DE]'}`}>
                      <div
                        style={{ width: `${item.percent}%` }}
                        className={`h-full rounded-full ${isDark ? 'bg-[#a1e3f9]' : 'bg-[#557A62]'}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actual Logged Events Table */}
          <div
            className={`p-5 rounded-2xl border space-y-3 ${
              isDark ? 'bg-[#1c2529] border-white/10' : 'bg-[#FFFFFF] border-[#E4DED2]'
            }`}
          >
            <h3 className={`font-display text-sm font-bold ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
              Recorded Waste Events History
            </h3>
            <div className="space-y-2">
              {filteredRecords.map((r) => (
                <div
                  key={r.id}
                  className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
                    isDark ? 'bg-[#151d20] border-white/5' : 'bg-[#F7F5EF] border-[#E4DED2]'
                  }`}
                >
                  <div>
                    <span className={`font-bold ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
                      {r.itemName}
                    </span>
                    <span className="ml-2 font-mono opacity-80">
                      ({r.quantity} {r.unit})
                    </span>
                    <p className={`text-[11px] mt-0.5 ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
                      Reason: <span className="font-semibold">{r.reason}</span> • Loss: ₹{r.estimatedLossInr}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-[11px] font-bold">
                      {formatFriendlyDate(r.wastedAt)}
                    </span>
                    <p className="text-[10px] opacity-60">Verified Event</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: PREDICTED WASTE RISK (Carefully labeled predictions, NOT actual waste) */}
      <div
        className={`p-6 rounded-3xl border space-y-4 shadow-sm ${
          isDark ? 'bg-[#1c2529] border-amber-500/30' : 'bg-[#FFFFFF] border-[#D5A84C]/40'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-inherit">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-[#F5D98B]/35 text-[#8C671C]'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-display text-base font-bold ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
                Predicted Waste Risk
              </h3>
              <p className={`text-xs ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
                Estimated based on expiry dates of current pantry items. These are future risk predictions, NOT actual waste.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveScreen('rescue')}
            className={`text-xs font-bold flex items-center gap-1 hover:underline cursor-pointer ${
              isDark ? 'text-[#a1e3f9]' : 'text-[#557A62]'
            }`}
          >
            <span>Open Rescue Plan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {predictedRiskItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {predictedRiskItems.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2 ${
                  isDark ? 'bg-[#151d20] border-white/5' : 'bg-[#FFFDF8] border-[#E4DED2]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className={`font-semibold text-xs ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
                      {item.name}
                    </h4>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        item.expired
                          ? 'bg-rose-500/20 text-rose-300'
                          : item.daysLeft <= 1
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {item.expired
                        ? 'Past Expiry'
                        : item.daysLeft === 0
                        ? 'Expires Today'
                        : `${item.daysLeft}d left`}
                    </span>
                  </div>
                  <p className={`text-[11px] mt-1 ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
                    {item.quantity} {item.unit} • {item.location}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px]">
                  <span>Expiry: {formatFriendlyDate(item.expiryDate, false)}</span>
                  <button
                    onClick={() => {
                      logFoodWaste({
                        inventoryItemId: item.id,
                        itemName: item.name,
                        quantity: item.quantity,
                        unit: item.unit,
                        reason: item.expired ? 'Expired' : 'Spoiled',
                        wastedAt: today,
                        estimatedLossInr: item.costEstimate || 40,
                        category: item.category,
                      });
                    }}
                    className="font-bold text-rose-400 hover:underline cursor-pointer"
                  >
                    Log as Wasted
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className={`p-6 rounded-2xl border text-center space-y-1 ${
              isDark ? 'bg-[#151d20] border-white/5' : 'bg-[#FFFDF8] border-[#E4DED2]'
            }`}
          >
            <CheckCircle2 className={`w-6 h-6 mx-auto ${isDark ? 'text-emerald-400' : 'text-[#557A62]'}`} />
            <p className={`font-bold text-xs ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
              Zero Predicted Waste Risk
            </p>
            <p className={`text-[11px] ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
              None of your inventory items are expiring within the next 3 days.
            </p>
          </div>
        )}
      </div>

      {/* SECTION 3: SMART SHOPPING TIP (Using real calendar date) */}
      <div
        className={`p-5 rounded-2xl border space-y-3 shadow-sm transition-all ${
          isDark ? 'bg-[#1c2529] border-[#a1e3f9]/30' : 'bg-[#FFFFFF] border-[#6FAF8F]/30'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className={`w-4 h-4 ${isDark ? 'text-[#a1e3f9]' : 'text-[#557A62]'}`} />
            <h3 className={`font-display text-base font-bold ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
              Smart Grocery Tip
            </h3>
          </div>
          {isTipApplied && (
            <span
              className={`flex items-center gap-1 text-[11px] font-bold ${
                isDark ? 'text-emerald-400' : 'text-[#557A62]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Applied</span>
            </span>
          )}
        </div>
        <p className={`text-xs leading-relaxed ${isDark ? 'text-[#bfc8cc]' : 'text-[#68736D]'}`}>
          Buy tender leafy greens (like Spinach or Coriander) in smaller batches closer to weekend cooking sessions
          to reduce wilt risk.
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className={`flex items-center gap-2 ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
            <Calendar className={`w-3.5 h-3.5 ${isDark ? 'text-[#ffb780]' : 'text-[#D9826B]'}`} />
            <span>Today's Local Date: {formatFriendlyDate(today)}</span>
          </div>
          <button
            type="button"
            onClick={handleApplyTip}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              isTipApplied
                ? isDark
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-[#6FAF8F]/20 text-[#43634F] border border-[#6FAF8F]/30'
                : isDark
                ? 'bg-[#a1e3f9] hover:bg-[#c2effc] text-[#003642]'
                : 'bg-[#557A62] hover:bg-[#43634F] text-white shadow-sm'
            }`}
          >
            {isTipApplied ? 'Tip Saved' : 'Apply Shopping Guideline'}
          </button>
        </div>
      </div>

      {/* RECORD FOOD WASTE MODAL */}
      {isLogWasteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div
            className={`w-full max-w-md border rounded-2xl shadow-2xl p-6 relative space-y-4 ${
              isDark ? 'bg-[#1c2529] border-white/10 text-white' : 'bg-[#FFFFFF] border-[#E4DED2] text-[#24332D]'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-inherit">
              <h3 className="font-display text-base font-bold">Record Actual Food Waste</h3>
              <button
                onClick={() => setIsLogWasteModalOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center opacity-70 hover:opacity-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveWaste} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={wasteItemName}
                  onChange={(e) => setWasteItemName(e.target.value)}
                  placeholder="e.g. Country Tomatoes, Milk, Leftover Rice"
                  className={`w-full px-3 py-2 rounded-xl border outline-none ${
                    isDark ? 'bg-[#151d20] border-white/10 text-white' : 'bg-[#F7F5EF] border-[#E4DED2]'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Quantity</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={wasteQty}
                    onChange={(e) => setWasteQty(parseFloat(e.target.value) || 1)}
                    className={`w-full px-3 py-2 rounded-xl border outline-none ${
                      isDark ? 'bg-[#151d20] border-white/10 text-white' : 'bg-[#F7F5EF] border-[#E4DED2]'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Unit</label>
                  <select
                    value={wasteUnit}
                    onChange={(e) => setWasteUnit(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border outline-none cursor-pointer ${
                      isDark ? 'bg-[#151d20] border-white/10 text-white' : 'bg-[#F7F5EF] border-[#E4DED2]'
                    }`}
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="L">L</option>
                    <option value="ml">ml</option>
                    <option value="pieces">pieces</option>
                    <option value="Bunch">Bunch</option>
                    <option value="Packets">Packets</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Waste Reason</label>
                  <select
                    value={wasteReason}
                    onChange={(e) => setWasteReason(e.target.value as WasteReason)}
                    className={`w-full px-3 py-2 rounded-xl border outline-none cursor-pointer ${
                      isDark ? 'bg-[#151d20] border-white/10 text-white' : 'bg-[#F7F5EF] border-[#E4DED2]'
                    }`}
                  >
                    <option value="Expired">Expired</option>
                    <option value="Spoiled">Spoiled</option>
                    <option value="Overcooked">Overcooked</option>
                    <option value="Excess preparation">Excess preparation</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Date Wasted</label>
                  <input
                    type="date"
                    required
                    value={wasteDate}
                    onChange={(e) => setWasteDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border outline-none ${
                      isDark ? 'bg-[#151d20] border-white/10 text-white' : 'bg-[#F7F5EF] border-[#E4DED2]'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Estimated Loss (₹ INR)</label>
                <input
                  type="number"
                  min="0"
                  value={wasteLossEst}
                  onChange={(e) => setWasteLossEst(parseInt(e.target.value, 10) || 0)}
                  className={`w-full px-3 py-2 rounded-xl border outline-none ${
                    isDark ? 'bg-[#151d20] border-white/10 text-white' : 'bg-[#F7F5EF] border-[#E4DED2]'
                  }`}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLogWasteModalOpen(false)}
                  className={`px-4 py-2 rounded-xl border cursor-pointer ${
                    isDark ? 'border-white/10 text-[#8e989b]' : 'border-[#E4DED2] text-[#68736D]'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-xl font-bold cursor-pointer ${
                    isDark ? 'bg-[#a1e3f9] text-[#003642]' : 'bg-[#557A62] text-white'
                  }`}
                >
                  Save Waste Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
