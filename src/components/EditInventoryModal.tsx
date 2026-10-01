import React, { useState, useEffect } from 'react';
import { X, Trash2, Check } from 'lucide-react';
import { useKitchen } from '../context/KitchenContext';
import { FoodCategory } from '../types';

export const EditInventoryModal: React.FC = () => {
  const { editingInventoryItem, setEditingInventoryItem, updateItem, deleteItem, setToastMessage, theme } = useKitchen();
  const isDark = theme === 'dark';

  const [name, setName] = useState('');
  const [category, setCategory] = useState<FoodCategory>('Produce');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('kg');
  const [daysLeft, setDaysLeft] = useState(3);
  const [location, setLocation] = useState('Vegetable Drawer');
  const [atRisk, setAtRisk] = useState(false);

  useEffect(() => {
    if (editingInventoryItem) {
      setName(editingInventoryItem.name);
      setCategory(
        editingInventoryItem.category === 'Staples'
          ? 'Basic Foods'
          : editingInventoryItem.category === 'Condiments'
          ? 'Sauces & Spreads'
          : editingInventoryItem.category
      );
      setQuantity(editingInventoryItem.quantity);
      setUnit(editingInventoryItem.unit);
      setDaysLeft(editingInventoryItem.daysLeft);
      setLocation(editingInventoryItem.location);
      setAtRisk(editingInventoryItem.atRisk || editingInventoryItem.daysLeft <= 2);
    }
  }, [editingInventoryItem]);

  if (!editingInventoryItem) return null;

  const handleSave = () => {
    if (!name.trim()) return;

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysLeft);

    updateItem(editingInventoryItem.id, {
      name: name.trim(),
      category,
      quantity,
      unit,
      location,
      daysLeft,
      atRisk,
      expiryDate: expiryDate.toISOString().split('T')[0],
      urgencyStatus: daysLeft <= 1 ? 'critical' : daysLeft <= 3 ? 'warning' : 'optimal',
    });

    setToastMessage(`Updated ${name.trim()} in My Food`);
    setEditingInventoryItem(null);
  };

  const handleDelete = () => {
    deleteItem(editingInventoryItem.id);
    setEditingInventoryItem(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className={`w-full max-w-md border rounded-2xl shadow-2xl p-6 relative space-y-5 transition-all ${
        isDark ? 'bg-[#1c2529] border-white/10 text-[#dbe4e8]' : 'bg-[#FFFFFF] border-[#E4DED2] text-[#24332D]'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between pb-3 border-b ${
          isDark ? 'border-white/10' : 'border-[#E4DED2]'
        }`}>
          <div>
            <h2 className={`font-display text-lg font-bold ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
              Edit Food Item
            </h2>
            <p className={`text-xs ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
              Update food amount, storage location, or expiry days
            </p>
          </div>
          <button
            onClick={() => setEditingInventoryItem(null)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isDark
                ? 'bg-white/5 hover:bg-white/10 text-[#bfc8cc] hover:text-white'
                : 'bg-[#F7F5EF] hover:bg-[#EFE9DE] text-[#68736D] hover:text-[#24332D]'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {/* Item Name */}
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
              isDark ? 'text-[#8e989b]' : 'text-[#68736D]'
            }`}>
              Food Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none transition-all ${
                isDark
                  ? 'bg-[#151d20] border-white/10 text-white placeholder-[#5a6568] focus:border-[#a1e3f9]'
                  : 'bg-[#FFFFFF] border-[#E4DED2] text-[#24332D] placeholder-[#8A9590] focus:border-[#6FAF8F]'
              }`}
            />
          </div>

          {/* Category & Storage Bay */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                isDark ? 'text-[#8e989b]' : 'text-[#68736D]'
              }`}>
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FoodCategory)}
                className={`w-full px-3 py-2.5 rounded-xl border text-xs outline-none cursor-pointer ${
                  isDark
                    ? 'bg-[#151d20] border-white/10 text-white'
                    : 'bg-[#FFFFFF] border-[#E4DED2] text-[#24332D]'
                }`}
              >
                <option value="Produce">Produce</option>
                <option value="Dairy">Dairy</option>
                <option value="Basic Foods">Basic Foods</option>
                <option value="Lentils & Spices">Lentils & Spices</option>
                <option value="Bakery">Bakery</option>
                <option value="Oils">Oils</option>
                <option value="Sauces & Spreads">Sauces & Spreads</option>
              </select>
            </div>

            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                isDark ? 'text-[#8e989b]' : 'text-[#68736D]'
              }`}>
                Storage Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Vegetable Drawer"
                className={`w-full px-3 py-2.5 rounded-xl border text-xs outline-none ${
                  isDark
                    ? 'bg-[#151d20] border-white/10 text-white'
                    : 'bg-[#FFFFFF] border-[#E4DED2] text-[#24332D]'
                }`}
              />
            </div>
          </div>

          {/* Quantity & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                isDark ? 'text-[#8e989b]' : 'text-[#68736D]'
              }`}>
                Quantity
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2.5 rounded-xl border text-xs outline-none ${
                  isDark
                    ? 'bg-[#151d20] border-white/10 text-white'
                    : 'bg-[#FFFFFF] border-[#E4DED2] text-[#24332D]'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                isDark ? 'text-[#8e989b]' : 'text-[#68736D]'
              }`}>
                Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl border text-xs outline-none cursor-pointer ${
                  isDark
                    ? 'bg-[#151d20] border-white/10 text-white'
                    : 'bg-[#FFFFFF] border-[#E4DED2] text-[#24332D]'
                }`}
              >
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="L">L</option>
                <option value="ml">ml</option>
                <option value="Bunch">Bunch</option>
                <option value="Packets">Packets</option>
                <option value="Whole">Whole</option>
              </select>
            </div>
          </div>

          {/* Expiry Days & At-Risk status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                isDark ? 'text-[#8e989b]' : 'text-[#68736D]'
              }`}>
                Days Left
              </label>
              <input
                type="number"
                min="0"
                value={daysLeft}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) || 0;
                  setDaysLeft(val);
                  if (val <= 2) setAtRisk(true);
                }}
                className={`w-full px-3 py-2.5 rounded-xl border text-xs outline-none ${
                  isDark
                    ? 'bg-[#151d20] border-white/10 text-white'
                    : 'bg-[#FFFFFF] border-[#E4DED2] text-[#24332D]'
                }`}
              />
            </div>

            <div className="flex flex-col justify-end">
              <label
                onClick={() => setAtRisk(!atRisk)}
                className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer select-none transition-all ${
                  isDark
                    ? 'bg-[#151d20] border-white/10 hover:bg-white/5'
                    : 'bg-[#F7F5EF] border-[#E4DED2] hover:bg-[#EFE9DE]'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${
                    atRisk ? 'bg-rose-500 text-white' : 'border border-gray-400 text-transparent'
                  }`}
                >
                  ✓
                </div>
                <span className={`text-xs ${isDark ? 'text-white' : 'text-[#24332D]'}`}>Use Soon</span>
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={`flex items-center justify-between pt-3 border-t ${
          isDark ? 'border-white/10' : 'border-[#E4DED2]'
        }`}>
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-400 hover:text-white hover:bg-rose-500/20 text-xs font-semibold transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditingInventoryItem(null)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#151d20] hover:bg-[#232b2e] text-[#bfc8cc]'
                  : 'bg-[#F7F5EF] hover:bg-[#EFE9DE] text-[#68736D]'
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
                isDark
                  ? 'bg-[#a1e3f9] hover:bg-[#c2effc] text-[#003642]'
                  : 'bg-[#557A62] hover:bg-[#43634F] text-white'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
