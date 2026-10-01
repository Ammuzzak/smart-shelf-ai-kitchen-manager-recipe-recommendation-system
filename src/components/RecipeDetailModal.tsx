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
    theme,
  } = useKitchen();
  const isDark = theme === 'dark';

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
      <div className={`w-full max-w-2xl border rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col relative transition-all ${
        isDark ? 'bg-[#1c2529] border-white/10 text-[#dbe4e8]' : 'bg-[#FFFFFF] border-[#E4DED2] text-[#24332D]'
      }`}>
        {/* Hero Header with Media */}
        <div className="relative h-56 w-full shrink-0">
          <img
            src={recipe.image}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
          <div className={`absolute inset-0 ${
            isDark
              ? 'bg-gradient-to-t from-[#1c2529] via-[#1c2529]/60 to-transparent'
              : 'bg-gradient-to-t from-black/80 via-black/40 to-transparent'
          }`} />

          {/* Close button */}
          <button
            onClick={() => setIsRecipeDetailOpen(false)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm border border-white/10 transition-all z-10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Floating badges */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            <span className={`px-3 py-1 rounded-full font-mono font-bold text-xs uppercase tracking-wide ${
              isDark ? 'bg-[#a1e3f9] text-[#003642]' : 'bg-[#557A62] text-white'
            }`}>
              {recipe.cuisine}
            </span>
            {recipe.isAIGenerated && (
              <span className={`px-3 py-1 rounded-full border font-mono font-bold text-xs flex items-center gap-1 ${
                isDark ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300' : 'bg-[#6FAF8F]/25 border-[#6FAF8F] text-white'
              }`}>
                <Sparkles className="w-3 h-3" />
                <span>AI Generated</span>
              </span>
            )}
            {recipe.matchPercentage !== undefined && (
              <span className={`px-3 py-1 rounded-full border font-mono font-bold text-xs ${
                isDark
                  ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300'
                  : 'bg-[#557A62]/90 border-[#6FAF8F] text-white'
              }`}>
                {recipe.matchPercentage}% Match
              </span>
            )}
            <span className={`px-3 py-1 rounded-full border font-mono font-bold text-xs ${
              isDark
                ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                : 'bg-[#6FAF8F]/20 border-[#6FAF8F]/40 text-white'
            }`}>
              Saves {recipe.rescueWeight}
            </span>
            <span className={`px-3 py-1 rounded-full border font-mono font-bold text-xs ${
              isDark
                ? 'bg-[#ffb780]/20 border-[#ffb780]/40 text-[#ffb780]'
                : 'bg-[#D9826B]/20 border-[#D9826B]/40 text-white'
            }`}>
              Saves {recipe.moneySaved}
            </span>
          </div>

          {/* Title overlay */}
          <div className="absolute bottom-4 left-6 right-6">
            <h2 className="font-display text-2xl font-black text-white">{recipe.title}</h2>
            <p className={`text-xs font-medium mt-0.5 ${isDark ? 'text-[#a1e3f9]' : 'text-[#EBF3EB]'}`}>
              {recipe.subtitle || recipe.description}
            </p>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 pr-4">
          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className={`p-3 rounded-2xl border flex items-center gap-3 ${
              isDark ? 'bg-[#151d20] border-white/5' : 'bg-[#F7F5EF] border-[#E4DED2]'
            }`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isDark ? 'bg-white/5 text-[#a1e3f9]' : 'bg-[#FFFFFF] text-[#557A62] shadow-sm'
              }`}>
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className={`text-[10px] uppercase font-bold ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
                  Cooking Time
                </p>
                <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
                  {recipe.estimatedCookingTime || `${recipe.prepTime} / ${recipe.cookTime}`}
                </p>
              </div>
            </div>

            <div className={`p-3 rounded-2xl border flex items-center gap-3 ${
              isDark ? 'bg-[#151d20] border-white/5' : 'bg-[#F7F5EF] border-[#E4DED2]'
            }`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isDark ? 'bg-white/5 text-emerald-400' : 'bg-[#FFFFFF] text-[#557A62] shadow-sm'
              }`}>
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className={`text-[10px] uppercase font-bold ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
                  Servings
                </p>
                <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
                  {recipe.servings} Servings
                </p>
              </div>
            </div>

            <div className={`p-3 rounded-2xl border flex items-center gap-3 ${
              isDark ? 'bg-[#151d20] border-white/5' : 'bg-[#F7F5EF] border-[#E4DED2]'
            }`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isDark ? 'bg-white/5 text-[#ffb780]' : 'bg-[#FFFFFF] text-[#D9826B] shadow-sm'
              }`}>
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <p className={`text-[10px] uppercase font-bold ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
                  Estimated Savings
                </p>
                <p className={`text-xs font-bold ${isDark ? 'text-[#ffb780]' : 'text-[#D9826B]'}`}>
                  {recipe.moneySaved}
                </p>
              </div>
            </div>
          </div>

          {/* Waste Saving Tip if available */}
          {recipe.wasteSavingTip && (
            <div className={`p-3.5 rounded-2xl border flex items-start gap-2.5 ${
              isDark ? 'bg-[#a1e3f9]/10 border-[#a1e3f9]/20' : 'bg-[#EBF3EB] border-[#6FAF8F]/30'
            }`}>
              <Lightbulb className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? 'text-[#a1e3f9]' : 'text-[#557A62]'}`} />
              <div className="text-xs">
                <span className={`font-bold ${isDark ? 'text-[#a1e3f9]' : 'text-[#557A62]'}`}>
                  Smart Kitchen Tip:{' '}
                </span>
                <span className={isDark ? 'text-[#dbe4e8]' : 'text-[#24332D]'}>
                  {recipe.wasteSavingTip}
                </span>
              </div>
            </div>
          )}

          {/* Full Ingredients & Quantities Breakdown */}
          <div className="space-y-3">
            <h3 className={`font-display text-sm font-bold uppercase tracking-wider flex items-center justify-between ${
              isDark ? 'text-white' : 'text-[#24332D]'
            }`}>
              <span>Ingredients & Quantities</span>
              {recipe.ingredientsWithQuantities && (
                <span className={`text-xs font-mono normal-case ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
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
                        ? isDark
                          ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-200'
                          : 'bg-[#6FAF8F]/15 border-[#6FAF8F]/30 text-[#43634F]'
                        : isDark
                        ? 'bg-[#ffb780]/10 border-[#ffb780]/25 text-[#ffb780]'
                        : 'bg-[#F2B49F]/20 border-[#F2B49F]/40 text-[#B8573E]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        item.isAvailable
                          ? isDark ? 'bg-emerald-400' : 'bg-[#557A62]'
                          : isDark ? 'bg-[#ffb780]' : 'bg-[#D9826B]'
                      }`} />
                      <span className={`font-semibold capitalize ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] opacity-80">{item.quantity}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                          item.isAvailable
                            ? isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-[#6FAF8F]/25 text-[#43634F]'
                            : isDark ? 'bg-[#ffb780]/20 text-[#ffb780]' : 'bg-[#F2B49F]/30 text-[#B8573E]'
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
                    className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-1.5 font-medium ${
                      isDark
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                        : 'bg-[#6FAF8F]/15 border-[#6FAF8F]/30 text-[#43634F]'
                    }`}
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
              <h3 className={`font-display text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isDark ? 'text-[#ffb780]' : 'text-[#D9826B]'
              }`}>
                <ShieldAlert className="w-4 h-4" />
                <span>You'll Also Need ({recipe.missingIngredients.length})</span>
              </h3>
              <div className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
                isDark
                  ? 'bg-[#ffb780]/10 border-[#ffb780]/20'
                  : 'bg-[#FFFDF8] border-[#D9826B]/30'
              }`}>
                <div className="flex flex-wrap gap-2">
                  {recipe.missingIngredients.map((item, i) => (
                    <span
                      key={i}
                      className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        isDark ? 'bg-[#ffb780]/20 text-[#ffb780]' : 'bg-[#F2B49F]/25 text-[#B8573E]'
                      }`}
                    >
                      + {item}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAddMissingToShopping}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                    isDark
                      ? 'bg-[#ffb780] hover:bg-[#ffd7b2] text-[#4a2800]'
                      : 'bg-[#D9826B] hover:bg-[#C2715C] text-white'
                  }`}
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
              <h3 className={`font-display text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isDark ? 'text-[#a1e3f9]' : 'text-[#557A62]'
              }`}>
                <RefreshCw className="w-4 h-4" />
                <span>Possible Substitutions</span>
              </h3>
              <div className="space-y-2">
                {recipe.substitutions.map((sub, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                      isDark ? 'bg-[#151d20] border-white/5' : 'bg-[#F7F5EF] border-[#E4DED2]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`line-through ${isDark ? 'text-[#8e989b]' : 'text-[#8A9590]'}`}>{sub.original}</span>
                        <span>→</span>
                        <span className={`font-bold ${isDark ? 'text-[#a1e3f9]' : 'text-[#557A62]'}`}>{sub.substitute}</span>
                      </div>
                      {sub.note && <p className={`text-[11px] mt-0.5 ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>{sub.note}</p>}
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded shrink-0 self-start sm:self-center border ${
                      isDark ? 'bg-white/5 text-[#bfc8cc] border-white/10' : 'bg-[#FFFFFF] text-[#68736D] border-[#E4DED2]'
                    }`}>
                      Flexible Swap
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step-by-Step Cooking Instructions */}
          <div className="space-y-3">
            <h3 className={`font-display text-sm font-bold uppercase tracking-wider ${
              isDark ? 'text-white' : 'text-[#24332D]'
            }`}>
              Step-by-Step Instructions ({recipe.steps.length} Steps)
            </h3>
            <div className="space-y-2.5">
              {recipe.steps.map((step) => (
                <div
                  key={step.stepNumber}
                  className={`p-4 rounded-2xl border space-y-2 ${
                    isDark ? 'bg-[#151d20] border-white/5' : 'bg-[#F7F5EF] border-[#E4DED2]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-6 h-6 rounded-full font-mono text-xs font-bold flex items-center justify-center ${
                        isDark ? 'bg-[#a1e3f9]/20 text-[#a1e3f9]' : 'bg-[#557A62] text-white'
                      }`}>
                        {step.stepNumber}
                      </span>
                      <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#24332D]'}`}>{step.title}</h4>
                    </div>
                    <span className={`text-[11px] font-mono ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>{step.duration}</span>
                  </div>
                  <div className={`text-xs leading-relaxed pl-8 space-y-1 ${
                    isDark ? 'text-[#bfc8cc]' : 'text-[#68736D]'
                  }`}>
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
        <div className={`p-4 border-t flex items-center justify-between gap-3 shrink-0 ${
          isDark ? 'bg-[#151d20] border-white/10' : 'bg-[#FFFDF8] border-[#E4DED2]'
        }`}>
          <div className={`text-xs ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
            Estimated Cooking: <span className={`font-bold ${isDark ? 'text-white' : 'text-[#24332D]'}`}>{recipe.estimatedCookingTime || recipe.cookTime}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsRecipeDetailOpen(false)}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              isDark
                ? 'bg-[#1c2529] hover:bg-[#252f33] text-white border-white/10'
                : 'bg-[#557A62] hover:bg-[#43634F] text-white border-[#557A62]'
            }`}
          >
            Close Recipe
          </button>
        </div>
      </div>
    </div>
  );
};
