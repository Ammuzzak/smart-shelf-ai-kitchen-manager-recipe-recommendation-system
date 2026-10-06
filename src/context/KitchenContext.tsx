import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
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
  ThemeMode,
  AuthUser,
  FoodWasteRecord,
  DerivedKitchenAlert,
  InventoryItemSource,
} from '../types';
import {
  RECIPES_DATA,
  DAILY_RESCUE_SCHEDULE,
  COMMUNITY_POSTS,
  INITIAL_USER_SETTINGS,
} from '../data/initialData';
import {
  getTodayDateString,
  getDaysUntilExpiry,
  isExpiringSoon,
  getExpiryUrgency,
  addDaysToDate,
} from '../utils/dateUtils';
import { calculateRecipeMatch } from '../data/recipeMatching';
import { normalizeSingleIngredient } from '../data/ingredientNormalization';

const loadStorage = <T,>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

const DEFAULT_AUTH_USER: AuthUser = {
  id: 'user_default',
  name: 'Home Cook',
  email: 'cook@smartshelf.app',
  isGuest: false,
  createdAt: getTodayDateString(),
};

interface KitchenContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  // Auth & User Isolation
  currentUser: AuthUser | null;
  isAuthChecking: boolean;
  authToken: string | null;
  setCurrentUserWithToken: (user: AuthUser, token: string) => void;
  logout: () => void;
  switchUser: (user: AuthUser) => void;
  // Navigation & Screens
  activeScreen: ActiveScreen;
  setActiveScreen: (screen: ActiveScreen) => void;
  // Canonical Inventory Source of Truth
  inventory: InventoryItem[];
  addItem: (item: Omit<InventoryItem, 'id' | 'userId' | 'addedDate'>) => void;
  updateItem: (id: string, updatedFields: Partial<InventoryItem>) => void;
  adjustItemQuantity: (id: string, delta: number) => void;
  deleteItem: (id: string) => void;
  loadSampleDemoPantry: () => void;
  clearAllInventory: () => void;
  editingInventoryItem: InventoryItem | null;
  setEditingInventoryItem: (item: InventoryItem | null) => void;
  // Canonical Food Waste Records
  wasteRecords: FoodWasteRecord[];
  logFoodWaste: (record: Omit<FoodWasteRecord, 'id' | 'userId'>) => void;
  clearWasteRecords: () => void;
  // Live Derived Kitchen Alerts
  kitchenAlerts: DerivedKitchenAlert[];
  // Notifications derived from alerts
  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;
  // Recipes & Derived recommendations
  recipes: Recipe[];
  activeRecipe: Recipe | null;
  setActiveRecipe: (r: Recipe | null) => void;
  activeCookingRecipe: Recipe | null;
  setActiveCookingRecipe: (r: Recipe | null) => void;
  activeCookingStep: number;
  setActiveCookingStep: (step: number) => void;
  selectedRecipeForDetail: Recipe | null;
  setSelectedRecipeForDetail: (r: Recipe | null) => void;
  isRecipeDetailOpen: boolean;
  setIsRecipeDetailOpen: (open: boolean) => void;
  // Shopping list
  shoppingItems: ShoppingItem[];
  toggleShoppingItem: (id: string) => void;
  addShoppingItem: (name: string, purpose: string, quantity: string) => void;
  verifyAllStaples: () => void;
  // Daily rescue schedule
  dailySchedule: DailyMealRescue[];
  // Community & User settings
  communityPosts: CommunityPost[];
  toggleLikePost: (id: string) => void;
  toggleBookmarkPost: (id: string) => void;
  addCommunityPost: (post: { title: string; description: string; badge?: string; category?: 'Recipes' | 'Tips' | 'Stories' }) => void;
  userSettings: UserSettings;
  updateUserSettings: (updater: Partial<UserSettings> | ((prev: UserSettings) => UserSettings)) => void;
  // Modals & UI states
  isHeyChefOpen: boolean;
  setIsHeyChefOpen: (open: boolean) => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  toastMessage: string | null;
  setToastMessage: (msg: string | null) => void;
  lastCompletedSession: CompletedSessionInfo | null;
  setLastCompletedSession: (session: CompletedSessionInfo | null) => void;
  // Hey Chef Timer
  chefTimerSeconds: number;
  isChefTimerRunning: boolean;
  startChefTimer: (seconds: number) => void;
  pauseChefTimer: () => void;
  addChefTimerMins: (mins: number) => void;
  resetChefTimer: () => void;
  completeCookingSession: (recipe: Recipe) => void;
}

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
  // Theme State
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('smart-shelf-theme');
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'dark'; // Dark Mode is default
  });

  useEffect(() => {
    try {
      localStorage.setItem('smart-shelf-theme', theme);
    } catch {
      // ignore
    }
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      document.body.style.backgroundColor = '#0d1518';
      document.body.style.color = '#dbe4e8';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      document.body.style.backgroundColor = '#F7F5EF';
      document.body.style.color = '#24332D';
    }
  }, [theme]);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    setUserSettings((prev) => ({
      ...prev,
      theme: mode === 'dark' ? 'Dark Mode' : 'Light Mode',
    }));
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  // User Account Architecture & Session Isolation
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    return loadStorage<AuthUser | null>('smart_shelf_active_user', null);
  });

  const [authToken, setAuthToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('smart_shelf_auth_token');
    } catch {
      return null;
    }
  });

  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem('smart_shelf_auth_token'));
    } catch {
      return false;
    }
  });

  // Validate server session token on app initialization
  useEffect(() => {
    if (!authToken) {
      setIsAuthChecking(false);
      return;
    }

    let isMounted = true;
    fetch('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Session invalid');
        }
        return res.json();
      })
      .then((data) => {
        if (isMounted && data.user) {
          setCurrentUser(data.user);
          localStorage.setItem('smart_shelf_active_user', JSON.stringify(data.user));
        }
      })
      .catch(() => {
        if (isMounted) {
          setCurrentUser(null);
          setAuthToken(null);
          try {
            localStorage.removeItem('smart_shelf_active_user');
            localStorage.removeItem('smart_shelf_auth_token');
          } catch (e) {
            console.error(e);
          }
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsAuthChecking(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [authToken]);

  // CANONICAL INVENTORY: Loaded strictly for current user
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    if (!currentUser) return [];
    const userInvKey = `smart_shelf_inventory_${currentUser.id}`;
    return loadStorage<InventoryItem[]>(userInvKey, []);
  });

  // CANONICAL FOOD WASTE RECORDS: Loaded strictly for current user
  const [wasteRecords, setWasteRecords] = useState<FoodWasteRecord[]>(() => {
    if (!currentUser) return [];
    const userWasteKey = `smart_shelf_waste_${currentUser.id}`;
    return loadStorage<FoodWasteRecord[]>(userWasteKey, []);
  });

  // CANONICAL SHOPPING LIST: Loaded strictly for current user
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>(() => {
    if (!currentUser) return [];
    const userShopKey = `smart_shelf_shopping_${currentUser.id}`;
    return loadStorage<ShoppingItem[]>(userShopKey, []);
  });

  // Sets user after successful login or signup and hydrates their isolated kitchen data
  const setCurrentUserWithToken = useCallback((user: AuthUser, token: string) => {
    setCurrentUser(user);
    setAuthToken(token);
    try {
      localStorage.setItem('smart_shelf_active_user', JSON.stringify(user));
      localStorage.setItem('smart_shelf_auth_token', token);
    } catch (e) {
      console.error(e);
    }
    const newInv = loadStorage<InventoryItem[]>(`smart_shelf_inventory_${user.id}`, []);
    const newWaste = loadStorage<FoodWasteRecord[]>(`smart_shelf_waste_${user.id}`, []);
    const newShop = loadStorage<ShoppingItem[]>(`smart_shelf_shopping_${user.id}`, []);
    setInventory(newInv);
    setWasteRecords(newWaste);
    setShoppingItems(newShop);
  }, []);

  // Logout handler: clears session and resets all user states
  const logout = useCallback(() => {
    if (authToken) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      }).catch(() => {});
    }
    setCurrentUser(null);
    setAuthToken(null);
    try {
      localStorage.removeItem('smart_shelf_active_user');
      localStorage.removeItem('smart_shelf_auth_token');
    } catch (e) {
      console.error(e);
    }
    setInventory([]);
    setWasteRecords([]);
    setShoppingItems([]);
    setActiveScreen('dashboard');
  }, [authToken]);

  // Switch User handler: isolates all datasets by userId
  const switchUser = useCallback((newUser: AuthUser) => {
    setCurrentUser(newUser);
    const newInv = loadStorage<InventoryItem[]>(`smart_shelf_inventory_${newUser.id}`, []);
    const newWaste = loadStorage<FoodWasteRecord[]>(`smart_shelf_waste_${newUser.id}`, []);
    const newShop = loadStorage<ShoppingItem[]>(`smart_shelf_shopping_${newUser.id}`, []);
    setInventory(newInv);
    setWasteRecords(newWaste);
    setShoppingItems(newShop);
  }, []);

  // Sync inventory changes to current user's storage
  useEffect(() => {
    if (!currentUser) return;
    const key = `smart_shelf_inventory_${currentUser.id}`;
    localStorage.setItem(key, JSON.stringify(inventory));
  }, [inventory, currentUser]);

  // Sync waste records changes to current user's storage
  useEffect(() => {
    if (!currentUser) return;
    const key = `smart_shelf_waste_${currentUser.id}`;
    localStorage.setItem(key, JSON.stringify(wasteRecords));
  }, [wasteRecords, currentUser]);

  // Sync shopping list changes to current user's storage
  useEffect(() => {
    if (!currentUser) return;
    const key = `smart_shelf_shopping_${currentUser.id}`;
    localStorage.setItem(key, JSON.stringify(shoppingItems));
  }, [shoppingItems, currentUser]);

  // Navigation state
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('dashboard');

  // Daily schedule & Community posts
  const [dailySchedule] = useState<DailyMealRescue[]>(DAILY_RESCUE_SCHEDULE);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(() =>
    loadStorage('smart_shelf_posts', COMMUNITY_POSTS)
  );

  // User Settings
  const [userSettings, setUserSettings] = useState<UserSettings>(() =>
    loadStorage('smart_shelf_settings', INITIAL_USER_SETTINGS)
  );

  useEffect(() => {
    localStorage.setItem('smart_shelf_settings', JSON.stringify(userSettings));
  }, [userSettings]);

  // Read notifications IDs for dismissal
  const [readAlertIds, setReadAlertIds] = useState<Set<string>>(new Set());

  // =========================================================================
  // LIVE DERIVED KITCHEN ALERTS
  // Synchronized directly with canonical inventory state.
  // Recalculates immediately on any ADD / EDIT / DELETE / QUANTITY change.
  // =========================================================================
  const kitchenAlerts: DerivedKitchenAlert[] = useMemo(() => {
    const alerts: DerivedKitchenAlert[] = [];

    for (const item of inventory) {
      if (item.quantity <= 0) continue;
      const days = getDaysUntilExpiry(item.expiryDate);

      if (days < 0) {
        // Expired alert
        const past = Math.abs(days);
        alerts.push({
          id: `alert-exp-${item.id}`,
          type: 'expired',
          title: `Expired: ${item.name}`,
          message: `${item.name} expired ${past} day${past === 1 ? '' : 's'} ago (${item.location}). Consider discarding or logging waste.`,
          time: 'Action required',
          itemId: item.id,
          itemName: item.name,
          severity: 'critical',
          source: 'Calculated from inventory',
          linkScreen: 'inventory',
        });
      } else if (days <= 2) {
        // Expiring soon alert (0 to 2 days left)
        alerts.push({
          id: `alert-soon-${item.id}`,
          type: 'expiring_soon',
          title: `Expiring Soon: ${item.name}`,
          message: `${item.name} expires ${days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`} in ${item.location}. Cook soon to prevent waste.`,
          time: days === 0 ? 'Expires today' : `${days}d left`,
          itemId: item.id,
          itemName: item.name,
          severity: 'warning',
          source: 'Calculated from inventory',
          linkScreen: 'rescue',
        });
      }

      // Low Stock alert (quantity at or below minimum threshold)
      const minQty = typeof item.minimumQuantity === 'number' && item.minimumQuantity > 0 ? item.minimumQuantity : 1;
      if (item.quantity <= minQty) {
        alerts.push({
          id: `alert-low-${item.id}`,
          type: 'low_stock',
          title: `Low Stock: ${item.name}`,
          message: `Only ${item.quantity} ${item.unit} left (minimum threshold is ${minQty} ${item.unit}). Added to restock watch.`,
          time: 'Restock needed',
          itemId: item.id,
          itemName: item.name,
          severity: 'info',
          source: 'Calculated from inventory',
          linkScreen: 'shopping-list',
        });
      }
    }

    return alerts;
  }, [inventory]);

  // Derived Notification items matching UI requirements
  const notifications: NotificationItem[] = useMemo(() => {
    return kitchenAlerts.map((alert) => ({
      id: alert.id,
      title: alert.title,
      message: alert.message,
      time: alert.time,
      type: alert.severity === 'critical' ? 'alert' : alert.severity === 'warning' ? 'alert' : 'info',
      read: readAlertIds.has(alert.id),
      linkScreen: alert.linkScreen,
    }));
  }, [kitchenAlerts, readAlertIds]);

  const markNotificationRead = (id: string) => {
    setReadAlertIds((prev) => new Set([...prev, id]));
  };

  const clearNotifications = () => {
    const allIds = kitchenAlerts.map((a) => a.id);
    setReadAlertIds(new Set(allIds));
  };

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Dynamic Recipe Recommendations based on real canonical inventory
  const recipes = useMemo(() => {
    return RECIPES_DATA.map((recipe) => deriveRecipeWithInventory(recipe, inventory));
  }, [inventory]);

  // Inventory actions
  const addItem = (itemData: Omit<InventoryItem, 'id' | 'userId' | 'addedDate'>) => {
    const today = getTodayDateString();
    const expiry = itemData.expiryDate || addDaysToDate(today, 5);
    const days = getDaysUntilExpiry(expiry);

    const newItem: InventoryItem = {
      ...itemData,
      id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      userId: currentUser?.id || 'guest',
      name: itemData.name.trim(),
      category: itemData.category || 'Produce',
      quantity: Math.max(0.1, Number(itemData.quantity) || 1),
      unit: itemData.unit || 'pieces',
      minimumQuantity: typeof itemData.minimumQuantity === 'number' ? itemData.minimumQuantity : 1,
      expiryDate: expiry,
      addedDate: today,
      location: itemData.location || 'Food Storage Shelf',
      source: itemData.source || 'User entered',
      notes: itemData.notes || '',
      daysLeft: days,
      atRisk: isExpiringSoon(expiry, 2),
      urgencyStatus: getExpiryUrgency(expiry),
      costEstimate: itemData.costEstimate || 40,
    };

    setInventory((prev) => [newItem, ...prev]);
    setToastMessage(`Added ${newItem.name} (${newItem.quantity} ${newItem.unit}) to My Food.`);
  };

  const updateItem = (id: string, updatedFields: Partial<InventoryItem>) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const merged = { ...item, ...updatedFields };
          if (updatedFields.expiryDate) {
            merged.daysLeft = getDaysUntilExpiry(updatedFields.expiryDate);
            merged.atRisk = isExpiringSoon(updatedFields.expiryDate, 2);
            merged.urgencyStatus = getExpiryUrgency(updatedFields.expiryDate);
          }
          return merged;
        }
        return item;
      })
    );
  };

  const adjustItemQuantity = (id: string, delta: number) => {
    setInventory((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = Math.max(0, +(item.quantity + delta).toFixed(2));
            return {
              ...item,
              quantity: newQty,
            };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const deleteItem = (id: string) => {
    setInventory((prev) => prev.filter((item) => item.id !== id));
  };

  const clearAllInventory = () => {
    setInventory([]);
    setToastMessage('Cleared all inventory items for this account.');
  };

  // Optional: Load sample pantry with fresh dates based on today's local date
  const loadSampleDemoPantry = () => {
    const today = getTodayDateString();
    const demoItems: InventoryItem[] = [
      {
        id: `demo-toor-dal-${Date.now()}`,
        userId: currentUser?.id || 'guest',
        name: 'Toor Dal (Pigeon Pea)',
        category: 'Basic Foods',
        quantity: 1.2,
        unit: 'kg',
        minimumQuantity: 0.5,
        expiryDate: addDaysToDate(today, 60),
        addedDate: today,
        location: 'Shelf B • Jar 04',
        source: 'Sample pantry',
        daysLeft: 60,
        atRisk: false,
        urgencyStatus: 'optimal',
        costEstimate: 180,
      },
      {
        id: `demo-tomatoes-${Date.now()}`,
        userId: currentUser?.id || 'guest',
        name: 'Country Tomatoes',
        category: 'Produce',
        quantity: 2,
        unit: 'kg',
        minimumQuantity: 0.5,
        expiryDate: addDaysToDate(today, 4),
        addedDate: today,
        location: 'Vegetable Drawer',
        source: 'Sample pantry',
        daysLeft: 4,
        atRisk: false,
        urgencyStatus: 'warning',
        costEstimate: 70,
      },
      {
        id: `demo-milk-${Date.now()}`,
        userId: currentUser?.id || 'guest',
        name: 'Fresh Cow Milk',
        category: 'Dairy',
        quantity: 1,
        unit: 'L',
        minimumQuantity: 0.5,
        expiryDate: addDaysToDate(today, 2),
        addedDate: today,
        location: 'Dairy Chiller',
        source: 'Sample pantry',
        daysLeft: 2,
        atRisk: true,
        urgencyStatus: 'critical',
        costEstimate: 35,
      },
      {
        id: `demo-maggi-${Date.now()}`,
        userId: currentUser?.id || 'guest',
        name: 'Maggi 2-Minute Noodles',
        category: 'Basic Foods',
        quantity: 3,
        unit: 'Packets',
        minimumQuantity: 1,
        expiryDate: addDaysToDate(today, 90),
        addedDate: today,
        location: 'Food Storage Shelf',
        source: 'Sample pantry',
        daysLeft: 90,
        atRisk: false,
        urgencyStatus: 'optimal',
        costEstimate: 42,
      },
      {
        id: `demo-eggs-${Date.now()}`,
        userId: currentUser?.id || 'guest',
        name: 'Farm Fresh Eggs',
        category: 'Dairy',
        quantity: 6,
        unit: 'pieces',
        minimumQuantity: 2,
        expiryDate: addDaysToDate(today, 10),
        addedDate: today,
        location: 'Fridge Door',
        source: 'Sample pantry',
        daysLeft: 10,
        atRisk: false,
        urgencyStatus: 'optimal',
        costEstimate: 42,
      },
    ];

    setInventory(demoItems);
    setToastMessage('Loaded sample pantry items with dates calibrated to today.');
  };

  // Canonical Food Waste Actions
  const logFoodWaste = (recordData: Omit<FoodWasteRecord, 'id' | 'userId'>) => {
    const today = getTodayDateString();
    const newRecord: FoodWasteRecord = {
      ...recordData,
      id: `waste-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId: currentUser?.id || 'guest',
      wastedAt: recordData.wastedAt || today,
    };

    setWasteRecords((prev) => [newRecord, ...prev]);

    // Also deduct or remove item from inventory if linked
    if (recordData.inventoryItemId) {
      setInventory((prev) =>
        prev
          .map((item) => {
            if (item.id === recordData.inventoryItemId) {
              const remaining = Math.max(0, +(item.quantity - recordData.quantity).toFixed(2));
              return { ...item, quantity: remaining };
            }
            return item;
          })
          .filter((item) => item.quantity > 0)
      );
    }

    setToastMessage(`Logged food waste: ${newRecord.quantity} ${newRecord.unit} of ${newRecord.itemName}.`);
  };

  const clearWasteRecords = () => {
    setWasteRecords([]);
    setToastMessage('Cleared food waste records for this account.');
  };

  // Modals & Cooking states
  const [editingInventoryItem, setEditingInventoryItem] = useState<InventoryItem | null>(null);
  const [selectedRecipeForDetail, setSelectedRecipeForDetail] = useState<Recipe | null>(null);
  const [isRecipeDetailOpen, setIsRecipeDetailOpen] = useState(false);
  const [isHeyChefOpen, setIsHeyChefOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(RECIPES_DATA[0]);
  const [activeCookingRecipe, setActiveCookingRecipe] = useState<Recipe | null>(RECIPES_DATA[0]);
  const [activeCookingStep, setActiveCookingStep] = useState(1);
  const [lastCompletedSession, setLastCompletedSession] = useState<CompletedSessionInfo | null>(null);

  // Chef Timer
  const [chefTimerSeconds, setChefTimerSeconds] = useState(0);
  const [isChefTimerRunning, setIsChefTimerRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isChefTimerRunning && chefTimerSeconds > 0) {
      interval = setInterval(() => {
        setChefTimerSeconds((prev) => {
          if (prev <= 1) {
            setIsChefTimerRunning(false);
            setToastMessage('Timer complete: Kitchen timer finished!');
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
    setIsChefTimerRunning(false);
    setChefTimerSeconds(0);
  };

  // Shopping list actions
  const toggleShoppingItem = (id: string) => {
    setShoppingItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const addShoppingItem = (name: string, purpose: string, quantity: string) => {
    const newItem: ShoppingItem = {
      id: `shop-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name,
      quantity,
      category: 'custom',
      purpose,
      checked: false,
      estimatedCost: 35,
    };
    setShoppingItems((prev) => [newItem, ...prev]);
    setToastMessage(`Added ${name} to Smart Shopping list.`);
  };

  const verifyAllStaples = () => {
    setShoppingItems((prev) =>
      prev.map((i) => (i.isStapleCheck ? { ...i, checked: true } : i))
    );
    setToastMessage('Marked all staple food items as verified in pantry.');
  };

  // Community actions
  const toggleLikePost = (id: string) => {
    setCommunityPosts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
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
      author: currentUser.name,
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
    setToastMessage(`Your tip "${post.title}" was published to Community Hub!`);
  };

  const updateUserSettings = (
    updater: Partial<UserSettings> | ((prev: UserSettings) => UserSettings)
  ) => {
    setUserSettings((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      if (next.theme === 'Light Mode' && theme !== 'light') {
        setThemeState('light');
      } else if (next.theme === 'Dark Mode' && theme !== 'dark') {
        setThemeState('dark');
      }
      return next;
    });
  };

  const completeCookingSession = (recipe: Recipe) => {
    const savedAmount = parseInt(recipe.moneySaved?.replace(/\D/g, '') || '185', 10);
    const weightNum = parseFloat(recipe.rescueWeight?.replace(/[^0-9.]/g, '') || '0.5');
    const weightKg = recipe.rescueWeight?.includes('g') && !recipe.rescueWeight?.includes('kg') ? +(weightNum / 1000).toFixed(2) : weightNum;

    // Deduct items from canonical inventory
    const terms = (recipe.pantryItems || []).map((p) => p.toLowerCase());
    setInventory((prev) =>
      prev.map((item) => {
        const matches = terms.some((t) => item.name.toLowerCase().includes(t) || t.includes(item.name.toLowerCase()));
        if (matches && item.quantity > 0) {
          const deduct = Math.min(item.quantity, 1);
          return {
            ...item,
            quantity: Math.max(0, +(item.quantity - deduct).toFixed(2)),
          };
        }
        return item;
      })
    );

    setUserSettings((prev) => ({
      ...prev,
      recipesMastered: prev.recipesMastered + 1,
      moneySavedInr: prev.moneySavedInr + savedAmount,
      wasteSavedKg: +(prev.wasteSavedKg + weightKg).toFixed(1),
    }));

    setLastCompletedSession({
      recipeId: recipe.id,
      title: recipe.title,
      subtitle: recipe.subtitle || '',
      rescueWeight: recipe.rescueWeight || '500g',
      moneySaved: recipe.moneySaved || `₹${savedAmount}`,
      rescuedItemsText: `Prepared ${recipe.title} • Saved ${recipe.rescueWeight}`,
      rescuedIngredientsNote: `Used pantry items before expiry`,
      timestamp: 'Just now',
    });

    setToastMessage(`${recipe.title} completed! Used ingredients deducted from My Food.`);
    setActiveScreen('dashboard');
  };

  return (
    <KitchenContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        currentUser,
        isAuthChecking,
        authToken,
        setCurrentUserWithToken,
        logout,
        switchUser,
        activeScreen,
        setActiveScreen,
        inventory,
        addItem,
        updateItem,
        adjustItemQuantity,
        deleteItem,
        loadSampleDemoPantry,
        clearAllInventory,
        editingInventoryItem,
        setEditingInventoryItem,
        wasteRecords,
        logFoodWaste,
        clearWasteRecords,
        kitchenAlerts,
        notifications,
        markNotificationRead,
        clearNotifications,
        isNotificationsOpen,
        setIsNotificationsOpen,
        recipes,
        activeRecipe,
        setActiveRecipe,
        activeCookingRecipe,
        setActiveCookingRecipe,
        activeCookingStep,
        setActiveCookingStep,
        selectedRecipeForDetail,
        setSelectedRecipeForDetail,
        isRecipeDetailOpen,
        setIsRecipeDetailOpen,
        shoppingItems,
        toggleShoppingItem,
        addShoppingItem,
        verifyAllStaples,
        dailySchedule,
        communityPosts,
        toggleLikePost,
        toggleBookmarkPost,
        addCommunityPost,
        userSettings,
        updateUserSettings,
        isHeyChefOpen,
        setIsHeyChefOpen,
        isAddModalOpen,
        setIsAddModalOpen,
        toastMessage,
        setToastMessage,
        lastCompletedSession,
        setLastCompletedSession,
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
