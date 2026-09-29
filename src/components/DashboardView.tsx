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
  } = useKitchen();

  const [chefQueryInput, setChefQueryInput] = useState('');

  // 1. Dynamic Greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning! 👋';
    if (hour < 17) return 'Good afternoon! 👋';
    return 'Good evening! 👋';
  }, []);

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
    const pendingShopping = shoppingItems.filter((s) => !s.completed);
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

  // Pastel Match Badge colors per user specification
  const getMatchBadgeStyle = (matchPercentage: number) => {
    if (matchPercentage >= 100) {
      return 'bg-[#8BAE8B]/20 text-[#43634F] border-[#8BAE8B]/40'; // Sage
    }
    if (matchPercentage >= 80) {
      return 'bg-[#91BDD0]/25 text-[#2C5768] border-[#91BDD0]/40'; // Soft Blue
    }
    if (matchPercentage >= 50) {
      return 'bg-[#F5D98B]/35 text-[#8C671C] border-[#F5D98B]/50'; // Yellow
    }
    return 'bg-[#F2B49F]/30 text-[#B8573E] border-[#F2B49F]/50'; // Peach
  };

  return (
    <div className="relative space-y-7 pb-28 text-[#24352F] select-none">
      {/* ========================================================= */}
      {/* SUBTLE ORGANIC BACKGROUND ACCENTS                         */}
      {/* ========================================================= */}
      {/* Soft sage radial glow */}
      <div className="absolute -top-24 -left-20 w-96 h-96 bg-[#8BAE8B]/10 rounded-full blur-[140px] pointer-events-none" />
      {/* Subtle peach glow */}
      <div className="absolute top-[35%] -right-24 w-96 h-96 bg-[#F2B49F]/10 rounded-full blur-[150px] pointer-events-none" />
      {/* Soft lavender glow */}
      <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-[#A99BCB]/8 rounded-full blur-[140px] pointer-events-none" />

      {/* ========================================================= */}
      {/* 1. HERO SECTION (Soft Sage + Cream Gradient)              */}
      {/* ========================================================= */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#EBF3EB] via-[#F6F1E9] to-[#FFFDF8] border border-[#E5DED2] shadow-[0_8px_30px_rgba(50,60,45,0.06)] overflow-hidden">
        {/* Subtle decorative dot pattern */}
        <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#557A62_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

        {/* Decorative Floating Garden/Kitchen Glyphs */}
        <div className="absolute right-8 top-6 hidden md:flex items-center gap-3 opacity-30 pointer-events-none text-2xl">
          <span>🌿</span>
          <span>🍅</span>
          <span>🥣</span>
          <span>🥘</span>
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            {/* Live Indicator */}
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFFFFF] border border-[#8BAE8B]/40 text-[#43634F] font-mono text-[11px] font-bold shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8BAE8B] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#557A62]" />
                </span>
                <span>KITCHEN LIVE</span>
              </span>
              <span className="text-xs text-[#68736D] font-medium">
                Cozy Smart Kitchen
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-[40px] font-black text-[#24352F] tracking-tight leading-tight">
              {greeting}
            </h1>
            <p className="text-sm sm:text-base text-[#68736D] font-medium leading-relaxed">
              Here's what's happening in your kitchen today. Track fresh ingredients, discover recipes, and cook with ease.
            </p>
          </div>

          {/* Differentiated Primary Actions */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {/* + Add Food (Clean Cream & Sage) */}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-[#FFFFFF] hover:bg-[#F7F3EA] border border-[#E5DED2] hover:border-[#8BAE8B] text-[#24352F] text-xs sm:text-sm font-bold flex items-center gap-2.5 transition-all cursor-pointer shadow-sm hover:-translate-y-0.5"
            >
              <div className="w-5 h-5 rounded-lg bg-[#8BAE8B]/20 flex items-center justify-center text-[#557A62]">
                <PlusCircle className="w-3.5 h-3.5" />
              </div>
              <span>+ Add Food</span>
            </button>

            {/* Ask Chef (Lavender + Soft Blue Gradient - Main AI Feature) */}
            <button
              type="button"
              onClick={() => setIsHeyChefOpen(true)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#A99BCB] to-[#91BDD0] hover:from-[#BDB0DC] hover:to-[#A3CBE0] text-white text-xs sm:text-sm font-display font-black flex items-center gap-2.5 shadow-md shadow-[#A99BCB]/30 hover:shadow-lg hover:shadow-[#A99BCB]/40 transition-all cursor-pointer hover:-translate-y-0.5"
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
      {/* 2. SUMMARY CARDS (4 Beautiful Themed Cards)               */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {/* CARD 1 — ITEMS IN KITCHEN (Sage Green Theme) */}
        <div
          onClick={() => setActiveScreen('inventory')}
          className="group relative p-5 rounded-3xl bg-[#FFFFFF] border border-[#E5DED2] hover:border-[#8BAE8B]/60 transition-all duration-300 cursor-pointer overflow-hidden shadow-[0_8px_30px_rgba(50,60,45,0.06)] hover:shadow-[0_12px_35px_rgba(50,60,45,0.1)] hover:-translate-y-1"
        >
          {/* Subtle Sage Glow */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#8BAE8B]/10 rounded-full blur-2xl group-hover:bg-[#8BAE8B]/20 transition-all pointer-events-none" />

          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-2xl bg-[#8BAE8B]/20 border border-[#8BAE8B]/30 flex items-center justify-center text-[#557A62] group-hover:scale-110 transition-transform">
              <span className="text-xl">🥕</span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#8BAE8B]/20 text-[#43634F] border border-[#8BAE8B]/35">
              Active Stock
            </span>
          </div>

          <div className="mt-4">
            <div className="font-display text-3xl sm:text-4xl font-black text-[#24352F] group-hover:text-[#557A62] transition-colors tracking-tight">
              {activeItemsCount}
            </div>
            <p className="text-xs sm:text-sm font-bold text-[#24352F] mt-1">Items in Kitchen</p>
            <p className="text-[11px] text-[#68736D] mt-0.5">Pantry, crisper & fridge items</p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E5DED2] flex items-center justify-between text-[11px] text-[#557A62] font-semibold">
            <span className="flex items-center gap-1 group-hover:underline">
              <span>View Inventory</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </span>
            <span className="font-mono text-[10px] text-[#68736D]">100% Tracked</span>
          </div>
        </div>

        {/* CARD 2 — EXPIRING SOON (Peach / Terracotta Theme) */}
        <div
          onClick={() => setActiveScreen('rescue')}
          className="group relative p-5 rounded-3xl bg-[#FFFFFF] border border-[#E5DED2] hover:border-[#D9826B]/60 transition-all duration-300 cursor-pointer overflow-hidden shadow-[0_8px_30px_rgba(50,60,45,0.06)] hover:shadow-[0_12px_35px_rgba(50,60,45,0.1)] hover:-translate-y-1"
        >
          {/* Subtle Peach Glow */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#F2B49F]/15 rounded-full blur-2xl group-hover:bg-[#F2B49F]/25 transition-all pointer-events-none" />

          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-2xl bg-[#F2B49F]/25 border border-[#D9826B]/30 flex items-center justify-center text-[#D9826B] group-hover:scale-110 transition-transform">
              <span className="text-xl">⏰</span>
            </div>
            <span
              className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                expiringCount > 0
                  ? 'bg-[#D9826B]/15 text-[#D9826B] border-[#D9826B]/35'
                  : 'bg-[#8BAE8B]/15 text-[#43634F] border-[#8BAE8B]/30'
              }`}
            >
              {expiringCount > 0 ? '≤ 3 Days Left' : 'All Fresh'}
            </span>
          </div>

          <div className="mt-4">
            <div
              className={`font-display text-3xl sm:text-4xl font-black tracking-tight ${
                expiringCount > 0 ? 'text-[#D9826B]' : 'text-[#557A62]'
              }`}
            >
              {expiringCount}
            </div>
            <p className="text-xs sm:text-sm font-bold text-[#24352F] mt-1">Expiring Soon</p>
            <p className="text-[11px] text-[#68736D] mt-0.5">Urgent meals to cook</p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E5DED2] flex items-center justify-between text-[11px] text-[#D9826B] font-semibold">
            <span className="flex items-center gap-1 group-hover:underline">
              <span>Rescue Plan</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </span>
            <span className="font-mono text-[10px] text-[#68736D]">Zero Waste</span>
          </div>
        </div>

        {/* CARD 3 — RECIPES AVAILABLE (Soft Blue + Lavender Theme) */}
        <div
          onClick={() => setActiveScreen('recipes')}
          className="group relative p-5 rounded-3xl bg-[#FFFFFF] border border-[#E5DED2] hover:border-[#91BDD0]/60 transition-all duration-300 cursor-pointer overflow-hidden shadow-[0_8px_30px_rgba(50,60,45,0.06)] hover:shadow-[0_12px_35px_rgba(50,60,45,0.1)] hover:-translate-y-1"
        >
          {/* Subtle Blue Glow */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#91BDD0]/15 rounded-full blur-2xl group-hover:bg-[#A99BCB]/15 transition-all pointer-events-none" />

          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-2xl bg-[#91BDD0]/20 border border-[#91BDD0]/35 flex items-center justify-center text-[#2C5768] group-hover:scale-110 transition-transform">
              <span className="text-xl">🍳</span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#91BDD0]/20 text-[#2C5768] border border-[#91BDD0]/35">
              Cook Ready
            </span>
          </div>

          <div className="mt-4">
            <div className="font-display text-3xl sm:text-4xl font-black text-[#24352F] group-hover:text-[#2C5768] transition-colors tracking-tight">
              {availableRecipesCount}
            </div>
            <p className="text-xs sm:text-sm font-bold text-[#24352F] mt-1">Recipes Available</p>
            <p className="text-[11px] text-[#68736D] mt-0.5">Matched from your pantry</p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E5DED2] flex items-center justify-between text-[11px] text-[#2C5768] font-semibold">
            <span className="flex items-center gap-1 group-hover:underline">
              <span>Recipe Hub</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </span>
            <span className="font-mono text-[10px] text-[#A99BCB]">AI Matched</span>
          </div>
        </div>

        {/* CARD 4 — ITEMS TO RESTOCK (Warm Yellow / Mustard Theme) */}
        <div
          onClick={() => setActiveScreen('shopping-list')}
          className="group relative p-5 rounded-3xl bg-[#FFFFFF] border border-[#E5DED2] hover:border-[#D9AE58]/60 transition-all duration-300 cursor-pointer overflow-hidden shadow-[0_8px_30px_rgba(50,60,45,0.06)] hover:shadow-[0_12px_35px_rgba(50,60,45,0.1)] hover:-translate-y-1"
        >
          {/* Subtle Yellow Glow */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#F5D98B]/20 rounded-full blur-2xl group-hover:bg-[#F5D98B]/30 transition-all pointer-events-none" />

          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-2xl bg-[#F5D98B]/30 border border-[#D9AE58]/35 flex items-center justify-center text-[#8C671C] group-hover:scale-110 transition-transform">
              <span className="text-xl">🛒</span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#F5D98B]/30 text-[#8C671C] border border-[#D9AE58]/35">
              Below Min
            </span>
          </div>

          <div className="mt-4">
            <div className="font-display text-3xl sm:text-4xl font-black text-[#24352F] group-hover:text-[#8C671C] transition-colors tracking-tight">
              {restockCount}
            </div>
            <p className="text-xs sm:text-sm font-bold text-[#24352F] mt-1">Items to Restock</p>
            <p className="text-[11px] text-[#68736D] mt-0.5">Low inventory queue</p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E5DED2] flex items-center justify-between text-[11px] text-[#8C671C] font-semibold">
            <span className="flex items-center gap-1 group-hover:underline">
              <span>Shopping List</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </span>
            <span className="font-mono text-[10px] text-[#68736D]">Smart Queue</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. QUICK ACTIONS ROW (Elegant Pill/Card Buttons)          */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* + Add Food → Sage */}
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="p-3.5 rounded-2xl bg-[#FFFFFF] hover:bg-[#F7F3EA] border border-[#E5DED2] hover:border-[#8BAE8B] flex items-center gap-3 text-xs font-bold text-[#24352F] transition-all cursor-pointer group shadow-sm hover:-translate-y-0.5"
        >
          <div className="w-8 h-8 rounded-xl bg-[#8BAE8B]/20 border border-[#8BAE8B]/30 flex items-center justify-center text-[#557A62] group-hover:scale-110 transition-transform">
            <PlusCircle className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-[#24352F] group-hover:text-[#557A62] transition-colors">+ Add Food</p>
            <p className="text-[10px] text-[#68736D]">Scan / Enter</p>
          </div>
        </button>

        {/* Find Recipes → Soft Blue */}
        <button
          type="button"
          onClick={() => setActiveScreen('recipes')}
          className="p-3.5 rounded-2xl bg-[#FFFFFF] hover:bg-[#F7F3EA] border border-[#E5DED2] hover:border-[#91BDD0] flex items-center gap-3 text-xs font-bold text-[#24352F] transition-all cursor-pointer group shadow-sm hover:-translate-y-0.5"
        >
          <div className="w-8 h-8 rounded-xl bg-[#91BDD0]/25 border border-[#91BDD0]/35 flex items-center justify-center text-[#2C5768] group-hover:scale-110 transition-transform">
            <UtensilsCrossed className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-[#24352F] group-hover:text-[#2C5768] transition-colors">Find Recipes</p>
            <p className="text-[10px] text-[#68736D]">Smart Hub</p>
          </div>
        </button>

        {/* Shopping List → Mustard */}
        <button
          type="button"
          onClick={() => setActiveScreen('shopping-list')}
          className="p-3.5 rounded-2xl bg-[#FFFFFF] hover:bg-[#F7F3EA] border border-[#E5DED2] hover:border-[#D9AE58] flex items-center gap-3 text-xs font-bold text-[#24352F] transition-all cursor-pointer group shadow-sm hover:-translate-y-0.5"
        >
          <div className="w-8 h-8 rounded-xl bg-[#F5D98B]/35 border border-[#D9AE58]/35 flex items-center justify-center text-[#8C671C] group-hover:scale-110 transition-transform">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-[#24352F] group-hover:text-[#8C671C] transition-colors">Shopping List</p>
            <p className="text-[10px] text-[#68736D]">Restock items</p>
          </div>
        </button>

        {/* Waste Rescue → Sage Green */}
        <button
          type="button"
          onClick={() => setActiveScreen('rescue')}
          className="p-3.5 rounded-2xl bg-[#FFFFFF] hover:bg-[#F7F3EA] border border-[#E5DED2] hover:border-[#8BAE8B] flex items-center gap-3 text-xs font-bold text-[#24352F] transition-all cursor-pointer group shadow-sm hover:-translate-y-0.5"
        >
          <div className="w-8 h-8 rounded-xl bg-[#8BAE8B]/20 border border-[#8BAE8B]/30 flex items-center justify-center text-[#557A62] group-hover:scale-110 transition-transform">
            <CalendarCheck className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-[#24352F] group-hover:text-[#557A62] transition-colors">Waste Rescue</p>
            <p className="text-[10px] text-[#68736D]">Prevent waste</p>
          </div>
        </button>

        {/* Ask Chef AI → Lavender */}
        <button
          type="button"
          onClick={() => setIsHeyChefOpen(true)}
          className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-[#FFFFFF] hover:bg-[#F5F2FA] border border-[#A99BCB]/40 hover:border-[#A99BCB] flex items-center gap-3 text-xs font-bold transition-all cursor-pointer group shadow-sm hover:-translate-y-0.5"
        >
          <div className="w-8 h-8 rounded-xl bg-[#A99BCB]/25 border border-[#A99BCB]/35 flex items-center justify-center text-[#63538C] group-hover:scale-110 transition-transform">
            <Sparkles className="w-4 h-4 animate-pulse text-[#63538C]" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-[#24352F] group-hover:text-[#63538C] transition-colors">Ask Chef AI</p>
            <p className="text-[10px] text-[#A99BCB]">Voice & Chat</p>
          </div>
        </button>
      </div>

      {/* ========================================================= */}
      {/* 4. ASK CHEF (Visual Centerpiece: Lavender + Cream + Blue) */}
      {/* ========================================================= */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#F5F2FA] via-[#FFFDF8] to-[#EEF6F9] border border-[#A99BCB]/35 shadow-[0_8px_30px_rgba(50,60,45,0.06)] overflow-hidden">
        {/* Soft Lavender and Blue Ambient Aura */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-[#A99BCB]/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-10 left-1/4 w-80 h-80 bg-[#91BDD0]/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#A99BCB] to-[#91BDD0] flex items-center justify-center text-white shadow-md shadow-[#A99BCB]/25">
                  <ChefHat className="w-7 h-7" />
                </div>
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#D9826B] border-2 border-white flex items-center justify-center shadow-sm">
                  <Sparkles className="w-2.5 h-2.5 text-white" />
                </span>
              </div>

              <div>
                <h2 className="font-display text-xl sm:text-2xl font-black text-[#24352F] flex items-center gap-2">
                  <span>✨ Ask Chef</span>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#A99BCB]/20 text-[#63538C] border border-[#A99BCB]/35">
                    AI Assistant
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-[#68736D]">
                  Tell Chef what you have and I'll help you decide what to cook.
                </p>
              </div>
            </div>

            {/* Voice Command Button (Soft Blue Accent) */}
            <button
              type="button"
              onClick={() => setIsHeyChefOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#91BDD0]/20 hover:bg-[#91BDD0]/30 border border-[#91BDD0]/40 text-[#2B5769] text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm shrink-0 self-start sm:self-auto hover:-translate-y-0.5"
            >
              <Mic className="w-3.5 h-3.5 text-[#2B5769] animate-pulse" />
              <span>Voice Command</span>
            </button>
          </div>

          {/* Large White Rounded Input */}
          <form onSubmit={handleChefSubmit} className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#68736D] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={chefQueryInput}
                onChange={(e) => setChefQueryInput(e.target.value)}
                placeholder="Type ingredients or dish request (e.g. 'chicken and rice', 'quick South Indian dinner', 'use tomatoes')..."
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E5DED2] text-[#24352F] text-xs sm:text-sm placeholder-[#8A9590] focus:border-[#557A62] focus:ring-2 focus:ring-[#8BAE8B]/20 outline-none transition-all shadow-sm font-medium"
              />
            </div>
            {/* Ask Chef Button (Terracotta / Lavender Accent) */}
            <button
              type="submit"
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#D9826B] to-[#A99BCB] hover:from-[#E2927C] hover:to-[#BDB0DC] text-white font-display font-black text-xs sm:text-sm flex items-center gap-2 transition-all shrink-0 cursor-pointer shadow-md shadow-[#D9826B]/20 hover:-translate-y-0.5"
            >
              <span>Ask Chef</span>
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </form>

          {/* Quick Suggestion Chips (Subtle Pastel Backgrounds) */}
          <div className="space-y-2 pt-1">
            <p className="text-[10px] font-mono text-[#68736D] uppercase font-bold tracking-wider">
              Quick Suggestions:
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleSuggestionChip('What can I cook?')}
                className="px-3.5 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#E5DED2] hover:border-[#91BDD0] text-xs text-[#24352F] hover:text-[#2C5768] transition-all cursor-pointer flex items-center gap-1.5 font-semibold shadow-sm hover:-translate-y-0.5"
              >
                <Sparkles className="w-3 h-3 text-[#91BDD0]" />
                <span>What can I cook?</span>
              </button>

              <button
                type="button"
                onClick={() => handleSuggestionChip('Use ingredients before expiry')}
                className="px-3.5 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#E5DED2] hover:border-[#D9826B] text-xs text-[#24352F] hover:text-[#D9826B] transition-all cursor-pointer flex items-center gap-1.5 font-semibold shadow-sm hover:-translate-y-0.5"
              >
                <Sparkles className="w-3 h-3 text-[#D9826B]" />
                <span>Use ingredients before expiry</span>
              </button>

              <button
                type="button"
                onClick={() => handleSuggestionChip('Quick dinner')}
                className="px-3.5 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#E5DED2] hover:border-[#D9AE58] text-xs text-[#24352F] hover:text-[#8C671C] transition-all cursor-pointer flex items-center gap-1.5 font-semibold shadow-sm hover:-translate-y-0.5"
              >
                <Sparkles className="w-3 h-3 text-[#D9AE58]" />
                <span>Quick dinner</span>
              </button>

              <button
                type="button"
                onClick={() => handleSuggestionChip('South Indian')}
                className="px-3.5 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#E5DED2] hover:border-[#8BAE8B] text-xs text-[#24352F] hover:text-[#557A62] transition-all cursor-pointer flex items-center gap-1.5 font-semibold shadow-sm hover:-translate-y-0.5"
              >
                <Sparkles className="w-3 h-3 text-[#557A62]" />
                <span>South Indian</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. WHAT CAN I COOK? & USE THESE SOON                      */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 Cols): WHAT CAN I COOK? (Food Photography Prominent) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5DED2] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#91BDD0]/20 flex items-center justify-center text-[#2C5768]">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-display text-lg sm:text-xl font-black text-[#24352F] tracking-wide">
                  What Can I Cook?
                </h2>
                <p className="text-[11px] text-[#68736D]">
                  Recipes matched directly with your pantry
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveScreen('recipes')}
              className="text-xs text-[#2C5768] hover:underline font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <span>Explore All ({availableRecipesCount})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {featuredRecipe ? (
            <div className="space-y-4">
              {/* Featured Top-Ranked Recipe Card (White card with prominent photography) */}
              <div className="group relative rounded-3xl bg-[#FFFFFF] border border-[#E5DED2] hover:border-[#8BAE8B]/60 transition-all duration-300 overflow-hidden shadow-[0_8px_30px_rgba(50,60,45,0.06)] hover:shadow-[0_12px_35px_rgba(50,60,45,0.1)] flex flex-col sm:flex-row">
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
                  <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-transparent via-black/10 to-transparent" />
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-white/90 text-[#24352F] backdrop-blur-md shadow-sm">
                      Featured Match
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#8BAE8B] text-white backdrop-blur-md">
                      {featuredRecipe.recipe.cuisine}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 sm:p-6 sm:w-1/2 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono text-[#68736D] font-medium">
                        Prep: {featuredRecipe.recipe.prepTime}
                      </span>
                      {/* Match Badge with Pastel Logic */}
                      <span
                        className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${getMatchBadgeStyle(
                          featuredRecipe.matchPercentage
                        )}`}
                      >
                        {featuredRecipe.matchPercentage >= 100
                          ? '100% Ready'
                          : `${featuredRecipe.matchPercentage}% Match`}
                      </span>
                    </div>

                    <h3
                      onClick={() => handleOpenRecipeDetail(featuredRecipe.recipe)}
                      className="font-display text-lg sm:text-xl font-bold text-[#24352F] group-hover:text-[#557A62] transition-colors mt-2 cursor-pointer leading-snug"
                    >
                      {featuredRecipe.recipe.title}
                    </h3>
                    <p className="text-xs text-[#68736D] line-clamp-2 mt-1">
                      {featuredRecipe.recipe.description}
                    </p>

                    {/* Ingredients summary */}
                    <div className="mt-3 pt-3 border-t border-[#E5DED2] space-y-1">
                      <div className="flex flex-wrap gap-1">
                        {featuredRecipe.availableIngredients.slice(0, 4).map((ing, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-[#8BAE8B]/15 text-[#43634F] border border-[#8BAE8B]/30 font-medium"
                          >
                            ✓ {ing}
                          </span>
                        ))}
                        {featuredRecipe.missingIngredients.slice(0, 2).map((ing, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-[#F2B49F]/25 text-[#B8573E] border border-[#F2B49F]/35 font-medium"
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
                    className="w-full py-2.5 px-4 rounded-xl bg-[#557A62] hover:bg-[#43634F] text-white font-display font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:-translate-y-0.5"
                  >
                    <span>View Recipe & Steps</span>
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </div>

              {/* Secondary Grid */}
              {secondaryRecipes.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {secondaryRecipes.map(({ recipe, matchPercentage, availableIngredients, missingIngredients }) => (
                    <div
                      key={recipe.id}
                      className="group rounded-3xl bg-[#FFFFFF] border border-[#E5DED2] hover:border-[#8BAE8B]/60 transition-all duration-300 overflow-hidden flex flex-col justify-between shadow-[0_8px_30px_rgba(50,60,45,0.06)] hover:shadow-[0_12px_35px_rgba(50,60,45,0.1)] hover:-translate-y-1"
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
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/90 text-[#24352F] backdrop-blur-md">
                              {recipe.prepTime}
                            </span>
                          </div>
                          <div className="absolute top-2.5 right-2.5">
                            <span
                              className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${getMatchBadgeStyle(
                                matchPercentage
                              )}`}
                            >
                              {matchPercentage >= 100 ? '100% Ready' : `${matchPercentage}% Match`}
                            </span>
                          </div>
                        </div>

                        <div className="p-4 space-y-2">
                          <h4
                            onClick={() => handleOpenRecipeDetail(recipe)}
                            className="font-display text-sm font-bold text-[#24352F] group-hover:text-[#557A62] transition-colors cursor-pointer line-clamp-1"
                          >
                            {recipe.title}
                          </h4>
                          <p className="text-xs text-[#68736D] line-clamp-2">
                            {recipe.description}
                          </p>

                          <div className="flex flex-wrap gap-1 pt-1">
                            {availableIngredients.slice(0, 2).map((ing, i) => (
                              <span
                                key={i}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-[#8BAE8B]/15 text-[#43634F] font-medium"
                              >
                                ✓ {ing}
                              </span>
                            ))}
                            {missingIngredients.slice(0, 1).map((ing, i) => (
                              <span
                                key={i}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-[#F2B49F]/25 text-[#B8573E] font-medium"
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
                          className="w-full py-2 px-3 rounded-xl bg-[#F7F3EA] hover:bg-[#8BAE8B] hover:text-white text-[#24352F] border border-[#E5DED2] font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
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
            <div className="p-8 rounded-3xl bg-[#FFFFFF] border border-[#E5DED2] text-center space-y-3 shadow-sm">
              <UtensilsCrossed className="w-8 h-8 text-[#557A62] mx-auto opacity-70" />
              <h3 className="font-display text-base font-bold text-[#24352F]">No Matched Recipes Yet</h3>
              <p className="text-xs text-[#68736D] max-w-sm mx-auto">
                Add more items to your inventory to unlock instant matches!
              </p>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#557A62] text-white text-xs font-bold cursor-pointer"
              >
                + Add Food Items
              </button>
            </div>
          )}
        </div>

        {/* Right (1 Col): USE THESE SOON (Peach / Terracotta Theme) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5DED2] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#F2B49F]/25 flex items-center justify-center text-[#D9826B]">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-display text-base sm:text-lg font-black text-[#24352F] tracking-wide">
                  Use These Soon
                </h2>
                <p className="text-[11px] text-[#68736D]">Helpful freshness reminder</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveScreen('rescue')}
              className="text-xs text-[#D9826B] hover:underline font-bold flex items-center gap-1 cursor-pointer"
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
                  className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E5DED2] hover:border-[#D9826B]/50 transition-all flex items-center justify-between gap-3 shadow-[0_4px_16px_rgba(50,60,45,0.04)] group hover:-translate-y-0.5"
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
                      <h4 className="font-display text-xs sm:text-sm font-bold text-[#24352F] capitalize group-hover:text-[#D9826B] transition-colors">
                        {item.name}
                      </h4>
                    </div>
                    <p className="text-[11px] text-[#68736D]">
                      {item.quantity} {item.unit} • {item.location}
                    </p>
                    <span
                      className={`inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        item.daysLeft <= 1
                          ? 'bg-[#F2B49F]/30 text-[#D9826B] border-[#D9826B]/40'
                          : 'bg-[#F5D98B]/35 text-[#8C671C] border-[#D9AE58]/35'
                      }`}
                    >
                      {item.daysLeft <= 0 ? 'Expires today' : item.daysLeft === 1 ? 'Expires in 24h' : `${item.daysLeft} days left`}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleFindRecipesForItem(item.name)}
                    className="p-2.5 rounded-xl bg-[#F7F3EA] hover:bg-[#D9826B] text-[#D9826B] hover:text-white border border-[#E5DED2] transition-all cursor-pointer shrink-0 shadow-sm"
                    title={`Find recipes for ${item.name}`}
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#E5DED2] text-center space-y-2 shadow-sm">
                <CheckCircle2 className="w-8 h-8 text-[#557A62] mx-auto" />
                <h4 className="font-display text-sm font-bold text-[#24352F]">All Food Is Fresh!</h4>
                <p className="text-xs text-[#68736D]">
                  No items expiring in the next 3 days.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 6. SECOND ROW (Smart Waste Protection & Smart Shopping)   */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 6A. SMART WASTE PROTECTION (Eco-Themed Sage Card) */}
        <div className="rounded-3xl p-6 bg-gradient-to-br from-[#EDF5ED] via-[#F6FAF6] to-[#FFFFFF] border border-[#8BAE8B]/40 shadow-[0_8px_30px_rgba(50,60,45,0.06)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#8BAE8B]/25 border border-[#8BAE8B]/35 text-[#557A62] flex items-center justify-center shadow-sm">
                <Leaf className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-black text-[#24352F] tracking-wide">
                  🌱 Smart Waste Protection
                </h3>
                <p className="text-xs text-[#68736D]">
                  {expiringCount > 0 ? `${expiringCount} ingredients can be rescued today` : 'Optimal zero-waste score'}
                </p>
              </div>
            </div>

            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#8BAE8B]/20 text-[#43634F] font-bold border border-[#8BAE8B]/35">
              Eco Active
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E5DED2] text-center shadow-sm">
            <div>
              <p className="text-[10px] text-[#68736D] uppercase font-bold tracking-wider">Food at Risk</p>
              <p className="text-lg sm:text-xl font-display font-black text-[#D9826B] font-mono mt-0.5">
                {estimatedRescueGrams}g
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[#68736D] uppercase font-bold tracking-wider">Savings Potential</p>
              <p className="text-lg sm:text-xl font-display font-black text-[#557A62] font-mono mt-0.5">
                ₹{estimatedMoneySaved}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E5DED2] text-xs text-[#68736D] space-y-1 shadow-sm">
            <span className="text-[11px] font-bold text-[#557A62] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#557A62]" />
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
            className="w-full py-3 px-4 rounded-xl bg-[#557A62] hover:bg-[#43634F] text-white font-display font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer hover:-translate-y-0.5"
          >
            <CalendarCheck className="w-4 h-4 text-white" />
            <span>Launch Rescue Plan →</span>
          </button>
        </div>

        {/* 6B. SMART SHOPPING (Warm Yellow Theme) */}
        <div className="rounded-3xl p-6 bg-gradient-to-br from-[#FFFBF2] via-[#FFFDF8] to-[#FFFFFF] border border-[#F5D98B]/60 shadow-[0_8px_30px_rgba(50,60,45,0.06)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#F5D98B]/35 border border-[#D9AE58]/35 text-[#8C671C] flex items-center justify-center shadow-sm">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-black text-[#24352F] tracking-wide">
                  🛒 Smart Shopping
                </h3>
                <p className="text-xs text-[#68736D]">Low inventory restock recommendations</p>
              </div>
            </div>

            <span className="text-xs font-mono font-bold text-[#8C671C] bg-[#F5D98B]/35 px-2.5 py-0.5 rounded-full border border-[#D9AE58]/35">
              {restockCount} items
            </span>
          </div>

          <div className="space-y-2">
            {lowStockItems.length > 0 ? (
              lowStockItems.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-[#FFFFFF] border border-[#E5DED2] flex items-center justify-between gap-3 text-xs shadow-sm"
                >
                  <div>
                    <p className="font-bold text-[#24352F] capitalize">{item.name}</p>
                    <p className="text-[10px] text-[#8C671C] font-semibold">
                      Current: {item.quantity} {item.unit} • Min: {getItemMinimumStockThreshold(item)} {item.unit}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddLowStockToShopping(item.name)}
                    className="px-3 py-1.5 rounded-lg bg-[#F5D98B]/35 hover:bg-[#F5D98B] text-[#7A5A14] text-[11px] font-bold transition-all cursor-pointer shrink-0"
                  >
                    + Add to List
                  </button>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-2xl bg-[#FFFFFF] text-center text-xs text-[#68736D] border border-[#E5DED2]">
                All pantry and produce staples are well stocked!
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setActiveScreen('shopping-list')}
            className="w-full py-3 px-4 rounded-xl bg-[#FFFFFF] hover:bg-[#F7F3EA] border border-[#E5DED2] text-[#24352F] font-display font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer hover:-translate-y-0.5 shadow-sm"
          >
            <span>View Complete Shopping List</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 7. RECENT KITCHEN ACTIVITY (Clean Timeline)               */}
      {/* ========================================================= */}
      <div className="rounded-3xl p-6 bg-[#FFFFFF] border border-[#E5DED2] shadow-[0_8px_30px_rgba(50,60,45,0.06)] space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5DED2] pb-3">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-[#557A62]" />
            <h3 className="font-display text-sm font-bold text-[#24352F] uppercase tracking-wider">
              Recent Kitchen Activity
            </h3>
          </div>
          <span className="text-[10px] font-mono text-[#68736D]">Real-Time Sync</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {lastCompletedSession ? (
            <div className="p-3.5 rounded-2xl bg-[#F7F3EA] border border-[#8BAE8B]/30 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#557A62]">Recipe Prepared</span>
                <span className="text-[10px] font-mono text-[#68736D]">Today</span>
              </div>
              <p className="text-xs text-[#24352F] font-bold">{lastCompletedSession.title}</p>
              <p className="text-[11px] text-[#68736D]">{lastCompletedSession.rescuedItemsText}</p>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-[#F7F3EA] border border-[#E5DED2] space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#63538C]">Recipe Hub</span>
                <span className="text-[10px] font-mono text-[#68736D]">Active</span>
              </div>
              <p className="text-xs text-[#24352F] font-bold">Smart Shelf Initialized</p>
              <p className="text-[11px] text-[#68736D]">Ready for meal recommendations</p>
            </div>
          )}

          <div className="p-3.5 rounded-2xl bg-[#F7F3EA] border border-[#E5DED2] space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#557A62]">Inventory Sync</span>
              <span className="text-[10px] font-mono text-[#68736D]">Active</span>
            </div>
            <p className="text-xs text-[#24352F] font-bold">
              {activeItemsCount} items actively tracked
            </p>
            <p className="text-[11px] text-[#68736D]">
              {expiringCount > 0 ? `${expiringCount} items require cooking soon` : 'All items in optimal condition'}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F7F3EA] border border-[#E5DED2] space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#8C671C]">Shopping Queue</span>
              <span className="text-[10px] font-mono text-[#68736D]">Updated</span>
            </div>
            <p className="text-xs text-[#24352F] font-bold">
              {shoppingItems.filter((s) => !s.completed).length} items awaiting purchase
            </p>
            <p className="text-[11px] text-[#68736D]">Smart replenishment ready</p>
          </div>
        </div>
      </div>
    </div>
  );
};
