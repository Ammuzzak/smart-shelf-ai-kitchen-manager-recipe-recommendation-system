import React, { useState } from 'react';
import { X, Sparkles, Plus, Minus, Camera, Check } from 'lucide-react';
import { useKitchen } from '../context/KitchenContext';
import { FoodCategory } from '../types';

export const AddInventoryModal: React.FC = () => {
  const { isAddModalOpen, setIsAddModalOpen, addItem, setToastMessage } = useKitchen();

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
      <div className="w-full max-w-md bg-[#1c2529] border border-white/10 rounded-2xl shadow-2xl p-6 relative space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h2 className="font-display text-lg font-bold text-white">Add Food Item</h2>
            <p className="text-xs text-[#8e989b]">Add fresh items or scan a receipt</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(false)}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-[#bfc8cc] hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Item Chips */}
        <div>
          <label className="block text-xs font-semibold text-[#8e989b] uppercase tracking-wider mb-2">
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
                    ? 'bg-[#a1e3f9] text-[#003642] font-semibold'
                    : 'bg-[#151d20] text-[#bfc8cc] hover:text-white border border-white/5'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Item Name Input */}
        <div>
          <label className="block text-xs font-semibold text-[#8e989b] mb-1.5">Food Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Fresh Tomatoes"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#151d20] border border-white/10 text-white text-xs placeholder-[#5a6568] focus:border-[#a1e3f9] outline-none"
          />
        </div>

        {/* Category & Location */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#8e989b] mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as FoodCategory)}
              className="w-full px-3 py-2 rounded-xl bg-[#151d20] border border-white/10 text-white text-xs focus:border-[#a1e3f9] outline-none cursor-pointer"
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
            <label className="block text-xs font-semibold text-[#8e989b] mb-1.5">Storage Location</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#151d20] border border-white/10 text-white text-xs focus:border-[#a1e3f9] outline-none cursor-pointer"
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
            <label className="block text-xs font-semibold text-[#8e989b] mb-1.5">Quantity</label>
            <div className="flex items-center justify-between p-1 rounded-xl bg-[#151d20] border border-white/10">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(0.5, +(q - 0.5).toFixed(1)))}
                className="w-8 h-8 rounded-lg bg-[#252f33] hover:bg-[#323d42] text-white flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-sm font-bold text-white">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => +(q + 0.5).toFixed(1))}
                className="w-8 h-8 rounded-lg bg-[#252f33] hover:bg-[#323d42] text-[#a1e3f9] flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8e989b] mb-1.5">Unit</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[#151d20] border border-white/10 text-white text-xs focus:border-[#a1e3f9] outline-none cursor-pointer"
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
            <label className="text-xs font-semibold text-[#8e989b]">Expires in</label>
            <span className="text-xs font-mono font-bold text-[#ffb780]">{expiryDays} days</span>
          </div>
          <input
            type="range"
            min="1"
            max="30"
            value={expiryDays}
            onChange={(e) => setExpiryDays(parseInt(e.target.value, 10))}
            className="w-full accent-[#a1e3f9] bg-[#151d20] cursor-pointer"
          />
        </div>

        {/* Helpful Tip */}
        <div className="p-3.5 rounded-xl bg-[#151d20] border border-[#a1e3f9]/20 flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-[#a1e3f9] shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-semibold text-white">Smart Recommendation</p>
            <p className="text-[#8e989b] mt-0.5 leading-relaxed">
              Based on your cooking habits, using {name} within {expiryDays} days will keep it fresh and delicious.
            </p>
          </div>
        </div>

        {/* Summary */}
        <p className="text-xs text-center text-[#8e989b]">
          Adding <strong className="text-white">{quantity} {unit}</strong> of{' '}
          <strong className="text-[#a1e3f9]">{name}</strong> to{' '}
          <strong className="text-white">{location}</strong>
        </p>

        {/* Bottom Actions */}
        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-white/10">
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
            className="py-2.5 px-3 rounded-xl bg-[#232b2e] hover:bg-[#2c363a] text-white border border-white/10 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5 text-[#ffb780]" />
            <span>Scan Receipt</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="py-2.5 px-3 rounded-xl bg-[#a1e3f9] hover:bg-[#c2effc] text-[#003642] font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#a1e3f9]/15 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Add to My Food</span>
          </button>
        </div>
      </div>
    </div>
  );
};
