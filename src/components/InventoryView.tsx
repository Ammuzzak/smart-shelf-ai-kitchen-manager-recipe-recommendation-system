import React, { useState } from 'react';
import { Search, Plus, Minus, Trash2, Pencil } from 'lucide-react';
import { useKitchen } from '../context/KitchenContext';

export const InventoryView: React.FC = () => {
  const { inventory, adjustItemQuantity, deleteItem, setIsAddModalOpen, setEditingInventoryItem, theme } = useKitchen();
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

  return (
    <div className={`space-y-6 pb-20 theme-transition ${isDark ? 'text-[#dbe4e8]' : 'text-[#24332D]'}`}>
      {/* Top Banner */}
      <div className={`flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl border shadow-sm transition-all ${
        isDark ? 'bg-[#1c2529] border-white/10' : 'bg-[#FFFFFF] border-[#E4DED2]'
      }`}>
        <div>
          <h2 className={`font-display text-xl font-bold ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
            My Food & Food Storage
          </h2>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
            Track your fresh vegetables, basic foods, and storage locations
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
          <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
            isDark ? 'text-[#8e989b]' : 'text-[#68736D]'
          }`} />
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const isUrgent = item.atRisk || item.daysLeft <= 2;
          return (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all shadow-sm ${
                isDark
                  ? `bg-[#1c2529] ${isUrgent ? 'border-rose-500/30' : 'border-white/10 hover:border-white/20'}`
                  : `bg-[#FFFFFF] ${isUrgent ? 'border-[#D9826B]/50 bg-[#FFFDF8]' : 'border-[#E4DED2] hover:border-[#6FAF8F]/40'}`
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
                      {item.name}
                    </h3>
                    {isUrgent && (
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                        isDark
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-[#D9826B]/15 text-[#D9826B]'
                      }`}>
                        {item.daysLeft <= 0 ? 'Today' : `${item.daysLeft}d left`}
                      </span>
                    )}
                  </div>
                  <p className={`text-[11px] mt-0.5 ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
                    {item.location}
                  </p>
                </div>

                <div className="flex items-center gap-1">
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
              <div className={`mt-4 p-3 rounded-xl border flex items-center justify-between ${
                isDark
                  ? 'bg-[#151d20] border-white/5'
                  : 'bg-[#F7F5EF] border-[#E4DED2]'
              }`}>
                <div>
                  <p className={`text-[10px] uppercase font-bold tracking-wider ${
                    isDark ? 'text-[#8e989b]' : 'text-[#68736D]'
                  }`}>
                    Current Amount
                  </p>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className={`font-mono text-base font-extrabold ${
                      isDark ? 'text-[#a1e3f9]' : 'text-[#557A62]'
                    }`}>
                      {item.quantity}
                    </span>
                    <span className={`text-xs font-medium ${isDark ? 'text-[#bfc8cc]' : 'text-[#68736D]'}`}>
                      {item.unit}
                    </span>
                  </div>
                </div>

                <div className={`flex items-center gap-1.5 p-1 rounded-lg border ${
                  isDark ? 'bg-[#1c2529] border-white/10' : 'bg-[#FFFFFF] border-[#E4DED2]'
                }`}>
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
              <div className={`mt-3 flex items-center justify-between text-[11px] ${
                isDark ? 'text-[#8e989b]' : 'text-[#68736D]'
              }`}>
                <span>Category: {displayCategoryName(item.category)}</span>
                <span>Expiry: {item.expiryDate}</span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className={`p-8 text-center rounded-2xl border ${
          isDark
            ? 'bg-[#1c2529] border-white/10 text-[#8e989b]'
            : 'bg-[#FFFFFF] border-[#E4DED2] text-[#68736D]'
        }`}>
          No food items matched your search. Click "+ Add Food Item" to add new food.
        </div>
      )}
    </div>
  );
};
