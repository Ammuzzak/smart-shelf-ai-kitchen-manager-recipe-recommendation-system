import React from 'react';
import {
  X,
  Clock,
  Users,
  ShieldAlert,
  CheckCircle2,
  DollarSign,
  ShoppingCart,
  Sparkles,
  RefreshCw,
  Lightbulb,
} from 'lucide-react';
import { useKitchen } from '../context/KitchenContext';
import { Recipe } from '../types';

export const RecipeDetailModal: React.FC = () => {
  const {
    selectedRecipeForDetail,
    setIsRecipeDetailOpen,
    isRecipeDetailOpen,
    addShoppingItem,
    setToastMessage,
  } = useKitchen();

  if (!isRecipeDetailOpen || !selectedRecipeForDetail) return null;

  const recipe: Recipe = selectedRecipeForDetail;

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
            {recipe.isAIGenerated && (
              <span className="px-3 py-1 rounded-full bg-cyan-500/25 border border-cyan-400 text-cyan-300 font-mono font-bold text-xs flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>AI Generated</span>
              </span>
            )}
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
                <p className="text-[10px] text-[#8e989b] uppercase font-bold">Cooking Time</p>
                <p className="text-xs font-bold text-white">
                  {recipe.estimatedCookingTime || `${recipe.prepTime} / ${recipe.cookTime}`}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#151d20] border border-white/5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-emerald-400">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-[#8e989b] uppercase font-bold">Servings</p>
                <p className="text-xs font-bold text-white">{recipe.servings} Servings</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#151d20] border border-white/5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[#ffb780]">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-[#8e989b] uppercase font-bold">Estimated Savings</p>
                <p className="text-xs font-bold text-[#ffb780]">{recipe.moneySaved}</p>
              </div>
            </div>
          </div>

          {/* Waste Saving Tip if available */}
          {recipe.wasteSavingTip && (
            <div className="p-3.5 rounded-2xl bg-[#a1e3f9]/10 border border-[#a1e3f9]/20 flex items-start gap-2.5">
              <Lightbulb className="w-4 h-4 text-[#a1e3f9] shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-[#a1e3f9]">Smart Kitchen Tip: </span>
                <span className="text-[#dbe4e8]">{recipe.wasteSavingTip}</span>
              </div>
            </div>
          )}

          {/* Full Ingredients & Quantities Breakdown */}
          <div className="space-y-3">
            <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider flex items-center justify-between">
              <span>Ingredients & Quantities</span>
              {recipe.ingredientsWithQuantities && (
                <span className="text-xs text-[#8e989b] font-mono normal-case">
                  {recipe.ingredientsWithQuantities.filter((i) => i.isAvailable).length} available / {recipe.ingredientsWithQuantities.length} total
                </span>
              )}
            </h3>

            {recipe.ingredientsWithQuantities && recipe.ingredientsWithQuantities.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {recipe.ingredientsWithQuantities.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                      item.isAvailable
                        ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-200'
                        : 'bg-[#ffb780]/10 border-[#ffb780]/25 text-[#ffb780]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${item.isAvailable ? 'bg-emerald-400' : 'bg-[#ffb780]'}`} />
                      <span className="font-semibold capitalize text-white">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] opacity-80">{item.quantity}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                          item.isAvailable ? 'bg-emerald-500/20 text-emerald-300' : 'bg-[#ffb780]/20 text-[#ffb780]'
                        }`}
                      >
                        {item.isAvailable ? 'Available' : 'Missing'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {recipe.pantryItems.map((item, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-1.5 font-medium"
                  >
                    <span>✓</span>
                    <span>{item}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Missing Ingredients & Shopping List Trigger */}
          {recipe.missingIngredients && recipe.missingIngredients.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-display text-xs font-bold text-[#ffb780] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-[#ffb780]" />
                <span>You'll Also Need ({recipe.missingIngredients.length})</span>
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
          )}

          {/* Possible Substitutions */}
          {recipe.substitutions && recipe.substitutions.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-display text-xs font-bold text-[#a1e3f9] uppercase tracking-wider flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-[#a1e3f9]" />
                <span>Possible Substitutions</span>
              </h3>
              <div className="space-y-2">
                {recipe.substitutions.map((sub, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-[#151d20] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#8e989b] line-through">{sub.original}</span>
                        <span className="text-white">→</span>
                        <span className="font-bold text-[#a1e3f9]">{sub.substitute}</span>
                      </div>
                      {sub.note && <p className="text-[11px] text-[#8e989b] mt-0.5">{sub.note}</p>}
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-[#bfc8cc] shrink-0 self-start sm:self-center">
                      Flexible Swap
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step-by-Step Cooking Instructions */}
          <div className="space-y-3">
            <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider">
              Step-by-Step Instructions ({recipe.steps.length} Steps)
            </h3>
            <div className="space-y-2.5">
              {recipe.steps.map((step) => (
                <div
                  key={step.stepNumber}
                  className="p-4 rounded-2xl bg-[#151d20] border border-white/5 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-[#a1e3f9]/20 text-[#a1e3f9] font-mono text-xs font-bold flex items-center justify-center">
                        {step.stepNumber}
                      </span>
                      <h4 className="text-xs font-bold text-white">{step.title}</h4>
                    </div>
                    <span className="text-[11px] font-mono text-[#8e989b]">{step.duration}</span>
                  </div>
                  <div className="text-xs text-[#bfc8cc] leading-relaxed pl-8 space-y-1">
                    {step.instructions.map((inst, i) => (
                      <p key={i}>{inst}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Modal Footer */}
        <div className="p-4 bg-[#151d20] border-t border-white/10 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-[#8e989b]">
            Estimated Cooking: <span className="text-white font-bold">{recipe.estimatedCookingTime || recipe.cookTime}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsRecipeDetailOpen(false)}
            className="px-6 py-2.5 rounded-xl bg-[#1c2529] hover:bg-[#252f33] text-white text-xs font-bold transition-all border border-white/10 cursor-pointer"
          >
            Close Recipe
          </button>
        </div>
      </div>
    </div>
  );
};
