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
  const { shoppingItems, toggleShoppingItem, addShoppingItem, verifyAllStaples, setToastMessage, theme } =
    useKitchen();
  const isDark = theme === 'dark';

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
    <div className={`space-y-6 pb-20 theme-transition ${isDark ? 'text-[#dbe4e8]' : 'text-[#24332D]'}`}>
      {/* Header & Cost card */}
      <div className={`p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 shadow-sm transition-all ${
        isDark ? 'bg-[#1c2529] border-white/10' : 'bg-[#FFFFFF] border-[#E4DED2]'
      }`}>
        <div>
          <span className={`text-xs font-bold uppercase tracking-wider ${
            isDark ? 'text-[#a1e3f9]' : 'text-[#D5A84C]'
          }`}>
            Shopping Plan
          </span>
          <h2 className={`font-display text-xl font-bold mt-0.5 ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
            Smart Shopping List
          </h2>
          <p className={`text-xs ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
            Plan ahead for your upcoming meals and avoid buying extra food
          </p>
        </div>

        {/* Estimated Cost Card */}
        <div className={`flex items-center gap-3 px-5 py-3 rounded-xl border shadow-sm ${
          isDark
            ? 'bg-[#151d20] border-white/10'
            : 'bg-[#FFFDF8] border-[#E4DED2]'
        }`}>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isDark ? 'bg-[#ffb780]/15 text-[#ffb780]' : 'bg-[#F5D98B]/40 text-[#8C671C]'
          }`}>
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className={`text-[10px] uppercase font-bold tracking-wider ${
              isDark ? 'text-[#8e989b]' : 'text-[#68736D]'
            }`}>
              Estimated Cost
            </p>
            <p className={`font-display text-xl font-extrabold ${
              isDark ? 'text-[#ffb780]' : 'text-[#8C671C]'
            }`}>
              ₹ {totalEstimatedCost}
            </p>
          </div>
        </div>
      </div>

      {/* 1. Required for Meals Checklist */}
      <div className={`p-5 rounded-2xl border space-y-4 shadow-sm transition-all ${
        isDark ? 'bg-[#1c2529] border-white/10' : 'bg-[#FFFFFF] border-[#E4DED2]'
      }`}>
        <div className="flex items-center justify-between">
          <h3 className={`font-display text-base font-bold ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
            Needed For Upcoming Meals
          </h3>
          <span className={`text-xs font-semibold font-mono ${isDark ? 'text-[#a1e3f9]' : 'text-[#557A62]'}`}>
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
                  ? isDark
                    ? 'bg-[#151d20] border-emerald-500/20 text-[#8e989b]'
                    : 'bg-[#EBF3EB] border-[#6FAF8F]/30 text-[#68736D]'
                  : isDark
                  ? 'bg-[#151d20] border-white/5 hover:border-white/15 text-white'
                  : 'bg-[#F7F5EF] border-[#E4DED2] hover:border-[#6FAF8F]/40 text-[#24332D]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                    item.checked
                      ? isDark
                        ? 'bg-emerald-500 border-emerald-500 text-[#003642]'
                        : 'bg-[#6FAF8F] border-[#6FAF8F] text-white'
                      : isDark
                      ? 'border-white/20 bg-[#1c2529]'
                      : 'border-[#E4DED2] bg-[#FFFFFF]'
                  }`}
                >
                  {item.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <div>
                  <p className={`text-xs font-semibold ${
                    item.checked
                      ? 'line-through opacity-70'
                      : isDark ? 'text-white' : 'text-[#24332D]'
                  }`}>
                    {item.name}
                  </p>
                  <p className={`text-[11px] ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
                    {item.purpose}
                  </p>
                </div>
              </div>

              <span className={`text-xs font-mono font-medium px-2 py-0.5 rounded ${
                isDark ? 'bg-white/5 text-[#bfc8cc]' : 'bg-[#FFFFFF] border border-[#E4DED2] text-[#24332D]'
              }`}>
                {item.quantity}
              </span>
            </div>
          ))}
        </div>

        {/* Add Custom Item */}
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className={`w-full py-2.5 rounded-xl border border-dashed text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isDark
                ? 'border-white/15 hover:border-[#a1e3f9]/50 text-[#a1e3f9] hover:bg-white/5'
                : 'border-[#6FAF8F]/40 hover:border-[#6FAF8F] text-[#557A62] hover:bg-[#6FAF8F]/10'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Custom Item</span>
          </button>
        ) : (
          <form onSubmit={handleAddCustom} className={`p-3 rounded-xl border space-y-2 ${
            isDark ? 'bg-[#151d20] border-white/10' : 'bg-[#F7F5EF] border-[#E4DED2]'
          }`}>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Item name (e.g. Bread)"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className={`col-span-2 px-3 py-1.5 rounded-lg border text-xs outline-none ${
                  isDark
                    ? 'bg-[#1c2529] border-white/10 text-white focus:border-[#a1e3f9]'
                    : 'bg-[#FFFFFF] border-[#E4DED2] text-[#24332D] focus:border-[#6FAF8F]'
                }`}
              />
              <input
                type="text"
                placeholder="Amount (e.g. 500g)"
                value={newItemQty}
                onChange={(e) => setNewItemQty(e.target.value)}
                className={`px-3 py-1.5 rounded-lg border text-xs outline-none ${
                  isDark
                    ? 'bg-[#1c2529] border-white/10 text-white focus:border-[#a1e3f9]'
                    : 'bg-[#FFFFFF] border-[#E4DED2] text-[#24332D] focus:border-[#6FAF8F]'
                }`}
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className={`px-3 py-1 rounded-lg text-xs cursor-pointer ${
                  isDark ? 'text-[#8e989b] hover:text-white' : 'text-[#68736D] hover:text-[#24332D]'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                  isDark
                    ? 'bg-[#a1e3f9] text-[#003642]'
                    : 'bg-[#557A62] text-white hover:bg-[#43634F]'
                }`}
              >
                Add
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 2. Helpful Tips */}
      <div className={`p-5 rounded-2xl border space-y-3 shadow-sm transition-all ${
        isDark ? 'bg-[#1c2529] border-white/10' : 'bg-[#FFFFFF] border-[#E4DED2]'
      }`}>
        <div className="flex items-center gap-2">
          <Sparkles className={`w-4 h-4 ${isDark ? 'text-[#a1e3f9]' : 'text-[#D5A84C]'}`} />
          <h3 className={`font-display text-base font-bold ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
            Helpful Tips
          </h3>
        </div>

        <div className="space-y-3">
          {/* Tomato Quantity Adjustment */}
          {!isTomatoDismissed && (
            <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
              isDark
                ? 'bg-[#151d20] border-[#a1e3f9]/20'
                : 'bg-[#FFFDF8] border-[#D9826B]/30'
            }`}>
              <div className="space-y-1 max-w-xl">
                <p className={`text-xs font-bold flex items-center gap-1.5 ${
                  isDark ? 'text-white' : 'text-[#24332D]'
                }`}>
                  <Lightbulb className={`w-4 h-4 ${isDark ? 'text-[#a1e3f9]' : 'text-[#D9826B]'}`} />
                  Adjust Tomato Amount
                </p>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-[#bfc8cc]' : 'text-[#68736D]'}`}>
                  Buy 250g instead of 500g to avoid wasting extra tomatoes based on your household's eating habits.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsTomatoDismissed(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                    isDark
                      ? 'bg-[#232b2e] hover:bg-[#2c363a] text-[#8e989b] hover:text-white'
                      : 'bg-[#F7F5EF] hover:bg-[#EFE9DE] text-[#68736D] hover:text-[#24332D]'
                  }`}
                >
                  Dismiss
                </button>
                <button
                  onClick={handleApplyTomatoAdjustment}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer ${
                    isDark
                      ? 'bg-[#a1e3f9] hover:bg-[#c2effc] text-[#003642]'
                      : 'bg-[#D9826B] hover:bg-[#C2715C] text-white'
                  }`}
                >
                  Apply
                </button>
              </div>
            </div>
          )}

          {/* Tamarind Substitute Suggestion */}
          {!isTamarindDismissed && (
            <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
              isDark
                ? 'bg-[#151d20] border-[#ffb780]/20'
                : 'bg-[#FFFDF8] border-[#D5A84C]/30'
            }`}>
              <div className="space-y-1 max-w-xl">
                <p className={`text-xs font-bold flex items-center gap-1.5 ${
                  isDark ? 'text-white' : 'text-[#24332D]'
                }`}>
                  <Lightbulb className={`w-4 h-4 ${isDark ? 'text-[#ffb780]' : 'text-[#D5A84C]'}`} />
                  Food Storage Reminder
                </p>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-[#bfc8cc]' : 'text-[#68736D]'}`}>
                  You already have extra Tamarind Paste (350g in Shelf B). Skip buying more tamarind this week.
                </p>
              </div>
              <button
                onClick={() => setIsTamarindDismissed(true)}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isDark
                    ? 'bg-[#232b2e] hover:bg-[#2c363a] text-white'
                    : 'bg-[#F7F5EF] hover:bg-[#EFE9DE] text-[#24332D]'
                }`}
              >
                Got it
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Check Basic Foods */}
      <div className={`p-5 rounded-2xl border space-y-4 shadow-sm transition-all ${
        isDark ? 'bg-[#1c2529] border-white/10' : 'bg-[#FFFFFF] border-[#E4DED2]'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`font-display text-base font-bold ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
              Check Basic Foods
            </h3>
            <p className={`text-xs ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
              Double check your kitchen basic foods before heading out
            </p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-mono font-medium ${
            isDark ? 'bg-white/5 text-[#a1e3f9]' : 'bg-[#557A62]/15 text-[#557A62]'
          }`}>
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
                  ? isDark
                    ? 'bg-[#151d20] border-emerald-500/30'
                    : 'bg-[#EBF3EB] border-[#6FAF8F]/40'
                  : isDark
                  ? 'bg-[#151d20] border-white/5 hover:border-white/15'
                  : 'bg-[#F7F5EF] border-[#E4DED2] hover:border-[#6FAF8F]/30'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                  item.checked
                    ? isDark
                      ? 'bg-emerald-500 border-emerald-500 text-[#003642]'
                      : 'bg-[#6FAF8F] border-[#6FAF8F] text-white'
                    : isDark
                    ? 'border-white/20 bg-[#1c2529]'
                    : 'border-[#E4DED2] bg-[#FFFFFF]'
                }`}
              >
                {item.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <div>
                <p className={`text-xs font-semibold ${
                  item.checked
                    ? isDark ? 'text-emerald-400' : 'text-[#43634F]'
                    : isDark ? 'text-white' : 'text-[#24332D]'
                }`}>
                  {item.name}
                </p>
                <p className={`text-[11px] font-mono ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
                  {item.quantity}
                </p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={verifyAllStaples}
          className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
            isDark
              ? 'bg-[#232b2e] hover:bg-[#2c363a] text-white border border-white/10'
              : 'bg-[#557A62] hover:bg-[#43634F] text-white'
          }`}
        >
          <CheckCircle2 className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-white'}`} />
          <span>[✓] All Basic Foods Checked</span>
        </button>
      </div>
    </div>
  );
};
