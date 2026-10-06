import React, { useState } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Pencil,
  Sparkles,
  AlertTriangle,
  Package,
} from 'lucide-react';
import { useKitchen } from '../context/KitchenContext';
import {
  getDaysUntilExpiry,
  getExpiryRelativeLabel,
  formatFriendlyDate,
  isExpired,
  isExpiringSoon,
} from '../utils/dateUtils';

export const InventoryView: React.FC = () => {
  const {
    inventory,
    adjustItemQuantity,
    deleteItem,
    setIsAddModalOpen,
    setEditingInventoryItem,
    loadSampleDemoPantry,
    logFoodWaste,
    theme,
  } = useKitchen();
  const isDark = theme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = [
    'All',
    'Produce',
    'Basic Foods',
    'Dairy',
    'Lentils & Spices',
    'Oils',
    'Sauces & Spreads',
  ];

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

  const filteredItems = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesCat = selectedCategory === 'All';
    if (!matchesCat) {
      if (selectedCategory === 'Basic Foods') {
        matchesCat = item.category === 'Basic Foods' || item.category === 'Staples';
      } else if (selectedCategory === 'Sauces & Spreads') {
        matchesCat = item.category === 'Sauces & Spreads' || item.category === 'Condiments';
      } else {
        matchesCat = item.category === selectedCategory;
      }
    }

    return matchesSearch && matchesCat;
  });

  const displayCategoryName = (cat: string) => {
    if (cat === 'Staples') return 'Basic Foods';
    if (cat === 'Condiments') return 'Sauces & Spreads';
    return cat;
  };

  const handleQuickWaste = (item: typeof inventory[0]) => {
    const confirmLoss = window.confirm(
      `Record waste event for ${item.name} (${item.quantity} ${item.unit})?\nThis will record an actual food waste log and remove it from your inventory.`
    );
    if (confirmLoss) {
      logFoodWaste({
        inventoryItemId: item.id,
        itemName: item.name,
        quantity: item.quantity,
        unit: item.unit,
        reason: isExpired(item.expiryDate) ? 'Expired' : 'Spoiled',
        wastedAt: new Date().toISOString().split('T')[0],
        estimatedLossInr: item.costEstimate || 40,
        category: item.category,
        notes: `Recorded from My Food (${item.location})`,
      });
    }
  };

  return (
    <div className={`space-y-6 pb-20 theme-transition ${isDark ? 'text-[#dbe4e8]' : 'text-[#24332D]'}`}>
      {/* Top Banner */}
      <div
        className={`flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl border shadow-sm transition-all ${
          isDark ? 'bg-[#1c2529] border-white/10' : 'bg-[#FFFFFF] border-[#E4DED2]'
        }`}
      >
        <div>
          <h2 className={`font-display text-xl font-bold ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
            My Food & Food Storage
          </h2>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
            Canonical inventory source of truth • Recalculates all alerts & recipes immediately
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
              isDark
                ? 'bg-[#a1e3f9] hover:bg-[#c2effc] text-[#003642]'
                : 'bg-[#557A62] hover:bg-[#43634F] text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Add Food Item</span>
          </button>
        </div>
      </div>

      {/* Search & Category Filter Pills */}
      <div className="space-y-3">
        <div className="relative">
          <Search
            className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
              isDark ? 'text-[#8e989b]' : 'text-[#68736D]'
            }`}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search food items, spices, veggies, locations..."
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs outline-none transition-all ${
              isDark
                ? 'bg-[#151d20] border-white/10 text-white placeholder-[#5a6568] focus:border-[#a1e3f9]'
                : 'bg-[#FFFFFF] border-[#E4DED2] text-[#24332D] placeholder-[#8A9590] focus:border-[#6FAF8F] focus:ring-1 focus:ring-[#6FAF8F]'
            }`}
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? isDark
                    ? 'bg-[#a1e3f9] text-[#003642] font-bold shadow-sm'
                    : 'bg-[#557A62] text-white font-bold shadow-sm'
                  : isDark
                  ? 'bg-[#1c2529] text-[#bfc8cc] hover:text-white border border-white/5'
                  : 'bg-[#FFFFFF] text-[#68736D] hover:text-[#24332D] border border-[#E4DED2]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Items Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const daysLeft = getDaysUntilExpiry(item.expiryDate);
            const expired = isExpired(item.expiryDate);
            const urgent = isExpiringSoon(item.expiryDate, 2);

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all shadow-sm ${
                  isDark
                    ? `bg-[#1c2529] ${
                        expired
                          ? 'border-rose-600/50 bg-[#22171a]'
                          : urgent
                          ? 'border-[#ffb780]/40'
                          : 'border-white/10 hover:border-white/20'
                      }`
                    : `bg-[#FFFFFF] ${
                        expired
                          ? 'border-[#D9826B] bg-[#FFF8F6]'
                          : urgent
                          ? 'border-[#F2B49F] bg-[#FFFDF8]'
                          : 'border-[#E4DED2] hover:border-[#6FAF8F]/40'
                      }`
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
                        {item.name}
                      </h3>
                      {expired ? (
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-rose-500/20 text-rose-400">
                          Expired
                        </span>
                      ) : urgent ? (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                            isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-[#D9826B]/15 text-[#D9826B]'
                          }`}
                        >
                          {daysLeft === 0 ? 'Today' : `${daysLeft}d left`}
                        </span>
                      ) : null}
                    </div>
                    <p className={`text-[11px] mt-0.5 ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
                      {item.location} • {item.source}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    {expired && (
                      <button
                        onClick={() => handleQuickWaste(item)}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition-all cursor-pointer"
                        title="Record as food waste"
                      >
                        Log Waste
                      </button>
                    )}
                    <button
                      onClick={() => setEditingInventoryItem(item)}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        isDark
                          ? 'text-[#8e989b] hover:text-[#a1e3f9] hover:bg-white/5'
                          : 'text-[#68736D] hover:text-[#24332D] hover:bg-[#F7F5EF]'
                      }`}
                      title="Edit item details"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        isDark
                          ? 'text-[#8e989b] hover:text-rose-400 hover:bg-white/5'
                          : 'text-[#68736D] hover:text-[#D9826B] hover:bg-[#F7F5EF]'
                      }`}
                      title="Remove from My Food"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Quantity Controller */}
                <div
                  className={`mt-4 p-3 rounded-xl border flex items-center justify-between ${
                    isDark ? 'bg-[#151d20] border-white/5' : 'bg-[#F7F5EF] border-[#E4DED2]'
                  }`}
                >
                  <div>
                    <p
                      className={`text-[10px] uppercase font-bold tracking-wider ${
                        isDark ? 'text-[#8e989b]' : 'text-[#68736D]'
                      }`}
                    >
                      Current Amount
                    </p>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span
                        className={`font-mono text-base font-extrabold ${
                          isDark ? 'text-[#a1e3f9]' : 'text-[#557A62]'
                        }`}
                      >
                        {item.quantity}
                      </span>
                      <span className={`text-xs font-medium ${isDark ? 'text-[#bfc8cc]' : 'text-[#68736D]'}`}>
                        {item.unit}
                      </span>
                      {typeof item.minimumQuantity === 'number' && (
                        <span className={`text-[10px] ml-1.5 ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
                          (min: {item.minimumQuantity})
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 p-1 rounded-lg border ${
                      isDark ? 'bg-[#1c2529] border-white/10' : 'bg-[#FFFFFF] border-[#E4DED2]'
                    }`}
                  >
                    <button
                      onClick={() => adjustItemQuantity(item.id, -getDeltaForUnit(item.unit))}
                      className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold active:scale-95 transition-all cursor-pointer ${
                        isDark
                          ? 'bg-[#252f33] hover:bg-[#323d42] text-white'
                          : 'bg-[#F7F5EF] hover:bg-[#EFE9DE] text-[#24332D]'
                      }`}
                      title="Decrease amount"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => adjustItemQuantity(item.id, getDeltaForUnit(item.unit))}
                      className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold active:scale-95 transition-all cursor-pointer ${
                        isDark
                          ? 'bg-[#252f33] hover:bg-[#323d42] text-[#a1e3f9]'
                          : 'bg-[#557A62] hover:bg-[#43634F] text-white'
                      }`}
                      title="Increase amount"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Footer Meta */}
                <div
                  className={`mt-3 flex items-center justify-between text-[11px] ${
                    isDark ? 'text-[#8e989b]' : 'text-[#68736D]'
                  }`}
                >
                  <span>Category: {displayCategoryName(item.category)}</span>
                  <span
                    className={
                      expired
                        ? 'text-rose-400 font-bold'
                        : urgent
                        ? isDark
                          ? 'text-[#ffb780] font-bold'
                          : 'text-[#D9826B] font-bold'
                        : ''
                    }
                  >
                    {getExpiryRelativeLabel(item.expiryDate)} ({formatFriendlyDate(item.expiryDate, false)})
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty Inventory State */
        <div
          className={`p-10 text-center rounded-3xl border space-y-4 max-w-xl mx-auto shadow-sm ${
            isDark ? 'bg-[#1c2529] border-white/10 text-[#dbe4e8]' : 'bg-[#FFFFFF] border-[#E4DED2] text-[#24332D]'
          }`}
        >
          <div
            className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${
              isDark ? 'bg-[#a1e3f9]/15 text-[#a1e3f9]' : 'bg-[#557A62]/15 text-[#557A62]'
            }`}
          >
            <Package className="w-7 h-7" />
          </div>
          <div>
            <h3 className={`font-display text-lg font-bold ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
              Your Kitchen Storage is Empty
            </h3>
            <p className={`text-xs mt-1 max-w-sm mx-auto ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
              Add real groceries you bought or load sample pantry items to begin.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#a1e3f9] hover:bg-[#c2effc] text-[#003642]'
                  : 'bg-[#557A62] hover:bg-[#43634F] text-white'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Add Food Item</span>
            </button>

            <button
              onClick={loadSampleDemoPantry}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 border shadow-sm transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#151d20] hover:bg-[#232b2e] text-[#a1e3f9] border-[#a1e3f9]/30'
                  : 'bg-[#FFFDF8] hover:bg-[#F7F5EF] text-[#557A62] border-[#557A62]/30'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Load Sample Pantry</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
