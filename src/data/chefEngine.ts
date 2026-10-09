import { InventoryItem, Recipe } from '../types';
import {
  extractIngredientsFromSentence,
  normalizeSingleIngredient,
  getIngredientDisplayName,
} from './ingredientNormalization';
import {
  matchRecipesWithInput,
  matchRecipesWithInventory,
  RecipeMatchResult,
} from './recipeMatching';

export type ChefIntent =
  | 'FIND_RECIPE'
  | 'ADD_FOOD'
  | 'COOKING_TIME'
  | 'OPEN_MY_FOOD'
  | 'OPEN_RECIPES'
  | 'OPEN_SHOPPING'
  | 'START_COOKING'
  | 'NAVIGATE'
  | 'GENERAL_QUERY';

export interface StructuredChefRecipe {
  name: string;
  match_percent: number;
  ready_to_cook: boolean;
  uses_inventory: string[];
  missing_items: string[];
  uses_expiring_items: string[];
  prep_time_mins: number;
  steps: string[];
}

export interface StructuredChefResponse {
  intent: ChefIntent;
  language: 'english' | 'tamil' | 'tanglish';
  recognized_ingredients: string[];
  conversational_reply: string;
  recipes: StructuredChefRecipe[];
  timer_seconds?: number;
  action_performed?: string;
}

/**
 * Detect language style of input query
 */
export function detectLanguage(query: string): 'english' | 'tamil' | 'tanglish' {
  const lower = query.toLowerCase();
  const tamilKeywords = [
    'enna', 'sapadalam', 'samayikalam', 'panna', 'mudiyum', 'iruku', 'irukku',
    'kitta', 'enkitta', 'vechu', 'konjam', 'evlo', 'neram', 'kulla', 'sollu',
    'paal', 'manga', 'muttai', 'thakkali', 'vengayam', 'uppu', 'arisi', 'thayir'
  ];

  const hasTamilScript = /[\u0B80-\u0BFF]/.test(query);
  if (hasTamilScript) return 'tamil';

  const hasTanglish = tamilKeywords.some((kw) => lower.includes(kw));
  if (hasTanglish) return 'tanglish';

  return 'english';
}

/**
 * Detect user's intent from query
 */
export function detectChefIntent(query: string): ChefIntent {
  const lower = query.toLowerCase().trim();

  // 1. COOKING_TIME
  if (
    lower.includes('how long') ||
    lower.includes('how many minutes') ||
    lower.includes('how much time') ||
    lower.includes('evvalavu neram') ||
    lower.includes('evlo neram') ||
    lower.includes('evlo time') ||
    lower.includes('time take') ||
    lower.includes('time does it take') ||
    lower.includes('boil panna evlo')
  ) {
    return 'COOKING_TIME';
  }

  // 2. START_COOKING
  if (
    lower.includes('start cooking') ||
    lower.includes('cooking mode') ||
    lower.includes('live cooking') ||
    lower.includes("let's cook") ||
    lower.includes('samayika start')
  ) {
    return 'START_COOKING';
  }

  // 3. OPEN_MY_FOOD
  if (
    lower.includes('my food') ||
    lower.includes('open food') ||
    lower.includes('show food') ||
    lower.includes('show my food') ||
    lower.includes('enna food') ||
    lower.includes('food storage') ||
    lower.includes('open inventory') ||
    lower.includes('show inventory')
  ) {
    return 'OPEN_MY_FOOD';
  }

  // 4. OPEN_SHOPPING
  if (
    lower.includes('shopping') ||
    lower.includes('what should i buy') ||
    lower.includes('what do i need to buy') ||
    lower.includes('show shopping') ||
    lower.includes('buy list')
  ) {
    return 'OPEN_SHOPPING';
  }

  // 5. OPEN_RECIPES
  if (
    lower === 'show recipes' ||
    lower === 'open recipes' ||
    lower === 'recipe hub' ||
    lower === 'open recipe hub'
  ) {
    return 'OPEN_RECIPES';
  }

  // 6. NAVIGATE
  if (
    lower.includes('dashboard') ||
    lower.includes('go to dashboard') ||
    lower.includes('open food waste') ||
    lower.includes('waste analytics') ||
    lower.includes('community')
  ) {
    return 'NAVIGATE';
  }

  // 7. ADD_FOOD (e.g. "Add tomato", "Add 2 eggs", "Add to my food")
  // Must be an explicit command to add or insert
  const isAddKeyword =
    lower.startsWith('add ') ||
    lower.startsWith('insert ') ||
    lower.includes('add to my food') ||
    lower.includes('add to food') ||
    lower.includes('add to inventory');

  if (isAddKeyword) {
    return 'ADD_FOOD';
  }

  // 8. FIND_RECIPE (Defaults to FIND_RECIPE for any food, question, or ingredient inputs)
  if (
    lower.includes('what can') ||
    lower.includes('what to') ||
    lower.includes('enna sapadalam') ||
    lower.includes('enna samayikalam') ||
    lower.includes('enna panna') ||
    lower.includes('vechu enna') ||
    lower.includes('quick ah') ||
    lower.includes('quick a') ||
    lower.includes('something quick') ||
    lower.includes('recipe') ||
    lower.includes('cook') ||
    lower.includes('make') ||
    lower.includes('have') ||
    lower.includes('iruku') ||
    lower.includes('irukku') ||
    extractIngredientsFromSentence(lower).length > 0
  ) {
    return 'FIND_RECIPE';
  }

  return 'GENERAL_QUERY';
}

