import React, { useState } from 'react';
import { Search, Sparkles, Clock, Users, ArrowRight, ChefHat, Flame, CheckCircle2 } from 'lucide-react';
import { useKitchen } from '../context/KitchenContext';
import { Recipe } from '../types';

export const RecipeHubView: React.FC = () => {
  const {
    recipes,
    setActiveRecipe,
    setActiveCookingRecipe,
    setActiveCookingStep,
    setActiveScreen,
    inventory,
    setToastMessage,
    setSelectedRecipeForDetail,
    setIsRecipeDetailOpen,
  } = useKitchen();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [onlyAvailableNow, setOnlyAvailableNow] = useState(false);

  const filterChips = ['All', 'South Indian', 'Quick (<20 min)', 'Highest Rescue'];

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch =
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.cuisine.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      activeFilter === 'All' ||
      (activeFilter === 'South Indian' && recipe.cuisine === 'South Indian') ||
      (activeFilter === 'Quick (<20 min)' && parseInt(recipe.prepTime) + parseInt(recipe.cookTime) <= 25) ||
      (activeFilter === 'Highest Rescue' && parseInt(recipe.rescueWeight) >= 500);

    const matchesAvailable = !onlyAvailableNow || recipe.missingIngredients?.length === 0;

    return matchesSearch && matchesFilter && matchesAvailable;
  });

  const handleStartCooking = (recipe: Recipe) => {
    setActiveRecipe(recipe);
    setActiveCookingRecipe(recipe);
    setActiveCookingStep(recipe.id === 'tangy-tomato-rasam' ? 4 : 1);
    setActiveScreen('live-cooking');
  };

  const handleWhatCanIMakeNow = () => {
    setOnlyAvailableNow(true);
    setActiveFilter('South Indian');
    setToastMessage('Matched 4 authentic zero-waste recipes using 100% of your current pantry stock!');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Top Search & "What can I make now?" Button (Image 13) */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[#8e989b] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search recipes, ingredients (e.g. Rasam, Paniyaram, Toor Dal)..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#151d20] border border-white/10 text-white text-xs placeholder-[#5a6568] focus:border-[#a1e3f9] outline-none"
          />
        </div>

        {/* Big Luminous "What can I make now?" Button (Image 13) */}
        <button
          onClick={handleWhatCanIMakeNow}
          className="w-full py-3.5 px-4 rounded-2xl bg-[#a1e3f9] hover:bg-[#c2effc] text-[#003642] font-display font-extrabold text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-[#a1e3f9]/20 transition-all transform active:scale-[0.99]"
        >
          <Sparkles className="w-5 h-5 text-[#003642]" />
          <span>What can I make now?</span>
        </button>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {filterChips.map((chip) => (
            <button
              key={chip}
              onClick={() => {
                setActiveFilter(chip);
                if (chip === 'All') setOnlyAvailableNow(false);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeFilter === chip
                  ? 'bg-[#1c2529] text-[#a1e3f9] border border-[#a1e3f9]/40 font-bold'
                  : 'bg-[#151d20] text-[#bfc8cc] hover:text-white border border-white/5'
              }`}
            >
              {chip}
            </button>
          ))}
          {onlyAvailableNow && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-semibold">
              ✓ Ready in Pantry
            </span>
          )}
        </div>
      </div>

      {/* 2. Recipe Cards Grid (Image 13) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredRecipes.map((recipe) => (
          <div
            key={recipe.id}
            className="rounded-2xl bg-[#1c2529] border border-white/10 hover:border-white/20 transition-all overflow-hidden flex flex-col justify-between group"
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

                <div className="absolute top-3 left-3 flex gap-1.5">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/60 text-white backdrop-blur-md">
                    {recipe.prepTime}
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#a1e3f9]/90 text-[#003642] backdrop-blur-md">
                    {recipe.cuisine}
                  </span>
                </div>

                <div className="absolute top-3 right-3">
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

                {/* At-Risk Ingredients Tags */}
                <div className="space-y-1.5 pt-1">
                  <p className="text-[10px] text-[#8e989b] uppercase font-bold tracking-wider">
                    Rescues From Your Shelf:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {recipe.atRiskIngredients.map((ing, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1 font-medium"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        {ing.name} ({ing.urgency})
                      </span>
                    ))}
                  </div>
                </div>

                {/* Pantry Staples Used */}
                <div className="flex flex-wrap gap-1 text-[11px] text-[#8e989b]">
                  <span>Pantry:</span>
                  <span className="text-[#bfc8cc]">{recipe.pantryItems.slice(0, 3).join(', ')}</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 pt-2 border-t border-white/5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setSelectedRecipeForDetail(recipe);
                  setIsRecipeDetailOpen(true);
                }}
                className="text-xs text-[#a1e3f9] hover:underline font-mono font-semibold"
              >
                View Details
              </button>
              <button
                onClick={() => handleStartCooking(recipe)}
                className="px-4 py-2 rounded-xl bg-[#232b2e] group-hover:bg-[#a1e3f9] group-hover:text-[#003642] text-white text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <ChefHat className="w-3.5 h-3.5" />
                <span>Start Cooking</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
