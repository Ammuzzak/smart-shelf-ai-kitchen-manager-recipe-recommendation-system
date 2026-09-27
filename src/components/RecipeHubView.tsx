import React, { useState, useMemo } from 'react';
import {
  Search,
  Sparkles,
  ChefHat,
  Check,
  Plus,
  AlertCircle,
  Clock,
  ShoppingCart,
  Wand2,
} from 'lucide-react';
import { useKitchen } from '../context/KitchenContext';
import { Recipe } from '../types';
import { matchRecipesWithInput, matchRecipesWithInventory, RecipeMatchResult } from '../data/recipeMatching';
import { extractIngredientsFromSentence, getIngredientDisplayName } from '../data/ingredientNormalization';

export const RecipeHubView: React.FC = () => {
  const {
    recipes,
    inventory,
    setActiveRecipe,
    setActiveCookingRecipe,
    setActiveCookingStep,
    setActiveScreen,
    setToastMessage,
    setSelectedRecipeForDetail,
    setIsRecipeDetailOpen,
    addShoppingItem,
  } = useKitchen();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const filterChips = ['All', 'South Indian', 'Breakfast', 'Snacks', 'Lunch / Dinner', 'Most Food Saved'];

  // Recognized ingredients detected in natural sentence query
  const detectedIngredientsInQuery = useMemo(() => {
    return extractIngredientsFromSentence(searchQuery);
  }, [searchQuery]);

  // Compute matched recipes split strictly into Can Make Now vs Almost Ready
  const splitResults = useMemo(() => {
    if (searchQuery.trim()) {
      return matchRecipesWithInput(searchQuery, recipes, inventory);
    }
    // Default mode: directly read from user's current My Food inventory
    return matchRecipesWithInventory(inventory, recipes);
  }, [searchQuery, recipes, inventory]);

  const filterList = (list: RecipeMatchResult[]) => {
    return list.filter(({ recipe }) => {
      if (activeFilter === 'All') return true;
      if (activeFilter === 'South Indian') return recipe.cuisine.toLowerCase().includes('south indian');
      if (activeFilter === 'Breakfast') return recipe.category === 'Breakfast';
      if (activeFilter === 'Snacks') return recipe.category === 'Snack' || recipe.category === 'Breakfast';
      if (activeFilter === 'Lunch / Dinner') return recipe.category === 'Lunch' || recipe.category === 'Dinner';
      if (activeFilter === 'Most Food Saved') return parseInt(recipe.rescueWeight) >= 300;
      return true;
    });
  };

  const canMakeNowList = useMemo(() => filterList(splitResults.canMakeNow), [splitResults.canMakeNow, activeFilter]);
  const almostReadyList = useMemo(() => filterList(splitResults.almostReady), [splitResults.almostReady, activeFilter]);
  const generatedRecipe = splitResults.generatedRecipe;

  const handleStartCooking = (recipe: Recipe) => {
    setActiveRecipe(recipe);
    setActiveCookingRecipe(recipe);
    setActiveCookingStep(1);
    setActiveScreen('live-cooking');
  };

  const handleAddMissingToShopping = (recipe: Recipe) => {
    const missing = recipe.missingIngredientsList || recipe.missingIngredients || [];
    if (missing.length === 0) {
      setToastMessage('All required ingredients are already in your kitchen!');
      return;
    }
    missing.forEach((item) => {
      addShoppingItem(item, `For ${recipe.title}`, '1 pack');
    });
    setToastMessage(`Added ${missing.length} missing ingredient(s) to your Smart Shopping list!`);
  };

  const handleWhatCanIMakeNow = () => {
    setSearchQuery('');
    setActiveFilter('All');
    setToastMessage('Showing recipes you can make right now with ingredients in My Food!');
  };

  const renderRecipeCard = (
    { recipe, matchPercentage, availableIngredients, missingIngredients, assumedBasicIngredients }: RecipeMatchResult,
    isReady: boolean
  ) => {
    return (
      <div
        key={recipe.id}
        className="rounded-2xl bg-[#1c2529] border border-white/10 hover:border-white/20 transition-all overflow-hidden flex flex-col justify-between group shadow-lg"
      >
        <div>
          {/* Recipe Cover Image with badges */}
          <div
            onClick={() => {
              setSelectedRecipeForDetail(recipe);
              setIsRecipeDetailOpen(true);
            }}
            className="relative h-48 w-full overflow-hidden cursor-pointer"
          >
            <img
              src={recipe.image}
              alt={recipe.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1c2529] via-transparent to-black/30" />

            {/* Top-left pills */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/60 text-white backdrop-blur-md">
                {recipe.prepTime}
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#a1e3f9]/90 text-[#003642] backdrop-blur-md">
                {recipe.cuisine}
              </span>
            </div>

            {/* Top-right Match Status Badge */}
            <div className="absolute top-3 right-3">
              {isReady ? (
                <div className="text-xs font-mono font-extrabold px-2.5 py-1 rounded-full border backdrop-blur-md flex items-center gap-1 shadow-md text-emerald-300 bg-emerald-500/25 border-emerald-400">
                  <Check className="w-3.5 h-3.5" />
                  <span>100% Ready</span>
                </div>
              ) : (
                <div className="text-xs font-mono font-extrabold px-2.5 py-1 rounded-full border backdrop-blur-md flex items-center gap-1 shadow-md text-[#ffb780] bg-[#ffb780]/20 border-[#ffb780]/40">
                  <Sparkles className="w-3 h-3" />
                  <span>{matchPercentage}% Match</span>
                </div>
              )}
            </div>

            {/* Food Saved Ribbon */}
            <div className="absolute bottom-2 right-3">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/90 text-[#002b1c] backdrop-blur-md">
                Saves {recipe.moneySaved}
              </span>
            </div>
          </div>

          {/* Card Content */}
          <div className="p-4 space-y-3">
            <div>
              <h3
                onClick={() => {
                  setSelectedRecipeForDetail(recipe);
                  setIsRecipeDetailOpen(true);
                }}
                className="font-display text-base font-bold text-white group-hover:text-[#a1e3f9] transition-colors cursor-pointer"
              >
                {recipe.title}
              </h3>
              <p className="text-xs text-[#8e989b] line-clamp-2 mt-1">{recipe.description}</p>
            </div>

            {/* Ingredients breakdown */}
            <div className="space-y-2 pt-1 border-t border-white/5">
              {/* You Have */}
              <div className="space-y-1">
                <p className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>You have ({availableIngredients.length}):</span>
                </p>
                <div className="flex flex-wrap gap-1">
                  {availableIngredients.map((ing, i) => (
                    <span
                      key={i}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium"
                    >
                      ✓ {ing}
                    </span>
                  ))}
                </div>
              </div>

              {/* Missing ingredients */}
              {missingIngredients.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] text-[#ffb780] uppercase font-bold tracking-wider flex items-center gap-1">
                    <Plus className="w-3 h-3" />
                    <span>Missing ({missingIngredients.length}):</span>
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {missingIngredients.map((item, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-[#ffb780]/15 text-[#ffb780] border border-[#ffb780]/30 font-medium"
                      >
                        ❌ {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Assumed basic pantry ingredient notice */}
              {assumedBasicIngredients && assumedBasicIngredients.length > 0 && (
                <p className="text-[10px] text-[#8e989b] italic">
                  Uses basic pantry: {assumedBasicIngredients.join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 pt-2 border-t border-white/5 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedRecipeForDetail(recipe);
              setIsRecipeDetailOpen(true);
            }}
            className="text-xs text-[#a1e3f9] hover:underline font-mono font-semibold cursor-pointer"
          >
            View Steps
          </button>

          {isReady ? (
            <button
              onClick={() => handleStartCooking(recipe)}
              className="px-4 py-2 rounded-xl bg-[#a1e3f9] hover:bg-[#c2effc] text-[#003642] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#a1e3f9]/20"
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>Start Cooking</span>
            </button>
          ) : (
            <button
              onClick={() => handleAddMissingToShopping(recipe)}
              className="px-3 py-1.5 rounded-xl bg-[#ffb780] hover:bg-[#ffd7b2] text-[#4a2800] text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Add to Shopping List</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-7 pb-20">
      {/* 1. Top Search & "What can I make now?" Button */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[#8e989b] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter ingredients (e.g. 'i have milk, mango, sugar and condensed milk' or 'egg tomato onion')..."
            className="w-full pl-10 pr-10 py-3.5 rounded-2xl bg-[#151d20] border border-white/10 text-white text-xs sm:text-sm placeholder-[#5a6568] focus:border-[#a1e3f9] focus:ring-1 focus:ring-[#a1e3f9] outline-none transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#8e989b] hover:text-white bg-white/5 hover:bg-white/10 w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Natural Language Ingredients Tag Extraction Pill */}
        {detectedIngredientsInQuery.length > 0 && (
          <div className="p-3 rounded-2xl bg-[#a1e3f9]/10 border border-[#a1e3f9]/30 space-y-1.5 shadow-sm">
            <div className="flex items-center gap-1.5 text-xs text-[#a1e3f9] font-bold">
              <Sparkles className="w-4 h-4 text-[#a1e3f9]" />
              <span>RECOGNIZED INGREDIENTS ({detectedIngredientsInQuery.length}):</span>
            </div>
            <div className="flex items-center flex-wrap gap-1.5">
              {detectedIngredientsInQuery.map((std) => (
                <span
                  key={std}
                  className="px-2.5 py-1 rounded-lg bg-[#a1e3f9]/25 text-[#a1e3f9] font-bold text-xs flex items-center gap-1 border border-[#a1e3f9]/40"
                >
                  ✓ {getIngredientDisplayName(std)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* "What can I make now?" Button */}
        <button
          onClick={handleWhatCanIMakeNow}
          className="w-full py-3.5 px-4 rounded-2xl bg-[#a1e3f9] hover:bg-[#c2effc] text-[#003642] font-display font-black text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-[#a1e3f9]/20 transition-all transform active:scale-[0.99] cursor-pointer"
        >
          <Sparkles className="w-5 h-5 text-[#003642]" />
          <span>What can I make now? (Uses My Food)</span>
        </button>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {filterChips.map((chip) => (
            <button
              key={chip}
              onClick={() => setActiveFilter(chip)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === chip
                  ? 'bg-[#1c2529] text-[#a1e3f9] border border-[#a1e3f9]/40 font-bold shadow-sm'
                  : 'bg-[#151d20] text-[#bfc8cc] hover:text-white border border-white/5'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Generated Recipe Banner if user provided ingredients with no direct 100% catalog match */}
      {generatedRecipe && (
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#1c2529] to-[#252f33] border border-[#a1e3f9]/40 space-y-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-[#a1e3f9]" />
              <span className="text-xs font-mono font-bold text-[#a1e3f9] uppercase tracking-wider">
                Dynamically Generated For Your Ingredients
              </span>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/25 border border-emerald-400 text-emerald-300 font-bold">
              100% Ready to Cook
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="md:col-span-2 space-y-2">
              <h3 className="font-display text-xl font-black text-white">{generatedRecipe.title}</h3>
              <p className="text-xs text-[#bfc8cc]">{generatedRecipe.description}</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {generatedRecipe.pantryItems.map((item, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold"
                  >
                    ✓ {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 justify-end">
              <button
                onClick={() => handleStartCooking(generatedRecipe)}
                className="w-full py-3 px-4 rounded-xl bg-[#a1e3f9] hover:bg-[#c2effc] text-[#003642] font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#a1e3f9]/20 transition-all cursor-pointer"
              >
                <ChefHat className="w-4 h-4" />
                <span>Start Cooking Now</span>
              </button>
              <button
                onClick={() => {
                  setSelectedRecipeForDetail(generatedRecipe);
                  setIsRecipeDetailOpen(true);
                }}
                className="w-full py-2 px-4 rounded-xl bg-[#1c2529] hover:bg-[#252f33] text-white text-xs font-semibold border border-white/10 transition-all cursor-pointer"
              >
                View Steps
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 1: 🍳 I CAN MAKE NOW (100% Ready) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">🍳</span>
            <h2 className="font-display text-lg font-black text-white tracking-wide">I CAN MAKE NOW</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
              {canMakeNowList.length} Ready
            </span>
          </div>
          <span className="text-xs text-[#8e989b] hidden sm:inline">
            You have all required ingredients in your kitchen
          </span>
        </div>

        {canMakeNowList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {canMakeNowList.map((res) => renderRecipeCard(res, true))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-[#1c2529] border border-white/5 text-center text-[#8e989b] text-xs">
            No exact 100% recipes found in catalog for this selection. Check the dynamic recipe suggestion above or the "Almost Ready" recipes below!
          </div>
        )}
      </div>

      {/* SECTION 2: 💡 ALMOST READY (Missing 1 or 2 ingredients) */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">💡</span>
            <h2 className="font-display text-lg font-black text-white tracking-wide">ALMOST READY</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#ffb780]/20 text-[#ffb780] font-mono font-bold">
              {almostReadyList.length} Recipes
            </span>
          </div>
          <span className="text-xs text-[#8e989b] hidden sm:inline">
            Missing only 1 or 2 ingredients
          </span>
        </div>

        {almostReadyList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {almostReadyList.map((res) => renderRecipeCard(res, false))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-[#1c2529] border border-white/5 text-center text-[#8e989b] text-xs">
            No almost-ready recipes found for your current ingredients.
          </div>
        )}
      </div>

      {/* Empty State when zero results in both */}
      {canMakeNowList.length === 0 && almostReadyList.length === 0 && !generatedRecipe && (
        <div className="p-8 text-center rounded-2xl bg-[#1c2529] border border-white/10 text-[#8e989b] space-y-3">
          <AlertCircle className="w-8 h-8 text-[#ffb780] mx-auto opacity-75" />
          <p className="text-sm text-white font-medium">No recipes found matching your search.</p>
          <p className="text-xs text-[#8e989b]">
            Try entering foods you have like "milk, mango", "egg, tomato", "bread, cheese", or click "What can I make now?".
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setActiveFilter('All');
            }}
            className="px-4 py-2 rounded-xl bg-[#a1e3f9] text-[#003642] text-xs font-bold cursor-pointer"
          >
            Show All Recipes
          </button>
        </div>
      )}
    </div>
  );
};
