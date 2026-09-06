import React, { useState } from 'react';
import { Search, Plus, Minus, Trash2, Pencil, AlertTriangle, ShieldCheck, Filter, ScanLine } from 'lucide-react';
import { useKitchen } from '../context/KitchenContext';
import { FoodCategory } from '../types';

export const InventoryView: React.FC = () => {
  const { inventory, adjustItemQuantity, deleteItem, setIsAddModalOpen, setEditingInventoryItem } = useKitchen();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Produce', 'Staples', 'Dairy', 'Lentils & Spices', 'Oils', 'Condiments'];

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
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-[#1c2529] border border-white/10">
        <div>
          <h2 className="font-display text-xl font-bold text-white">Live Inventory & Pantry Shelf</h2>
          <p className="text-xs text-[#8e989b] mt-0.5">
            Calibrated with kitchen scales, RFID tags & storage bay sensors
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#a1e3f9] hover:bg-[#c2effc] text-[#003642] font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Inventory Item</span>
          </button>
        </div>
      </div>

      {/* Search & Category Filter Pills */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[#8e989b] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pantry items, spices, veggies, locations..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#151d20] border border-white/10 text-white text-xs placeholder-[#5a6568] focus:border-[#a1e3f9] outline-none"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#a1e3f9] text-[#003642] font-bold shadow-sm'
                  : 'bg-[#1c2529] text-[#bfc8cc] hover:text-white border border-white/5'
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
              className={`p-4 rounded-2xl bg-[#1c2529] border transition-all ${
                isUrgent ? 'border-rose-500/30' : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white text-sm">{item.name}</h3>
                    {isUrgent && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold">
                        {item.daysLeft <= 0 ? 'Today' : `${item.daysLeft}d left`}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#8e989b] mt-0.5">{item.location}</p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingInventoryItem(item)}
                    className="text-[#8e989b] hover:text-[#a1e3f9] p-1.5 rounded-lg hover:bg-white/5 transition-all"
                    title="Edit item details"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="text-[#8e989b] hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/5 transition-all"
                    title="Remove from pantry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Quantity & Calibration Controller */}
              <div className="mt-4 p-3 rounded-xl bg-[#151d20] border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-[#8e989b] uppercase font-bold tracking-wider">Current Stock</p>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="font-mono text-base font-extrabold text-[#a1e3f9]">
                      {item.quantity}
                    </span>
                    <span className="text-xs text-[#bfc8cc] font-medium">{item.unit}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-[#1c2529] p-1 rounded-lg border border-white/10">
                  <button
                    onClick={() => adjustItemQuantity(item.id, -getDeltaForUnit(item.unit))}
                    className="w-8 h-8 rounded-md bg-[#252f33] hover:bg-[#323d42] text-white flex items-center justify-center text-xs font-bold active:scale-95 transition-all"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => adjustItemQuantity(item.id, getDeltaForUnit(item.unit))}
                    className="w-8 h-8 rounded-md bg-[#252f33] hover:bg-[#323d42] text-[#a1e3f9] flex items-center justify-center text-xs font-bold active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Footer Meta */}
              <div className="mt-3 flex items-center justify-between text-[11px] text-[#8e989b]">
                <span>Category: {item.category}</span>
                <span>Expiry: {item.expiryDate}</span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="p-8 text-center rounded-2xl bg-[#1c2529] border border-white/10 text-[#8e989b]">
          No inventory items matched your search. Click "+ Add Inventory Item" to log new ingredients.
        </div>
      )}
    </div>
  );
};
