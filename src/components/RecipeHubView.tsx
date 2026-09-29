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

export const RecipeHubView: React.FC = () => {
  const {
    recipes,
    inventory,
    setToastMessage,
    setSelectedRecipeForDetail,
    setIsRecipeDetailOpen,
    addShoppingItem,
  } = useKitchen();

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
        setToastMessage(`Generated ${data.recipes.length} custom recipes for your ingredients!`);
      } else {
        setToastMessage('Could not generate custom recipes. Showing catalog matches.');
      }
    } catch (err: any) {
      console.warn('AI recipe generation error, showing catalog fallback:', err);
      setToastMessage('AI service busy. Displaying closest matching recipes.');
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
        className="rounded-2xl bg-[#1c2529] border border-white/10 hover:border-white/20 transition-all overflow-hidden flex flex-col justify-between group shadow-lg"
      >
        <div>
          {/* Recipe Cover Image with badges */}
          <div
            onClick={() => handleOpenRecipe(recipe)}
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
                onClick={() => handleOpenRecipe(recipe)}
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
            onClick={() => handleOpenRecipe(recipe)}
            className="px-4 py-2 rounded-xl bg-[#151d20] hover:bg-[#1c2529] border border-white/10 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#a1e3f9]" />
            <span>View Recipe & Steps</span>
          </button>

          {!isReady && missingIngredients.length > 0 && (
            <button
              onClick={() => handleAddMissingToShopping(recipe)}
              className="px-3 py-2 rounded-xl bg-[#ffb780] hover:bg-[#ffd7b2] text-[#4a2800] text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm"
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
    <div className="space-y-7 pb-20">
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
            <Search className="w-4 h-4 text-[#8e989b] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter ingredients (e.g. 'milk, mango, sugar and condensed milk' or 'tomato, onion')..."
              className="w-full pl-10 pr-10 py-3.5 rounded-2xl bg-[#151d20] border border-white/10 text-white text-xs sm:text-sm placeholder-[#5a6568] focus:border-[#a1e3f9] focus:ring-1 focus:ring-[#a1e3f9] outline-none transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setAiGeneratedRecipes([]);
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#8e989b] hover:text-white bg-white/5 hover:bg-white/10 w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isGenerating}
            className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-[#005a6b] to-[#a1e3f9] hover:from-[#007085] hover:to-[#bbf0ff] text-[#00222b] font-display font-black text-xs sm:text-sm tracking-wide flex items-center gap-2 shadow-lg shadow-[#a1e3f9]/20 transition-all shrink-0 cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#00222b]" />
            ) : (
              <Wand2 className="w-4 h-4 text-[#00222b]" />
            )}
            <span>Generate with AI</span>
          </button>
        </form>

        {/* Natural Language Ingredients Tag Extraction Pill */}
        {detectedIngredientsInQuery.length > 0 && (
          <div className="p-3 rounded-2xl bg-[#a1e3f9]/10 border border-[#a1e3f9]/30 space-y-1.5 shadow-sm">
            <div className="flex items-center justify-between text-xs text-[#a1e3f9] font-bold">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#a1e3f9]" />
                <span>RECOGNIZED INGREDIENTS ({detectedIngredientsInQuery.length}):</span>
              </div>
              <button
                type="button"
                onClick={() => handleGenerateWithAI()}
                className="text-[11px] underline text-[#a1e3f9] hover:text-white cursor-pointer"
              >
                Run AI Generation →
              </button>
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

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleGenerateFromMyFood}
            disabled={isGenerating}
            className="py-3 px-4 rounded-2xl bg-[#1c2529] hover:bg-[#252f33] border border-[#a1e3f9]/30 text-[#a1e3f9] font-display font-bold text-xs tracking-wide flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-[#a1e3f9]" />
            <span>Generate Recipes for Current My Food</span>
          </button>

          <button
            type="button"
            onClick={handleWhatCanIMakeNow}
            className="py-3 px-4 rounded-2xl bg-[#151d20] hover:bg-[#1c2529] border border-white/10 text-white font-display font-semibold text-xs tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer"
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
                  ? 'bg-[#1c2529] text-[#a1e3f9] border border-[#a1e3f9]/40 font-bold shadow-sm'
                  : 'bg-[#151d20] text-[#bfc8cc] hover:text-white border border-white/5'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* AI Generating Loader */}
      {isGenerating && (
        <div className="p-8 rounded-3xl bg-gradient-to-r from-[#151d20] via-[#1c2529] to-[#151d20] border border-[#a1e3f9]/30 text-center space-y-3 shadow-2xl animate-pulse">
          <Loader2 className="w-8 h-8 text-[#a1e3f9] animate-spin mx-auto" />
          <h3 className="font-display text-base font-bold text-white">
            Gemini AI is analyzing your ingredients...
          </h3>
          <p className="text-xs text-[#8e989b] max-w-md mx-auto">
            Crafting tailored recipes with exact quantities, step-by-step instructions, and flexible ingredient substitutions.
          </p>
        </div>
      )}

      {/* 2. DYNAMICALLY GENERATED AI RECIPES SECTION */}
      {aiGeneratedRecipes.length > 0 && !isGenerating && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#a1e3f9]/30 pb-2">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-[#a1e3f9]/20 text-[#a1e3f9]">
                <Wand2 className="w-4 h-4" />
              </span>
              <div>
                <h2 className="font-display text-lg font-black text-white tracking-wide flex items-center gap-2">
                  <span>AI DYNAMICALLY GENERATED RECIPES</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                    {generationSource || 'Gemini AI'}
                  </span>
                </h2>
                <p className="text-[11px] text-[#8e989b]">
                  Created dynamically based on what you currently have
                </p>
              </div>
            </div>
            <button
              onClick={() => handleGenerateWithAI()}
              className="text-xs text-[#a1e3f9] hover:underline font-mono flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Regenerate</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {aiGeneratedRecipes.map((recipe) => (
              <div
                key={recipe.id}
                className="rounded-3xl bg-[#1c2529] border border-[#a1e3f9]/40 hover:border-[#a1e3f9] transition-all overflow-hidden flex flex-col justify-between shadow-xl group"
              >
                <div>
                  <div
                    onClick={() => handleOpenRecipe(recipe)}
                    className="relative h-44 w-full overflow-hidden cursor-pointer"
                  >
                    <img
                      src={recipe.image}
                      alt={recipe.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1c2529] via-black/40 to-transparent" />

                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/60 text-white backdrop-blur-md">
                        {recipe.estimatedCookingTime || recipe.prepTime}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#a1e3f9] text-[#003642] backdrop-blur-md">
                        {recipe.cuisine}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/25 border border-emerald-400 text-emerald-300 backdrop-blur-md">
                        {recipe.matchPercentage || 100}% Match
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div>
                      <h3
                        onClick={() => handleOpenRecipe(recipe)}
                        className="font-display text-base font-bold text-white group-hover:text-[#a1e3f9] transition-colors cursor-pointer"
                      >
                        {recipe.title}
                      </h3>
                      <p className="text-xs text-[#bfc8cc] line-clamp-2 mt-1">{recipe.description}</p>
                    </div>

                    {/* Ingredients with Quantities & Separated Available vs Missing */}
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      {/* You Have / AVAILABLE */}
                      {recipe.ingredientsWithQuantities && recipe.ingredientsWithQuantities.some((i) => i.isAvailable !== false) ? (
                        <div className="space-y-1">
                          <p className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>You Have (Available):</span>
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {recipe.ingredientsWithQuantities
                              .filter((i) => i.isAvailable !== false)
                              .map((ing, i) => (
                                <span
                                  key={i}
                                  className="text-[11px] px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium"
                                >
                                  ✓ {ing.name} <span className="opacity-75">({ing.quantity})</span>
                                </span>
                              ))}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold">
                            You Have:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {recipe.pantryItems.map((item, i) => (
                              <span
                                key={i}
                                className="text-[11px] px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium"
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
                          <p className="text-[10px] font-mono text-[#ffb780] uppercase tracking-wider font-bold flex items-center gap-1">
                            <Plus className="w-3 h-3" />
                            <span>You'll Also Need (Missing):</span>
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {recipe.ingredientsWithQuantities
                              .filter((i) => i.isAvailable === false)
                              .map((ing, i) => (
                                <span
                                  key={i}
                                  className="text-[11px] px-2 py-0.5 rounded-lg bg-[#ffb780]/15 text-[#ffb780] border border-[#ffb780]/30 font-medium"
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
                      <div className="p-2.5 rounded-xl bg-[#151d20] border border-white/5 text-[11px] space-y-1">
                        <span className="text-[#a1e3f9] font-bold">Flexible Swap: </span>
                        <span className="text-[#8e989b] line-through">{recipe.substitutions[0].original}</span>
                        <span className="text-white"> → </span>
                        <span className="text-emerald-300 font-semibold">{recipe.substitutions[0].substitute}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenRecipe(recipe)}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#a1e3f9] hover:bg-[#c2effc] text-[#003642] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>View Recipe & Steps</span>
                  </button>

                  {recipe.missingIngredients && recipe.missingIngredients.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleAddMissingToShopping(recipe)}
                      className="p-2.5 rounded-xl bg-[#ffb780] hover:bg-[#ffd7b2] text-[#4a2800] text-xs font-bold transition-all cursor-pointer shrink-0"
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
          <div className="p-6 rounded-2xl bg-[#1c2529] border border-white/5 text-center text-[#8e989b] text-xs space-y-2">
            <p>No exact 100% recipes found in stored catalog for this selection.</p>
            <button
              onClick={() => handleGenerateWithAI()}
              className="px-4 py-2 rounded-xl bg-[#a1e3f9]/20 text-[#a1e3f9] hover:bg-[#a1e3f9]/30 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Generate Custom AI Recipes For These Ingredients</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. SECTION: 💡 ALMOST READY (Missing 1 or 2 ingredients) */}
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
    </div>
  );
};
