import { Recipe } from '../types';
import { getIngredientDisplayName } from './ingredientNormalization';

/**
 * Generates an intuitive recipe purely from the user's available ingredients.
 * Only uses the user's ingredients (+ optional basic water/salt if needed).
 *
 * Example:
 * Input: ['mango', 'milk', 'sugar', 'condensed milk']
 * Output: Mango Milkshake / Mango Delight
 */
export function generateRecipeFromIngredients(userStandards: string[]): Recipe | null {
  if (!userStandards || userStandards.length === 0) return null;

  const userSet = new Set(userStandards.map((s) => s.toLowerCase()));
  const displayList = userStandards.map(getIngredientDisplayName);

  // 1. Mango + Milk combinations
  if (userSet.has('mango') && userSet.has('milk')) {
    const hasCondensed = userSet.has('condensed milk');
    const hasSugar = userSet.has('sugar');

    const ingredientsSteps = [
      { name: 'Ripe Mango', quantity: '2 medium, peeled & chopped', isRescued: true },
      { name: 'Milk', quantity: '1.5 cups chilled', isRescued: true },
      ...(hasSugar ? [{ name: 'Sugar', quantity: '1-2 tbsp' }] : []),
      ...(hasCondensed ? [{ name: 'Condensed Milk', quantity: '2 tbsp' }] : []),
    ];

    const instructions = [
      'Cut the mango.',
      'Add mango to a blender.',
      'Add milk.',
      ...(hasSugar ? ['Add sugar.'] : []),
      ...(hasCondensed ? ['Add condensed milk.'] : []),
      'Blend until smooth.',
      'Serve chilled.',
    ];

    return {
      id: `custom-mango-milkshake-${Date.now()}`,
      title: '🥭 Mango Milkshake',
      subtitle: 'You have everything you need! ✓',
      prepTime: '5 min',
      cookTime: '0 min',
      servings: 2,
      description: `Delicious homemade shake prepared with your available ingredients: ${displayList.join(', ')}.`,
      cuisine: 'Beverage & Snack',
      category: 'Breakfast',
      image: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=900&auto=format&fit=crop&q=80',
      normalizedRequired: userStandards,
      atRiskIngredients: [{ name: 'Mango', urgency: 'Fresh', status: 'urgent' }],
      pantryItems: displayList,
      missingIngredients: [],
      rescueWeight: '350g',
      moneySaved: '₹80',
      matchPercentage: 100,
      availableIngredientsList: displayList,
      missingIngredientsList: [],
      steps: instructions.map((ins, idx) => ({
        stepNumber: idx + 1,
        title: `Step ${idx + 1}`,
        duration: '1 min',
        instructions: [ins],
      })),
    };
  }

  // 2. Egg + Tomato + Onion
  if (userSet.has('egg') && (userSet.has('tomato') || userSet.has('onion'))) {
    const hasTomato = userSet.has('tomato');
    const hasOnion = userSet.has('onion');

    const title = hasTomato && hasOnion ? 'Tomato & Onion Egg Scramble' : hasTomato ? 'Fresh Tomato Scrambled Eggs' : 'Spiced Onion Egg Omelette';

    return {
      id: `custom-egg-dish-${Date.now()}`,
      title,
      subtitle: 'Quick protein-packed meal from your ingredients',
      prepTime: '4 min',
      cookTime: '6 min',
      servings: 2,
      description: `Fast stovetop egg scramble prepared using your available ${displayList.join(', ')}.`,
      cuisine: 'Breakfast',
      category: 'Breakfast',
      image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=900&auto=format&fit=crop&q=80',
      normalizedRequired: userStandards,
      atRiskIngredients: [{ name: 'Eggs', urgency: 'Fresh', status: 'optimal' }],
      pantryItems: displayList,
      missingIngredients: [],
      rescueWeight: '280g',
      moneySaved: '₹60',
      matchPercentage: 100,
      availableIngredientsList: displayList,
      missingIngredientsList: [],
      steps: [
        {
          stepNumber: 1,
          title: 'Sauté Veggies',
          duration: '3 min',
          instructions: [
            ...(hasOnion ? ['Finely chop onions and sauté in a skillet until soft.'] : []),
            ...(hasTomato ? ['Add diced tomatoes and cook until juicy and tender.'] : []),
          ],
        },
        {
          stepNumber: 2,
          title: 'Whisk & Scramble Eggs',
          duration: '3 min',
          instructions: [
            'Crack eggs into the pan, season with salt (basic pantry ingredient), and gently scramble on medium flame.',
            'Cook for 2-3 minutes until soft and fluffy. Serve warm!',
          ],
        },
      ],
    };
  }

  // 3. Bread + Cheese + Tomato
  if (userSet.has('bread') && (userSet.has('cheese') || userSet.has('tomato'))) {
    const hasCheese = userSet.has('cheese');
    const hasTomato = userSet.has('tomato');

    const title = hasCheese && hasTomato ? 'Cheesy Tomato Toast' : hasCheese ? 'Grilled Melted Cheese Bread' : 'Warm Tomato Bruschetta Toast';

    return {
      id: `custom-bread-dish-${Date.now()}`,
      title,
      subtitle: 'Crispy warm toast from your ingredients',
      prepTime: '2 min',
      cookTime: '5 min',
      servings: 1,
      description: `Comforting pan-toasted bread created using your available ${displayList.join(', ')}.`,
      cuisine: 'Quick Snack',
      category: 'Snack',
      image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=900&auto=format&fit=crop&q=80',
      normalizedRequired: userStandards,
      atRiskIngredients: [{ name: 'Bread', urgency: 'Bakery', status: 'warning' }],
      pantryItems: displayList,
      missingIngredients: [],
      rescueWeight: '200g',
      moneySaved: '₹50',
      matchPercentage: 100,
      availableIngredientsList: displayList,
      missingIngredientsList: [],
      steps: [
        {
          stepNumber: 1,
          title: 'Assemble Toppings',
          duration: '2 min',
          instructions: [
            'Place bread slices on a plate or cutting board.',
            ...(hasTomato ? ['Layer freshly cut tomato slices across the bread.'] : []),
            ...(hasCheese ? ['Top with generous cheese over the bread and tomatoes.'] : []),
          ],
        },
        {
          stepNumber: 2,
          title: 'Toast in Pan Covered',
          duration: '4 min',
          instructions: [
            'Place on a warm skillet, cover with a lid on low heat for 3 to 4 minutes.',
            'Remove when bread is golden crisp underneath and cheese is delightfully melted.',
          ],
        },
      ],
    };
  }

  // 4. General fallback custom creation using user's exact ingredients
  const primaryName = displayList[0];
  const secondaryName = displayList[1] || '';
  const comboTitle = secondaryName ? `${primaryName} & ${secondaryName} Kitchen Medley` : `Fresh ${primaryName} Special`;

  return {
    id: `custom-generated-${Date.now()}`,
    title: comboTitle,
    subtitle: '100% created from your available kitchen ingredients',
    prepTime: '5 min',
    cookTime: '5 min',
    servings: 2,
    description: `A customized dish prepared entirely with the ingredients you have: ${displayList.join(', ')}.`,
    cuisine: 'Home Kitchen',
    category: 'Snack',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900&auto=format&fit=crop&q=80',
    normalizedRequired: userStandards,
    atRiskIngredients: [{ name: primaryName, urgency: 'In Stock', status: 'optimal' }],
    pantryItems: displayList,
    missingIngredients: [],
    rescueWeight: '300g',
    moneySaved: '₹70',
    matchPercentage: 100,
    availableIngredientsList: displayList,
    missingIngredientsList: [],
    steps: [
      {
        stepNumber: 1,
        title: 'Ingredient Preparation',
        duration: '3 min',
        instructions: [
          `Gather your available ingredients: ${displayList.join(', ')}.`,
          'Wash and slice or measure according to desired portion.',
        ],
      },
      {
        stepNumber: 2,
        title: 'Cook or Blend',
        duration: '4 min',
        instructions: [
          `Combine ${displayList.join(' and ')} in your cookware or blender.`,
          'Cook or blend until texture is consistent and fragrant.',
          'Enjoy fresh with zero food waste!',
        ],
      },
    ],
  };
}
