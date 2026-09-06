import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  InventoryItem,
  Recipe,
  DailyMealRescue,
  ShoppingItem,
  CommunityPost,
  UserSettings,
  ActiveScreen,
  FoodCategory,
  NotificationItem,
  CompletedSessionInfo,
} from '../types';
import {
  INITIAL_INVENTORY,
  RECIPES_DATA,
  DAILY_RESCUE_SCHEDULE,
  INITIAL_SHOPPING_ITEMS,
  COMMUNITY_POSTS,
  INITIAL_USER_SETTINGS,
} from '../data/initialData';

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Urgent: Fermented Batter (34h left)',
    message: 'High acidity risk detected in Crisper Shelf. AI recommends making Kara Paniyaram tomorrow breakfast.',
    time: '10m ago',
    type: 'alert',
    read: false,
    linkScreen: 'rescue',
  },
  {
    id: 'notif-2',
    title: 'IoT Crisper Scale Calibrated',
    message: 'Weight auto-deducted 560g following Tangy Tomato Rasam cooking session. ₹185 saved.',
    time: '25m ago',
    type: 'success',
    read: false,
    linkScreen: 'inventory',
  },
  {
    id: 'notif-3',
    title: 'Smart Shopping Checklist',
    message: '3 pantry staples verified. 2 fresh produce items needed for upcoming rescue meals.',
    time: '1h ago',
    type: 'info',
    read: false,
    linkScreen: 'shopping-list',
  },
];

interface KitchenContextType {
  activeScreen: ActiveScreen;
  setActiveScreen: (screen: ActiveScreen) => void;
  inventory: InventoryItem[];
  recipes: Recipe[];
  dailySchedule: DailyMealRescue[];
  shoppingItems: ShoppingItem[];
  communityPosts: CommunityPost[];
  userSettings: UserSettings;
  activeRecipe: Recipe | null;
  setActiveRecipe: (r: Recipe | null) => void;
  activeCookingRecipe: Recipe | null;
  setActiveCookingRecipe: (r: Recipe | null) => void;
  activeCookingStep: number;
  setActiveCookingStep: (step: number) => void;
  isHeyChefOpen: boolean;
  setIsHeyChefOpen: (open: boolean) => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  toastMessage: string | null;
  setToastMessage: (msg: string | null) => void;
  lastCompletedSession: CompletedSessionInfo;
  setLastCompletedSession: (session: CompletedSessionInfo) => void;
  // Inventory actions
  adjustItemQuantity: (id: string, delta: number) => void;
  addItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateItem: (id: string, updatedFields: Partial<InventoryItem>) => void;
  deleteItem: (id: string) => void;
  editingInventoryItem: InventoryItem | null;
  setEditingInventoryItem: (item: InventoryItem | null) => void;
  // Recipe detail modal
  selectedRecipeForDetail: Recipe | null;
  setSelectedRecipeForDetail: (r: Recipe | null) => void;
  isRecipeDetailOpen: boolean;
  setIsRecipeDetailOpen: (open: boolean) => void;
  // Notifications
  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;
  // Shopping actions
  toggleShoppingItem: (id: string) => void;
  addShoppingItem: (name: string, purpose: string, quantity: string) => void;
  verifyAllStaples: () => void;
  // Community actions
  toggleLikePost: (id: string) => void;
  toggleBookmarkPost: (id: string) => void;
  addCommunityPost: (post: { title: string; description: string; badge?: string; category?: 'Recipes' | 'Tips' | 'Stories' }) => void;
  // User settings action
  updateUserSettings: (updater: Partial<UserSettings> | ((prev: UserSettings) => UserSettings)) => void;
  // Hey Chef timer
  chefTimerSeconds: number;
  isChefTimerRunning: boolean;
  startChefTimer: (seconds: number) => void;
  pauseChefTimer: () => void;
  addChefTimerMins: (mins: number) => void;
  resetChefTimer: () => void;
  // Finish cooking
  completeCookingSession: (recipe: Recipe) => void;
}

