import React, { useState, useEffect } from 'react';
import { X, Trash2, Check, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useKitchen } from '../context/KitchenContext';
import { FoodCategory, InventoryItem } from '../types';

export const EditInventoryModal: React.FC = () => {
  const { editingInventoryItem, setEditingInventoryItem, updateItem, deleteItem, setToastMessage } = useKitchen();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<FoodCategory>('Produce');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('kg');
  const [daysLeft, setDaysLeft] = useState(3);
  const [location, setLocation] = useState('Crisper Hydrator');
  const [atRisk, setAtRisk] = useState(false);

  useEffect(() => {
    if (editingInventoryItem) {
      setName(editingInventoryItem.name);
      setCategory(editingInventoryItem.category);
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

    setToastMessage(`Updated shelf entry for ${name.trim()}`);
    setEditingInventoryItem(null);
  };

  const handleDelete = () => {
    deleteItem(editingInventoryItem.id);
    setEditingInventoryItem(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#1c2529] border border-white/10 rounded-2xl shadow-2xl p-6 relative space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h2 className="font-display text-lg font-bold text-white">Edit Inventory Item</h2>
            <p className="text-xs text-[#8e989b]">Calibrate stock quantity, storage bay & expiry</p>
          </div>
          <button
            onClick={() => setEditingInventoryItem(null)}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-[#bfc8cc] hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {/* Item Name */}
          <div>
            <label className="block text-xs font-semibold text-[#8e989b] uppercase tracking-wider mb-1.5">
              Item Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#151d20] border border-white/10 text-white text-xs placeholder-[#5a6568] focus:border-[#a1e3f9] outline-none"
            />
          </div>

          {/* Category & Storage Bay */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#8e989b] uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FoodCategory)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#151d20] border border-white/10 text-white text-xs outline-none cursor-pointer"
              >
                <option value="Produce">Produce</option>
                <option value="Dairy">Dairy</option>
                <option value="Staples">Staples</option>
                <option value="Lentils & Spices">Lentils & Spices</option>
                <option value="Bakery">Bakery</option>
                <option value="Oils">Oils</option>
                <option value="Condiments">Condiments</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8e989b] uppercase tracking-wider mb-1.5">
                Storage Bay
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Crisper Hydrator"
                className="w-full px-3 py-2.5 rounded-xl bg-[#151d20] border border-white/10 text-white text-xs outline-none"
              />
            </div>
          </div>

          {/* Quantity & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#8e989b] uppercase tracking-wider mb-1.5">
                Quantity
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#151d20] border border-white/10 text-white text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8e989b] uppercase tracking-wider mb-1.5">
                Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#151d20] border border-white/10 text-white text-xs outline-none cursor-pointer"
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
              <label className="block text-xs font-semibold text-[#8e989b] uppercase tracking-wider mb-1.5">
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
                className="w-full px-3 py-2.5 rounded-xl bg-[#151d20] border border-white/10 text-white text-xs outline-none"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label
                onClick={() => setAtRisk(!atRisk)}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-[#151d20] border border-white/10 cursor-pointer select-none hover:bg-white/5 transition-all"
              >
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${
                    atRisk ? 'bg-rose-500 text-white' : 'border border-white/30 text-transparent'
                  }`}
                >
                  ✓
                </div>
                <span className="text-xs text-white">Flag as At-Risk</span>
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-400 hover:text-white hover:bg-rose-500/20 text-xs font-semibold transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditingInventoryItem(null)}
              className="px-3.5 py-2 rounded-xl bg-[#151d20] hover:bg-[#232b2e] text-[#bfc8cc] text-xs font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#a1e3f9] hover:bg-[#c2effc] text-[#003642] text-xs font-bold transition-all"
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
