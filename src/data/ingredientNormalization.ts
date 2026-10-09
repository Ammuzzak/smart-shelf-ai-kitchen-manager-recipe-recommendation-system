// Ingredient normalization dictionary and utility functions
// Supports common Tamil + English food words, variations, spelling mistakes, plurals, and casual phrases.

export interface IngredientAlias {
  standard: string; // e.g. "egg", "tomato", "banana", "milk", "boost", "chocolate syrup", "mango", "condensed milk"
  displayName: string;
  keywords: string[];
}

export const INGREDIENT_ALIASES: IngredientAlias[] = [
  // Multi-word and specific phrases first!
  {
    standard: 'condensed milk',
    displayName: 'Condensed Milk',
    keywords: [
      'condensed milk', 'condence milk', 'condens milk', 'mithaimate', 'milkmaid', 'sweetened condensed milk'
    ]
  },
  {
    standard: 'chocolate syrup',
    displayName: 'Chocolate Syrup',
    keywords: [
      'chocolate syrup', 'hershey syrup', "hershey's syrup", "hersheys syrup", 'hershey', 'hersheys',
      'cocoa syrup', 'chocolate sauce', 'choc syrup'
    ]
  },
  {
    standard: 'mango',
    displayName: 'Mango',
    keywords: [
      'mango', 'mangoes', 'mangos', 'manga', 'maanga', 'maangai', 'mampazham', 'maampazham', 'aam'
    ]
  },
  {
    standard: 'milk',
    displayName: 'Milk',
    keywords: [
      'milk', 'paal', 'paalu', 'paale', 'pal', 'doodh', 'whole milk', 'skim milk', 'fresh milk', 'cow milk'
    ]
  },
  {
    standard: 'sugar',
    displayName: 'Sugar',
    keywords: [
      'sugar', 'sarkkarai', 'sakkarai', 'chini', 'cheeni', 'white sugar', 'cane sugar'
    ]
  },
  {
    standard: 'boost',
    displayName: 'Boost',
    keywords: [
      'boost', 'boost powder', 'boost drink', 'horlicks', 'milo', 'bournvita', 'malt'
    ]
  },
  {
    standard: 'banana',
    displayName: 'Banana',
    keywords: [
      'banana', 'bananas', 'vazhaipazham', 'vazha pazham', 'valapalam', 'valai palam', 'vazhaipalam', 'kela'
    ]
  },
  {
    standard: 'egg',
    displayName: 'Egg',
    keywords: [
      'egg', 'eggs', 'muttai', 'mutta', 'muttaye', 'muttay', 'anda', 'ande',
      'boiled egg', 'egg white', 'egg yolk', 'omelet', 'omlet', 'omelette'
    ]
  },
  {
    standard: 'tomato',
    displayName: 'Tomato',
    keywords: [
      'tomato', 'tomatoes', 'thakkali', 'thakkali pazham', 'thakkalipazham', 'thakkali pazhangal', 'tamatar'
    ]
  },
  {
    standard: 'onion',
    displayName: 'Onion',
    keywords: [
      'onion', 'onions', 'vengayam', 'vengaayam', 'vengaiyam', 'shallot', 'shallots', 'chinna vengayam', 'periya vengayam', 'pyaz'
    ]
  },
  {
    standard: 'bread',
    displayName: 'Bread',
    keywords: [
      'bread', 'breads', 'bread slice', 'bread slices', 'sandwich bread', 'white bread', 'brown bread', 'toast'
    ]
  },
  {
    standard: 'yogurt',
    displayName: 'Yogurt / Curd',
    keywords: [
      'curd', 'yogurt', 'yoghurt', 'thayir', 'thair', 'dahi'
    ]
  },
  {
    standard: 'cheese',
    displayName: 'Cheese',
    keywords: [
      'cheese', 'cheddar', 'mozzarella', 'paneer', 'cheese slice', 'cheese slices'
    ]
  },
  {
    standard: 'butter',
    displayName: 'Butter',
    keywords: [
      'butter', 'vennai', 'makhan'
    ]
  },
  {
    standard: 'ghee',
    displayName: 'Ghee',
    keywords: [
      'ghee', 'nei', 'ney'
    ]
  },
  {
    standard: 'rice',
    displayName: 'Rice',
    keywords: [
      'rice', 'arisi', 'saatham', 'sadham', 'sadam', 'sona masoori', 'basmati', 'cooked rice', 'chawal'
    ]
  },
  {
    standard: 'lemon',
    displayName: 'Lemon',
    keywords: [
      'lemon', 'lemons', 'elumichai', 'elumichampazham', 'elumpichai', 'nimbu', 'lime', 'lemon juice'
    ]
  },
  {
    standard: 'spinach',
    displayName: 'Spinach',
    keywords: [
      'spinach', 'palak', 'keerai', 'keera', 'pasalai keerai'
    ]
  },
  {
    standard: 'toor dal',
    displayName: 'Toor Dal (Lentils)',
    keywords: [
      'toor dal', 'tuvar dal', 'paruppu', 'thuvaram paruppu', 'dal', 'dhal', 'lentils', 'yellow lentils'
    ]
  },
  {
    standard: 'potato',
    displayName: 'Potato',
    keywords: [
      'potato', 'potatoes', 'urulaikizhangu', 'urulai', 'aloo', 'alu'
    ]
  },
  {
    standard: 'carrot',
    displayName: 'Carrot',
    keywords: [
      'carrot', 'carrots', 'gajar'
    ]
  },
  {
    standard: 'beans',
    displayName: 'French Beans',
    keywords: [
      'beans', 'green beans', 'french beans', 'beans kai'
    ]
  },
  {
    standard: 'mushroom',
    displayName: 'Mushroom',
    keywords: [
      'mushroom', 'mushrooms', 'kalan', 'kaalan', 'khumbi'
    ]
  },
  {
    standard: 'cream',
    displayName: 'Heavy Cream',
    keywords: [
      'cream', 'heavy cream', 'malai', 'fresh cream'
    ]
  },
  {
    standard: 'pasta',
    displayName: 'Pasta',
    keywords: [
      'pasta', 'macaroni', 'penne', 'spaghetti', 'noodles', 'fettuccine'
    ]
  },
  {
    standard: 'oil',
    displayName: 'Cooking Oil',
    keywords: [
      'oil', 'cooking oil', 'ennai', 'nallennai', 'sesame oil', 'refine oil', 'sunflower oil', 'tel'
    ]
  },
  {
    standard: 'garlic',
    displayName: 'Garlic',
    keywords: [
      'garlic', 'poondu', 'lahsun', 'lasun'
    ]
  },
  {
    standard: 'ginger',
    displayName: 'Ginger',
    keywords: [
      'ginger', 'inji', 'adrak'
    ]
  },
  {
    standard: 'green chilli',
    displayName: 'Green Chilli',
    keywords: [
      'green chilli', 'green chillies', 'green chili', 'pachai milagai', 'pacha milagai', 'hari mirch'
    ]
  },
  {
    standard: 'coriander',
    displayName: 'Coriander / Cilantro',
    keywords: [
      'coriander', 'cilantro', 'kothamalli', 'koththamalli', 'dhaniya patta'
    ]
  },
  {
    standard: 'curry leaves',
    displayName: 'Curry Leaves',
    keywords: [
      'curry leaves', 'kariveppilai', 'karuveppilai', 'kadi patta'
    ]
  },
  {
    standard: 'mustard seeds',
    displayName: 'Mustard Seeds',
    keywords: [
      'mustard', 'mustard seeds', 'kadugu', 'rai'
    ]
  },
  {
    standard: 'cumin seeds',
    displayName: 'Cumin Seeds',
    keywords: [
      'cumin', 'cumin seeds', 'jeera', 'seeragam'
    ]
  },
  {
    standard: 'pepper',
    displayName: 'Black Pepper',
    keywords: [
      'pepper', 'black pepper', 'milagu', 'kali mirch'
    ]
  },
  {
    standard: 'salt',
    displayName: 'Salt',
    keywords: [
      'salt', 'uppu', 'namak'
    ]
  },
  {
    standard: 'turmeric',
    displayName: 'Turmeric',
    keywords: [
      'turmeric', 'manjal', 'manjal thool', 'haldi'
    ]
  },
  {
    standard: 'red chilli powder',
    displayName: 'Red Chilli Powder',
    keywords: [
      'chilli powder', 'red chilli powder', 'milagai thool', 'lal mirch'
    ]
  },
  {
    standard: 'tamarind',
    displayName: 'Tamarind',
    keywords: [
      'tamarind', 'puli', 'imli', 'tamarind paste'
    ]
  },
  {
    standard: 'coconut',
    displayName: 'Coconut',
    keywords: [
      'coconut', 'grated coconut', 'thengai', 'thengai thuruval', 'nariyal'
    ]
  },
  {
    standard: 'dosa batter',
    displayName: 'Idli/Dosa Batter',
    keywords: [
      'batter', 'dosa batter', 'idli batter', 'maavu', 'mavu', 'idli mavu', 'fermented batter'
    ]
  },
  {
    standard: 'rava',
    displayName: 'Rava / Semolina',
    keywords: [
      'rava', 'sooji', 'suji', 'semolina', 'bombay rava'
    ]
  },
  {
    standard: 'poha',
    displayName: 'Poha / Flattened Rice',
    keywords: [
      'poha', 'aval', 'avalu', 'flattened rice'
    ]
  },
  {
    standard: 'puttu flour',
    displayName: 'Puttu Flour / Rice Flour',
    keywords: [
      'puttu flour', 'rice flour', 'arisi maavu', 'puttu podi', 'puttu'
    ]
  },
  {
    standard: 'wheat flour',
    displayName: 'Wheat Flour / Atta',
    keywords: [
      'atta', 'wheat flour', 'godhumai maavu', 'chapati flour'
    ]
  },
  {
    standard: 'urad dal',
    displayName: 'Urad Dal',
    keywords: [
      'urad dal', 'ulundhu', 'ulunthu', 'black gram'
    ]
  },
  {
    standard: 'sambar powder',
    displayName: 'Sambar Powder',
    keywords: [
      'sambar powder', 'sambar podi'
    ]
  },
  {
    standard: 'rasam powder',
    displayName: 'Rasam Powder',
    keywords: [
      'rasam powder', 'rasam podi'
    ]
  },
  {
    standard: 'hing',
    displayName: 'Asafoetida (Hing)',
    keywords: [
      'hing', 'asafoetida', 'perungayam'
    ]
  },
  {
    standard: 'chicken',
    displayName: 'Chicken',
    keywords: [
      'chicken', 'kozhi', 'koli', 'chickan', 'chickn', 'murgh', 'murg', 'chicken piece', 'chicken breast', 'nattu kozhi'
    ]
  },
  {
    standard: 'mutton',
    displayName: 'Mutton / Lamb',
    keywords: [
      'mutton', 'aatu kari', 'aattukari', 'goat meat', 'lamb', 'gosht'
    ]
  },
  {
    standard: 'fish',
    displayName: 'Fish / Seafood',
    keywords: [
      'fish', 'meen', 'machli', 'prawn', 'prawns', 'iraal'
    ]
  },
  {
    standard: 'paneer',
    displayName: 'Paneer',
    keywords: [
      'paneer', 'panir', 'cottage cheese'
    ]
  },
];

