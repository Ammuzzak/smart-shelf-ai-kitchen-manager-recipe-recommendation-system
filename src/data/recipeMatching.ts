import { Recipe, InventoryItem } from '../types';
import {
  extractIngredientsFromSentence,
  normalizeSingleIngredient,
  getIngredientDisplayName,
  ASSUMED_BASIC_INGREDIENTS,
} from './ingredientNormalization';
import { generateRecipeFromIngredients } from './recipeGenerator';

export interface RecipeMatchResult {
  recipe: Recipe;
  matchPercentage: number;
  availableIngredients: string[];
  missingIngredients: string[];
  isFullyAvailable: boolean;
  missingRequiredCount: number;
  assumedBasicIngredients?: string[];
}

// Common staples/bases
const GENERIC_BASE_ITEMS = new Set([
  'sugar',
  'salt',
  'water',
  'oil',
  'hing',
  'turmeric',
  'chili powder',
  'mustard seeds',
]);

/**
 * Calculates recipe match strictly against the user's available ingredients.
 *
 * Rules:
 * 1. User ingredients are the SOURCE OF TRUTH.
 * 2. Recipes are NOT assumed to have banana, chocolate, cheese, etc. unless user actually has them.
 * 3. Only very small assumed basic ingredients (salt, water, oil) can be permitted if not in user's list.
 * 4. isFullyAvailable = true ONLY when all non-basic required ingredients are present.
 */
export function calculateRecipeMatch(
  recipe: Recipe,
  userAvailableStandards: string[]
): RecipeMatchResult {
  const userSet = new Set(userAvailableStandards.map((s) => s.toLowerCase()));

  // Extract recipe required items
  const required =
    recipe.normalizedRequired && recipe.normalizedRequired.length > 0
      ? recipe.normalizedRequired
      : [
          ...(recipe.atRiskIngredients?.map((a) => normalizeSingleIngredient(a.name)) || []),
          ...(recipe.pantryItems?.slice(0, 3).map((p) => normalizeSingleIngredient(p)) || []),
        ];

  const uniqueRequired = Array.from(new Set(required.filter(Boolean)));
  const optional = (recipe.normalizedOptional || []).filter(Boolean);

  const available: string[] = [];
  const missing: string[] = [];
  const assumedBasics: string[] = [];

  for (const item of uniqueRequired) {
    if (userSet.has(item.toLowerCase())) {
      available.push(getIngredientDisplayName(item));
    } else if (ASSUMED_BASIC_INGREDIENTS.has(item.toLowerCase())) {
      // Basic ingredient (salt, water, oil)
      assumedBasics.push(getIngredientDisplayName(item));
    } else {
      missing.push(getIngredientDisplayName(item));
    }
  }

  // Include available optional ingredients
  for (const opt of optional) {
    if (userSet.has(opt.toLowerCase())) {
      const disp = getIngredientDisplayName(opt);
      if (!available.includes(disp)) {
        available.push(disp);
      }
    }
  }

  // If uniqueRequired is empty (or only assumed basics)
  const totalNonBasic = uniqueRequired.filter(
    (i) => !ASSUMED_BASIC_INGREDIENTS.has(i.toLowerCase())
  ).length;

  const matchPercentage =
    totalNonBasic === 0
      ? 100
      : Math.max(0, Math.round(((totalNonBasic - missing.length) / totalNonBasic) * 100));

  const isFullyAvailable = missing.length === 0;

  return {
    recipe: {
      ...recipe,
      matchPercentage,
      availableIngredientsList: available,
      missingIngredientsList: missing,
      missingIngredients: missing,
    },
    matchPercentage,
    availableIngredients: available,
    missingIngredients: missing,
    isFullyAvailable,
    missingRequiredCount: missing.length,
    assumedBasicIngredients: assumedBasics,
  };
}

export interface SplitRecipeResults {
  canMakeNow: RecipeMatchResult[]; // 100% ready to cook (0 missing non-basic ingredients)
  almostReady: RecipeMatchResult[]; // Almost ready (missing 1 or 2 ingredients)
  userStandards: string[];
  generatedRecipe?: Recipe | null;
}

/**
 * Evaluates recipes strictly against a user input sentence or ingredient list.
 *
 * Example:
 * Input: "i have milk, mango, sugar and condensed milk"
 * User Standards: ["milk", "mango", "sugar", "condensed milk"]
 * Result:
 * - Can Make Now: Mango Milkshake (100% Ready)
 *   (DOES NOT include Banana Milkshake or Chocolate Milk!)
 * - Almost Ready: Mango Lassi (Missing Yogurt)
 * - If no exact match: Generates a recipe using user's ingredients.
 */
