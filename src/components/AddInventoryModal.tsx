import React, { useState } from 'react';
import { X, Sparkles, Plus, Minus, Camera, Check } from 'lucide-react';
import { useKitchen } from '../context/KitchenContext';
import { FoodCategory } from '../types';

export const AddInventoryModal: React.FC = () => {
  const { isAddModalOpen, setIsAddModalOpen, addItem, setToastMessage, theme } = useKitchen();
  const isDark = theme === 'dark';

  const [name, setName] = useState('Spinach');
  const [category, setCategory] = useState<FoodCategory>('Produce');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('Bunch');
  const [expiryDays, setExpiryDays] = useState(4);
  const [location, setLocation] = useState('Vegetable Drawer');

  if (!isAddModalOpen) return null;

  const quickItemChips = ['Spinach', 'Milk', 'Eggs', 'Tomatoes', 'Coconut', 'Toor Dal'];

  const handleSelectChip = (itemName: string) => {
    setName(itemName);
    if (itemName === 'Milk') {
      setCategory('Dairy');
      setUnit('L');
      setLocation('Dairy Chiller');
      setExpiryDays(3);
    } else if (itemName === 'Eggs') {
      setCategory('Dairy');
      setUnit('Packets');
      setLocation('Fridge Door');
      setExpiryDays(14);
    } else if (itemName === 'Tomatoes' || itemName === 'Spinach') {
      setCategory('Produce');
      setUnit(itemName === 'Spinach' ? 'Bunch' : 'kg');
      setLocation('Vegetable Drawer');
      setExpiryDays(4);
    } else if (itemName === 'Coconut') {
      setCategory('Produce');
      setUnit('Whole');
      setLocation('Vegetable Drawer');
      setExpiryDays(2);
    } else if (itemName === 'Toor Dal') {
      setCategory('Basic Foods');
      setUnit('kg');
      setLocation('Food Storage Shelf');
      setExpiryDays(60);
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);

    addItem({
      name: name.trim(),
      category,
      quantity,
      unit,
      location,
      expiryDate: expiryDate.toISOString().split('T')[0],
      purchaseDate: new Date().toISOString().split('T')[0],
      daysLeft: expiryDays,
      atRisk: expiryDays <= 2,
      urgencyStatus: expiryDays <= 1 ? 'critical' : expiryDays <= 3 ? 'warning' : 'optimal',
      costEstimate: quantity * 40,
    });

    setIsAddModalOpen(false);
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
              Add Food Item
            </h2>
            <p className={`text-xs ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
              Add fresh items or scan a receipt
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(false)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isDark ? 'bg-white/5 hover:bg-white/10 text-[#bfc8cc] hover:text-white' : 'bg-[#F7F5EF] hover:bg-[#EFE9DE] text-[#68736D] hover:text-[#24332D]'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Item Chips */}
        <div>
          <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${
            isDark ? 'text-[#8e989b]' : 'text-[#68736D]'
          }`}>
            Quick Select Common Foods
          </label>
          <div className="flex flex-wrap gap-1.5">
            {quickItemChips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleSelectChip(chip)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  name === chip
                    ? isDark
                      ? 'bg-[#a1e3f9] text-[#003642] font-semibold'
                      : 'bg-[#557A62] text-white font-semibold'
                    : isDark
                    ? 'bg-[#151d20] text-[#bfc8cc] hover:text-white border border-white/5'
                    : 'bg-[#F7F5EF] text-[#68736D] hover:text-[#24332D] border border-[#E4DED2]'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Item Name Input */}
        <div>
          <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
            Food Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Fresh Tomatoes"
            className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none transition-all ${
              isDark
                ? 'bg-[#151d20] border-white/10 text-white placeholder-[#5a6568] focus:border-[#a1e3f9]'
                : 'bg-[#FFFFFF] border-[#E4DED2] text-[#24332D] placeholder-[#8A9590] focus:border-[#6FAF8F]'
            }`}
          />
        </div>

        {/* Category & Location */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as FoodCategory)}
              className={`w-full px-3 py-2 rounded-xl border text-xs outline-none cursor-pointer ${
                isDark
                  ? 'bg-[#151d20] border-white/10 text-white focus:border-[#a1e3f9]'
                  : 'bg-[#FFFFFF] border-[#E4DED2] text-[#24332D] focus:border-[#6FAF8F]'
              }`}
            >
              <option value="Produce">Produce</option>
              <option value="Dairy">Dairy</option>
              <option value="Basic Foods">Basic Foods</option>
              <option value="Lentils & Spices">Lentils & Spices</option>
              <option value="Oils">Oils</option>
              <option value="Sauces & Spreads">Sauces & Spreads</option>
              <option value="Bakery">Bakery</option>
            </select>
          </div>

          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
              Storage Location
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border text-xs outline-none cursor-pointer ${
                isDark
                  ? 'bg-[#151d20] border-white/10 text-white focus:border-[#a1e3f9]'
                  : 'bg-[#FFFFFF] border-[#E4DED2] text-[#24332D] focus:border-[#6FAF8F]'
              }`}
            >
              <option value="Vegetable Drawer">Vegetable Drawer</option>
              <option value="Fridge Shelf">Fridge Shelf</option>
              <option value="Fridge Door">Fridge Door</option>
              <option value="Dairy Chiller">Dairy Chiller</option>
              <option value="Food Storage Shelf">Food Storage Shelf</option>
              <option value="Spice Box">Spice Box</option>
              <option value="Freezer">Freezer</option>
            </select>
          </div>
        </div>

        {/* Quantity Counter & Unit Picker */}
        <div className="grid grid-cols-2 gap-3 items-center">
          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
              Quantity
            </label>
            <div className={`flex items-center justify-between p-1 rounded-xl border ${
              isDark ? 'bg-[#151d20] border-white/10' : 'bg-[#F7F5EF] border-[#E4DED2]'
            }`}>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(0.5, +(q - 0.5).toFixed(1)))}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer transition-all ${
                  isDark ? 'bg-[#252f33] hover:bg-[#323d42] text-white' : 'bg-[#FFFFFF] hover:bg-[#EFE9DE] text-[#24332D] shadow-sm'
                }`}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className={`font-mono text-sm font-bold ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => +(q + 0.5).toFixed(1))}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer transition-all ${
                  isDark
                    ? 'bg-[#252f33] hover:bg-[#323d42] text-[#a1e3f9]'
                    : 'bg-[#557A62] hover:bg-[#43634F] text-white shadow-sm'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
              Unit
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-xl border text-xs outline-none cursor-pointer ${
                isDark
                  ? 'bg-[#151d20] border-white/10 text-white focus:border-[#a1e3f9]'
                  : 'bg-[#FFFFFF] border-[#E4DED2] text-[#24332D] focus:border-[#6FAF8F]'
              }`}
            >
              <option value="Bunch">Bunch</option>
              <option value="g">Grams (g)</option>
              <option value="kg">Kilograms (kg)</option>
              <option value="ml">Milliliters (ml)</option>
              <option value="L">Liters (L)</option>
              <option value="Whole">Whole</option>
              <option value="Packets">Packets</option>
            </select>
          </div>
        </div>

        {/* Estimated Expiry Days */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={`text-xs font-semibold ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
              Expires in
            </label>
            <span className={`text-xs font-mono font-bold ${isDark ? 'text-[#ffb780]' : 'text-[#D9826B]'}`}>
              {expiryDays} days
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="30"
            value={expiryDays}
            onChange={(e) => setExpiryDays(parseInt(e.target.value, 10))}
            className={`w-full cursor-pointer ${
              isDark ? 'accent-[#a1e3f9] bg-[#151d20]' : 'accent-[#557A62] bg-[#EFE9DE]'
            }`}
          />
        </div>

        {/* Helpful Tip */}
        <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${
          isDark ? 'bg-[#151d20] border-[#a1e3f9]/20' : 'bg-[#EBF3EB] border-[#6FAF8F]/30'
        }`}>
          <Sparkles className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? 'text-[#a1e3f9]' : 'text-[#557A62]'}`} />
          <div className="text-xs">
            <p className={`font-semibold ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
              Smart Recommendation
            </p>
            <p className={`mt-0.5 leading-relaxed ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
              Based on your cooking habits, using {name} within {expiryDays} days will keep it fresh and delicious.
            </p>
          </div>
        </div>

        {/* Summary */}
        <p className={`text-xs text-center ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
          Adding <strong className={isDark ? 'text-white' : 'text-[#24332D]'}>{quantity} {unit}</strong> of{' '}
          <strong className={isDark ? 'text-[#a1e3f9]' : 'text-[#557A62]'}>{name}</strong> to{' '}
          <strong className={isDark ? 'text-white' : 'text-[#24332D]'}>{location}</strong>
        </p>

        {/* Bottom Actions */}
        <div className={`grid grid-cols-2 gap-2.5 pt-2 border-t ${
          isDark ? 'border-white/10' : 'border-[#E4DED2]'
        }`}>
          <button
            type="button"
            onClick={() => {
              setName('Country Tomatoes');
              setCategory('Produce');
              setQuantity(1);
              setUnit('kg');
              setLocation('Vegetable Drawer');
              setExpiryDays(4);
              setToastMessage('Scanned receipt! Detected 1kg Country Tomatoes.');
            }}
            className={`py-2.5 px-3 rounded-xl border font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isDark
                ? 'bg-[#232b2e] hover:bg-[#2c363a] text-white border-white/10'
                : 'bg-[#F7F5EF] hover:bg-[#EFE9DE] text-[#24332D] border-[#E4DED2]'
            }`}
          >
            <Camera className={`w-3.5 h-3.5 ${isDark ? 'text-[#ffb780]' : 'text-[#D9826B]'}`} />
            <span>Scan Receipt</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer ${
              isDark
                ? 'bg-[#a1e3f9] hover:bg-[#c2effc] text-[#003642] shadow-[#a1e3f9]/15'
                : 'bg-[#557A62] hover:bg-[#43634F] text-white shadow-[#557A62]/15'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Add to My Food</span>
          </button>
        </div>
      </div>
    </div>
  );
};
