import React, { useState } from 'react';
import {
  Wallet,
  CheckCircle2,
  Sparkles,
  Plus,
  Check,
  Lightbulb,
} from 'lucide-react';
import { useKitchen } from '../context/KitchenContext';

export const ShoppingListView: React.FC = () => {
  const { shoppingItems, toggleShoppingItem, addShoppingItem, verifyAllStaples, setToastMessage } =
    useKitchen();

  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isTomatoDismissed, setIsTomatoDismissed] = useState(false);
  const [isTamarindDismissed, setIsTamarindDismissed] = useState(false);

  const rescueItems = shoppingItems.filter((i) => i.category === 'rescue' || i.category === 'custom');
  const stapleItems = shoppingItems.filter((i) => i.isStapleCheck);

  const totalEstimatedCost = shoppingItems
    .filter((i) => !i.checked)
    .reduce((sum, item) => sum + (item.estimatedCost || 40), 0);

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    addShoppingItem(newItemName.trim(), 'Added to shopping list', newItemQty.trim() || '1 item');
    setNewItemName('');
    setNewItemQty('');
    setShowAddForm(false);
  };

  const handleApplyTomatoAdjustment = () => {
    setIsTomatoDismissed(true);
    setToastMessage('Tomato shopping amount set to 250g. Saved ₹25!');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header & Cost card */}
      <div className="p-5 rounded-2xl bg-[#1c2529] border border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#a1e3f9] uppercase tracking-wider">Shopping Plan</span>
          <h2 className="font-display text-xl font-bold text-white mt-0.5">Smart Shopping List</h2>
          <p className="text-xs text-[#8e989b]">
            Plan ahead for your upcoming meals and avoid buying extra food
          </p>
        </div>

        {/* Estimated Cost Card */}
        <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-[#151d20] border border-white/10">
          <div className="w-10 h-10 rounded-lg bg-[#ffb780]/15 flex items-center justify-center text-[#ffb780]">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-[#8e989b] uppercase font-bold tracking-wider">Estimated Cost</p>
            <p className="font-display text-xl font-extrabold text-[#ffb780]">₹ {totalEstimatedCost}</p>
          </div>
        </div>
      </div>

      {/* 1. Required for Meals Checklist */}
      <div className="p-5 rounded-2xl bg-[#1c2529] border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-white">Needed For Upcoming Meals</h3>
          <span className="text-xs text-[#a1e3f9] font-medium font-mono">
            {rescueItems.filter((i) => i.checked).length} / {rescueItems.length} checked
          </span>
        </div>

        <div className="space-y-2">
          {rescueItems.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleShoppingItem(item.id)}
              className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                item.checked
                  ? 'bg-[#151d20] border-emerald-500/20 text-[#8e989b]'
                  : 'bg-[#151d20] border-white/5 hover:border-white/15 text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                    item.checked
                      ? 'bg-emerald-500 border-emerald-500 text-[#003642]'
                      : 'border-white/20 bg-[#1c2529]'
                  }`}
                >
                  {item.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <div>
                  <p className={`text-xs font-semibold ${item.checked ? 'line-through text-[#8e989b]' : 'text-white'}`}>
                    {item.name}
                  </p>
                  <p className="text-[11px] text-[#8e989b]">{item.purpose}</p>
                </div>
              </div>

              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-white/5 text-[#bfc8cc]">
                {item.quantity}
              </span>
            </div>
          ))}
        </div>

        {/* Add Custom Item */}
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full py-2.5 rounded-xl border border-dashed border-white/15 hover:border-[#a1e3f9]/50 text-xs font-semibold text-[#a1e3f9] flex items-center justify-center gap-2 transition-all hover:bg-white/5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Custom Item</span>
          </button>
        ) : (
          <form onSubmit={handleAddCustom} className="p-3 rounded-xl bg-[#151d20] border border-white/10 space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Item name (e.g. Bread)"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="col-span-2 px-3 py-1.5 rounded-lg bg-[#1c2529] border border-white/10 text-xs text-white outline-none focus:border-[#a1e3f9]"
              />
              <input
                type="text"
                placeholder="Amount (e.g. 500g)"
                value={newItemQty}
                onChange={(e) => setNewItemQty(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-[#1c2529] border border-white/10 text-xs text-white outline-none focus:border-[#a1e3f9]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1 rounded-lg text-xs text-[#8e989b] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 rounded-lg bg-[#a1e3f9] text-[#003642] text-xs font-bold"
              >
                Add
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 2. Helpful Tips */}
      <div className="p-5 rounded-2xl bg-[#1c2529] border border-white/10 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#a1e3f9]" />
          <h3 className="font-display text-base font-bold text-white">Helpful Tips</h3>
        </div>

        <div className="space-y-3">
          {/* Tomato Quantity Adjustment */}
          {!isTomatoDismissed && (
            <div className="p-4 rounded-xl bg-[#151d20] border border-[#a1e3f9]/20 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1 max-w-xl">
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-[#a1e3f9]" />
                  Adjust Tomato Amount
                </p>
                <p className="text-xs text-[#bfc8cc] leading-relaxed">
                  Buy 250g instead of 500g to avoid wasting extra tomatoes based on your household's eating habits.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsTomatoDismissed(true)}
                  className="px-3 py-1.5 rounded-lg bg-[#232b2e] hover:bg-[#2c363a] text-xs text-[#8e989b] hover:text-white transition-all"
                >
                  Dismiss
                </button>
                <button
                  onClick={handleApplyTomatoAdjustment}
                  className="px-3.5 py-1.5 rounded-lg bg-[#a1e3f9] hover:bg-[#c2effc] text-[#003642] text-xs font-bold transition-all shadow-sm"
                >
                  Apply
                </button>
              </div>
            </div>
          )}

          {/* Tamarind Substitute Suggestion */}
          {!isTamarindDismissed && (
            <div className="p-4 rounded-xl bg-[#151d20] border border-[#ffb780]/20 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1 max-w-xl">
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-[#ffb780]" />
                  Food Storage Reminder
                </p>
                <p className="text-xs text-[#bfc8cc] leading-relaxed">
                  You already have extra Tamarind Paste (350g in Shelf B). Skip buying more tamarind this week.
                </p>
              </div>
              <button
                onClick={() => setIsTamarindDismissed(true)}
                className="px-4 py-1.5 rounded-lg bg-[#232b2e] hover:bg-[#2c363a] text-xs text-white font-medium transition-all"
              >
                Got it
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Check Basic Foods */}
      <div className="p-5 rounded-2xl bg-[#1c2529] border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-base font-bold text-white">Check Basic Foods</h3>
            <p className="text-xs text-[#8e989b]">Double check your kitchen basic foods before heading out</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-[#a1e3f9] font-mono font-medium">
            Quick Check
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {stapleItems.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleShoppingItem(item.id)}
              className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                item.checked
                  ? 'bg-[#151d20] border-emerald-500/30'
                  : 'bg-[#151d20] border-white/5 hover:border-white/15'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                  item.checked
                    ? 'bg-emerald-500 border-emerald-500 text-[#003642]'
                    : 'border-white/20 bg-[#1c2529]'
                }`}
              >
                {item.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <div>
                <p className={`text-xs font-semibold ${item.checked ? 'text-emerald-400' : 'text-white'}`}>
                  {item.name}
                </p>
                <p className="text-[11px] text-[#8e989b] font-mono">{item.quantity}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={verifyAllStaples}
          className="w-full py-2.5 rounded-xl bg-[#232b2e] hover:bg-[#2c363a] text-white border border-white/10 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>[✓] All Basic Foods Checked</span>
        </button>
      </div>
    </div>
  );
};