export function matchRecipesWithInput(
  query: string,
  allRecipes: Recipe[],
  currentInventory?: InventoryItem[]
): SplitRecipeResults {
  const trimmed = query.trim();

  // If empty query, evaluate with current inventory
  if (!trimmed) {
    return matchRecipesWithInventory(currentInventory || [], allRecipes);
  }

  // 1. Extract ingredients from sentence
  const extractedStandards = extractIngredientsFromSentence(trimmed);

  // If no ingredients recognized, check direct title match
  if (extractedStandards.length === 0) {
    const lower = trimmed.toLowerCase();
    const invStandards = (currentInventory || [])
      .filter((i) => i.quantity > 0)
      .map((i) => normalizeSingleIngredient(i.name));
    const titleMatches = allRecipes.filter(
      (r) =>
        r.title.toLowerCase().includes(lower) ||
        r.cuisine.toLowerCase().includes(lower) ||
        r.category.toLowerCase().includes(lower)
    );

    const scored = titleMatches.map((r) => calculateRecipeMatch(r, invStandards));
    return {
      canMakeNow: scored.filter((s) => s.isFullyAvailable),
      almostReady: scored.filter((s) => !s.isFullyAvailable && s.missingRequiredCount <= 2),
      userStandards: invStandards,
    };
  }

  // Distinctive items provided by user (excluding generic pantry staples like sugar, salt, water, oil)
  const distinctiveUserItems = extractedStandards.filter(
    (s) => !GENERIC_BASE_ITEMS.has(s.toLowerCase())
  );

  // Score all recipes strictly against extracted user ingredients
  const scored = allRecipes.map((recipe) => calculateRecipeMatch(recipe, extractedStandards));

  // "Can Make Now": All required non-basic ingredients are possessed by user.
  // CRITICAL: If user provided distinctive ingredients (e.g. mango),
  // the recipe MUST use at least one of the user's distinctive ingredients!
  const canMakeNow = scored
    .filter((res) => {
      if (!res.isFullyAvailable) return false;
      if (res.availableIngredients.length === 0) return false;

      // If user specified distinctive ingredients, recipe must use at least one
      if (distinctiveUserItems.length > 0) {
        const recipeIngredients = [
          ...(res.recipe.normalizedRequired || []),
          ...(res.recipe.normalizedOptional || []),
          ...(res.recipe.pantryItems || []).map(normalizeSingleIngredient),
          ...(res.recipe.atRiskIngredients || []).map((a) => normalizeSingleIngredient(a.name)),
        ].map((s) => s.toLowerCase());

        const usesDistinctive = distinctiveUserItems.some((d) =>
          recipeIngredients.includes(d.toLowerCase())
        );
        if (!usesDistinctive) return false;
      }

      return true;
    })
    .sort((a, b) => b.availableIngredients.length - a.availableIngredients.length);

  // "Almost Ready": Missing 1 or 2 ingredients, but user has at least 50% of the recipe.
  // CRITICAL: Must possess the distinctive key ingredient of the recipe.
  // E.g. If recipe is Banana Milkshake and missing is Banana, DO NOT recommend it to a mango user!
  const almostReady = scored
    .filter((res) => {
      if (res.isFullyAvailable) return false;
      if (res.availableIngredients.length === 0) return false;
      if (res.missingRequiredCount > 2 || res.matchPercentage < 50) return false;

      // If user specified distinctive ingredients (like mango, condensed milk),
      // the recipe MUST share a distinctive ingredient with user
      if (distinctiveUserItems.length > 0) {
        const recipeIngredients = [
          ...(res.recipe.normalizedRequired || []),
          ...(res.recipe.normalizedOptional || []),
          ...(res.recipe.pantryItems || []).map(normalizeSingleIngredient),
          ...(res.recipe.atRiskIngredients || []).map((a) => normalizeSingleIngredient(a.name)),
        ].map((s) => s.toLowerCase());

        const sharesDistinctive = distinctiveUserItems.some((d) =>
          recipeIngredients.includes(d.toLowerCase())
        );
        if (!sharesDistinctive) return false;
      }

      // Never show a recipe whose missing item is its primary namesake ingredient
      // (e.g. Do not show Banana Milkshake when Banana is missing)
      const primaryIngredient = (res.recipe.normalizedRequired && res.recipe.normalizedRequired[0]) || '';
      if (primaryIngredient && !GENERIC_BASE_ITEMS.has(primaryIngredient.toLowerCase())) {
        const isPrimaryMissing = res.missingIngredients.some(
          (m) => normalizeSingleIngredient(m).toLowerCase() === primaryIngredient.toLowerCase()
        );
        if (isPrimaryMissing) return false;
      }

      return true;
    })
    .sort((a, b) => b.matchPercentage - a.matchPercentage);

  // If there are no 100% "Can Make Now" recipes in the catalog, generate one!
  let generatedRecipe: Recipe | null = null;
  if (canMakeNow.length === 0 && extractedStandards.length > 0) {
    generatedRecipe = generateRecipeFromIngredients(extractedStandards);
  }

  return {
    canMakeNow,
    almostReady,
    userStandards: extractedStandards,
    generatedRecipe,
  };
}

/**
 * Calculates recipe matches against the user's current My Food inventory.
 * Used for "What can I make now?".
 */
export function matchRecipesWithInventory(
  inventory: InventoryItem[],
  allRecipes: Recipe[]
): SplitRecipeResults {
  // Extract standard keys from non-zero inventory items
  const userStandards: string[] = [];

  for (const item of inventory) {
    if (item.quantity > 0) {
      const std = normalizeSingleIngredient(item.name);
      if (std) userStandards.push(std);
      const extra = extractIngredientsFromSentence(item.name);
      userStandards.push(...extra);
    }
  }

  const uniqueStandards = Array.from(new Set(userStandards));

  const scored = allRecipes.map((recipe) => calculateRecipeMatch(recipe, uniqueStandards));

  const canMakeNow = scored
    .filter((res) => res.isFullyAvailable && res.availableIngredients.length > 0)
    .sort((a, b) => b.availableIngredients.length - a.availableIngredients.length);

  const almostReady = scored
    .filter(
      (res) =>
        !res.isFullyAvailable &&
        res.missingRequiredCount <= 2 &&
        res.matchPercentage >= 50 &&
        res.availableIngredients.length > 0
    )
    .sort((a, b) => b.matchPercentage - a.matchPercentage);

  let generatedRecipe: Recipe | null = null;
  if (canMakeNow.length === 0 && uniqueStandards.length > 0) {
    generatedRecipe = generateRecipeFromIngredients(uniqueStandards);
  }

  return {
    canMakeNow,
    almostReady,
    userStandards: uniqueStandards,
    generatedRecipe,
  };
}