/**
 * Ask Chef: Core processing engine that takes the user's natural language input,
 * the actual shared My Food inventory, and available recipes, and returns
 * the exact structured response schema.
 */
export function queryChef(
  userInput: string,
  inventory: InventoryItem[],
  allRecipes: Recipe[]
): StructuredChefResponse {
  const language = detectLanguage(userInput);
  const intent = detectChefIntent(userInput);
  const lower = userInput.toLowerCase();

  // Extract recognized ingredients
  const extractedIngredients = extractIngredientsFromSentence(userInput);

  // Check if user requested a quick recipe ("quick ah", "konjam quick a", "20 min")
  const isQuickRequested =
    lower.includes('quick') ||
    lower.includes('fast') ||
    lower.includes('20 min') ||
    lower.includes('seekiram') ||
    lower.includes('avsaram');

  // Top expiring items from current My Food (closest to expiry, <= 2 days)
  const expiringItems = inventory
    .filter((i) => i.quantity > 0 && (i.atRisk || i.daysLeft <= 2))
    .sort((a, b) => a.daysLeft - b.daysLeft);

  // ==========================================
  // INTENT: COOKING_TIME
  // ==========================================
  if (intent === 'COOKING_TIME') {
    let reply = '';
    let timerSecs = 8 * 60;

    if (lower.includes('egg') || lower.includes('muttai') || lower.includes('mutta')) {
      timerSecs = 8 * 60;
      if (language === 'tamil' || language === 'tanglish') {
        reply = 'Muttai boil panna: soft boil-ku 6 minutes, nalla hard boil-ku 8-10 minutes aagum. Naan 8-minute timer set panniten!';
      } else {
        reply = 'Boiling eggs takes 6 minutes for soft-boiled or 8 to 10 minutes for firm hard-boiled eggs. I have set an 8-minute kitchen timer for you!';
      }
    } else if (lower.includes('rice') || lower.includes('sadam') || lower.includes('saatham') || lower.includes('arisi')) {
      timerSecs = 15 * 60;
      if (language === 'tamil' || language === 'tanglish') {
        reply = 'Sadam cook panna cooker-la 3 whistles (15 minutes) aagum. 15-minute timer start panniyachu!';
      } else {
        reply = 'Cooking rice takes 15 to 18 minutes (or 3 whistles in a pressure cooker). I started a 15-minute timer for you.';
      }
    } else if (lower.includes('dosa') || lower.includes('dosai')) {
      timerSecs = 2 * 60;
      if (language === 'tamil' || language === 'tanglish') {
        reply = 'Crispy dosa-ku tawa-la 2 minutes aagum. Oru side 2 min, flip panni 30 seconds podhum.';
      } else {
        reply = 'A crispy golden dosa takes about 2 to 3 minutes on a hot cast iron skillet.';
      }
    } else if (lower.includes('idli')) {
      timerSecs = 10 * 60;
      if (language === 'tamil' || language === 'tanglish') {
        reply = 'Idli steam panna sariya 10 minutes aagum. 10-minute timer start pannidava?';
      } else {
        reply = 'Steaming soft idlis takes exactly 10 minutes on medium steam.';
      }
    } else {
      timerSecs = 10 * 60;
      if (language === 'tamil' || language === 'tanglish') {
        reply = 'Stovetop-la samayikka sadharanama 10-15 minutes aagum. 10 minutes timer set panniruken!';
      } else {
        reply = 'Most stovetop dishes take 10 to 15 minutes on medium heat. I have set a 10-minute timer for your cooking!';
      }
    }

    return {
      intent,
      language,
      recognized_ingredients: extractedIngredients,
      conversational_reply: reply,
      recipes: [],
      timer_seconds: timerSecs,
    };
  }

  // ==========================================
  // INTENT: ADD_FOOD
  // ==========================================
  if (intent === 'ADD_FOOD') {
    const numMatch = userInput.match(/\b(\d+)\b/);
    const qty = numMatch ? parseInt(numMatch[1], 10) : 1;
    const names = extractedIngredients.map(getIngredientDisplayName).join(', ') || 'item';

    let reply = `Added ${qty} ${names} to My Food storage.`;
    if (language === 'tamil' || language === 'tanglish') {
      reply = `${names} ungaloda My Food storage-la add panniyachu!`;
    }

    return {
      intent,
      language,
      recognized_ingredients: extractedIngredients,
      conversational_reply: reply,
      recipes: [],
      action_performed: `Added ${qty} ${names} to My Food`,
    };
  }

  // ==========================================
  // INTENT: OPEN_MY_FOOD, OPEN_SHOPPING, START_COOKING, NAVIGATE
  // ==========================================
  if (intent === 'OPEN_MY_FOOD') {
    return {
      intent,
      language,
      recognized_ingredients: [],
      conversational_reply:
        language === 'tamil' || language === 'tanglish'
          ? 'My Food open pandren. Unga kitta irukura ellam ingredients-um inga irukku.'
          : 'Opening My Food. Here are all ingredients currently in your kitchen storage.',
      recipes: [],
      action_performed: 'navigate_inventory',
    };
  }

  if (intent === 'OPEN_SHOPPING') {
    return {
      intent,
      language,
      recognized_ingredients: [],
      conversational_reply:
        language === 'tamil' || language === 'tanglish'
          ? 'Smart Shopping list open pandren. Thevaiyana ingredients paathukalam.'
          : 'Opening Smart Shopping list for your required ingredients.',
      recipes: [],
      action_performed: 'navigate_shopping',
    };
  }

  if (intent === 'START_COOKING') {
    return {
      intent,
      language,
      recognized_ingredients: [],
      conversational_reply:
        language === 'tamil' || language === 'tanglish'
          ? 'Recipe Hub-ku kootitu poren! Vanga steps paakalaam.'
          : 'Opening Recipe Hub with your recipes and step-by-step guidance!',
      recipes: [],
      action_performed: 'navigate_recipes',
    };
  }

  if (intent === 'NAVIGATE') {
    return {
      intent,
      language,
      recognized_ingredients: [],
      conversational_reply:
        language === 'tamil' || language === 'tanglish'
          ? 'Kitchen Dashboard-ku kootitu poren.'
          : 'Navigating to Kitchen Dashboard.',
      recipes: [],
      action_performed: 'navigate_dashboard',
    };
  }

  // ==========================================
  // INTENT: FIND_RECIPE (Core Flow)
  // Evaluates strictly using user inventory or extracted ingredients
  // ==========================================
  let splitMatches = matchRecipesWithInput(userInput, allRecipes, inventory);

  // If query is broad (e.g. "enna sapadalam ippo, konjam quick a", "what can i cook?")
  // and no specific ingredients were named in the sentence:
  // use the full current My Food inventory!
  if (extractedIngredients.length === 0) {
    splitMatches = matchRecipesWithInventory(inventory, allRecipes);
  }

  // Sort and filter candidates
  let candidateResults = [
    ...splitMatches.canMakeNow,
    ...splitMatches.almostReady,
  ];

  // If quick recipe requested, prioritize recipes with prep+cook <= 20 mins
  if (isQuickRequested) {
    candidateResults.sort((a, b) => {
      const aTime = (parseInt(a.recipe.prepTime) || 5) + (parseInt(a.recipe.cookTime) || 5);
      const bTime = (parseInt(b.recipe.prepTime) || 5) + (parseInt(b.recipe.cookTime) || 5);
      return aTime - bTime;
    });
  }

  // Boost recipes using expiring ingredients
  const expiringStandards = expiringItems.map((i) => normalizeSingleIngredient(i.name));
  if (expiringStandards.length > 0) {
    candidateResults.sort((a, b) => {
      const aUsesExpiring = a.availableIngredients.some((ing) =>
        expiringStandards.includes(normalizeSingleIngredient(ing))
      );
      const bUsesExpiring = b.availableIngredients.some((ing) =>
        expiringStandards.includes(normalizeSingleIngredient(ing))
      );
      if (aUsesExpiring && !bUsesExpiring) return -1;
      if (!aUsesExpiring && bUsesExpiring) return 1;
      return b.matchPercentage - a.matchPercentage;
    });
  }

  // Pick top 2-3 structured recipes
  const topRecipes: StructuredChefRecipe[] = candidateResults.slice(0, 3).map((res) => {
    const r = res.recipe;
    const usesExpiring = res.availableIngredients.filter((ing) =>
      expiringStandards.includes(normalizeSingleIngredient(ing))
    );

    const stepTexts = r.steps && r.steps.length > 0
      ? r.steps.map((s) => s.instructions.join(' '))
      : [r.description || 'Cook ingredients until done.'];

    return {
      name: r.title,
      match_percent: res.matchPercentage,
      ready_to_cook: res.isFullyAvailable,
      uses_inventory: res.availableIngredients,
      missing_items: res.missingIngredients,
      uses_expiring_items: usesExpiring,
      prep_time_mins: (parseInt(r.prepTime) || 5) + (parseInt(r.cookTime) || 5),
      steps: stepTexts,
    };
  });

  // If no recipes matched and a dynamic recipe was generated
  if (topRecipes.length === 0 && splitMatches.generatedRecipe) {
    const gen = splitMatches.generatedRecipe;
    topRecipes.push({
      name: gen.title,
      match_percent: 100,
      ready_to_cook: true,
      uses_inventory: gen.pantryItems,
      missing_items: [],
      uses_expiring_items: [],
      prep_time_mins: 10,
      steps: gen.steps ? gen.steps.map((s) => s.instructions.join(' ')) : ['Combine and cook.'],
    });
  }

  // Craft natural reply in the user's language style
  let reply = '';
  const firstRecipe = topRecipes[0];
  const secondRecipe = topRecipes[1];

  const expiringNote = expiringItems.length > 0 ? expiringItems[0] : null;

  if (language === 'tamil' || language === 'tanglish') {
    if (firstRecipe) {
      const quickTxt = isQuickRequested ? 'quick-ah ' : '';
      const expTxt = expiringNote
        ? ` (${expiringNote.name} ${expiringNote.daysLeft <= 1 ? 'seekiram expire aagum' : 'use pannalam'})`
        : '';
      reply = `Unga kitta irukura ingredients vechu ${quickTxt}${firstRecipe.name}${expTxt} pannalam!`;
      if (secondRecipe) {
        reply += ` Illana ${secondRecipe.name}-um ready-ah irukku.`;
      }
      if (firstRecipe.missing_items.length > 0) {
        reply += ` You'll also need: ${firstRecipe.missing_items.join(', ')}.`;
      }
    } else {
      reply = 'Unga ingredients vechu recipe paakalaam. Recipe Hub check pannunga!';
    }
  } else {
    if (firstRecipe) {
      const expTxt = expiringNote
        ? ` (prioritizing ${expiringNote.name} expiring in ${expiringNote.daysLeft}d)`
        : '';
      reply = `Based on your food, you can make ${firstRecipe.name}${expTxt}!`;
      if (secondRecipe) {
        reply += ` Or try ${secondRecipe.name}.`;
      }
      if (firstRecipe.missing_items.length > 0) {
        reply += ` You'll also need: ${firstRecipe.missing_items.join(', ')}.`;
      }
    } else {
      reply = 'Showing suitable recipes matched to your kitchen food in Recipe Hub.';
    }
  }

  return {
    intent: 'FIND_RECIPE',
    language,
    recognized_ingredients: extractedIngredients,
    conversational_reply: reply,
    recipes: topRecipes,
  };
}
