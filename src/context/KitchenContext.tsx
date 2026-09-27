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

const loadStorage = <T,>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Urgent: Fermented Batter (34h left)',
    message: 'High acidity risk in Crisper Shelf. Make Kara Paniyaram for tomorrow breakfast.',
    time: '10m ago',
    type: 'alert',
    read: false,
    linkScreen: 'rescue',
  },
  {
    id: 'notif-2',
    title: 'Quantity Updated',
    message: 'Used 560g following Tangy Tomato Rasam cooking session. ₹185 saved.',
    time: '25m ago',
    type: 'success',
    read: false,
    linkScreen: 'inventory',
  },
  {
    id: 'notif-3',
    title: 'Shopping Checklist',
    message: '3 basic foods checked. 2 fresh produce items needed for upcoming meals.',
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

import { calculateRecipeMatch } from '../data/recipeMatching';
import { normalizeSingleIngredient } from '../data/ingredientNormalization';

export const deriveRecipeWithInventory = (recipe: Recipe, inv: InventoryItem[]): Recipe => {
  const invStandards = inv
    .filter((i) => i.quantity > 0)
    .map((i) => normalizeSingleIngredient(i.name));

  const match = calculateRecipeMatch(recipe, invStandards);

  return {
    ...recipe,
    matchPercentage: match.matchPercentage,
    missingIngredients: match.missingIngredients,
    availableIngredientsList: match.availableIngredients,
    missingIngredientsList: match.missingIngredients,
  };
};

const KitchenContext = createContext<KitchenContextType | undefined>(undefined);

export const KitchenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('dashboard');
  const [inventory, setInventory] = useState<InventoryItem[]>(() =>
    loadStorage('smart_shelf_inventory', INITIAL_INVENTORY)
  );
  const [dailySchedule] = useState<DailyMealRescue[]>(DAILY_RESCUE_SCHEDULE);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>(() =>
    loadStorage('smart_shelf_shopping', INITIAL_SHOPPING_ITEMS)
  );
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(() =>
    loadStorage('smart_shelf_posts', COMMUNITY_POSTS)
  );
  const [userSettings, setUserSettings] = useState<UserSettings>(() =>
    loadStorage('smart_shelf_settings', INITIAL_USER_SETTINGS)
  );
  
  const [editingInventoryItem, setEditingInventoryItem] = useState<InventoryItem | null>(null);
  const [selectedRecipeForDetail, setSelectedRecipeForDetail] = useState<Recipe | null>(null);
  const [isRecipeDetailOpen, setIsRecipeDetailOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(() =>
    loadStorage('smart_shelf_notifications', INITIAL_NOTIFICATIONS)
  );
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);

  const [lastCompletedSession, setLastCompletedSession] = useState<CompletedSessionInfo>(() =>
    loadStorage('smart_shelf_session', {
      recipeId: 'tangy-tomato-rasam',
      title: 'Tangy Tomato Rasam',
      subtitle: '(Lemon Infused)',
      rescueWeight: '560g',
      moneySaved: '₹185',
      rescuedItemsText: 'Used 4 food items • 560g saved • ₹185 saved',
      rescuedIngredientsNote: 'Used lemon and tomatoes before they went bad',
      timestamp: 'Recent session',
    })
  );

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('smart_shelf_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('smart_shelf_shopping', JSON.stringify(shoppingItems));
  }, [shoppingItems]);

  useEffect(() => {
    localStorage.setItem('smart_shelf_settings', JSON.stringify(userSettings));
  }, [userSettings]);

  useEffect(() => {
    localStorage.setItem('smart_shelf_posts', JSON.stringify(communityPosts));
  }, [communityPosts]);

  useEffect(() => {
    localStorage.setItem('smart_shelf_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('smart_shelf_session', JSON.stringify(lastCompletedSession));
  }, [lastCompletedSession]);

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
    'Used 4 food items • 560g saved • ₹185 saved'
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
        title: `Food Storage Alert: ${created.name} (${created.daysLeft}d left)`,
        message: `Use soon in ${created.location}. Recipe suggestions ready in Recipe Hub.`,
        time: 'Just now',
        type: 'alert',
        read: false,
        linkScreen: 'recipes',
      };
      setNotifications((prev) => [alertNotif, ...prev]);
    }

    setToastMessage(
      `Added ${created.name} (${created.quantity} ${created.unit}) • Expiry in ${created.daysLeft}d • Quantity updated`
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
    setToastMessage('Item removed from My Food');
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
            usedAmountNote: `Used in ${recipe.title} (-${deduct}${item.unit})`,
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
      rescuedItemsText: `Used ${rescuedItemsLog.length > 0 ? rescuedItemsLog.length : 4} food items • ${recipe.rescueWeight} saved • ₹${savedAmount} saved`,
      rescuedIngredientsNote: rescuedItemsLog.length > 0 ? `Used ${rescuedItemsLog.slice(0, 3).join(', ')} before they went bad` : 'Used lemon and tomatoes before they went bad',
      timestamp: 'Just now',
    });

    // Push completion notification
    const compNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: `${recipe.title} Completed!`,
      message: `Used ${recipe.rescueWeight}. ₹${savedAmount} saved to your food log.`,
      time: 'Just now',
      type: 'success',
      read: false,
      linkScreen: 'dashboard',
    };
    setNotifications((prev) => [compNotif, ...prev]);

    setToastMessage(
      `${recipe.title} Completed! Used ${recipe.rescueWeight || '560g'} • Saved ₹${savedAmount} • Quantity updated`
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
