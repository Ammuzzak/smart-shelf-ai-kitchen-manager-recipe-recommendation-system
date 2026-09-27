/**
 * Smart Shelf Ingredient Normalizer, Multi-lingual NLP & Recipe Matcher
 * Supports Tamil, Tanglish, casual English, singular/plural, spelling variations, and conversational sentences.
 */

// Normalized standard ingredient keys mapped to aliases (English, Tamil, Tanglish, Hindi)
export const INGREDIENT_DICTIONARY: Record<string, { label: string; aliases: string[]; category: string }> = {
  egg: {
    label: 'Egg',
    aliases: ['egg', 'eggs', 'muttai', 'mutta', 'muttay', 'muttai-gal', 'muttaigal', 'ande', 'anda', 'boiled egg'],
    category: 'Dairy',
  },
  tomato: {
    label: 'Tomato',
    aliases: ['tomato', 'tomatoes', 'thakkali', 'thakkali pazham', 'thakkalipazham', 'thakali', 'tamatar', 'country tomato'],
    category: 'Produce',
  },
  onion: {
    label: 'Onion',
    aliases: ['onion', 'onions', 'vengayam', 'vengaayam', 'shallot', 'shallots', 'sambar onion', 'pyaz', 'ulli'],
    category: 'Produce',
  },
  banana: {
    label: 'Banana',
    aliases: ['banana', 'bananas', 'vazhaipazham', 'vazha pazham', 'valapalam', 'valapazham', 'kela', 'ripe banana'],
    category: 'Produce',
  },
  milk: {
    label: 'Milk',
    aliases: ['milk', 'paal', 'paalu', 'pal', 'doodh', 'fresh milk', 'whole milk'],
    category: 'Dairy',
  },
  boost: {
    label: 'Boost',
    aliases: ['boost', 'boost powder', 'horlicks', 'malted drink', 'health drink powder'],
    category: 'Basic Foods',
  },
  chocolate_syrup: {
    label: 'Chocolate Syrup',
    aliases: [
      'chocolate syrup',
      'hershey syrup',
      "hershey's syrup",
      'hersheys syrup',
      'cocoa syrup',
      'chocolate sauce',
      'hershey',
      'hersheys',
    ],
    category: 'Sauces & Spreads',
  },
  sugar: {
    label: 'Sugar',
    aliases: ['sugar', 'sakkarai', 'sarkkarai', 'seeni', 'chini', 'brown sugar', 'sugarcane'],
    category: 'Basic Foods',
  },
  bread: {
    label: 'Bread',
    aliases: ['bread', 'bread slice', 'bread slices', 'toast bread', 'white bread', 'brown bread', 'sandwich bread'],
    category: 'Bakery',
  },
  cheese: {
    label: 'Cheese',
    aliases: ['cheese', 'cheddar', 'mozzarella', 'cheese slice', 'cheese slices', 'paneer'],
    category: 'Dairy',
  },
  butter: {
    label: 'Butter',
    aliases: ['butter', 'vennai', 'makhan', 'salted butter', 'ghee', 'neyyi', 'nei'],
    category: 'Dairy',
  },
  rice: {
    label: 'Rice',
    aliases: ['rice', 'saadham', 'sadham', 'saatham', 'chawal', 'arisi', 'cooked rice', 'sona masoori'],
    category: 'Basic Foods',
  },
  yogurt: {
    label: 'Yogurt / Curd',
    aliases: ['yogurt', 'curd', 'thayir', 'thair', 'dahi', 'plain yogurt'],
    category: 'Dairy',
  },
  lemon: {
    label: 'Lemon',
    aliases: ['lemon', 'lemons', 'elumichai', 'elumicham pazham', 'elumicha', 'nimbu', 'lime'],
    category: 'Produce',
  },
  pepper: {
    label: 'Pepper',
    aliases: ['pepper', 'black pepper', 'milagu', 'kali mirch', 'crushed pepper', 'pepper powder'],
    category: 'Lentils & Spices',
  },
  salt: {
    label: 'Salt',
    aliases: ['salt', 'uppu', 'namak', 'rock salt', 'table salt'],
    category: 'Basic Foods',
  },
  oil: {
    label: 'Oil',
    aliases: ['oil', 'cooking oil', 'yennai', 'ennai', 'sesame oil', 'nallennai', 'coconut oil', 'sunflower oil', 'tel'],
    category: 'Oils',
  },
  green_chilli: {
    label: 'Green Chilli',
    aliases: ['green chilli', 'green chili', 'green chillies', 'pacha milagai', 'pachai milagai', 'hari mirch', 'chilli', 'chili'],
    category: 'Produce',
  },
  curry_leaves: {
    label: 'Curry Leaves',
    aliases: ['curry leaves', 'karuveppilai', 'kariveppilai', 'kadi patta', 'curry leaf'],
    category: 'Produce',
  },
  mustard_seeds: {
    label: 'Mustard Seeds',
    aliases: ['mustard seeds', 'mustard', 'kadugu', 'rai', 'sarson'],
    category: 'Lentils & Spices',
  },
  cumin: {
    label: 'Cumin',
    aliases: ['cumin', 'cumin seeds', 'jeeragam', 'seeragam', 'jeera'],
    category: 'Lentils & Spices',
  },
  coriander: {
    label: 'Coriander / Cilantro',
    aliases: ['coriander', 'coriander leaves', 'cilantro', 'koththamalli', 'kothamalli', 'dhaniya'],
    category: 'Produce',
  },
  ginger: {
    label: 'Ginger',
    aliases: ['ginger', 'inji', 'adrak'],
    category: 'Produce',
  },
  garlic: {
    label: 'Garlic',
    aliases: ['garlic', 'poondu', 'lahsun'],
    category: 'Produce',
  },
  spinach: {
    label: 'Spinach',
    aliases: ['spinach', 'palak', 'keerai', 'pasalai keerai'],
    category: 'Produce',
  },
  coconut: {
    label: 'Coconut',
    aliases: ['coconut', 'thengai', 'thenga', 'grated coconut', 'nariyal'],
    category: 'Produce',
  },
  idli_batter: {
    label: 'Idli/Dosa Batter',
    aliases: ['batter', 'idli batter', 'dosa batter', 'maavu', 'mavu', 'fermented batter'],
    category: 'Basic Foods',
  },
  toor_dal: {
    label: 'Toor Dal',
    aliases: ['toor dal', 'tuvaram paruppu', 'thuvaram paruppu', 'dal', 'paruppu', 'lentils', 'pigeon pea'],
    category: 'Basic Foods',
  },
  urad_dal: {
    label: 'Urad Dal',
    aliases: ['urad dal', 'ulutham paruppu', 'ulunthu', 'black gram'],
    category: 'Basic Foods',
  },
  rava: {
    label: 'Rava / Semolina',
    aliases: ['rava', 'sooji', 'semolina', 'suji'],
    category: 'Basic Foods',
  },
  poha: {
    label: 'Poha / Flattened Rice',
    aliases: ['poha', 'aval', 'flattened rice', 'beaten rice', 'avalu'],
    category: 'Basic Foods',
  },
  pasta: {
    label: 'Pasta',
    aliases: ['pasta', 'penne', 'macaroni', 'noodles', 'fettuccine', 'spaghetti'],
    category: 'Basic Foods',
  },
  mushroom: {
    label: 'Mushroom',
    aliases: ['mushroom', 'mushrooms', 'kaalan', 'kalan'],
    category: 'Produce',
  },
  cream: {
    label: 'Cream',
    aliases: ['cream', 'heavy cream', 'malai', 'fresh cream'],
    category: 'Dairy',
  },
  carrot: {
    label: 'Carrot',
    aliases: ['carrot', 'carrots', 'gajar'],
    category: 'Produce',
  },
  beans: {
    label: 'Green Beans',
    aliases: ['beans', 'green beans', 'french beans'],
    category: 'Produce',
  },
  tamarind: {
    label: 'Tamarind',
    aliases: ['tamarind', 'puli', 'imli', 'tamarind paste'],
    category: 'Sauces & Spreads',
  },
  capsicum: {
    label: 'Capsicum / Bell Pepper',
    aliases: ['capsicum', 'bell pepper', 'kuda milagai'],
    category: 'Produce',
  },
  potato: {
    label: 'Potato',
    aliases: ['potato', 'potatoes', 'urulaikizhangu', 'urulai', 'aloo'],
    category: 'Produce',
  },
  turmeric: {
    label: 'Turmeric',
    aliases: ['turmeric', 'manjal', 'haldi', 'turmeric powder'],
    category: 'Lentils & Spices',
  },
  chilli_powder: {
    label: 'Chilli Powder',
    aliases: ['chilli powder', 'chili powder', 'milagai thool', 'lal mirch'],
    category: 'Lentils & Spices',
  },
  chapati: {
    label: 'Chapati / Roti',
    aliases: ['chapati', 'roti', 'phulka', 'flatbread', 'chappathi'],
    category: 'Bakery',
  },
};