// Helper to remove punctuation and extra spaces
function cleanPhrase(text: string): string {
  return text
    .toLowerCase()
    .replace(/[,\.?!;:\-_/\\()\"\'`+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Very small list of optional basic kitchen ingredients that may be assumed to be available.
 * Everything else MUST come strictly from what the user has.
 */
export const ASSUMED_BASIC_INGREDIENTS = new Set<string>(['salt', 'water', 'oil']);

/**
 * Robust ingredient extractor from natural sentences.
 * Extracts ALL recognized ingredients, without stopping or missing any.
 *
 * Examples tested:
 * - "i have milk, mango, sugar and condensed milk"
 *   -> ["milk", "mango", "sugar", "condensed milk"]
 * - "En kitta paal, manga, sugar, condensed milk irukku"
 *   -> ["milk", "mango", "sugar", "condensed milk"]
 * - "Enkitta mango iruku paal iruku"
 *   -> ["mango", "milk"]
 * - "mango milk vechu enna panna mudiyum"
 *   -> ["mango", "milk"]
 */
export function extractIngredientsFromSentence(query: string): string[] {
  if (!query) return [];

  // Replace separators with spaces, keeping standard spacing
  let normalized = ` ${cleanPhrase(query)} `;

  // Sort aliases: multi-word phrases first (e.g. "condensed milk", "chocolate syrup")
  // so "condensed milk" is matched and removed before "milk" can consume it!
  const sortedAliases = [...INGREDIENT_ALIASES].sort((a, b) => {
    const maxA = Math.max(...a.keywords.map((k) => k.length));
    const maxB = Math.max(...b.keywords.map((k) => k.length));
    return maxB - maxA;
  });

  const foundStandards: string[] = [];

  for (const alias of sortedAliases) {
    for (const keyword of alias.keywords) {
      const cleanKw = cleanPhrase(keyword);
      // Word boundary regex
      const regex = new RegExp(`(^|\\s)${cleanKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|\\s)`, 'i');
      if (regex.test(normalized)) {
        if (!foundStandards.includes(alias.standard)) {
          foundStandards.push(alias.standard);
        }
        // Mask out the matched keyword with placeholder spaces so substrings don't get double matched incorrectly
        normalized = normalized.replace(regex, ' ___ ');
        break;
      }
    }
  }

  return foundStandards;
}

/**
 * Normalizes a single ingredient string into standard key
 */
export function normalizeSingleIngredient(name: string): string {
  const cleaned = cleanPhrase(name);
  // Multi-word first
  const sorted = [...INGREDIENT_ALIASES].sort((a, b) => {
    const maxA = Math.max(...a.keywords.map((k) => k.length));
    const maxB = Math.max(...b.keywords.map((k) => k.length));
    return maxB - maxA;
  });

  for (const alias of sorted) {
    for (const kw of alias.keywords) {
      const ckw = cleanPhrase(kw);
      if (cleaned === ckw || cleaned.startsWith(ckw + ' ') || cleaned.endsWith(' ' + ckw) || cleaned.includes(` ${ckw} `)) {
        return alias.standard;
      }
    }
  }
  return cleaned;
}

/**
 * Gets display name for standard ingredient
 */
export function getIngredientDisplayName(standard: string): string {
  const match = INGREDIENT_ALIASES.find((a) => a.standard === standard);
  if (match) return match.displayName;
  return standard.charAt(0).toUpperCase() + standard.slice(1);
}