export const deriveRecipeWithInventory = (recipe: Recipe, inv: InventoryItem[]): Recipe => {
  const invTerms = inv.filter((item) => item.quantity > 0);

  const checkHasIngredient = (query: string) => {
    const q = query.toLowerCase().trim();
    return invTerms.find((item) => {
      const n = item.name.toLowerCase();
      if (n.includes(q) || q.includes(n)) return true;
      if (q === 'eggs' && n.includes('egg')) return true;
      if (q === 'egg' && n.includes('egg')) return true;
      if (q === 'spinach' && (n.includes('palak') || n.includes('spinach'))) return true;
      if (q === 'palak' && (n.includes('palak') || n.includes('spinach'))) return true;
      if (q === 'coriander' && (n.includes('cilantro') || n.includes('coriander'))) return true;
      if (q === 'cilantro' && (n.includes('cilantro') || n.includes('coriander'))) return true;
      if (q === 'shallots' && (n.includes('onion') || n.includes('shallot'))) return true;
      if (q === 'sambar onions' && (n.includes('onion') || n.includes('shallot'))) return true;
      if (q === 'tomatoes' && n.includes('tomato')) return true;
      if (q === 'batter' && n.includes('batter')) return true;
      if (q === 'coconut' && n.includes('coconut')) return true;
      if (q === 'mushrooms' && n.includes('mushroom')) return true;
      if (q === 'cream' && n.includes('cream')) return true;
      if (q === 'pasta' && (n.includes('pasta') || n.includes('fettuccine') || n.includes('penne'))) return true;
      if (q === 'carrots' && n.includes('carrot')) return true;
      if (q === 'beans' && n.includes('bean')) return true;
      if (q === 'toor dal' && (n.includes('toor dal') || n.includes('dal'))) return true;
      return false;
    });
  };

  let missing: string[] = [];
  let atRisk: { name: string; urgency: string; status: 'critical' | 'urgent' | 'warning' }[] = [];
  let pantry: string[] = [];

  if (recipe.id === 'spinach-tomato-omelette') {
    const hasEggs = checkHasIngredient('egg');
    const hasSpinach = checkHasIngredient('spinach');
    const hasTomatoes = checkHasIngredient('tomato');
    if (!hasEggs) missing.push('Eggs (2-3)');
    if (!hasSpinach) missing.push('Spinach (1 bunch)');
    if (!hasTomatoes) missing.push('Tomatoes (1-2)');
    if (hasSpinach) pantry.push(hasSpinach.name);
    if (hasTomatoes) pantry.push(hasTomatoes.name);
    if (hasEggs) pantry.push(hasEggs.name);
  } else if (recipe.id === 'creamy-mushroom-pasta') {
    const hasCream = checkHasIngredient('cream');
    const hasMushrooms = checkHasIngredient('mushroom');
    const hasPasta = checkHasIngredient('pasta');
    if (!hasPasta) missing.push('Fettuccine or Penne');
    if (!hasCream) missing.push('Heavy Cream');
    if (!hasMushrooms) missing.push('Mushrooms');
    if (hasCream) pantry.push(hasCream.name);
    if (hasMushrooms) pantry.push(hasMushrooms.name);
    if (hasPasta) pantry.push(hasPasta.name);
  } else if (recipe.id === 'mixed-veg-sambar') {
    const hasDrumstick = checkHasIngredient('drumstick');
    const hasDal = checkHasIngredient('toor dal');
    const hasOnion = checkHasIngredient('shallot');
    if (!hasDrumstick) missing.push('Drumstick (optional)');
    if (!hasDal) missing.push('Toor Dal');
    if (hasDal) pantry.push(hasDal.name);
    if (hasOnion) pantry.push(hasOnion.name);
  } else if (recipe.id === 'tangy-tomato-rasam') {
    const hasTomatoes = checkHasIngredient('tomato');
    const hasCoriander = checkHasIngredient('coriander');
    if (!hasTomatoes) missing.push('Country Tomatoes');
    if (hasTomatoes) pantry.push(hasTomatoes.name);
    if (hasCoriander) pantry.push(hasCoriander.name);
  } else if (recipe.id === 'kara-kuzhi-paniyaram') {
    const hasBatter = checkHasIngredient('batter');
    const hasCoconut = checkHasIngredient('coconut');
    if (!hasBatter) missing.push('Fermented Batter');
    if (hasBatter) pantry.push(hasBatter.name);
    if (hasCoconut) pantry.push(hasCoconut.name);
  } else {
    missing = (recipe.missingIngredients || []).filter((m) => !checkHasIngredient(m));
  }

  const termsToCheck = [
    ...(recipe.atRiskIngredients?.map((a) => a.name) || []),
    ...(recipe.pantryItems || []),
    recipe.title,
  ];

  invTerms.forEach((item) => {
    if ((item.atRisk || item.daysLeft <= 2) && item.quantity > 0) {
      const match = termsToCheck.some((t) => {
        const query = t.toLowerCase();
        const itemName = item.name.toLowerCase();
        return (
          itemName.includes(query) ||
          query.includes(itemName) ||
          (query.includes('tomato') && itemName.includes('tomato')) ||
          (query.includes('batter') && itemName.includes('batter')) ||
          (query.includes('coconut') && itemName.includes('coconut')) ||
          (query.includes('spinach') && (itemName.includes('spinach') || itemName.includes('palak'))) ||
          (query.includes('coriander') && itemName.includes('coriander')) ||
          (query.includes('egg') && itemName.includes('egg')) ||
          (query.includes('mushroom') && itemName.includes('mushroom')) ||
          (query.includes('cream') && itemName.includes('cream')) ||
          (query.includes('shallot') && (itemName.includes('shallot') || itemName.includes('onion')))
        );
      });
      if (match && !atRisk.some((a) => a.name === item.name)) {
        const mappedStatus: 'critical' | 'urgent' | 'warning' =
          item.urgencyStatus === 'critical' ? 'critical' : item.urgencyStatus === 'urgent' ? 'urgent' : 'warning';
        atRisk.push({
          name: item.name,
          urgency: item.daysLeft <= 0 ? 'Today' : `${item.daysLeft}d left`,
          status: mappedStatus,
        });
      }
    }
  });

  if (atRisk.length === 0 && recipe.atRiskIngredients) {
    atRisk = recipe.atRiskIngredients;
  }
  if (pantry.length === 0 && recipe.pantryItems) {
    pantry = recipe.pantryItems;
  }

  return {
    ...recipe,
    missingIngredients: missing,
    atRiskIngredients: atRisk,
    pantryItems: pantry,
  };
};