/**
 * Standardizes a single ingredient word or query.
 */
export const normalizeIngredient = (raw: string): string | null => {
  if (!raw) return null;
  const cleaned = raw.toLowerCase().trim().replace(/['".,!?;:]/g, '');

  for (const [key, item] of Object.entries(INGREDIENT_DICTIONARY)) {
    if (key === cleaned) return key;
    if (item.aliases.some((alias) => alias === cleaned || cleaned.includes(alias) || alias.includes(cleaned))) {
      return key;
    }
  }

  // Common singularization fallback
  if (cleaned.endsWith('s')) {
    const singular = cleaned.slice(0, -1);
    for (const [key, item] of Object.entries(INGREDIENT_DICTIONARY)) {
      if (item.aliases.some((alias) => alias === singular)) return key;
    }
  }

  return null;
};

/**
 * Robust extractor that parses full natural sentences in English, Tamil, and Tanglish.
 * E.g.:
 * - "I have banana, milk, sugar and Boost"
 * - "Boost, milk, sugar, banana and Hershey's syrup"
 * - "En kitta banana, milk, sugar irukku"
 * - "En kitta muttai, thakkali, vengayam irukku"
 * - "banana iruku milk iruku enna panna mudiyum?"
 */
export const extractIngredientsFromText = (text: string): string[] => {
  if (!text || typeof text !== 'string') return [];

  // Normalize lower case and common punctuation
  let cleanText = text
    .toLowerCase()
    .replace(/[,&+]/g, ' ')
    .replace(/['"?!;:]/g, ' ')
    .replace(/\s+/g, ' ');

  const extracted = new Set<string>();

  // Check multi-word aliases first (e.g. "chocolate syrup", "hershey's syrup", "curry leaves", "toor dal", "bread slice")
  const sortedKeys = Object.keys(INGREDIENT_DICTIONARY).sort((a, b) => {
    const maxLenB = Math.max(...INGREDIENT_DICTIONARY[b].aliases.map((al) => al.length));
    const maxLenA = Math.max(...INGREDIENT_DICTIONARY[a].aliases.map((al) => al.length));
    return maxLenB - maxLenA;
  });

  for (const key of sortedKeys) {
    const { aliases } = INGREDIENT_DICTIONARY[key];
    for (const alias of aliases) {
      // Use regex with word boundaries where appropriate or substring for compounded Tamil words
      const pattern = new RegExp(`(^|\\s|\\b)${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\b|\\s|$)`, 'i');
      if (pattern.test(cleanText) || cleanText.includes(alias)) {
        extracted.add(key);
        // Remove matched words to avoid double matching smaller sub-words
        cleanText = cleanText.replace(new RegExp(alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), ' ');
        break;
      }
    }
  }

  // Also check individual tokens against dictionary
  const tokens = cleanText.split(/\s+/).filter(Boolean);
  for (const token of tokens) {
    const match = normalizeIngredient(token);
    if (match) {
      extracted.add(match);
    }
  }

  return Array.from(extracted);
};

export interface MatchedRecipeResult {
  recipe: any;
  matchPercentage: number;
  availableCount: number;
  totalRequired: number;
  availableIngredients: string[];
  missingIngredients: string[];
  optionalIngredients: string[];
}

/**
 * Computes match percentage and lists which ingredients user has vs needs.
 * Recipes with higher match percentages rank first.
 */
export const calculateRecipeMatch = (
  recipe: any,
  userIngredients: string[] // list of normalized keys (e.g. ['banana', 'milk', 'sugar'])
): MatchedRecipeResult => {
  const reqKeys: string[] = (recipe.normalizedRequired || []).map((i: string) => i.toLowerCase().trim());
  const optKeys: string[] = (recipe.normalizedOptional || []).map((i: string) => i.toLowerCase().trim());

  const userKeysSet = new Set(userIngredients.map((u) => u.toLowerCase().trim()));

  const available: string[] = [];
  const missing: string[] = [];
  const optionalFound: string[] = [];

  for (const req of reqKeys) {
    // Check if user has this ingredient or any alias
    if (userKeysSet.has(req)) {
      const displayLabel = INGREDIENT_DICTIONARY[req]?.label || req;
      available.push(displayLabel);
    } else {
      const displayLabel = INGREDIENT_DICTIONARY[req]?.label || req;
      missing.push(displayLabel);
    }
  }

  for (const opt of optKeys) {
    if (userKeysSet.has(opt)) {
      const displayLabel = INGREDIENT_DICTIONARY[opt]?.label || opt;
      optionalFound.push(displayLabel);
    }
  }

  const totalRequired = Math.max(1, reqKeys.length);
  const matchPercentage = Math.round((available.length / totalRequired) * 100);

  return {
    recipe,
    matchPercentage,
    availableCount: available.length,
    totalRequired,
    availableIngredients: available,
    missingIngredients: missing,
    optionalIngredients: optionalFound,
  };
};

/**
 * Cooking Time knowledge base for specific foods (Accurate, never confuses eggs with tomatoes)
 */
export const COOKING_TIME_DATABASE: Record<string, string> = {
  egg: 'Boiling an egg takes 6 minutes for soft-boiled (runny yolk), 8 minutes for medium-boiled, and 10 to 12 minutes for hard-boiled in gently boiling water with a pinch of salt.',
  rice: 'White rice (Sona Masoori or Ponni) takes 15 to 18 minutes on medium flame in an open pot (1:2 water ratio), or 3 whistles (approx 8 minutes) in a pressure cooker.',
  dosa: 'A crisp South Indian dosa takes about 1.5 to 2 minutes on a well-seasoned medium-hot cast iron tawa with 1 tsp of oil or ghee.',
  idli: 'Steaming soft idlis takes 10 to 12 minutes on medium-high steam in an idli steamer or cooker without the whistle weight.',
  potato: 'Medium potatoes take 12 to 15 minutes (3 to 4 whistles) in a pressure cooker, or 20 to 25 minutes if boiled in an open pot.',
  tomato: 'Simmer country tomatoes on medium flame for 6 to 8 minutes until skins naturally split and soften.',
  milkshake: 'A fresh Banana Milkshake takes just 2 to 3 minutes to blend until smooth and frothy.',
  tea: 'South Indian masala chai or filter coffee takes 4 to 5 minutes to boil milk, brew decoction, and froth.',
  upma: 'Rava upma takes 8 to 10 minutes total: 3 mins to temper spices and 5 mins to simmer roasted sooji in boiling water.',
  pasta: 'Dried pasta takes 8 to 10 minutes in rolling salted boiling water to reach al dente tenderness.',
};

export type IntentType =
  | 'ADD_INGREDIENT'
  | 'FIND_RECIPE'
  | 'COOKING_TIME'
  | 'OPEN_INVENTORY'
  | 'SHOPPING'
  | 'COOKING_MODE'
  | 'NAVIGATION'
  | 'UNKNOWN';

export interface ParsedUserIntent {
  intent: IntentType;
  extractedIngredients: string[];
  cookingTimeTopic?: string;
  addQuantity?: number;
  addUnit?: string;
  targetScreen?: string;
  querySummary: string;
}

/**
 * Intelligent Intent Detector supporting English, Tamil, and Tanglish.
 */
export const parseUserIntent = (rawInput: string): ParsedUserIntent => {
  const text = rawInput.toLowerCase().trim();
  const ingredients = extractIngredientsFromText(text);

  // 1. COOKING_TIME Intent:
  // e.g. "How long does it take to boil an egg?", "muttai boil panna evlo time aagum?", "how many minutes to cook rice?"
  const isTimeQuery =
    text.includes('how long') ||
    text.includes('how much time') ||
    text.includes('how many min') ||
    text.includes('evlo time') ||
    text.includes('evalavu neram') ||
    text.includes('evvalavu neram') ||
    text.includes('boil time') ||
    text.includes('cook time') ||
    text.includes('minutes to cook') ||
    text.includes('cooking time');

  if (isTimeQuery) {
    let topic = 'general';
    for (const key of Object.keys(COOKING_TIME_DATABASE)) {
      if (text.includes(key) || ingredients.includes(key)) {
        topic = key;
        break;
      }
    }
    // Check tamil words for topic
    if (text.includes('muttai') || text.includes('mutta')) topic = 'egg';
    if (text.includes('arisi') || text.includes('saadham') || text.includes('sadham')) topic = 'rice';
    if (text.includes('urulai') || text.includes('aloo')) topic = 'potato';
    if (text.includes('thakkali')) topic = 'tomato';

    return {
      intent: 'COOKING_TIME',
      extractedIngredients: ingredients,
      cookingTimeTopic: topic,
      querySummary: `Cooking time for ${topic}`,
    };
  }

  // 2. ADD_INGREDIENT Intent:
  // e.g. "Add tomato", "Add 2 eggs", "En kitta tomato irukku", "En kitta muttai irukku", "add milk"
  const isExplicitAdd =
    text.startsWith('add ') ||
    text.includes('add pan') ||
    text.includes('add pannu') ||
    text.includes('serthe');

  const isStatementOfHavingWithoutAskingWhatToCook =
    (text.includes('en kitta') || text.includes('enkitta') || text.includes('i have')) &&
    !text.includes('enna panna') &&
    !text.includes('what can i') &&
    !text.includes('what to make') &&
    !text.includes('enna samayikka') &&
    !text.includes('recipe');

  if (isExplicitAdd) {
    const qtyMatch = text.match(/(\d+)/);
    const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
    return {
      intent: 'ADD_INGREDIENT',
      extractedIngredients: ingredients,
      addQuantity: qty,
      querySummary: `Add ${ingredients.join(', ')}`,
    };
  }

  // 3. FIND_RECIPE Intent:
  // e.g. "What can I make with banana and milk?", "En kitta banana milk iruku enna panna mudiyum?",
  // "egg vechu enna panna mudiyum?", "what recipe can I make with these?", "what can I cook?"
  const isRecipeQuery =
    text.includes('what can i make') ||
    text.includes('what can i cook') ||
    text.includes('what to cook') ||
    text.includes('what to make') ||
    text.includes('enna panna mudiyum') ||
    text.includes('enna samayikka mudiyum') ||
    text.includes('enna cook panna') ||
    text.includes('recipe') ||
    text.includes('recipes') ||
    text.includes('samayal') ||
    text.includes('vechu enna') ||
    text.includes('what can we make') ||
    text.includes('what recipe');

  if (isRecipeQuery || (ingredients.length > 0 && isStatementOfHavingWithoutAskingWhatToCook)) {
    return {
      intent: 'FIND_RECIPE',
      extractedIngredients: ingredients,
      querySummary: `Find recipes using ${ingredients.join(', ')}`,
    };
  }

  // If user simply inputs ingredient names, e.g. "Boost, milk, sugar, banana and Hershey's syrup" or "egg tomato onion"
  if (ingredients.length >= 2) {
    return {
      intent: 'FIND_RECIPE',
      extractedIngredients: ingredients,
      querySummary: `Find recipes using ${ingredients.join(', ')}`,
    };
  }

  // 4. OPEN_INVENTORY Intent:
  // e.g. "Show my food", "Open my food", "Enna food irukku?", "open inventory"
  if (
    text.includes('my food') ||
    text.includes('open food') ||
    text.includes('show food') ||
    text.includes('inventory') ||
    text.includes('enna food irukku') ||
    text.includes('enna irukku')
  ) {
    return {
      intent: 'OPEN_INVENTORY',
      extractedIngredients: [],
      targetScreen: 'inventory',
      querySummary: 'Open My Food',
    };
  }

  // 5. SHOPPING Intent:
  // e.g. "What do I need to buy?", "Show shopping list", "shopping list"
  if (text.includes('shopping') || text.includes('what do i need to buy') || text.includes('buy')) {
    return {
      intent: 'SHOPPING',
      extractedIngredients: [],
      targetScreen: 'shopping-list',
      querySummary: 'Open Shopping List',
    };
  }

  // 6. COOKING_MODE Intent:
  // e.g. "Start cooking", "Start live cooking"
  if (text.includes('start cooking') || text.includes('live cooking') || text.includes('open cooking')) {
    return {
      intent: 'COOKING_MODE',
      extractedIngredients: [],
      targetScreen: 'live-cooking',
      querySummary: 'Start Live Cooking',
    };
  }

  // 7. NAVIGATION Intent:
  // e.g. "Go to dashboard", "Open food waste"
  if (text.includes('dashboard') || text.includes('home')) {
    return {
      intent: 'NAVIGATION',
      extractedIngredients: [],
      targetScreen: 'dashboard',
      querySummary: 'Go to Dashboard',
    };
  }
  if (text.includes('food waste') || text.includes('waste') || text.includes('analytics')) {
    return {
      intent: 'NAVIGATION',
      extractedIngredients: [],
      targetScreen: 'analytics',
      querySummary: 'Open Food Waste',
    };
  }
  if (text.includes('community')) {
    return {
      intent: 'NAVIGATION',
      extractedIngredients: [],
      targetScreen: 'community',
      querySummary: 'Open Community',
    };
  }
  if (text.includes('profile')) {
    return {
      intent: 'NAVIGATION',
      extractedIngredients: [],
      targetScreen: 'profile',
      querySummary: 'Open Profile',
    };
  }

  // Fallback
  return {
    intent: 'UNKNOWN',
    extractedIngredients: ingredients,
    querySummary: text,
  };
};
