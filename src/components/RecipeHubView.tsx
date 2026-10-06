import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Sparkles,
  Check,
  Plus,
  Clock,
  ShoppingCart,
  Wand2,
  RefreshCw,
  Loader2,
  BookOpen,
} from 'lucide-react';
import { useKitchen } from '../context/KitchenContext';
import { Recipe } from '../types';
import { matchRecipesWithInput, matchRecipesWithInventory, RecipeMatchResult } from '../data/recipeMatching';
import { extractIngredientsFromSentence, getIngredientDisplayName } from '../data/ingredientNormalization';
import { getCanonicalImageForRecipe } from '../data/canonicalRecipes';

export const RecipeHubView: React.FC = () => {
  const {
    recipes,
    inventory,
    setToastMessage,
    setSelectedRecipeForDetail,
    setIsRecipeDetailOpen,
    addShoppingItem,
    theme,
  } = useKitchen();
  const isDark = theme === 'dark';

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [aiGeneratedRecipes, setAiGeneratedRecipes] = useState<Recipe[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSource, setGenerationSource] = useState<string | null>(null);

  const filterChips = ['All', 'South Indian', 'Breakfast', 'Snacks', 'Lunch / Dinner', 'Most Food Saved'];

  // Recognized ingredients detected in natural sentence query
  const detectedIngredientsInQuery = useMemo(() => {
    return extractIngredientsFromSentence(searchQuery);
  }, [searchQuery]);

  // Compute matched recipes split strictly into Can Make Now vs Almost Ready from stored catalog
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

  // Trigger Dynamic AI Recipe Generation via Gemini
  const handleGenerateWithAI = async (customIngredients?: string[]) => {
    const rawInput = searchQuery.trim();
    const ingredientsToUse = customIngredients && customIngredients.length > 0
      ? customIngredients
      : detectedIngredientsInQuery.length > 0
      ? detectedIngredientsInQuery
      : rawInput
      ? [rawInput]
      : inventory.filter((i) => i.quantity > 0).map((i) => i.name);

    if (ingredientsToUse.length === 0) {
      setToastMessage('Please enter at least one ingredient to generate recipes.');
      return;
    }

    setIsGenerating(true);
    setToastMessage('Gemini AI is crafting recipes with your ingredients...');

    try {
      const response = await fetch('/api/recipes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: ingredientsToUse,
          userInventory: inventory.map((i) => i.name),
          cuisinePreference: activeFilter === 'All' ? 'Any' : activeFilter,
          dietaryPreference: 'Vegetarian / Flexible',
          searchQuery: rawInput,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      if (Array.isArray(data.recipes) && data.recipes.length > 0) {
        setAiGeneratedRecipes(data.recipes);
        setGenerationSource(data.source === 'gemini-ai' ? 'Gemini AI Model' : 'Smart Shelf Culinary Engine');
        setToastMessage(`Found ${data.recipes.length} verified canonical recipes!`);
      } else {
        setAiGeneratedRecipes([]);
        setToastMessage(data.message || "I couldn't find a verified recipe matching your ingredients.");
      }
    } catch (err: any) {
      console.warn('AI recipe generation error, showing catalog fallback:', err);
      setToastMessage("I couldn't find a verified recipe matching your ingredients.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Open recipe details in RecipeDetailModal
  const handleOpenRecipe = (recipe: Recipe) => {
    setSelectedRecipeForDetail(recipe);
    setIsRecipeDetailOpen(true);
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
    setAiGeneratedRecipes([]);
    setToastMessage('Showing recipes you can make right now with ingredients in My Food!');
  };

  const handleGenerateFromMyFood = () => {
    const currentFoodNames = inventory.filter((i) => i.quantity > 0).map((i) => i.name);
    if (currentFoodNames.length === 0) {
      setToastMessage('Your My Food inventory is empty. Add food items first!');
      return;
    }
    handleGenerateWithAI(currentFoodNames);
  };

  const renderRecipeCard = (
    { recipe, matchPercentage, availableIngredients, missingIngredients, assumedBasicIngredients }: RecipeMatchResult,
    isReady: boolean
  ) => {
    return (
      <div
        key={recipe.id}
        className={`rounded-2xl border transition-all overflow-hidden flex flex-col justify-between group shadow-sm ${
          isDark
            ? 'bg-[#1c2529] border-white/10 hover:border-white/20'
            : 'bg-[#FFFFFF] border-[#E4DED2] hover:border-[#6FAF8F]/40'
        }`}
      >
        <div>
          {/* Recipe Cover Image with badges */}
          <div
            onClick={() => handleOpenRecipe(recipe)}
            className="relative h-48 w-full overflow-hidden cursor-pointer"
          >
            <img
              src={recipe.image || getCanonicalImageForRecipe(recipe.title)}
              alt={recipe.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className={`absolute inset-0 ${
              isDark
                ? 'bg-gradient-to-t from-[#1c2529] via-transparent to-black/30'
                : 'bg-gradient-to-t from-black/60 via-transparent to-black/20'
            }`} />

            {/* Top-left pills */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/60 text-white backdrop-blur-md">
                {recipe.prepTime}
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded backdrop-blur-md ${
                isDark ? 'bg-[#a1e3f9]/90 text-[#003642]' : 'bg-[#FFFFFF]/90 text-[#24332D]'
              }`}>
                {recipe.cuisine}
              </span>
            </div>

            {/* Top-right Match Status Badge */}
            <div className="absolute top-3 right-3">
              {isReady ? (
                <div className={`text-xs font-mono font-extrabold px-2.5 py-1 rounded-full border backdrop-blur-md flex items-center gap-1 shadow-md ${
                  isDark
                    ? 'text-emerald-300 bg-emerald-500/25 border-emerald-400'
                    : 'text-white bg-[#557A62]/95 border-[#6FAF8F]'
                }`}>
                  <Check className="w-3.5 h-3.5" />
                  <span>100% Ready</span>
                </div>
              ) : (
                <div className={`text-xs font-mono font-extrabold px-2.5 py-1 rounded-full border backdrop-blur-md flex items-center gap-1 shadow-md ${
                  isDark
                    ? 'text-[#ffb780] bg-[#ffb780]/20 border-[#ffb780]/40'
                    : 'text-white bg-[#D9826B]/95 border-[#D9826B]'
                }`}>
                  <Sparkles className="w-3 h-3" />
                  <span>{matchPercentage}% Match</span>
                </div>
              )}
            </div>

            {/* Food Saved Ribbon */}
            <div className="absolute bottom-2 right-3">
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded backdrop-blur-md ${
                isDark
                  ? 'bg-emerald-500/90 text-[#002b1c]'
                  : 'bg-[#557A62] text-white shadow-sm'
              }`}>
                Saves {recipe.moneySaved}
              </span>
            </div>
          </div>

          {/* Card Content */}
          <div className="p-4 space-y-3">
            <div>
              <h3
                onClick={() => handleOpenRecipe(recipe)}
                className={`font-display text-base font-bold transition-colors cursor-pointer ${
                  isDark
                    ? 'text-white group-hover:text-[#a1e3f9]'
                    : 'text-[#24332D] group-hover:text-[#557A62]'
                }`}
              >
                {recipe.title}
              </h3>
              <p className={`text-xs line-clamp-2 mt-1 ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
                {recipe.description}
              </p>
            </div>

            {/* Ingredients breakdown */}
            <div className={`space-y-2 pt-1 border-t ${isDark ? 'border-white/5' : 'border-[#E4DED2]'}`}>
              {/* You Have */}
              <div className="space-y-1">
                <p className={`text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 ${
                  isDark ? 'text-emerald-400' : 'text-[#557A62]'
                }`}>
                  <Check className="w-3 h-3" />
                  <span>You have ({availableIngredients.length}):</span>
                </p>
                <div className="flex flex-wrap gap-1">
                  {availableIngredients.map((ing, i) => (
                    <span
                      key={i}
                      className={`text-[11px] px-2 py-0.5 rounded-md font-medium border ${
                        isDark
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-[#6FAF8F]/15 text-[#43634F] border-[#6FAF8F]/30'
                      }`}
                    >
                      ✓ {ing}
                    </span>
                  ))}
                </div>
              </div>

              {/* Missing ingredients */}
              {missingIngredients.length > 0 && (
                <div className="space-y-1">
                  <p className={`text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 ${
                    isDark ? 'text-[#ffb780]' : 'text-[#D9826B]'
                  }`}>
                    <Plus className="w-3 h-3" />
                    <span>Missing ({missingIngredients.length}):</span>
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {missingIngredients.map((item, i) => (
                      <span
                        key={i}
                        className={`text-[11px] px-2 py-0.5 rounded-md font-medium border ${
                          isDark
                            ? 'bg-[#ffb780]/15 text-[#ffb780] border-[#ffb780]/30'
                            : 'bg-[#F2B49F]/25 text-[#B8573E] border-[#F2B49F]/40'
                        }`}
                      >
                        ❌ {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Assumed basic pantry ingredient notice */}
              {assumedBasicIngredients && assumedBasicIngredients.length > 0 && (
                <p className={`text-[10px] italic ${isDark ? 'text-[#8e989b]' : 'text-[#8A9590]'}`}>
                  Uses basic pantry: {assumedBasicIngredients.join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className={`p-4 pt-2 border-t flex items-center justify-between gap-2 ${
          isDark ? 'border-white/5' : 'border-[#E4DED2]'
        }`}>
          <button
            type="button"
            onClick={() => handleOpenRecipe(recipe)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              isDark
                ? 'bg-[#151d20] hover:bg-[#1c2529] border-white/10 text-white'
                : 'bg-[#F7F5EF] hover:bg-[#EFE9DE] border-[#E4DED2] text-[#24332D]'
            }`}
          >
            <BookOpen className={`w-3.5 h-3.5 ${isDark ? 'text-[#a1e3f9]' : 'text-[#557A62]'}`} />
            <span>View Recipe & Steps</span>
          </button>

          {!isReady && missingIngredients.length > 0 && (
            <button
              onClick={() => handleAddMissingToShopping(recipe)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm ${
                isDark
                  ? 'bg-[#ffb780] hover:bg-[#ffd7b2] text-[#4a2800]'
                  : 'bg-[#D5A84C] hover:bg-[#C2963A] text-white'
              }`}
              title="Add missing items to Smart Shopping list"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Add to Shopping</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-7 pb-20 theme-transition ${isDark ? 'text-[#dbe4e8]' : 'text-[#24332D]'}`}>
      {/* 1. Top Search & AI Recipe Generator Actions */}
      <div className="space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleGenerateWithAI();
          }}
          className="relative flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
              isDark ? 'text-[#8e989b]' : 'text-[#68736D]'
            }`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter ingredients (e.g. 'milk, mango, sugar and condensed milk' or 'tomato, onion')..."
              className={`w-full pl-10 pr-10 py-3.5 rounded-2xl border text-xs sm:text-sm outline-none transition-all shadow-inner ${
                isDark
                  ? 'bg-[#151d20] border-white/10 text-white placeholder-[#5a6568] focus:border-[#a1e3f9] focus:ring-1 focus:ring-[#a1e3f9]'
                  : 'bg-[#FFFFFF] border-[#E4DED2] text-[#24332D] placeholder-[#8A9590] focus:border-[#6FAF8F] focus:ring-1 focus:ring-[#6FAF8F]'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setAiGeneratedRecipes([]);
                }}
                className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-xs w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isDark
                    ? 'text-[#8e989b] hover:text-white bg-white/5 hover:bg-white/10'
                    : 'text-[#68736D] hover:text-[#24332D] bg-[#F7F5EF] hover:bg-[#EFE9DE]'
                }`}
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isGenerating}
            className={`px-5 py-3.5 rounded-2xl font-display font-black text-xs sm:text-sm tracking-wide flex items-center gap-2 transition-all shrink-0 cursor-pointer disabled:opacity-50 shadow-md hover:-translate-y-0.5 ${
              isDark
                ? 'bg-gradient-to-r from-[#005a6b] to-[#a1e3f9] hover:from-[#007085] hover:to-[#bbf0ff] text-[#00222b] shadow-[#a1e3f9]/20'
                : 'bg-[#557A62] hover:bg-[#43634F] text-white shadow-[#557A62]/20'
            }`}
          >
            {isGenerating ? (
              <Loader2 className={`w-4 h-4 animate-spin ${isDark ? 'text-[#00222b]' : 'text-white'}`} />
            ) : (
              <Wand2 className={`w-4 h-4 ${isDark ? 'text-[#00222b]' : 'text-white'}`} />
            )}
            <span>Generate with AI</span>
          </button>
        </form>

        {/* Natural Language Ingredients Tag Extraction Pill */}
        {detectedIngredientsInQuery.length > 0 && (
          <div className={`p-3 rounded-2xl border space-y-1.5 shadow-sm ${
            isDark
              ? 'bg-[#a1e3f9]/10 border-[#a1e3f9]/30'
              : 'bg-[#6FAF8F]/10 border-[#6FAF8F]/30'
          }`}>
            <div className={`flex items-center justify-between text-xs font-bold ${
              isDark ? 'text-[#a1e3f9]' : 'text-[#43634F]'
            }`}>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>RECOGNIZED INGREDIENTS ({detectedIngredientsInQuery.length}):</span>
              </div>
              <button
                type="button"
                onClick={() => handleGenerateWithAI()}
                className={`text-[11px] underline cursor-pointer ${
                  isDark ? 'text-[#a1e3f9] hover:text-white' : 'text-[#557A62] hover:text-[#24332D]'
                }`}
              >
                Run AI Generation →
              </button>
            </div>
            <div className="flex items-center flex-wrap gap-1.5">
              {detectedIngredientsInQuery.map((std) => (
                <span
                  key={std}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-1 border ${
                    isDark
                      ? 'bg-[#a1e3f9]/25 text-[#a1e3f9] border-[#a1e3f9]/40'
                      : 'bg-[#6FAF8F]/20 text-[#43634F] border-[#6FAF8F]/35'
                  }`}
                >
                  ✓ {getIngredientDisplayName(std)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleGenerateFromMyFood}
            disabled={isGenerating}
            className={`py-3 px-4 rounded-2xl font-display font-bold text-xs tracking-wide flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50 border ${
              isDark
                ? 'bg-[#1c2529] hover:bg-[#252f33] border-[#a1e3f9]/30 text-[#a1e3f9]'
                : 'bg-[#FFFFFF] hover:bg-[#F7F5EF] border-[#6FAF8F]/40 text-[#557A62]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Recipes for Current My Food</span>
          </button>

          <button
            type="button"
            onClick={handleWhatCanIMakeNow}
            className={`py-3 px-4 rounded-2xl font-display font-semibold text-xs tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer border ${
              isDark
                ? 'bg-[#151d20] hover:bg-[#1c2529] border-white/10 text-white'
                : 'bg-[#FFFFFF] hover:bg-[#F7F5EF] border-[#E4DED2] text-[#24332D]'
            }`}
          >
            <span>What can I make now? (Catalog View)</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {filterChips.map((chip) => (
            <button
              key={chip}
              onClick={() => setActiveFilter(chip)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === chip
                  ? isDark
                    ? 'bg-[#1c2529] text-[#a1e3f9] border border-[#a1e3f9]/40 font-bold shadow-sm'
                    : 'bg-[#557A62] text-white font-bold shadow-sm'
                  : isDark
                  ? 'bg-[#151d20] text-[#bfc8cc] hover:text-white border border-white/5'
                  : 'bg-[#FFFFFF] text-[#68736D] hover:text-[#24332D] border border-[#E4DED2]'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* AI Generating Loader */}
      {isGenerating && (
        <div className={`p-8 rounded-3xl border text-center space-y-3 shadow-2xl animate-pulse ${
          isDark
            ? 'bg-gradient-to-r from-[#151d20] via-[#1c2529] to-[#151d20] border-[#a1e3f9]/30'
            : 'bg-gradient-to-r from-[#EBF3EB] via-[#FFFFFF] to-[#EBF3EB] border-[#6FAF8F]/40'
        }`}>
          <Loader2 className={`w-8 h-8 animate-spin mx-auto ${isDark ? 'text-[#a1e3f9]' : 'text-[#557A62]'}`} />
          <h3 className={`font-display text-base font-bold ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
            Gemini AI is analyzing your ingredients...
          </h3>
          <p className={`text-xs max-w-md mx-auto ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
            Crafting tailored recipes with exact quantities, step-by-step instructions, and flexible ingredient substitutions.
          </p>
        </div>
      )}

      {/* ZERO RESULTS VERIFIED BANNER (Rule 12) */}
      {searchQuery.trim() && canMakeNowList.length === 0 && almostReadyList.length === 0 && aiGeneratedRecipes.length === 0 && !isGenerating && (
        <div className={`p-8 rounded-3xl border text-center space-y-3 shadow-sm ${
          isDark ? 'bg-[#1c2529] border-white/10' : 'bg-[#FFFFFF] border-[#E4DED2]'
        }`}>
          <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center bg-amber-500/10 text-amber-500">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className={`font-display text-base font-bold ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
            I couldn't find a verified recipe matching your ingredients.
          </h3>
          <p className={`text-xs max-w-md mx-auto ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
            We strictly enforce a canonical verified recipe database and do not invent fake recipes. Try searching for recognized ingredients like Maggi, chicken, egg, tomato, or rice.
          </p>
        </div>
      )}

      {/* 2. DYNAMICALLY GENERATED AI RECIPES SECTION */}
      {aiGeneratedRecipes.length > 0 && !isGenerating && (
        <div className="space-y-4">
          <div className={`flex items-center justify-between border-b pb-2 ${
            isDark ? 'border-[#a1e3f9]/30' : 'border-[#6FAF8F]/30'
          }`}>
            <div className="flex items-center gap-2.5">
              <span className={`p-1.5 rounded-lg ${
                isDark ? 'bg-[#a1e3f9]/20 text-[#a1e3f9]' : 'bg-[#6FAF8F]/20 text-[#557A62]'
              }`}>
                <Wand2 className="w-4 h-4" />
              </span>
              <div>
                <h2 className={`font-display text-lg font-black tracking-wide flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-[#24332D]'
                }`}>
                  <span>AI DYNAMICALLY GENERATED RECIPES</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    isDark
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30'
                      : 'bg-[#6FAF8F]/15 text-[#557A62] border-[#6FAF8F]/30'
                  }`}>
                    {generationSource || 'Gemini AI'}
                  </span>
                </h2>
                <p className={`text-[11px] ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
                  Created dynamically based on what you currently have
                </p>
              </div>
            </div>
            <button
              onClick={() => handleGenerateWithAI()}
              className={`text-xs hover:underline font-mono flex items-center gap-1 cursor-pointer ${
                isDark ? 'text-[#a1e3f9]' : 'text-[#557A62]'
              }`}
            >
              <RefreshCw className="w-3 h-3" />
              <span>Regenerate</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {aiGeneratedRecipes.map((recipe) => (
              <div
                key={recipe.id}
                className={`rounded-3xl border transition-all overflow-hidden flex flex-col justify-between shadow-xl group ${
                  isDark
                    ? 'bg-[#1c2529] border-[#a1e3f9]/40 hover:border-[#a1e3f9]'
                    : 'bg-[#FFFFFF] border-[#6FAF8F]/40 hover:border-[#6FAF8F]'
                }`}
              >
                <div>
                  <div
                    onClick={() => handleOpenRecipe(recipe)}
                    className="relative h-44 w-full overflow-hidden cursor-pointer"
                  >
                    <img
                      src={recipe.image || getCanonicalImageForRecipe(recipe.title)}
                      alt={recipe.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/60 text-white backdrop-blur-md">
                        {recipe.estimatedCookingTime || recipe.prepTime}
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded backdrop-blur-md ${
                        isDark ? 'bg-[#a1e3f9] text-[#003642]' : 'bg-[#557A62] text-white'
                      }`}>
                        {recipe.cuisine}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border backdrop-blur-md ${
                        isDark
                          ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300'
                          : 'bg-[#557A62]/90 border-[#6FAF8F] text-white'
                      }`}>
                        {recipe.matchPercentage || 100}% Match
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div>
                      <h3
                        onClick={() => handleOpenRecipe(recipe)}
                        className={`font-display text-base font-bold transition-colors cursor-pointer ${
                          isDark
                            ? 'text-white group-hover:text-[#a1e3f9]'
                            : 'text-[#24332D] group-hover:text-[#557A62]'
                        }`}
                      >
                        {recipe.title}
                      </h3>
                      <p className={`text-xs line-clamp-2 mt-1 ${isDark ? 'text-[#bfc8cc]' : 'text-[#68736D]'}`}>
                        {recipe.description}
                      </p>
                    </div>

                    {/* Ingredients with Quantities & Separated Available vs Missing */}
                    <div className={`space-y-2 pt-2 border-t ${isDark ? 'border-white/5' : 'border-[#E4DED2]'}`}>
                      {/* You Have / AVAILABLE */}
                      {recipe.ingredientsWithQuantities && recipe.ingredientsWithQuantities.some((i) => i.isAvailable !== false) ? (
                        <div className="space-y-1">
                          <p className={`text-[10px] font-mono uppercase tracking-wider font-bold flex items-center gap-1 ${
                            isDark ? 'text-emerald-400' : 'text-[#557A62]'
                          }`}>
                            <Check className="w-3 h-3" />
                            <span>You Have (Available):</span>
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {recipe.ingredientsWithQuantities
                              .filter((i) => i.isAvailable !== false)
                              .map((ing, i) => (
                                <span
                                  key={i}
                                  className={`text-[11px] px-2 py-0.5 rounded-lg border font-medium ${
                                    isDark
                                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                      : 'bg-[#6FAF8F]/15 text-[#43634F] border-[#6FAF8F]/30'
                                  }`}
                                >
                                  ✓ {ing.name} <span className="opacity-75">({ing.quantity})</span>
                                </span>
                              ))}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className={`text-[10px] font-mono uppercase tracking-wider font-bold ${
                            isDark ? 'text-emerald-400' : 'text-[#557A62]'
                          }`}>
                            You Have:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {recipe.pantryItems.map((item, i) => (
                              <span
                                key={i}
                                className={`text-[11px] px-2 py-0.5 rounded-lg border font-medium ${
                                  isDark
                                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                    : 'bg-[#6FAF8F]/15 text-[#43634F] border-[#6FAF8F]/30'
                                }`}
                              >
                                ✓ {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* You'll Also Need / MISSING */}
                      {recipe.ingredientsWithQuantities && recipe.ingredientsWithQuantities.some((i) => i.isAvailable === false) && (
                        <div className="space-y-1">
                          <p className={`text-[10px] font-mono uppercase tracking-wider font-bold flex items-center gap-1 ${
                            isDark ? 'text-[#ffb780]' : 'text-[#D9826B]'
                          }`}>
                            <Plus className="w-3 h-3" />
                            <span>You'll Also Need (Missing):</span>
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {recipe.ingredientsWithQuantities
                              .filter((i) => i.isAvailable === false)
                              .map((ing, i) => (
                                <span
                                  key={i}
                                  className={`text-[11px] px-2 py-0.5 rounded-lg border font-medium ${
                                    isDark
                                      ? 'bg-[#ffb780]/15 text-[#ffb780] border-[#ffb780]/30'
                                      : 'bg-[#F2B49F]/25 text-[#B8573E] border-[#F2B49F]/40'
                                  }`}
                                >
                                  + {ing.name} <span className="opacity-75">({ing.quantity})</span>
                                </span>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Substitutions preview */}
                    {recipe.substitutions && recipe.substitutions.length > 0 && (
                      <div className={`p-2.5 rounded-xl border text-[11px] space-y-1 ${
                        isDark ? 'bg-[#151d20] border-white/5' : 'bg-[#F7F5EF] border-[#E4DED2]'
                      }`}>
                        <span className={`font-bold ${isDark ? 'text-[#a1e3f9]' : 'text-[#557A62]'}`}>Flexible Swap: </span>
                        <span className={`line-through ${isDark ? 'text-[#8e989b]' : 'text-[#8A9590]'}`}>{recipe.substitutions[0].original}</span>
                        <span> → </span>
                        <span className={`font-semibold ${isDark ? 'text-emerald-300' : 'text-[#43634F]'}`}>{recipe.substitutions[0].substitute}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className={`p-4 pt-2 border-t flex items-center justify-between gap-2 ${
                  isDark ? 'border-white/5' : 'border-[#E4DED2]'
                }`}>
                  <button
                    type="button"
                    onClick={() => handleOpenRecipe(recipe)}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md ${
                      isDark
                        ? 'bg-[#a1e3f9] hover:bg-[#c2effc] text-[#003642]'
                        : 'bg-[#557A62] hover:bg-[#43634F] text-white'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>View Recipe & Steps</span>
                  </button>

                  {recipe.missingIngredients && recipe.missingIngredients.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleAddMissingToShopping(recipe)}
                      className={`p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                        isDark
                          ? 'bg-[#ffb780] hover:bg-[#ffd7b2] text-[#4a2800]'
                          : 'bg-[#D5A84C] hover:bg-[#C2963A] text-white'
                      }`}
                      title="Add missing ingredients to shopping list"
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. SECTION: 🍳 I CAN MAKE NOW (100% Ready From Catalog) */}
      <div className="space-y-4">
        <div className={`flex items-center justify-between border-b pb-2 ${
          isDark ? 'border-white/10' : 'border-[#E4DED2]'
        }`}>
          <div className="flex items-center gap-2.5">
            <span className="text-lg">🍳</span>
            <h2 className={`font-display text-lg font-black tracking-wide ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
              I CAN MAKE NOW
            </h2>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold ${
              isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-[#6FAF8F]/20 text-[#43634F]'
            }`}>
              {canMakeNowList.length} Ready
            </span>
          </div>
          <span className={`text-xs hidden sm:inline ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
            You have all required ingredients in your kitchen
          </span>
        </div>

        {canMakeNowList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {canMakeNowList.map((res) => renderRecipeCard(res, true))}
          </div>
        ) : (
          <div className={`p-6 rounded-2xl border text-center text-xs space-y-2 ${
            isDark ? 'bg-[#1c2529] border-white/5 text-[#8e989b]' : 'bg-[#FFFFFF] border-[#E4DED2] text-[#68736D]'
          }`}>
            <p>No exact 100% recipes found in stored catalog for this selection.</p>
            <button
              onClick={() => handleGenerateWithAI()}
              className={`px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
                isDark
                  ? 'bg-[#a1e3f9]/20 text-[#a1e3f9] hover:bg-[#a1e3f9]/30'
                  : 'bg-[#557A62]/15 text-[#557A62] hover:bg-[#557A62]/25'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Generate Custom AI Recipes For These Ingredients</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. SECTION: 💡 ALMOST READY (Missing 1 or 2 ingredients) */}
      <div className="space-y-4 pt-4">
        <div className={`flex items-center justify-between border-b pb-2 ${
          isDark ? 'border-white/10' : 'border-[#E4DED2]'
        }`}>
          <div className="flex items-center gap-2.5">
            <span className="text-lg">💡</span>
            <h2 className={`font-display text-lg font-black tracking-wide ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
              ALMOST READY
            </h2>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold ${
              isDark ? 'bg-[#ffb780]/20 text-[#ffb780]' : 'bg-[#F2B49F]/30 text-[#B8573E]'
            }`}>
              {almostReadyList.length} Recipes
            </span>
          </div>
          <span className={`text-xs hidden sm:inline ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
            Missing only 1 or 2 ingredients
          </span>
        </div>

        {almostReadyList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {almostReadyList.map((res) => renderRecipeCard(res, false))}
          </div>
        ) : (
          <div className={`p-6 rounded-2xl border text-center text-xs ${
            isDark ? 'bg-[#1c2529] border-white/5 text-[#8e989b]' : 'bg-[#FFFFFF] border-[#E4DED2] text-[#68736D]'
          }`}>
            No almost-ready recipes found for your current ingredients.
          </div>
        )}
      </div>
    </div>
  );
};
