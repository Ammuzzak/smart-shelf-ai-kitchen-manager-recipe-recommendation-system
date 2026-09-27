import React from 'react';
import {
  X,
  ChefHat,
  Clock,
  Users,
  ShieldAlert,
  CheckCircle2,
  DollarSign,
  ShoppingCart,
  ArrowRight,
} from 'lucide-react';
import { useKitchen } from '../context/KitchenContext';
import { Recipe } from '../types';

export const RecipeDetailModal: React.FC = () => {
  const {
    selectedRecipeForDetail,
    setIsRecipeDetailOpen,
    isRecipeDetailOpen,
    setActiveCookingRecipe,
    setActiveCookingStep,
    setActiveScreen,
    addShoppingItem,
    setToastMessage,
  } = useKitchen();

  if (!isRecipeDetailOpen || !selectedRecipeForDetail) return null;

  const recipe: Recipe = selectedRecipeForDetail;

  const handleStartLiveCooking = () => {
    setActiveCookingRecipe(recipe);
    setActiveCookingStep(1);
    setIsRecipeDetailOpen(false);
    setActiveScreen('live-cooking');
    setToastMessage(`Started Live Cooking for ${recipe.title}`);
  };

  const handleAddMissingToShopping = () => {
    if (!recipe.missingIngredients || recipe.missingIngredients.length === 0) {
      setToastMessage('All required ingredients are already in your kitchen!');
      return;
    }
    recipe.missingIngredients.forEach((item) => {
      addShoppingItem(item, `For ${recipe.title}`, '1 pack');
    });
    setToastMessage(`Added ${recipe.missingIngredients.length} item(s) to your Smart Shopping list!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-[#1c2529] border border-white/10 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col relative">
        {/* Hero Header with Media */}
        <div className="relative h-56 w-full shrink-0">
          <img
            src={recipe.image}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1c2529] via-[#1c2529]/60 to-transparent" />

          {/* Close button */}
          <button
            onClick={() => setIsRecipeDetailOpen(false)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm border border-white/10 transition-all z-10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Floating badges */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full bg-[#a1e3f9] text-[#003642] font-mono font-bold text-xs uppercase tracking-wide">
              {recipe.cuisine}
            </span>
            {recipe.matchPercentage !== undefined && (
              <span className="px-3 py-1 rounded-full bg-emerald-500/25 border border-emerald-400 text-emerald-300 font-mono font-bold text-xs">
                {recipe.matchPercentage}% Match
              </span>
            )}
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono font-bold text-xs">
              Saves {recipe.rescueWeight}
            </span>
            <span className="px-3 py-1 rounded-full bg-[#ffb780]/20 border border-[#ffb780]/40 text-[#ffb780] font-mono font-bold text-xs">
              Saves {recipe.moneySaved}
            </span>
          </div>

          {/* Title overlay */}
          <div className="absolute bottom-4 left-6 right-6">
            <h2 className="font-display text-2xl font-black text-white">{recipe.title}</h2>
            <p className="text-xs text-[#a1e3f9] font-medium mt-0.5">{recipe.subtitle || recipe.description}</p>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 pr-4">
          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-[#151d20] border border-white/5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[#a1e3f9]">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-[#8e989b] uppercase font-bold">Prep & Cook</p>
                <p className="text-xs font-bold text-white">{recipe.prepTime} / {recipe.cookTime}</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#151d20] border border-white/5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-emerald-400">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-[#8e989b] uppercase font-bold">Servings</p>
                <p className="text-xs font-bold text-white">{recipe.servings} People</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#151d20] border border-white/5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[#ffb780]">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-[#8e989b] uppercase font-bold">Money Saved</p>
                <p className="text-xs font-bold text-[#ffb780]">{recipe.moneySaved}</p>
              </div>
            </div>
          </div>

          {/* Expiring Ingredients Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider">
                Uses From Your Food (Expiring Soon)
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {recipe.atRiskIngredients.map((item, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-[#151d20] border border-rose-500/20 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span className="text-xs font-semibold text-white">{item.name}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold">
                    {item.urgency} left
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Ingredients You Have & You Need */}
          <div className="space-y-4">
            {/* You Have */}
            <div className="space-y-2">
              <h3 className="font-display text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>You Have:</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {(recipe.availableIngredientsList && recipe.availableIngredientsList.length > 0
                  ? recipe.availableIngredientsList
                  : recipe.pantryItems
                ).map((item, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-1.5 font-medium"
                  >
                    <span>✓</span>
                    <span>{item}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* You Need */}
            {recipe.missingIngredients && recipe.missingIngredients.length > 0 ? (
              <div className="space-y-2">
                <h3 className="font-display text-xs font-bold text-[#ffb780] uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-[#ffb780]" />
                  <span>You Need:</span>
                </h3>
                <div className="p-3.5 rounded-2xl bg-[#ffb780]/10 border border-[#ffb780]/20 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    {recipe.missingIngredients.map((item, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-lg bg-[#ffb780]/20 text-[#ffb780] text-xs font-bold"
                      >
                        + {item}
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddMissingToShopping}
                    className="px-3 py-1.5 rounded-xl bg-[#ffb780] hover:bg-[#ffd7b2] text-[#4a2800] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Add to Shopping List</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>You have all necessary ingredients to prepare this recipe right now!</span>
              </div>
            )}
          </div>

          {/* Cooking Steps Preview */}
          <div className="space-y-3">
            <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider">
              Step-by-Step Cooking Guide ({recipe.steps.length} Steps)
            </h3>
            <div className="space-y-2">
              {recipe.steps.map((step) => (
                <div
                  key={step.stepNumber}
                  className="p-3.5 rounded-2xl bg-[#151d20] border border-white/5 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#a1e3f9]/20 text-[#a1e3f9] font-mono text-[11px] font-bold flex items-center justify-center">
                        {step.stepNumber}
                      </span>
                      <h4 className="text-xs font-bold text-white">{step.title}</h4>
                    </div>
                    <span className="text-[10px] font-mono text-[#8e989b]">{step.duration}</span>
                  </div>
                  <p className="text-xs text-[#8e989b] line-clamp-2 leading-relaxed pl-7">
                    {step.instructions.join(' ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom CTA Footer */}
        <div className="p-4 bg-[#151d20] border-t border-white/10 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsRecipeDetailOpen(false)}
            className="px-4 py-2.5 rounded-xl bg-[#1c2529] hover:bg-[#252f33] text-[#bfc8cc] text-xs font-semibold transition-all cursor-pointer"
          >
            Back to Catalog
          </button>

          <button
            type="button"
            onClick={handleStartLiveCooking}
            className="px-6 py-2.5 rounded-xl bg-[#a1e3f9] hover:bg-[#c2effc] text-[#003642] text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-[#a1e3f9]/20 cursor-pointer"
          >
            <ChefHat className="w-4 h-4" />
            <span>Start Live Cooking</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
