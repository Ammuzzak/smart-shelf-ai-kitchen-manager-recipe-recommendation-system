import { Recipe } from '../types';
import { EXPANDED_RECIPES_DATA } from './recipesDatabase';

export type CanonicalRecipe = Recipe;

export const CANONICAL_RECIPES: CanonicalRecipe[] =
  EXPANDED_RECIPES_DATA;

export function findCanonicalRecipe(
  title: string
): CanonicalRecipe | undefined {
  const normalizedTitle = String(title || '')
    .trim()
    .toLowerCase();

  if (!normalizedTitle) {
    return undefined;
  }

  return CANONICAL_RECIPES.find(
    (recipe) =>
      recipe.title.trim().toLowerCase() === normalizedTitle
  );
}

export function isCanonicalRecipeTitle(title: string): boolean {
  return Boolean(findCanonicalRecipe(title));
}

export function getCanonicalImageForRecipe(title: string): string {
  const recipe = findCanonicalRecipe(title);

  if (recipe?.image) {
    return recipe.image;
  }

  const encodedTitle = encodeURIComponent(title || 'Recipe');

  return `https://placehold.co/800x600?text=${encodedTitle}`;
}