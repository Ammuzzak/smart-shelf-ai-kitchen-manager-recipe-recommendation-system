import React, { useState, useMemo } from 'react';
import {
  ChefHat,
  Mic,
  PlusCircle,
  Sparkles,
  Clock,
  AlertTriangle,
  ShoppingCart,
  UtensilsCrossed,
  ArrowRight,
  Search,
  Check,
  CheckCircle2,
  CalendarCheck,
  Send,
  Leaf,
  Layers,
  ShieldCheck,
  ArrowUpRight,
  TrendingDown,
  Info,
  PackageCheck,
  Sparkle,
  Radio,
  Flame,
} from 'lucide-react';
import { useKitchen } from '../context/KitchenContext';
import { matchRecipesWithInventory } from '../data/recipeMatching';
import { Recipe, InventoryItem } from '../types';

export const DashboardView: React.FC = () => {
  const {
    currentUser,
    inventory,
    recipes,
    shoppingItems,
    setActiveScreen,
    setIsHeyChefOpen,
    setIsAddModalOpen,
    setSelectedRecipeForDetail,
    setIsRecipeDetailOpen,
    addShoppingItem,
    setToastMessage,
    lastCompletedSession,
    theme,
  } = useKitchen();

  const isDark = theme === 'dark';
  const [chefQueryInput, setChefQueryInput] = useState('');

  // 1. Dynamic Greeting based on time of day and authenticated user name
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const userName = currentUser?.name ? `, ${currentUser.name}` : '';
    return `${timeGreeting}${userName} 👋`;
  }, [currentUser?.name]);

  // -------------------------------------------------------------
  // EXPLICIT DASHBOARD AUDITED THRESHOLDS & CALCULATIONS
  // -------------------------------------------------------------

  // Threshold 1: Expiring Soon = items expiring within 3 days or already expired
  const EXPIRING_SOON_THRESHOLD_DAYS = 3;

  const isItemExpiringSoon = (item: { quantity: number; daysLeft: number; atRisk?: boolean }) => {
    return item.quantity > 0 && (item.daysLeft <= EXPIRING_SOON_THRESHOLD_DAYS || Boolean(item.atRisk));
  };

  // Threshold 2: Low Stock = inventory quantity at or below its configured minimum quantity
  const getItemMinimumStockThreshold = (item: { minQuantity?: number; unit: string }): number => {
    if (typeof item.minQuantity === 'number' && item.minQuantity > 0) {
      return item.minQuantity;
    }
    const unit = item.unit.toLowerCase().trim();
    if (unit === 'kg') return 0.5;
    if (unit === 'g') return 200;
    if (unit === 'l' || unit === 'liter' || unit === 'litre') return 0.5;
    if (unit === 'ml') return 200;
    if (unit === 'egg' || unit === 'eggs' || unit === 'pcs' || unit === 'pieces') return 2;
    return 1;
  };

  const isItemLowStock = (item: { quantity: number; minQuantity?: number; unit: string }): boolean => {
    return item.quantity > 0 && item.quantity <= getItemMinimumStockThreshold(item);
  };

  // 2. Real Summary Numbers calculated strictly from existing state
  const activeItemsCount = useMemo(
    () => inventory.filter((item) => item.quantity > 0).length,
    [inventory]
  );

  const expiringItems = useMemo(
    () =>
      inventory
        .filter(isItemExpiringSoon)
        .sort((a, b) => a.daysLeft - b.daysLeft),
    [inventory]
  );

  const expiringCount = expiringItems.length;

  // Real recipe recommendations matching actual inventory
  const splitResults = useMemo(
    () => matchRecipesWithInventory(inventory, recipes),
    [inventory, recipes]
  );

  const availableRecipesCount = useMemo(
    () => splitResults.canMakeNow.length + splitResults.almostReady.length,
    [splitResults]
  );

  // Top recommended recipes for "What Can I Cook?"
  const recommendedRecipes = useMemo(() => {
    const combined = [...splitResults.canMakeNow, ...splitResults.almostReady];
    const seen = new Set<string>();
    const top: typeof combined = [];
    for (const match of combined) {
      if (!seen.has(match.recipe.id)) {
        seen.add(match.recipe.id);
        top.push(match);
      }
      if (top.length >= 4) break;
    }
    return top;
  }, [splitResults]);

  // Featured top recipe
  const featuredRecipe = recommendedRecipes.length > 0 ? recommendedRecipes[0] : null;
  const secondaryRecipes = recommendedRecipes.length > 1 ? recommendedRecipes.slice(1) : [];

  // Low stock inventory items for Smart Shopping
  const lowStockItems = useMemo(
    () => inventory.filter(isItemLowStock),
    [inventory]
  );

  const restockCount = useMemo(() => {
    const pendingShopping = shoppingItems.filter((s: any) => !s.checked && !s.completed);
    const lowStockNames = new Set(lowStockItems.map((i) => i.name.toLowerCase().trim()));
    const additionalPendingShopping = pendingShopping.filter(
      (s) => !lowStockNames.has(s.name.toLowerCase().trim())
    );
    return lowStockItems.length + additionalPendingShopping.length;
  }, [lowStockItems, shoppingItems]);

  // Waste Management calculations based on real item data
  const estimatedRescueGrams = useMemo(() => {
    return expiringItems.reduce((acc, item) => {
      const unit = item.unit.toLowerCase().trim();
      if (unit === 'g') return acc + Math.round(item.quantity);
      if (unit === 'kg') return acc + Math.round(item.quantity * 1000);
      if (unit === 'ml') return acc + Math.round(item.quantity * 0.95);
      if (unit === 'l') return acc + Math.round(item.quantity * 950);
      return acc + 150;
    }, 0);
  }, [expiringItems]);

  const estimatedMoneySaved = useMemo(() => {
    return expiringItems.reduce((acc, item) => {
      if (typeof item.costEstimate === 'number' && item.costEstimate > 0) {
        return acc + item.costEstimate;
      }
      return acc + 40;
    }, 0);
  }, [expiringItems]);

  // Handlers
  const handleOpenRecipeDetail = (recipe: Recipe) => {
    setSelectedRecipeForDetail(recipe);
    setIsRecipeDetailOpen(true);
  };

  const handleFindRecipesForItem = (itemName: string) => {
    setActiveScreen('recipes');
    setToastMessage(`Showing recipes for ${itemName}`);
  };

  const handleAddLowStockToShopping = (itemName: string) => {
    addShoppingItem(itemName, 'Low stock restock from Dashboard', '1 pack');
    setToastMessage(`Added ${itemName} to your Smart Shopping list!`);
  };

  const handleChefSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chefQueryInput.trim()) {
      setIsHeyChefOpen(true);
      return;
    }
    setIsHeyChefOpen(true);
    setToastMessage(`Ask Chef: "${chefQueryInput}"`);
    setChefQueryInput('');
  };

  const handleSuggestionChip = (chipText: string) => {
    if (chipText === 'South Indian') {
      setActiveScreen('recipes');
      setToastMessage('Showing South Indian recipes');
    } else if (chipText === 'Use ingredients before expiry') {
      setActiveScreen('rescue');
      setToastMessage('Opening Rescue Plan for expiring ingredients');
    } else {
      setIsHeyChefOpen(true);
      setToastMessage(`Ask Chef: "${chipText}"`);
    }
  };

  // Match badge styling adapting cleanly to both themes
  const getMatchBadgeStyle = (matchPercentage: number) => {
    if (isDark) {
      if (matchPercentage >= 100) return 'bg-emerald-500/25 border-emerald-400 text-emerald-300';
      if (matchPercentage >= 80) return 'bg-[#a1e3f9]/20 border-[#a1e3f9]/40 text-[#a1e3f9]';
      if (matchPercentage >= 50) return 'bg-[#ffb780]/20 border-[#ffb780]/40 text-[#ffb780]';
      return 'bg-rose-500/20 border-rose-500/30 text-rose-300';
    } else {
      if (matchPercentage >= 100) return 'bg-[#6FAF8F]/20 text-[#43634F] border-[#6FAF8F]/40';
      if (matchPercentage >= 80) return 'bg-[#8EC5D6]/25 text-[#2C5768] border-[#8EC5D6]/40';
      if (matchPercentage >= 50) return 'bg-[#F5D98B]/35 text-[#8C671C] border-[#F5D98B]/50';
      return 'bg-[#F2B49F]/30 text-[#B8573E] border-[#F2B49F]/50';
    }
  };

  return (
    <div className={`relative space-y-7 pb-28 select-none theme-transition ${
      isDark ? 'text-[#dbe4e8]' : 'text-[#24332D]'
    }`}>
      {/* Background Ambient Accents */}
      {isDark ? (
        <>
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute top-1/4 -right-32 w-96 h-96 bg-teal-500/10 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
        </>
      ) : (
        <>
          <div className="absolute -top-24 -left-20 w-96 h-96 bg-[#6FAF8F]/10 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute top-[35%] -right-24 w-96 h-96 bg-[#F2B49F]/10 rounded-full blur-[150px] pointer-events-none" />
          <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-[#A99BCB]/8 rounded-full blur-[140px] pointer-events-none" />
        </>
      )}

      {/* ========================================================= */}
      {/* 1. HERO SECTION                                           */}
      {/* ========================================================= */}
      <div className={`relative rounded-3xl p-6 sm:p-8 border shadow-xl overflow-hidden backdrop-blur-xl theme-transition ${
        isDark
          ? 'bg-gradient-to-r from-[#11191c] via-[#162226] to-[#121c1f] border-white/10'
          : 'bg-gradient-to-r from-[#EBF3EB] via-[#F6F1E9] to-[#FFFDF8] border-[#E4DED2] shadow-[0_8px_30px_rgba(50,60,45,0.06)]'
      }`}>
        {/* Subtle decorative dot pattern */}
        <div className={`absolute inset-0 opacity-[0.035] pointer-events-none [background-size:22px_22px] ${
          isDark
            ? 'bg-[radial-gradient(#a1e3f9_1px,transparent_1px)]'
            : 'bg-[radial-gradient(#557A62_1px,transparent_1px)]'
        }`} />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            {/* Live Indicator */}
            <div className="flex items-center gap-2.5">
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full font-mono text-[11px] font-bold shadow-sm ${
                isDark
                  ? 'bg-emerald-500/15 border border-emerald-400/30 text-emerald-300'
                  : 'bg-[#FFFFFF] border border-[#6FAF8F]/40 text-[#43634F]'
              }`}>
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isDark ? 'bg-emerald-400' : 'bg-[#6FAF8F]'
                  }`} />
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${
                    isDark ? 'bg-emerald-400' : 'bg-[#557A62]'
                  }`} />
                </span>
                <span>KITCHEN LIVE</span>
              </span>
              <span className={`text-xs font-mono ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
                Smart Shelf Kitchen OS
              </span>
            </div>

            <h1 className={`font-display text-3xl sm:text-4xl lg:text-[40px] font-black tracking-tight leading-tight ${
              isDark ? 'text-white' : 'text-[#24332D]'
            }`}>
              {greeting}
            </h1>
            <p className={`text-sm sm:text-base font-medium leading-relaxed ${
              isDark ? 'text-[#9fb0b5]' : 'text-[#68736D]'
            }`}>
              Here's what's happening in your kitchen today. Ingredients tracked, waste prevented, and meals ready to prepare.
            </p>
          </div>

          {/* Primary Actions */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className={`px-4 sm:px-5 py-3 rounded-2xl border text-xs sm:text-sm font-bold flex items-center gap-2.5 transition-all cursor-pointer shadow-md hover:-translate-y-0.5 ${
                isDark
                  ? 'bg-[#151f22] hover:bg-[#1c292e] border-white/10 hover:border-[#a1e3f9]/40 text-white'
                  : 'bg-[#FFFFFF] hover:bg-[#F7F5EF] border-[#E4DED2] hover:border-[#6FAF8F] text-[#24332D]'
              }`}
            >
              <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${
                isDark ? 'bg-[#a1e3f9]/15 text-[#a1e3f9]' : 'bg-[#6FAF8F]/20 text-[#557A62]'
              }`}>
                <PlusCircle className="w-3.5 h-3.5" />
              </div>
              <span>+ Add Food</span>
            </button>

            <button
              type="button"
              onClick={() => setIsHeyChefOpen(true)}
              className={`px-5 sm:px-6 py-3 rounded-2xl text-xs sm:text-sm font-display font-black flex items-center gap-2.5 transition-all cursor-pointer shadow-lg hover:-translate-y-0.5 ${
                isDark
                  ? 'bg-gradient-to-r from-[#006073] via-[#008ba3] to-[#a1e3f9] hover:from-[#00748c] hover:to-[#b7edfc] text-[#00222b] shadow-[#a1e3f9]/25'
                  : 'bg-gradient-to-r from-[#A99BCB] to-[#8EC5D6] hover:from-[#BDB0DC] hover:to-[#A3CBE0] text-white shadow-[#A99BCB]/30'
              }`}
            >
              <div className="w-6 h-6 rounded-xl bg-black/15 flex items-center justify-center">
                <Mic className="w-3.5 h-3.5 text-white animate-pulse" />
              </div>
              <span>Ask Chef</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. SUMMARY CARDS                                          */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {/* Card 1: Items in Kitchen */}
        <div
          onClick={() => setActiveScreen('inventory')}
          className={`group relative p-5 rounded-3xl border transition-all duration-300 cursor-pointer overflow-hidden shadow-lg hover:-translate-y-1 ${
            isDark
              ? 'bg-[#1c2529] border-white/10 hover:border-[#a1e3f9]/40'
              : 'bg-[#FFFFFF] border-[#E4DED2] hover:border-[#6FAF8F]/60 shadow-[0_8px_30px_rgba(50,60,45,0.06)]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${
              isDark ? 'bg-emerald-500/15 border border-emerald-500/25 text-emerald-400' : 'bg-[#6FAF8F]/20 text-[#557A62]'
            }`}>
              <span className="text-xl">🥕</span>
            </div>
            <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
              isDark
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-[#6FAF8F]/20 text-[#43634F] border-[#6FAF8F]/35'
            }`}>
              Active Stock
            </span>
          </div>

          <div className="mt-4">
            <div className={`font-display text-3xl sm:text-4xl font-black tracking-tight ${
              isDark ? 'text-white group-hover:text-[#a1e3f9]' : 'text-[#24332D] group-hover:text-[#557A62]'
            }`}>
              {activeItemsCount}
            </div>
            <p className={`text-xs sm:text-sm font-bold mt-1 ${isDark ? 'text-white' : 'text-[#24332D]'}`}>Items in Kitchen</p>
            <p className={`text-[11px] mt-0.5 ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>Pantry, crisper & fridge items</p>
          </div>

          <div className={`mt-4 pt-3 border-t flex items-center justify-between text-[11px] font-semibold ${
            isDark ? 'border-white/5 text-[#a1e3f9]' : 'border-[#E4DED2] text-[#557A62]'
          }`}>
            <span className="flex items-center gap-1 group-hover:underline">
              <span>View Inventory</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </span>
            <span className={`font-mono text-[10px] ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>100% Tracked</span>
          </div>
        </div>

        {/* Card 2: Expiring Soon */}
        <div
          onClick={() => setActiveScreen('rescue')}
          className={`group relative p-5 rounded-3xl border transition-all duration-300 cursor-pointer overflow-hidden shadow-lg hover:-translate-y-1 ${
            isDark
              ? 'bg-[#1c2529] border-white/10 hover:border-rose-400/40'
              : 'bg-[#FFFFFF] border-[#E4DED2] hover:border-[#D9826B]/60 shadow-[0_8px_30px_rgba(50,60,45,0.06)]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${
              isDark ? 'bg-rose-500/15 border border-rose-500/25 text-rose-400' : 'bg-[#F2B49F]/25 text-[#D9826B]'
            }`}>
              <span className="text-xl">⏰</span>
            </div>
            <span
              className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                expiringCount > 0
                  ? isDark
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                    : 'bg-[#D9826B]/15 text-[#D9826B] border-[#D9826B]/35'
                  : isDark
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-[#6FAF8F]/15 text-[#43634F] border-[#6FAF8F]/30'
              }`}
            >
              {expiringCount > 0 ? '≤ 3 Days Left' : 'All Fresh'}
            </span>
          </div>

          <div className="mt-4">
            <div
              className={`font-display text-3xl sm:text-4xl font-black tracking-tight ${
                expiringCount > 0
                  ? isDark ? 'text-rose-400 group-hover:text-rose-300' : 'text-[#D9826B]'
                  : isDark ? 'text-emerald-400' : 'text-[#557A62]'
              }`}
            >
              {expiringCount}
            </div>
            <p className={`text-xs sm:text-sm font-bold mt-1 ${isDark ? 'text-white' : 'text-[#24332D]'}`}>Expiring Soon</p>
            <p className={`text-[11px] mt-0.5 ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>Urgent meals to cook</p>
          </div>

          <div className={`mt-4 pt-3 border-t flex items-center justify-between text-[11px] font-semibold ${
            isDark ? 'border-white/5 text-[#ffb780]' : 'border-[#E4DED2] text-[#D9826B]'
          }`}>
            <span className="flex items-center gap-1 group-hover:underline">
              <span>Rescue Plan</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </span>
            <span className={`font-mono text-[10px] ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>Zero Waste</span>
          </div>
        </div>

        {/* Card 3: Recipes Available */}
        <div
          onClick={() => setActiveScreen('recipes')}
          className={`group relative p-5 rounded-3xl border transition-all duration-300 cursor-pointer overflow-hidden shadow-lg hover:-translate-y-1 ${
            isDark
              ? 'bg-[#1c2529] border-white/10 hover:border-[#a1e3f9]/40'
              : 'bg-[#FFFFFF] border-[#E4DED2] hover:border-[#8EC5D6]/60 shadow-[0_8px_30px_rgba(50,60,45,0.06)]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${
              isDark ? 'bg-[#a1e3f9]/15 border border-[#a1e3f9]/25 text-[#a1e3f9]' : 'bg-[#8EC5D6]/20 text-[#2C5768]'
            }`}>
              <span className="text-xl">🍳</span>
            </div>
            <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
              isDark
                ? 'bg-[#a1e3f9]/15 text-[#a1e3f9] border-[#a1e3f9]/30'
                : 'bg-[#8EC5D6]/20 text-[#2C5768] border-[#8EC5D6]/35'
            }`}>
              Cook Ready
            </span>
          </div>

          <div className="mt-4">
            <div className={`font-display text-3xl sm:text-4xl font-black tracking-tight ${
              isDark ? 'text-white group-hover:text-[#a1e3f9]' : 'text-[#24332D] group-hover:text-[#2C5768]'
            }`}>
              {availableRecipesCount}
            </div>
            <p className={`text-xs sm:text-sm font-bold mt-1 ${isDark ? 'text-white' : 'text-[#24332D]'}`}>Recipes Available</p>
            <p className={`text-[11px] mt-0.5 ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>Matched from your pantry</p>
          </div>

          <div className={`mt-4 pt-3 border-t flex items-center justify-between text-[11px] font-semibold ${
            isDark ? 'border-white/5 text-[#a1e3f9]' : 'border-[#E4DED2] text-[#2C5768]'
          }`}>
            <span className="flex items-center gap-1 group-hover:underline">
              <span>Recipe Hub</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </span>
            <span className={`font-mono text-[10px] ${isDark ? 'text-[#8e989b]' : 'text-[#A99BCB]'}`}>AI Matched</span>
          </div>
        </div>

        {/* Card 4: Items to Restock */}
        <div
          onClick={() => setActiveScreen('shopping-list')}
          className={`group relative p-5 rounded-3xl border transition-all duration-300 cursor-pointer overflow-hidden shadow-lg hover:-translate-y-1 ${
            isDark
              ? 'bg-[#1c2529] border-white/10 hover:border-[#ffb780]/40'
              : 'bg-[#FFFFFF] border-[#E4DED2] hover:border-[#D5A84C]/60 shadow-[0_8px_30px_rgba(50,60,45,0.06)]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${
              isDark ? 'bg-[#ffb780]/15 border border-[#ffb780]/25 text-[#ffb780]' : 'bg-[#F5D98B]/30 text-[#8C671C]'
            }`}>
              <span className="text-xl">🛒</span>
            </div>
            <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
              isDark
                ? 'bg-[#ffb780]/15 text-[#ffb780] border-[#ffb780]/30'
                : 'bg-[#F5D98B]/30 text-[#8C671C] border-[#D5A84C]/35'
            }`}>
              Below Min
            </span>
          </div>

          <div className="mt-4">
            <div className={`font-display text-3xl sm:text-4xl font-black tracking-tight ${
              isDark ? 'text-white group-hover:text-[#ffb780]' : 'text-[#24332D] group-hover:text-[#8C671C]'
            }`}>
              {restockCount}
            </div>
            <p className={`text-xs sm:text-sm font-bold mt-1 ${isDark ? 'text-white' : 'text-[#24332D]'}`}>Items to Restock</p>
            <p className={`text-[11px] mt-0.5 ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>Low inventory queue</p>
          </div>

          <div className={`mt-4 pt-3 border-t flex items-center justify-between text-[11px] font-semibold ${
            isDark ? 'border-white/5 text-[#ffb780]' : 'border-[#E4DED2] text-[#8C671C]'
          }`}>
            <span className="flex items-center gap-1 group-hover:underline">
              <span>Shopping List</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </span>
            <span className={`font-mono text-[10px] ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>Smart Queue</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. QUICK ACTIONS ROW                                      */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* + Add Food */}
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className={`p-3.5 rounded-2xl border flex items-center gap-3 text-xs font-bold transition-all cursor-pointer group shadow-sm hover:-translate-y-0.5 ${
            isDark
              ? 'bg-[#141d20] hover:bg-[#1a2529] border-white/10 hover:border-[#a1e3f9]/40 text-white'
              : 'bg-[#FFFFFF] hover:bg-[#F7F5EF] border-[#E4DED2] hover:border-[#6FAF8F] text-[#24332D]'
          }`}
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
            isDark ? 'bg-[#a1e3f9]/15 text-[#a1e3f9]' : 'bg-[#6FAF8F]/20 text-[#557A62]'
          }`}>
            <PlusCircle className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="font-bold">+ Add Food</p>
            <p className={`text-[10px] ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>Scan / Enter</p>
          </div>
        </button>

        {/* Find Recipes */}
        <button
          type="button"
          onClick={() => setActiveScreen('recipes')}
          className={`p-3.5 rounded-2xl border flex items-center gap-3 text-xs font-bold transition-all cursor-pointer group shadow-sm hover:-translate-y-0.5 ${
            isDark
              ? 'bg-[#141d20] hover:bg-[#1a2529] border-white/10 hover:border-[#a1e3f9]/40 text-white'
              : 'bg-[#FFFFFF] hover:bg-[#F7F5EF] border-[#E4DED2] hover:border-[#8EC5D6] text-[#24332D]'
          }`}
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
            isDark ? 'bg-[#a1e3f9]/15 text-[#a1e3f9]' : 'bg-[#8EC5D6]/25 text-[#2C5768]'
          }`}>
            <UtensilsCrossed className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="font-bold">Find Recipes</p>
            <p className={`text-[10px] ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>Smart Hub</p>
          </div>
        </button>

        {/* Shopping List */}
        <button
          type="button"
          onClick={() => setActiveScreen('shopping-list')}
          className={`p-3.5 rounded-2xl border flex items-center gap-3 text-xs font-bold transition-all cursor-pointer group shadow-sm hover:-translate-y-0.5 ${
            isDark
              ? 'bg-[#141d20] hover:bg-[#1a2529] border-white/10 hover:border-[#ffb780]/40 text-white'
              : 'bg-[#FFFFFF] hover:bg-[#F7F5EF] border-[#E4DED2] hover:border-[#D5A84C] text-[#24332D]'
          }`}
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
            isDark ? 'bg-[#ffb780]/15 text-[#ffb780]' : 'bg-[#F5D98B]/35 text-[#8C671C]'
          }`}>
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="font-bold">Shopping List</p>
            <p className={`text-[10px] ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>Restock items</p>
          </div>
        </button>

        {/* Waste Rescue */}
        <button
          type="button"
          onClick={() => setActiveScreen('rescue')}
          className={`p-3.5 rounded-2xl border flex items-center gap-3 text-xs font-bold transition-all cursor-pointer group shadow-sm hover:-translate-y-0.5 ${
            isDark
              ? 'bg-[#141d20] hover:bg-[#1a2529] border-white/10 hover:border-emerald-500/40 text-white'
              : 'bg-[#FFFFFF] hover:bg-[#F7F5EF] border-[#E4DED2] hover:border-[#6FAF8F] text-[#24332D]'
          }`}
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
            isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-[#6FAF8F]/20 text-[#557A62]'
          }`}>
            <CalendarCheck className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="font-bold">Waste Rescue</p>
            <p className={`text-[10px] ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>Prevent waste</p>
          </div>
        </button>

        {/* Ask Chef AI */}
        <button
          type="button"
          onClick={() => setIsHeyChefOpen(true)}
          className={`col-span-2 sm:col-span-1 p-3.5 rounded-2xl border flex items-center gap-3 text-xs font-bold transition-all cursor-pointer group shadow-sm hover:-translate-y-0.5 ${
            isDark
              ? 'bg-gradient-to-r from-[#17252a] via-[#1c2e35] to-[#17252a] border-[#a1e3f9]/30 hover:border-[#a1e3f9] text-[#a1e3f9]'
              : 'bg-[#FFFFFF] hover:bg-[#F5F2FA] border-[#A99BCB]/40 hover:border-[#A99BCB] text-[#24332D]'
          }`}
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
            isDark ? 'bg-[#a1e3f9]/20 text-[#a1e3f9]' : 'bg-[#A99BCB]/25 text-[#63538C]'
          }`}>
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div className="text-left">
            <p className="font-bold">Ask Chef AI</p>
            <p className={`text-[10px] ${isDark ? 'text-[#8e989b]' : 'text-[#A99BCB]'}`}>Voice & Chat</p>
          </div>
        </button>
      </div>

      {/* ========================================================= */}
      {/* 4. ASK CHEF (Visual Centerpiece Panel)                    */}
      {/* ========================================================= */}
      <div className={`relative rounded-3xl p-6 sm:p-8 border shadow-xl overflow-hidden backdrop-blur-xl group transition-all duration-300 ${
        isDark
          ? 'bg-gradient-to-br from-[#152024] via-[#19272d] to-[#121a1d] border-[#a1e3f9]/30 hover:border-[#a1e3f9]/50'
          : 'bg-gradient-to-br from-[#F5F2FA] via-[#FFFDF8] to-[#EEF6F9] border-[#A99BCB]/35 shadow-[0_8px_30px_rgba(50,60,45,0.06)]'
      }`}>
        <div className="relative z-10 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md transition-transform group-hover:scale-105 ${
                  isDark
                    ? 'bg-gradient-to-br from-[#a1e3f9]/25 to-[#005a6b]/35 border border-[#a1e3f9]/40 text-[#a1e3f9]'
                    : 'bg-gradient-to-br from-[#A99BCB] to-[#8EC5D6] text-white shadow-[#A99BCB]/25'
                }`}>
                  <ChefHat className="w-7 h-7" />
                </div>
                <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 flex items-center justify-center shadow-sm ${
                  isDark ? 'bg-cyan-400 border-[#152024] text-[#00222b]' : 'bg-[#D9826B] border-white text-white'
                }`}>
                  <Sparkles className="w-2.5 h-2.5" />
                </span>
              </div>

              <div>
                <h2 className={`font-display text-xl sm:text-2xl font-black flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-[#24332D]'
                }`}>
                  <span>✨ Ask Chef</span>
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                    isDark
                      ? 'bg-[#a1e3f9]/20 text-[#a1e3f9] border-[#a1e3f9]/30'
                      : 'bg-[#A99BCB]/20 text-[#63538C] border-[#A99BCB]/35'
                  }`}>
                    AI Assistant
                  </span>
                </h2>
                <p className={`text-xs sm:text-sm ${isDark ? 'text-[#bfc8cc]' : 'text-[#68736D]'}`}>
                  Tell Chef what you have and I'll help you decide what to cook.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsHeyChefOpen(true)}
              className={`px-4 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm shrink-0 self-start sm:self-auto hover:-translate-y-0.5 ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                  : 'bg-[#8EC5D6]/20 hover:bg-[#8EC5D6]/30 border-[#8EC5D6]/40 text-[#2B5769]'
              }`}
            >
              <Mic className="w-3.5 h-3.5 animate-pulse" />
              <span>Voice Command</span>
            </button>
          </div>

          {/* Search/Input Interface */}
          <form onSubmit={handleChefSubmit} className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Search className={`w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 ${
                isDark ? 'text-[#8e989b]' : 'text-[#68736D]'
              }`} />
              <input
                type="text"
                value={chefQueryInput}
                onChange={(e) => setChefQueryInput(e.target.value)}
                placeholder="Type ingredients or dish request (e.g. 'chicken and rice', 'quick South Indian dinner', 'use tomatoes')..."
                className={`w-full pl-11 pr-4 py-3.5 rounded-2xl border text-xs sm:text-sm outline-none transition-all shadow-sm font-medium ${
                  isDark
                    ? 'bg-[#0f1719]/90 border-white/10 text-white placeholder-[#5f6e72] focus:border-[#a1e3f9]'
                    : 'bg-[#FFFFFF] border-[#E4DED2] text-[#24332D] placeholder-[#8A9590] focus:border-[#557A62]'
                }`}
              />
            </div>
            <button
              type="submit"
              className={`px-6 py-3.5 rounded-2xl font-display font-black text-xs sm:text-sm flex items-center gap-2 transition-all shrink-0 cursor-pointer shadow-md hover:-translate-y-0.5 ${
                isDark
                  ? 'bg-[#a1e3f9] hover:bg-[#c2effc] text-[#003642] shadow-[#a1e3f9]/20'
                  : 'bg-gradient-to-r from-[#D9826B] to-[#A99BCB] hover:from-[#E2927C] hover:to-[#BDB0DC] text-white shadow-[#D9826B]/20'
              }`}
            >
              <span>Ask Chef</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Suggestion Chips */}
          <div className="space-y-2 pt-1">
            <p className={`text-[10px] font-mono uppercase font-bold tracking-wider ${
              isDark ? 'text-[#8e989b]' : 'text-[#68736D]'
            }`}>
              Quick Suggestions:
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'What can I cook?', color: isDark ? 'text-[#a1e3f9]' : 'text-[#2C5768]' },
                { label: 'Maggi', color: isDark ? 'text-[#ffb780]' : 'text-[#D9826B]' },
                { label: 'Use ingredients before expiry', color: isDark ? 'text-[#ffb780]' : 'text-[#D9826B]' },
                { label: 'Quick dinner', color: isDark ? 'text-[#F6C85F]' : 'text-[#8C671C]' },
                { label: 'South Indian', color: isDark ? 'text-[#8FD3B6]' : 'text-[#557A62]' },
              ].map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => handleSuggestionChip(chip.label)}
                  className={`px-3.5 py-1.5 rounded-xl border text-xs transition-all cursor-pointer flex items-center gap-1.5 font-semibold shadow-sm hover:-translate-y-0.5 ${
                    isDark
                      ? 'bg-[#0f1719] hover:bg-[#1a272b] border-white/10 text-[#dbe4e8] hover:text-white'
                      : 'bg-[#FFFFFF] hover:bg-[#F7F5EF] border-[#E4DED2] text-[#24332D]'
                  }`}
                >
                  <Sparkles className={`w-3 h-3 ${chip.color}`} />
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. WHAT CAN I COOK? & USE THESE SOON                      */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* WHAT CAN I COOK? */}
        <div className="lg:col-span-2 space-y-4">
          <div className={`flex items-center justify-between border-b pb-3 ${
            isDark ? 'border-white/10' : 'border-[#E4DED2]'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isDark ? 'bg-[#a1e3f9]/15 text-[#a1e3f9]' : 'bg-[#8EC5D6]/20 text-[#2C5768]'
              }`}>
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <div>
                <h2 className={`font-display text-lg sm:text-xl font-black tracking-wide ${
                  isDark ? 'text-white' : 'text-[#24332D]'
                }`}>
                  What Can I Cook?
                </h2>
                <p className={`text-[11px] ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
                  Matched directly with your pantry
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveScreen('recipes')}
              className={`text-xs hover:underline font-bold flex items-center gap-1.5 cursor-pointer ${
                isDark ? 'text-[#a1e3f9]' : 'text-[#2C5768]'
              }`}
            >
              <span>Explore All ({availableRecipesCount})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {featuredRecipe ? (
            <div className="space-y-4">
              {/* Featured Recipe Card */}
              <div className={`group relative rounded-3xl border transition-all duration-300 overflow-hidden shadow-xl flex flex-col sm:flex-row ${
                isDark
                  ? 'bg-gradient-to-r from-[#172327] via-[#1a282d] to-[#152024] border-white/10 hover:border-[#a1e3f9]/40'
                  : 'bg-[#FFFFFF] border-[#E4DED2] hover:border-[#6FAF8F]/60 shadow-[0_8px_30px_rgba(50,60,45,0.06)]'
              }`}>
                {/* Food Image */}
                <div
                  onClick={() => handleOpenRecipeDetail(featuredRecipe.recipe)}
                  className="sm:w-1/2 relative h-56 sm:h-auto overflow-hidden cursor-pointer shrink-0"
                >
                  <img
                    src={featuredRecipe.recipe.image}
                    alt={featuredRecipe.recipe.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-transparent via-black/15 to-transparent" />
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-black/70 text-white backdrop-blur-md">
                      Featured Match
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full backdrop-blur-md ${
                      isDark ? 'bg-[#a1e3f9] text-[#003642]' : 'bg-[#6FAF8F] text-white'
                    }`}>
                      {featuredRecipe.recipe.cuisine}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 sm:p-6 sm:w-1/2 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-mono font-medium ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
                        Prep: {featuredRecipe.recipe.prepTime}
                      </span>
                      <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${getMatchBadgeStyle(
                        featuredRecipe.matchPercentage
                      )}`}>
                        {featuredRecipe.matchPercentage >= 100
                          ? '100% Ready'
                          : `${featuredRecipe.matchPercentage}% Match`}
                      </span>
                    </div>

                    <h3
                      onClick={() => handleOpenRecipeDetail(featuredRecipe.recipe)}
                      className={`font-display text-lg sm:text-xl font-bold transition-colors mt-2 cursor-pointer leading-snug ${
                        isDark ? 'text-white group-hover:text-[#a1e3f9]' : 'text-[#24332D] group-hover:text-[#557A62]'
                      }`}
                    >
                      {featuredRecipe.recipe.title}
                    </h3>
                    <p className={`text-xs line-clamp-2 mt-1 ${isDark ? 'text-[#bfc8cc]' : 'text-[#68736D]'}`}>
                      {featuredRecipe.recipe.description}
                    </p>

                    <div className={`mt-3 pt-3 border-t space-y-1 ${isDark ? 'border-white/5' : 'border-[#E4DED2]'}`}>
                      <div className="flex flex-wrap gap-1">
                        {featuredRecipe.availableIngredients.slice(0, 4).map((ing, i) => (
                          <span
                            key={i}
                            className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${
                              isDark
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : 'bg-[#6FAF8F]/15 text-[#43634F] border-[#6FAF8F]/30'
                            }`}
                          >
                            ✓ {ing}
                          </span>
                        ))}
                        {featuredRecipe.missingIngredients.slice(0, 2).map((ing, i) => (
                          <span
                            key={i}
                            className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${
                              isDark
                                ? 'bg-[#ffb780]/15 text-[#ffb780] border-[#ffb780]/30'
                                : 'bg-[#F2B49F]/25 text-[#B8573E] border-[#F2B49F]/35'
                            }`}
                          >
                            + {ing}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenRecipeDetail(featuredRecipe.recipe)}
                    className={`w-full py-2.5 px-4 rounded-xl font-display font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:-translate-y-0.5 ${
                      isDark
                        ? 'bg-[#a1e3f9] hover:bg-[#c2effc] text-[#003642]'
                        : 'bg-[#557A62] hover:bg-[#43634F] text-white'
                    }`}
                  >
                    <span>View Recipe & Steps</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Secondary Grid */}
              {secondaryRecipes.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {secondaryRecipes.map(({ recipe, matchPercentage, availableIngredients, missingIngredients }) => (
                    <div
                      key={recipe.id}
                      className={`group rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col justify-between shadow-md hover:-translate-y-1 ${
                        isDark
                          ? 'bg-[#152024] border-white/10 hover:border-[#a1e3f9]/40'
                          : 'bg-[#FFFFFF] border-[#E4DED2] hover:border-[#6FAF8F]/60 shadow-[0_8px_30px_rgba(50,60,45,0.06)]'
                      }`}
                    >
                      <div>
                        <div
                          onClick={() => handleOpenRecipeDetail(recipe)}
                          className="relative h-40 w-full overflow-hidden cursor-pointer"
                        >
                          <img
                            src={recipe.image}
                            alt={recipe.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/60 text-white backdrop-blur-md">
                              {recipe.prepTime}
                            </span>
                          </div>
                          <div className="absolute top-2.5 right-2.5">
                            <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${getMatchBadgeStyle(
                              matchPercentage
                            )}`}>
                              {matchPercentage >= 100 ? '100% Ready' : `${matchPercentage}% Match`}
                            </span>
                          </div>
                        </div>

                        <div className="p-4 space-y-2">
                          <h4
                            onClick={() => handleOpenRecipeDetail(recipe)}
                            className={`font-display text-sm font-bold transition-colors cursor-pointer line-clamp-1 ${
                              isDark ? 'text-white group-hover:text-[#a1e3f9]' : 'text-[#24332D] group-hover:text-[#557A62]'
                            }`}
                          >
                            {recipe.title}
                          </h4>
                          <p className={`text-xs line-clamp-2 ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
                            {recipe.description}
                          </p>

                          <div className="flex flex-wrap gap-1 pt-1">
                            {availableIngredients.slice(0, 2).map((ing, i) => (
                              <span
                                key={i}
                                className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                  isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-[#6FAF8F]/15 text-[#43634F]'
                                }`}
                              >
                                ✓ {ing}
                              </span>
                            ))}
                            {missingIngredients.slice(0, 1).map((ing, i) => (
                              <span
                                key={i}
                                className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                  isDark ? 'bg-[#ffb780]/15 text-[#ffb780]' : 'bg-[#F2B49F]/25 text-[#B8573E]'
                                }`}
                              >
                                + {ing}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 pt-1">
                        <button
                          type="button"
                          onClick={() => handleOpenRecipeDetail(recipe)}
                          className={`w-full py-2 px-3 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            isDark
                              ? 'bg-[#1a272c] hover:bg-[#a1e3f9] hover:text-[#003642] text-white border-white/10'
                              : 'bg-[#F7F5EF] hover:bg-[#6FAF8F] hover:text-white text-[#24332D] border-[#E4DED2]'
                          }`}
                        >
                          <span>View Recipe</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className={`p-8 rounded-3xl border text-center space-y-3 shadow-sm ${
              isDark ? 'bg-[#152024] border-white/10' : 'bg-[#FFFFFF] border-[#E4DED2]'
            }`}>
              <UtensilsCrossed className="w-8 h-8 mx-auto opacity-70" />
              <h3 className="font-display text-base font-bold">No Matched Recipes Yet</h3>
              <p className="text-xs opacity-70 max-w-sm mx-auto">
                Add more items to your inventory to unlock instant matches!
              </p>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                  isDark ? 'bg-[#a1e3f9] text-[#003642]' : 'bg-[#557A62] text-white'
                }`}
              >
                + Add Food Items
              </button>
            </div>
          )}
        </div>

        {/* USE THESE SOON */}
        <div className="space-y-4">
          <div className={`flex items-center justify-between border-b pb-3 ${
            isDark ? 'border-white/10' : 'border-[#E4DED2]'
          }`}>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isDark ? 'bg-rose-500/15 text-rose-400' : 'bg-[#F2B49F]/25 text-[#D9826B]'
              }`}>
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className={`font-display text-base sm:text-lg font-black tracking-wide ${
                  isDark ? 'text-white' : 'text-[#24332D]'
                }`}>
                  Use These Soon
                </h2>
                <p className={`text-[11px] ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>Closest to expiration</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveScreen('rescue')}
              className={`text-xs hover:underline font-bold flex items-center gap-1 cursor-pointer ${
                isDark ? 'text-[#ffb780]' : 'text-[#D9826B]'
              }`}
            >
              <span>Rescue ({expiringCount})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {expiringItems.length > 0 ? (
              expiringItems.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 shadow-sm group hover:-translate-y-0.5 ${
                    isDark
                      ? 'bg-[#152024] border-white/10 hover:border-white/20'
                      : 'bg-[#FFFFFF] border-[#E4DED2] hover:border-[#D9826B]/50'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">
                        {item.name.toLowerCase().includes('tomato')
                          ? '🍅'
                          : item.name.toLowerCase().includes('spinach') || item.name.toLowerCase().includes('palak')
                          ? '🥬'
                          : item.name.toLowerCase().includes('batter')
                          ? '🥣'
                          : item.name.toLowerCase().includes('onion') || item.name.toLowerCase().includes('shallot')
                          ? '🧅'
                          : item.name.toLowerCase().includes('coconut')
                          ? '🥥'
                          : item.name.toLowerCase().includes('chicken')
                          ? '🍗'
                          : '🌿'}
                      </span>
                      <h4 className={`font-display text-xs sm:text-sm font-bold capitalize transition-colors ${
                        isDark ? 'text-white group-hover:text-[#a1e3f9]' : 'text-[#24332D] group-hover:text-[#D9826B]'
                      }`}>
                        {item.name}
                      </h4>
                    </div>
                    <p className={`text-[11px] ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
                      {item.quantity} {item.unit} • {item.location}
                    </p>
                    <span
                      className={`inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        item.daysLeft <= 1
                          ? isDark
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : 'bg-[#F2B49F]/30 text-[#D9826B] border-[#D9826B]/40'
                          : isDark
                          ? 'bg-[#ffb780]/20 text-[#ffb780] border-[#ffb780]/30'
                          : 'bg-[#F5D98B]/35 text-[#8C671C] border-[#D5A84C]/35'
                      }`}
                    >
                      {item.daysLeft <= 0 ? 'Expires today' : item.daysLeft === 1 ? 'Expires in 24h' : `${item.daysLeft} days left`}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleFindRecipesForItem(item.name)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer shrink-0 shadow-sm ${
                      isDark
                        ? 'bg-[#1b272c] hover:bg-[#a1e3f9] text-[#a1e3f9] hover:text-[#003642] border-white/5'
                        : 'bg-[#F7F5EF] hover:bg-[#D9826B] text-[#D9826B] hover:text-white border-[#E4DED2]'
                    }`}
                    title={`Find recipes for ${item.name}`}
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className={`p-6 rounded-3xl border text-center space-y-2 shadow-sm ${
                isDark ? 'bg-[#152024] border-white/10' : 'bg-[#FFFFFF] border-[#E4DED2]'
              }`}>
                <CheckCircle2 className={`w-8 h-8 mx-auto ${isDark ? 'text-emerald-400' : 'text-[#557A62]'}`} />
                <h4 className="font-display text-sm font-bold">All Food Is Fresh!</h4>
                <p className="text-xs opacity-70">
                  No items expiring in the next 3 days.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 6. SECOND ROW (Waste Protection & Smart Shopping)         */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SMART WASTE PROTECTION */}
        <div className={`rounded-3xl p-6 border shadow-xl space-y-4 ${
          isDark
            ? 'bg-gradient-to-br from-[#162327] via-[#1a282c] to-[#121c1f] border-emerald-500/30'
            : 'bg-gradient-to-br from-[#EDF5ED] via-[#F6FAF6] to-[#FFFFFF] border-[#6FAF8F]/40 shadow-[0_8px_30px_rgba(50,60,45,0.06)]'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${
                isDark ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' : 'bg-[#6FAF8F]/25 text-[#557A62]'
              }`}>
                <Leaf className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`font-display text-base font-black tracking-wide ${
                  isDark ? 'text-white' : 'text-[#24332D]'
                }`}>
                  🌱 Smart Waste Protection
                </h3>
                <p className={`text-xs ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
                  {expiringCount > 0 ? `${expiringCount} ingredients can be rescued today` : 'Optimal zero-waste score'}
                </p>
              </div>
            </div>

            <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold border ${
              isDark
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-[#6FAF8F]/20 text-[#43634F] border-[#6FAF8F]/35'
            }`}>
              Eco Active
            </span>
          </div>

          <div className={`grid grid-cols-2 gap-3 p-3.5 rounded-2xl border text-center shadow-sm ${
            isDark ? 'bg-[#0f1719] border-white/5' : 'bg-[#FFFFFF] border-[#E4DED2]'
          }`}>
            <div>
              <p className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
                Food at Risk
              </p>
              <p className={`text-lg sm:text-xl font-display font-black font-mono mt-0.5 ${
                isDark ? 'text-rose-300' : 'text-[#D9826B]'
              }`}>
                {estimatedRescueGrams}g
              </p>
            </div>
            <div>
              <p className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
                Savings Potential
              </p>
              <p className={`text-lg sm:text-xl font-display font-black font-mono mt-0.5 ${
                isDark ? 'text-emerald-400' : 'text-[#557A62]'
              }`}>
                ₹{estimatedMoneySaved}
              </p>
            </div>
          </div>

          <div className={`p-3.5 rounded-2xl border text-xs space-y-1 shadow-sm ${
            isDark
              ? 'bg-[#141e21] border-white/5 text-[#bfc8cc]'
              : 'bg-[#FFFFFF] border-[#E4DED2] text-[#68736D]'
          }`}>
            <span className={`text-[11px] font-bold flex items-center gap-1.5 ${
              isDark ? 'text-[#a1e3f9]' : 'text-[#557A62]'
            }`}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Let's rescue these ingredients before they go to waste:</span>
            </span>
            <p className="leading-relaxed">
              {expiringItems.length > 0
                ? `Cook ${expiringItems[0].name} today into a fresh South Indian curry, rasam, or poriyal to eliminate waste.`
                : 'Keep coriander and curry leaves wrapped in a dry cloth to double their fresh crispness.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveScreen('rescue')}
            className={`w-full py-3 px-4 rounded-xl font-display font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer hover:-translate-y-0.5 ${
              isDark
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white'
                : 'bg-[#557A62] hover:bg-[#43634F] text-white'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Launch Rescue Plan →</span>
          </button>
        </div>

        {/* SMART SHOPPING */}
        <div className={`rounded-3xl p-6 border shadow-xl space-y-4 ${
          isDark
            ? 'bg-gradient-to-br from-[#162327] via-[#1a282d] to-[#121c1f] border-[#ffb780]/30'
            : 'bg-gradient-to-br from-[#FFFBF2] via-[#FFFDF8] to-[#FFFFFF] border-[#F5D98B]/60 shadow-[0_8px_30px_rgba(50,60,45,0.06)]'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${
                isDark ? 'bg-[#ffb780]/20 border border-[#ffb780]/30 text-[#ffb780]' : 'bg-[#F5D98B]/35 text-[#8C671C]'
              }`}>
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`font-display text-base font-black tracking-wide ${
                  isDark ? 'text-white' : 'text-[#24332D]'
                }`}>
                  🛒 Smart Shopping
                </h3>
                <p className={`text-xs ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
                  Low inventory restock recommendations
                </p>
              </div>
            </div>

            <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
              isDark
                ? 'bg-[#ffb780]/15 text-[#ffb780] border-[#ffb780]/30'
                : 'bg-[#F5D98B]/35 text-[#8C671C] border-[#D5A84C]/35'
            }`}>
              {restockCount} items
            </span>
          </div>

          <div className="space-y-2">
            {lowStockItems.length > 0 ? (
              lowStockItems.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs shadow-sm ${
                    isDark ? 'bg-[#0f1719] border-white/5' : 'bg-[#FFFFFF] border-[#E4DED2]'
                  }`}
                >
                  <div>
                    <p className={`font-bold capitalize ${isDark ? 'text-white' : 'text-[#24332D]'}`}>{item.name}</p>
                    <p className={`text-[10px] font-medium ${isDark ? 'text-amber-300' : 'text-[#8C671C]'}`}>
                      Current: {item.quantity} {item.unit} • Min: {getItemMinimumStockThreshold(item)} {item.unit}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddLowStockToShopping(item.name)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                      isDark
                        ? 'bg-[#ffb780]/20 hover:bg-[#ffb780] text-[#ffb780] hover:text-[#4a2800]'
                        : 'bg-[#F5D98B]/35 hover:bg-[#F5D98B] text-[#7A5A14]'
                    }`}
                  >
                    + Add to List
                  </button>
                </div>
              ))
            ) : (
              <div className={`p-4 rounded-2xl text-center text-xs border ${
                isDark ? 'bg-[#0f1719] border-white/5 text-[#8e989b]' : 'bg-[#FFFFFF] border-[#E4DED2] text-[#68736D]'
              }`}>
                All pantry and produce staples are well stocked!
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setActiveScreen('shopping-list')}
            className={`w-full py-3 px-4 rounded-xl border font-display font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer hover:-translate-y-0.5 shadow-sm ${
              isDark
                ? 'bg-[#1a262a] hover:bg-[#223136] border-white/10 text-white'
                : 'bg-[#FFFFFF] hover:bg-[#F7F5EF] border-[#E4DED2] text-[#24332D]'
            }`}
          >
            <span>View Complete Shopping List</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 7. RECENT KITCHEN ACTIVITY                                */}
      {/* ========================================================= */}
      <div className={`rounded-3xl p-6 border shadow-xl space-y-4 ${
        isDark
          ? 'bg-[#131b1e] border-white/10'
          : 'bg-[#FFFFFF] border-[#E4DED2] shadow-[0_8px_30px_rgba(50,60,45,0.06)]'
      }`}>
        <div className={`flex items-center justify-between border-b pb-3 ${
          isDark ? 'border-white/10' : 'border-[#E4DED2]'
        }`}>
          <div className="flex items-center gap-2.5">
            <Clock className={`w-4 h-4 ${isDark ? 'text-[#a1e3f9]' : 'text-[#557A62]'}`} />
            <h3 className={`font-display text-sm font-bold uppercase tracking-wider ${
              isDark ? 'text-white' : 'text-[#24332D]'
            }`}>
              Recent Kitchen Activity
            </h3>
          </div>
          <span className={`text-[10px] font-mono ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
            Real-Time Sync
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {lastCompletedSession ? (
            <div className={`p-3.5 rounded-2xl border space-y-1 ${
              isDark ? 'bg-[#0f1719] border-emerald-500/20' : 'bg-[#F7F5EF] border-[#6FAF8F]/30'
            }`}>
              <div className="flex items-center justify-between text-xs">
                <span className={`font-bold ${isDark ? 'text-emerald-400' : 'text-[#557A62]'}`}>Recipe Prepared</span>
                <span className={`text-[10px] font-mono ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>Today</span>
              </div>
              <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#24332D]'}`}>{lastCompletedSession.title}</p>
              <p className={`text-[11px] ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>{lastCompletedSession.rescuedItemsText}</p>
            </div>
          ) : (
            <div className={`p-3.5 rounded-2xl border space-y-1 ${
              isDark ? 'bg-[#0f1719] border-white/5' : 'bg-[#F7F5EF] border-[#E4DED2]'
            }`}>
              <div className="flex items-center justify-between text-xs">
                <span className={`font-bold ${isDark ? 'text-[#a1e3f9]' : 'text-[#63538C]'}`}>Recipe Hub</span>
                <span className={`text-[10px] font-mono ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>Active</span>
              </div>
              <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#24332D]'}`}>Smart Shelf Initialized</p>
              <p className={`text-[11px] ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>Ready for meal recommendations</p>
            </div>
          )}

          <div className={`p-3.5 rounded-2xl border space-y-1 ${
            isDark ? 'bg-[#0f1719] border-white/5' : 'bg-[#F7F5EF] border-[#E4DED2]'
          }`}>
            <div className="flex items-center justify-between text-xs">
              <span className={`font-bold ${isDark ? 'text-[#a1e3f9]' : 'text-[#557A62]'}`}>Inventory Sync</span>
              <span className={`text-[10px] font-mono ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>Active</span>
            </div>
            <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
              {activeItemsCount} items actively tracked
            </p>
            <p className={`text-[11px] ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
              {expiringCount > 0 ? `${expiringCount} items require cooking soon` : 'All items in optimal condition'}
            </p>
          </div>

          <div className={`p-3.5 rounded-2xl border space-y-1 ${
            isDark ? 'bg-[#0f1719] border-white/5' : 'bg-[#F7F5EF] border-[#E4DED2]'
          }`}>
            <div className="flex items-center justify-between text-xs">
              <span className={`font-bold ${isDark ? 'text-[#ffb780]' : 'text-[#8C671C]'}`}>Shopping Queue</span>
              <span className={`text-[10px] font-mono ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>Updated</span>
            </div>
            <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
              {shoppingItems.filter((s) => !s.completed).length} items awaiting purchase
            </p>
            <p className={`text-[11px] ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>Smart replenishment ready</p>
          </div>
        </div>
      </div>
    </div>
  );
};