const KitchenContext = createContext<KitchenContextType | undefined>(undefined);

export const KitchenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('dashboard');
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [dailySchedule] = useState<DailyMealRescue[]>(DAILY_RESCUE_SCHEDULE);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>(INITIAL_SHOPPING_ITEMS);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(COMMUNITY_POSTS);
  const [userSettings, setUserSettings] = useState<UserSettings>(INITIAL_USER_SETTINGS);
  
  const [editingInventoryItem, setEditingInventoryItem] = useState<InventoryItem | null>(null);
  const [selectedRecipeForDetail, setSelectedRecipeForDetail] = useState<Recipe | null>(null);
  const [isRecipeDetailOpen, setIsRecipeDetailOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);

  const [lastCompletedSession, setLastCompletedSession] = useState<CompletedSessionInfo>({
    recipeId: 'tangy-tomato-rasam',
    title: 'Tangy Tomato Rasam',
    subtitle: '(Lemon Infused)',
    rescueWeight: '560g',
    moneySaved: '₹185',
    rescuedItemsText: '4 items rescued (560g) • ₹185 saved • IoT scale and crisper pantry inventory auto-deducted accurately.',
    rescuedIngredientsNote: 'Coriander, Lemon & Overripe Tomatoes salvaged',
    timestamp: 'Recent session',
  });

  // Dynamically compute recipe recommendations and at-risk matching from current inventory
  const recipes = useMemo(() => {
    return RECIPES_DATA.map((recipe) => deriveRecipeWithInventory(recipe, inventory));
  }, [inventory]);

  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(RECIPES_DATA[0]);
  const [activeCookingRecipe, setActiveCookingRecipe] = useState<Recipe | null>(RECIPES_DATA[0]);
  const [activeCookingStep, setActiveCookingStep] = useState<number>(4); // Default Step 4 matching Image 7
  const [isHeyChefOpen, setIsHeyChefOpen] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(
    'Tangy Tomato Rasam Completed! 4 items rescued (560g) • ₹185 saved • Scale & Pantry inventory auto-calibrated'
  );

  // Chef Timer state & live interval
  const [chefTimerSeconds, setChefTimerSeconds] = useState<number>(408); // 06:48
  const [isChefTimerRunning, setIsChefTimerRunning] = useState<boolean>(true);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isChefTimerRunning && chefTimerSeconds > 0) {
      interval = setInterval(() => {
        setChefTimerSeconds((prev) => {
          if (prev <= 1) {
            setIsChefTimerRunning(false);
            setToastMessage('Timer complete: Rasam tomatoes simmered to perfection!');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isChefTimerRunning, chefTimerSeconds]);

  const startChefTimer = (seconds: number) => {
    setChefTimerSeconds(seconds);
    setIsChefTimerRunning(true);
  };

  const pauseChefTimer = () => {
    setIsChefTimerRunning((prev) => !prev);
  };

  const addChefTimerMins = (mins: number) => {
    setChefTimerSeconds((prev) => prev + mins * 60);
  };

  const resetChefTimer = () => {
    setChefTimerSeconds(0);
    setIsChefTimerRunning(false);
  };

  const adjustItemQuantity = (id: string, delta: number) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(0, +(item.quantity + delta).toFixed(2));
          return {
            ...item,
            quantity: newQty,
            usedAmountNote: delta < 0 ? `${Math.abs(delta)}${item.unit} calibrated` : `+${delta}${item.unit} added`,
            atRisk: newQty > 0 ? item.atRisk : false,
          };
        }
        return item;
      })
    );
  };

  const addItem = (newItem: Omit<InventoryItem, 'id'>) => {
    const days = newItem.daysLeft ?? 7;
    const isAtRisk = days <= 2;
    const urgency: 'critical' | 'urgent' | 'warning' | 'optimal' =
      days <= 1 ? 'critical' : days <= 2 ? 'urgent' : days <= 4 ? 'warning' : 'optimal';

    const created: InventoryItem = {
      ...newItem,
      id: `inv-${Date.now()}`,
      daysLeft: days,
      atRisk: isAtRisk,
      urgencyStatus: urgency,
    };

    setInventory((prev) => [created, ...prev]);

    if (isAtRisk) {
      const alertNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        title: `Urgent Shelf Expiry: ${created.name} (${created.daysLeft}d left)`,
        message: `High risk in ${created.location}. AI meal rescue recommendations active in Recipe Hub.`,
        time: 'Just now',
        type: 'alert',
        read: false,
        linkScreen: 'recipes',
      };
      setNotifications((prev) => [alertNotif, ...prev]);
    }

    setToastMessage(
      `Added ${created.name} (${created.quantity} ${created.unit}) • Expiry in ${created.daysLeft}d • Auto-calibrated`
    );
  };

  const updateItem = (id: string, updatedFields: Partial<InventoryItem>) => {
    setInventory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updatedFields } : item))
    );
    setToastMessage('Item details updated successfully');
  };

  const deleteItem = (id: string) => {
    setInventory((prev) => prev.filter((item) => item.id !== id));
    setToastMessage('Item removed from pantry inventory');
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
    setToastMessage('All notifications cleared');
  };

  const toggleShoppingItem = (id: string) => {
    setShoppingItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const addShoppingItem = (name: string, purpose: string, quantity: string) => {
    const newItem: ShoppingItem = {
      id: `shop-${Date.now()}`,
      name,
      purpose,
      quantity,
      checked: false,
      category: 'custom',
      estimatedCost: 50,
    };
    setShoppingItems((prev) => [newItem, ...prev]);
    setToastMessage(`Added "${name}" to your Smart Shopping list`);
  };

  const verifyAllStaples = () => {
    setShoppingItems((prev) =>
      prev.map((item) => (item.isStapleCheck ? { ...item, checked: true } : item))
    );
    setToastMessage('All staples verified in pantry! Shopping list updated.');
  };

  const toggleLikePost = (id: string) => {
    setCommunityPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              liked: !p.liked,
              likes: p.liked ? p.likes - 1 : p.likes + 1,
            }
          : p
      )
    );
  };

  const toggleBookmarkPost = (id: string) => {
    setCommunityPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, bookmarked: !p.bookmarked } : p))
    );
  };

  const addCommunityPost = (post: {
    title: string;
    description: string;
    badge?: string;
    category?: 'Recipes' | 'Tips' | 'Stories';
  }) => {
    const newPost: CommunityPost = {
      id: `comm-${Date.now()}`,
      author: userSettings.name,
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      badge: post.badge || 'Zero Waste Tip',
      title: post.title,
      description: post.description,
      image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&auto=format&fit=crop&q=80',
      likes: 1,
      comments: 0,
      bookmarked: false,
      liked: true,
      category: post.category || 'Tips',
    };
    setCommunityPosts((prev) => [newPost, ...prev]);
    setToastMessage(`Your rescue tip "${post.title}" was published to the Community Hub!`);
  };

  const updateUserSettings = (
    updater: Partial<UserSettings> | ((prev: UserSettings) => UserSettings)
  ) => {
    setUserSettings((prev) => (typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }));
  };

  const completeCookingSession = (recipe: Recipe) => {
    const savedAmount = parseInt(recipe.moneySaved.replace(/\D/g, '') || '185', 10);
    const weightNum = parseFloat(recipe.rescueWeight.replace(/[^0-9.]/g, '') || '0.5');
    const weightKg = recipe.rescueWeight.includes('g') && !recipe.rescueWeight.includes('kg') ? +(weightNum / 1000).toFixed(2) : weightNum;

    // Gather recipe terms to match against inventory
    const terms: string[] = [];
    if (recipe.atRiskIngredients) recipe.atRiskIngredients.forEach((a) => terms.push(a.name));
    if (recipe.pantryItems) recipe.pantryItems.forEach((p) => terms.push(p));
    if (recipe.steps) {
      recipe.steps.forEach((s) => {
        if (s.ingredientsForStep) s.ingredientsForStep.forEach((i) => terms.push(i.name));
      });
    }
    if (recipe.id === 'tangy-tomato-rasam') {
      terms.push('tomato', 'tomatoes', 'coriander', 'cilantro', 'lemon', 'curry leaves');
    } else if (recipe.id === 'kara-kuzhi-paniyaram') {
      terms.push('batter', 'coconut', 'shallot', 'onion', 'curry leaves');
    } else if (recipe.id === 'spinach-tomato-omelette') {
      terms.push('spinach', 'palak', 'tomato', 'tomatoes', 'egg', 'eggs');
    } else if (recipe.id === 'veg-poriyal') {
      terms.push('carrot', 'carrots', 'bean', 'beans', 'coconut');
    } else if (recipe.id === 'mixed-veg-sambar') {
      terms.push('shallot', 'onion', 'carrot', 'carrots', 'toor dal', 'dal', 'tamarind', 'drumstick');
    } else if (recipe.id === 'creamy-mushroom-pasta') {
      terms.push('cream', 'heavy cream', 'mushroom', 'mushrooms', 'pasta', 'fettuccine');
    }

    const rescuedItemsLog: string[] = [];

    // Calibrate inventory: automatically deduct or mark rescued items
    setInventory((prev) =>
      prev.map((item) => {
        const itemName = item.name.toLowerCase();
        const isUsed = terms.some((term) => {
          const t = term.toLowerCase().trim();
          if (!t) return false;
          if (itemName.includes(t) || t.includes(itemName)) return true;
          if (t === 'eggs' && itemName.includes('egg')) return true;
          if (t === 'egg' && itemName.includes('egg')) return true;
          if (t === 'spinach' && (itemName.includes('palak') || itemName.includes('spinach'))) return true;
          if (t === 'palak' && (itemName.includes('palak') || itemName.includes('spinach'))) return true;
          if (t === 'coriander' && (itemName.includes('cilantro') || itemName.includes('coriander'))) return true;
          if (t === 'cilantro' && (itemName.includes('cilantro') || itemName.includes('coriander'))) return true;
          if (t === 'shallots' && (itemName.includes('shallot') || itemName.includes('onion'))) return true;
          if (t === 'batter' && itemName.includes('batter')) return true;
          if (t === 'coconut' && itemName.includes('coconut')) return true;
          if (t === 'tomatoes' && itemName.includes('tomato')) return true;
          if (t === 'tomato' && itemName.includes('tomato')) return true;
          if (t === 'mushrooms' && itemName.includes('mushroom')) return true;
          if (t === 'cream' && itemName.includes('cream')) return true;
          if (t === 'carrots' && itemName.includes('carrot')) return true;
          if (t === 'beans' && itemName.includes('bean')) return true;
          return false;
        });

        if (isUsed && item.quantity > 0) {
          let deduct = 1;
          const u = item.unit.toLowerCase();
          if (u === 'g') {
            if (item.category === 'Lentils & Spices') deduct = Math.min(item.quantity, 15);
            else if (item.quantity <= 250) deduct = item.quantity;
            else deduct = Math.min(item.quantity, 300);
          } else if (u === 'ml') {
            if (item.category === 'Oils') deduct = Math.min(item.quantity, 20);
            else if (item.quantity <= 400) deduct = item.quantity;
            else deduct = Math.min(item.quantity, 350);
          } else if (u === 'kg') {
            deduct = Math.min(item.quantity, 0.25);
          } else {
            deduct = Math.min(item.quantity, 1);
          }

          const newQty = Math.max(0, +(item.quantity - deduct).toFixed(2));
          rescuedItemsLog.push(`${item.name} (-${deduct}${item.unit})`);

          return {
            ...item,
            quantity: newQty,
            atRisk: false,
            urgencyStatus: newQty === 0 ? 'optimal' : item.urgencyStatus,
            usedAmountNote: `Rescued in ${recipe.title} (-${deduct}${item.unit})`,
          };
        }
        return item;
      })
    );

    // Update statistics
    setUserSettings((prev) => ({
      ...prev,
      recipesMastered: prev.recipesMastered + 1,
      moneySavedInr: prev.moneySavedInr + savedAmount,
      wasteSavedKg: +(prev.wasteSavedKg + weightKg).toFixed(1),
    }));

    // Update last completed session for Dashboard and Analytics
    setLastCompletedSession({
      recipeId: recipe.id,
      title: recipe.title,
      subtitle: recipe.subtitle || '',
      rescueWeight: recipe.rescueWeight || `${Math.round(weightKg * 1000)}g`,
      moneySaved: recipe.moneySaved || `₹${savedAmount}`,
      rescuedItemsText: `${rescuedItemsLog.length > 0 ? rescuedItemsLog.length : 3} items rescued (${recipe.rescueWeight}) • ₹${savedAmount} saved • IoT scale and crisper pantry inventory auto-deducted.`,
      rescuedIngredientsNote: rescuedItemsLog.length > 0 ? rescuedItemsLog.slice(0, 3).join(', ') + ' salvaged' : `${recipe.title} ingredients salvaged`,
      timestamp: 'Just now',
    });

    // Push completion notification
    const compNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: `${recipe.title} Completed!`,
      message: `IoT crisper scale auto-deducted ${recipe.rescueWeight}. ₹${savedAmount} saved to your pantry log.`,
      time: 'Just now',
      type: 'success',
      read: false,
      linkScreen: 'dashboard',
    };
    setNotifications((prev) => [compNotif, ...prev]);

    setToastMessage(
      `${recipe.title} Completed! Rescued ${recipe.rescueWeight || '560g'} • Saved ₹${savedAmount} • Scale & Pantry inventory auto-calibrated`
    );

    setActiveScreen('dashboard');
  };

  return (
    <KitchenContext.Provider
      value={{
        activeScreen,
        setActiveScreen,
        inventory,
        recipes,
        dailySchedule,
        shoppingItems,
        communityPosts,
        userSettings,
        activeRecipe,
        setActiveRecipe,
        activeCookingRecipe,
        setActiveCookingRecipe,
        activeCookingStep,
        setActiveCookingStep,
        isHeyChefOpen,
        setIsHeyChefOpen,
        isAddModalOpen,
        setIsAddModalOpen,
        toastMessage,
        setToastMessage,
        lastCompletedSession,
        setLastCompletedSession,
        adjustItemQuantity,
        addItem,
        updateItem,
        deleteItem,
        editingInventoryItem,
        setEditingInventoryItem,
        selectedRecipeForDetail,
        setSelectedRecipeForDetail,
        isRecipeDetailOpen,
        setIsRecipeDetailOpen,
        notifications,
        markNotificationRead,
        clearNotifications,
        isNotificationsOpen,
        setIsNotificationsOpen,
        toggleShoppingItem,
        addShoppingItem,
        verifyAllStaples,
        toggleLikePost,
        toggleBookmarkPost,
        addCommunityPost,
        updateUserSettings,
        chefTimerSeconds,
        isChefTimerRunning,
        startChefTimer,
        pauseChefTimer,
        addChefTimerMins,
        resetChefTimer,
        completeCookingSession,
      }}
    >
      {children}
    </KitchenContext.Provider>
  );
};

export const useKitchen = () => {
  const context = useContext(KitchenContext);
  if (!context) throw new Error('useKitchen must be used within KitchenProvider');
  return context;
};
