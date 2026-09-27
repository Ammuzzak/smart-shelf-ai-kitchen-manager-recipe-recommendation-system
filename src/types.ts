export type StorageLocation = 'Crisper' | 'Shelf A' | 'Shelf B' | 'Jar' | 'Freezer' | 'Spice Box' | 'Pantry Bin';

export type FoodCategory =
  | 'Produce'
  | 'Dairy'
  | 'Basic Foods'
  | 'Staples'
  | 'Lentils & Spices'
  | 'Bakery'
  | 'Oils'
  | 'Sauces & Spreads'
  | 'Condiments';

export interface InventoryItem {
  id: string;
  name: string;
  category: FoodCategory;
  quantity: number;
  unit: string;
  location: string;
  expiryDate: string; // YYYY-MM-DD
  purchaseDate: string;
  daysLeft: number;
  atRisk: boolean;
  urgencyStatus: 'critical' | 'urgent' | 'warning' | 'optimal';
  usedAmountNote?: string;
  caloriesApprox?: number;
  costEstimate?: number;
}

export interface RecipeStep {
  stepNumber: number;
  title: string;
  duration: string;
  badge?: string;
  aiPreservationRule?: string;
  instructions: string[];
  ingredientsForStep?: Array<{
    name: string;
    quantity: string;
    isRescued?: boolean;
    note?: string;
  }>;
}

export interface Recipe {
  id: string;
  title: string;
  subtitle?: string;
  prepTime: string;
  cookTime: string;
  servings: number;
  description: string;
  cuisine: string;
  category: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Side';
  image: string;
  atRiskIngredients: Array<{
    name: string;
    urgency: string;
    status: 'critical' | 'urgent' | 'warning' | 'optimal';
  }>;
  pantryItems: string[];
  missingIngredients?: string[];
  rescueWeight: string;
  moneySaved: string;
  activeSubstitution?: {
    from: string;
    to: string;
    reason: string;
    rescuedItem: string;
  };
  chefQuote?: {
    author: string;
    text: string;
  };
  steps: RecipeStep[];
  normalizedRequired?: string[];
  normalizedOptional?: string[];
  videoUrl?: string;
  matchPercentage?: number;
  availableIngredientsList?: string[];
  missingIngredientsList?: string[];
}

export interface ActivityItem {
  id: string;
  text: string;
  time: string;
  type: 'add' | 'cook' | 'save' | 'shopping';
}

export interface DailyMealRescue {
  id: string;
  dateKey: string; // '2026-09-14' or 'Wed 14'
  mealType: 'Breakfast' | 'Lunch' | 'Dinner';
  recipeId: string;
  title: string;
  subtitle: string;
  image: string;
  rescuedIngredients: Array<{
    name: string;
    urgency: string;
    status: 'critical' | 'urgent' | 'warning' | 'normal';
  }>;
}

export interface ShoppingItem {
  id: string;
  name: string;
  purpose: string;
  quantity: string;
  checked: boolean;
  category: 'rescue' | 'staple' | 'custom';
  estimatedCost: number;
  isStapleCheck?: boolean;
}

export interface CommunityPost {
  id: string;
  author: string;
  authorAvatar: string;
  badge: string;
  title: string;
  description: string;
  image: string;
  likes: number;
  comments: number;
  bookmarked: boolean;
  liked: boolean;
  category: 'Recipes' | 'Tips' | 'Stories';
}

export interface UserSettings {
  name: string;
  roleTitle: string;
  badge: string;
  dietaryPreference: string;
  notificationSettings: string;
  kitchenStorageGuide: string;
  householdMembers: number;
  theme: 'Dark Mode' | 'Light Mode';
  wasteSavedKg: number;
  moneySavedInr: number;
  recipesMastered: number;
  voiceAssistantEnabled: boolean;
}

export interface CompletedSessionInfo {
  recipeId: string;
  title: string;
  subtitle?: string;
  rescueWeight: string;
  moneySaved: string;
  rescuedItemsText: string;
  rescuedIngredientsNote: string;
  timestamp: string;
}

export type ActiveScreen =
  | 'dashboard'
  | 'inventory'
  | 'recipes'
  | 'rescue'
  | 'analytics'
  | 'community'
  | 'profile'
  | 'shopping-list'
  | 'live-cooking';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'alert' | 'success' | 'info';
  read: boolean;
  linkScreen?: ActiveScreen;
}
