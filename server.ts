
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import mongoose from "mongoose";
import {
  randomBytes,
  createHash,
  scrypt,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

import {
  CANONICAL_RECIPES,
  getCanonicalImageForRecipe,
} from "./src/data/canonicalRecipes";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3000);
const scryptAsync = promisify(scrypt);

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// =====================================================
// MONGODB USER MODEL AND ISOLATED USER DATA
// =====================================================

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({
        inventory: [],
        wasteRecords: [],
        shoppingItems: [],
        chefHistory: [],
        preferences: {},
      }),
    },
    sessions: {
      type: [
        {
          tokenHash: { type: String, required: true },
          expiresAt: { type: Date, required: true },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

const User =
  mongoose.models.User ||
  mongoose.model("User", UserSchema);

const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function verifyPassword(
  password: string,
  storedHash: string
) {
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;

  const expected = Buffer.from(key, "hex");
  const actual = (await scryptAsync(password, salt, 64)) as Buffer;

  return (
    actual.length === expected.length &&
    timingSafeEqual(actual, expected)
  );
}

async function createSession(user: any) {
  const token = randomBytes(32).toString("hex");

  user.sessions = (user.sessions || []).filter(
    (session: any) =>
      new Date(session.expiresAt).getTime() > Date.now()
  );

  user.sessions.push({
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  await user.save();

  return token;
}

async function getUserByToken(token: string) {
  if (!token) return null;

  const tokenHash = hashToken(token);

  return User.findOne({
    "sessions.tokenHash": tokenHash,
    "sessions.expiresAt": { $gt: new Date() },
  });
}

function getToken(req: express.Request) {
  const auth = req.headers.authorization || "";
  return auth.replace(/^Bearer\s+/i, "").trim();
}

function publicUser(user: any) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  };
}

function getStoredData(user: any) {
  return {
    inventory: user.data?.inventory ?? [],
    wasteRecords: user.data?.wasteRecords ?? [],
    shoppingItems: user.data?.shoppingItems ?? [],
    chefHistory: user.data?.chefHistory ?? [],
    preferences: user.data?.preferences ?? {},
  };
}

// =====================================================
// GEMINI AI
// =====================================================

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
      });
    } catch (error) {
      console.error("Gemini initialization failed:", error);
    }
  }

  return aiClient;
}

// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    app: "Smart Shelf AI Kitchen Manager",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString(),
  });
});

// =====================================================
// SIGN UP
// =====================================================

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof password !== "string" ||
      password.length < 8
    ) {
      return res.status(400).json({
        error: "Enter a valid name and email. Password must contain at least 8 characters.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        error: "Passwords do not match.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await User.findOne({ email: normalizedEmail });

    if (existing) {
      return res.status(409).json({
        error: "An account with this email already exists.",
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: await hashPassword(password),
      data: {
        inventory: [],
        wasteRecords: [],
        shoppingItems: [],
        chefHistory: [],
        preferences: {},
      },
      sessions: [],
    });

    const token = await createSession(user);

    return res.status(201).json({
      success: true,
      token,
      user: publicUser(user),
    });
  } catch (error: any) {
    if (error?.code === 11000) {
      return res.status(409).json({
        error: "An account with this email already exists.",
      });
    }

    console.error("Signup failed:", error?.message || error);

    return res.status(500).json({
      error: "Failed to create account.",
    });
  }
});

// =====================================================
// LOGIN
// =====================================================

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        error: "Email and password are required.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (
      !user ||
      !(await verifyPassword(password, user.passwordHash))
    ) {
      return res.status(401).json({
        error: "Invalid email or password.",
      });
    }

    const token = await createSession(user);

    return res.json({
      success: true,
      token,
      user: publicUser(user),
    });
  } catch (error: any) {
    console.error("Login failed:", error?.message || error);

    return res.status(500).json({
      error: "Unable to sign in. Please try again.",
    });
  }
});

// =====================================================
// LOGOUT
// =====================================================

app.post("/api/auth/logout", async (req, res) => {
  try {
    const token = getToken(req);

    if (token) {
      await User.updateOne(
        {},
        {
          $pull: {
            sessions: { tokenHash: hashToken(token) },
          },
        }
      );
    }

    return res.json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    console.error("Logout failed:", error);

    return res.status(500).json({
      error: "Unable to log out.",
    });
  }
});

// =====================================================
// CURRENT USER
// =====================================================

app.get("/api/auth/me", async (req, res) => {
  try {
    const user = await getUserByToken(getToken(req));

    if (!user) {
      return res.status(401).json({
        error: "Session expired or invalid. Please sign in.",
      });
    }

    return res.json({ user: publicUser(user) });
  } catch (error) {
    console.error("Profile lookup failed:", error);

    return res.status(500).json({
      error: "Unable to retrieve profile.",
    });
  }
});

// =====================================================
// GET USER'S OWN INVENTORY AND DATA
// =====================================================

app.post("/api/user/sync", async (req, res) => {
  try {
    const user = await getUserByToken(getToken(req));

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Map incoming frontend keys directly to your database fields
    if (req.body.inventory !== undefined) {
      user.data.inventory = req.body.inventory;
    }
    if (req.body.wasteRecords !== undefined) {
      user.data.wasteRecords = req.body.wasteRecords;
    }
    if (req.body.shoppingItems !== undefined) {
      user.data.shoppingItems = req.body.shoppingItems;
    }
    if (req.body.chefHistory !== undefined) {
      user.data.chefHistory = req.body.chefHistory;
    }
    if (req.body.preferences !== undefined) {
      user.data.preferences = req.body.preferences;
    }

    // Mark the mixed/nested data field as modified so Mongoose saves it
    user.markModified('data');
    await user.save();

    return res.json({ success: true });
  } catch (error) {
    console.error("User sync failed:", error);

    return res.status(500).json({
      error: "Unable to save kitchen data.",
    });
  }
});

// =====================================================
// LOAD SAMPLE PANTRY
// =====================================================

app.post("/api/user/load-sample", async (req, res) => {
  try {
    const user = await getUserByToken(getToken(req));

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const dateAfter = (days: number) =>
      new Date(Date.now() + days * 86400000)
        .toISOString()
        .split("T")[0];

    const today = new Date().toISOString().split("T")[0];

    const sampleInventory = [
      {
        id: `inv-${Date.now()}-1`,
        name: "Maggi 2-Minute Masala Noodles",
        category: "Pantry",
        quantity: 3,
        unit: "packs",
        expiryDate: dateAfter(60),
        location: "Pantry Shelf",
        confidence: "high",
        addedDate: today,
        urgencyStatus: "optimal",
      },
      {
        id: `inv-${Date.now()}-2`,
        name: "Farm Fresh Eggs",
        category: "Dairy & Eggs",
        quantity: 6,
        unit: "pcs",
        expiryDate: dateAfter(7),
        location: "Refrigerator Door",
        confidence: "high",
        addedDate: today,
        urgencyStatus: "warning",
      },
      {
        id: `inv-${Date.now()}-3`,
        name: "Country Tomatoes",
        category: "Produce",
        quantity: 1,
        unit: "kg",
        expiryDate: dateAfter(4),
        location: "Vegetable Crisper",
        confidence: "high",
        addedDate: today,
        urgencyStatus: "urgent",
      },
    ];

    user.data = {
      ...(user.data?.toObject?.() || user.data || {}),
      inventory: sampleInventory,
    };

    await user.save();

    return res.json({
      success: true,
      inventory: sampleInventory,
    });
  } catch (error) {
    console.error("Sample pantry failed:", error);

    return res.status(500).json({
      error: "Unable to load sample pantry.",
    });
  }
});

// =====================================================
// TAMIL / TANGLISH NORMALIZATION
// =====================================================

const tamilToEnglishMap: Record<string, string> = {
  maggi: "maggi",
  maggie: "maggi",
  maggy: "maggi",
  maggis: "maggi",
  noodles: "maggi",
  "instant noodles": "maggi",
  thakkali: "tomato",
  thakkalipazham: "tomato",
  vengayam: "onion",
  vengaayam: "onion",
  vengaiyam: "onion",
  muttai: "egg",
  mutta: "egg",
  anda: "egg",
  koli: "chicken",
  kozhi: "chicken",
  chickan: "chicken",
  murgh: "chicken",
  arisi: "rice",
  saatham: "rice",
  sadham: "rice",
  saadham: "rice",
  chawal: "rice",
  urulaikizhangu: "potato",
  urulaikilangu: "potato",
  urulai: "potato",
  aloo: "potato",
  paruppu: "toor dal",
  dhal: "toor dal",
  dal: "toor dal",
  paal: "milk",
  maanga: "mango",
  maangai: "mango",
  mampazham: "mango",
  manga: "mango",
  puli: "tamarind",
  thengai: "coconut",
  thayir: "curd",
  dahi: "curd",
  keerai: "spinach",
  poondu: "garlic",
  lahsun: "garlic",
  inji: "ginger",
  kadugu: "mustard seeds",
  seeragam: "cumin seeds",
  milagu: "black pepper",
  vegetable: "vegetables",
  vegetables: "vegetables",
  veggie: "vegetables",
  veggies: "vegetables",
  kaygari: "vegetables",
  cheese: "cheese",
  paneer: "paneer",
};

function normalizeToken(value: string): string {
  const cleaned = value.toLowerCase().trim();
  return tamilToEnglishMap[cleaned] || cleaned;
}

function normalizeList(items: any[]): string[] {
  return items
    .map((item) =>
      normalizeToken(
        typeof item === "string"
          ? item
          : String(item?.name || "")
      )
    )
    .filter(Boolean);
}

// =====================================================
// AI CHEF — ENGLISH, TAMIL AND TANGLISH
// =====================================================

app.post("/api/chef/ask", async (req, res) => {
  try {
    const {
      query = "",
      activeRecipe = "",
      currentStep = "",
      userInventory = [],
    } = req.body;

    const userQuery = String(query).trim();
    const qLower = userQuery.toLowerCase();

    const inventory = Array.isArray(userInventory)
      ? userInventory.map((item: any) => ({
          name: String(item.name || ""),
          quantity: Number(item.quantity || 0),
          unit: String(item.unit || "unit"),
        }))
      : [];

    const inventoryNames = inventory.map((item) =>
      normalizeToken(item.name)
    );

    const isTamilTanglish =
      /enna|sapadalam|samayikalam|panna|mudiyum|iruku|irukku|kitta|venum|epdi|seiya|sapdanum/i.test(
        qLower
      );

    const isMaggiQuery =
      /maggi|maggie|maggy|noodle/i.test(qLower);

    const hasMaggi = inventory.some((item) =>
      /maggi|maggie|noodle/i.test(item.name)
    );

    if (isMaggiQuery) {
      const extras: string[] = [];

      if (inventory.some((i) => /egg|muttai/i.test(i.name))) {
        extras.push("Egg");
      }

      if (inventory.some((i) => /onion|vengayam/i.test(i.name))) {
        extras.push("Onion");
      }

      if (inventory.some((i) => /tomato|thakkali/i.test(i.name))) {
        extras.push("Tomato");
      }

      if (!hasMaggi) {
        const reply = isTamilTanglish
          ? "Unga inventory-la Maggi illa. Classic Maggi panna 1 pack Maggi venum. Smart Shopping list-la add pannunga."
          : "Maggi is not in your inventory. You need one pack to make classic Maggi. Add it to your Smart Shopping list.";

        return res.json({
          response: reply,
          timerMinutes: 3,
          source: "chef-inventory-truth",
          maggiAvailable: false,
          missingIngredients: ["Maggi Noodles 1 pack"],
        });
      }

      const reply = isTamilTanglish
        ? `Unga inventory-la Maggi irukku! 2-3 minutes-la Classic Masala Maggi pannalam.${extras.length ? ` Unga kitta ${extras.join(", ")}-um irukku.` : ""}`
        : `You have Maggi! Make Classic Masala Maggi in about 2–3 minutes.${extras.length ? ` You also have ${extras.join(", ")} available.` : ""}`;

      return res.json({
        response: reply,
        timerMinutes: 3,
        source: "chef-inventory-truth",
        maggiAvailable: true,
      });
    }

    const ai = getAIClient();

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: `Current recipe: ${activeRecipe || "None"}
Current step: ${currentStep || "None"}
User question: ${userQuery || "What can I cook?"}
Actual inventory: ${JSON.stringify(inventory)}

Give concise, practical cooking advice in 1–3 sentences.
Never claim an ingredient is available unless it is in the inventory.
Prioritize South Indian home cooking.
Reply in friendly Tanglish when the user writes Tamil/Tanglish.`,
          config: {
            systemInstruction:
              "You are Chef Narayanan, a helpful South Indian cooking assistant. Be accurate about inventory and never invent available ingredients.",
            temperature: 0.4,
          },
        });

        const reply = response.text?.trim();

        if (reply) {
          const timerMatch = reply.match(
            /(\d+)\s*(?:minute|min|m)\b/i
          );

          return res.json({
            response: reply,
            timerMinutes: timerMatch
              ? Number(timerMatch[1])
              : 5,
            source: "gemini-ai",
          });
        }
      } catch (error: any) {
        console.warn("Chef Gemini error:", error?.message || error);
      }
    }

    let fallbackReply =
      "Keep the flame on medium heat and stir regularly to prevent burning.";
    let timerMinutes = 5;

    if (/substitute|tamarind/i.test(qLower)) {
      fallbackReply =
        "Try lemon juice as a substitute for tamarind. Add a little at a time and adjust to taste.";
      timerMinutes = 0;
    } else if (/next step|advance/i.test(qLower)) {
      fallbackReply =
        "Follow the next step shown in your recipe and check that the ingredients are cooked before serving.";
      timerMinutes = 1;
    } else if (/boil|tomato|rasam/i.test(qLower)) {
      fallbackReply =
        "Simmer the tomatoes for 6–8 minutes until soft. Adjust the cooking time based on their size.";
      timerMinutes = 7;
    }

    return res.json({
      response: fallbackReply,
      timerMinutes,
      source: "culinary-engine",
    });
  } catch (error) {
    console.error("Chef endpoint failed:", error);

    return res.status(500).json({
      error: "Unable to process the Chef request.",
    });
  }
});

// =====================================================
// RECIPE GENERATION — CANONICAL MAGGI + GEMINI AI
// =====================================================

app.post("/api/recipes/generate", async (req, res) => {
  try {
    const {
      ingredients = [],
      userInventory = [],
      cuisinePreference = "Any",
      dietaryPreference = "Flexible",
      searchQuery = "",
    } = req.body;

    const normalizedIngredients = normalizeList(
      Array.isArray(ingredients) ? ingredients : []
    );

    const normalizedInventory = normalizeList(
      Array.isArray(userInventory) ? userInventory : []
    );

    const query = String(searchQuery || "").trim();

    const availableItems = normalizedInventory.length
      ? normalizedInventory
      : normalizedIngredients;

    const combinedIngredients = [
      ...new Set([
        ...normalizedIngredients,
        ...normalizedInventory,
      ]),
    ];

    const asksForMaggi =
      combinedIngredients.includes("maggi") ||
      /maggi|maggie|maggy|noodle|instant noodles/i.test(query);

    // Never allow the AI to invent Maggi dish titles.
    if (asksForMaggi) {
      const allowedTitles = [
        "Masala Maggi",
        "Vegetable Maggi",
        "Egg Maggi",
        "Cheese Maggi",
        "Spicy Garlic Maggi",
      ];

      const recipes = CANONICAL_RECIPES.filter((recipe: any) =>
        allowedTitles.includes(recipe.title)
      )
        .map((recipe: any) => {
          const required = (recipe.normalizedRequired || []).map(
            normalizeToken
          );

          const matched = required.filter((item: string) =>
            combinedIngredients.includes(item)
          );

          const formattedIngredients = (
            recipe.ingredientsWithQuantities || []
          ).map((item: any) => ({
            ...item,
            isAvailable: combinedIngredients.includes(
              normalizeToken(item.name)
            ),
          }));

          const missingIngredients = formattedIngredients
            .filter((item: any) => !item.isAvailable)
            .map(
              (item: any) =>
                `${item.name} (${item.quantity})`
            );

          return {
            ...recipe,
            image: getCanonicalImageForRecipe(recipe.title),
            pantryItems: formattedIngredients
              .filter((item: any) => item.isAvailable)
              .map((item: any) => item.name),
            ingredientsWithQuantities: formattedIngredients,
            missingIngredients,
            matchPercentage: required.length
              ? Math.round((matched.length / required.length) * 100)
              : 100,
            isAIGenerated: false,
          };
        })
        .sort(
          (a: any, b: any) =>
            b.matchPercentage - a.matchPercentage
        )
        .slice(0, 5);

      return res.json({
        recipes,
        source: "maggi-canonical",
        message: "Showing approved Smart Shelf Maggi recipes.",
      });
    }

    const ai = getAIClient();

    if (!ai) {
      return res.status(503).json({
        recipes: [],
        source: "ai-unavailable",
        message: "Configure GEMINI_API_KEY in your environment.",
      });
    }

    const prompt = `
You are Smart Shelf AI Chef, specializing in authentic Indian
and South Indian home cooking.

User request: ${query}
Available ingredients: ${JSON.stringify(availableItems)}
Requested ingredients: ${JSON.stringify(normalizedIngredients)}
Cuisine: ${cuisinePreference}
Diet: ${dietaryPreference}

Rules:
- Return one to three realistic, recognizable dishes.
- Prioritize South Indian dishes where appropriate.
- If chicken and rice are available, Chicken Biryani may be suggested.
- Do not suggest Maggi in this general recipe path.
- Do not invent unusual dish names.
- Ingredient availability must match the provided inventory.
- Common salt, water and basic spices may be assumed only as
  optional pantry basics; do not claim they are in inventory.
- Include missing ingredients explicitly.
- Give realistic quantities and clear numbered cooking steps.
- A recipe can use one main ingredient plus basic pantry items.
- Return JSON only.

Required JSON format:
{
  "recipes": [{
    "title": "Recognizable dish name",
    "subtitle": "Short description",
    "description": "Brief description",
    "cuisine": "Indian",
    "category": "Dinner",
    "prepTime": "10 min",
    "cookTime": "20 min",
    "estimatedCookingTime": "30 min",
    "servings": 2,
    "ingredientsWithQuantities": [
      {"name": "Tomato", "quantity": "2", "isAvailable": true}
    ],
    "steps": [
      {
        "stepNumber": 1,
        "title": "Prepare",
        "duration": "5 min",
        "instructions": ["Wash and chop the ingredients."]
      }
    ],
    "substitutions": [],
    "wasteSavingTip": "Use ingredients nearing expiry first."
  }]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        systemInstruction:
          "Generate practical recipes. Never invent ingredient availability or nonsensical dish names. Return valid JSON.",
        temperature: 0.3,
      },
    });

    let jsonText = response.text?.trim() || "";

    jsonText = jsonText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "");

    const parsed = JSON.parse(jsonText);

    const rawRecipes = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.recipes)
        ? parsed.recipes
        : [];

    const recipes = rawRecipes
      .filter((recipe: any) => recipe && typeof recipe === "object")
      .slice(0, 3)
      .map((recipe: any, index: number) => {
        const title = String(
          recipe.title || recipe.recipeName || ""
        ).trim();

        const formattedIngredients = (
          Array.isArray(recipe.ingredientsWithQuantities)
            ? recipe.ingredientsWithQuantities
            : []
        ).map((item: any) => {
          const name = String(item.name || "").trim();

          // Compare normalized ingredient names, not Gemini's
          // untrusted isAvailable value.
          const token = normalizeToken(name);

          return {
            name,
            quantity: String(item.quantity || "as required"),
            isAvailable: availableItems.some(
              (available: string) =>
                available === token ||
                available.includes(token) ||
                token.includes(available)
            ),
          };
        });

        const availableIngredientsList = formattedIngredients
          .filter((item: any) => item.isAvailable)
          .map((item: any) => item.name);

        const missingIngredientsList = formattedIngredients
          .filter((item: any) => !item.isAvailable)
          .map((item: any) => item.name);

        const total = formattedIngredients.length;

        return {
          id: `ai-generated-${Date.now()}-${index}`,
          title: title || "Kitchen Recipe",
          subtitle: String(recipe.subtitle || "Smart Shelf recipe"),
          description: String(recipe.description || ""),
          cuisine: String(recipe.cuisine || "Indian"),
          category: [
            "Breakfast",
            "Lunch",
            "Dinner",
            "Snack",
            "Side",
          ].includes(recipe.category)
            ? recipe.category
            : "Dinner",
          prepTime: String(recipe.prepTime || "5 min"),
          cookTime: String(recipe.cookTime || "15 min"),
          estimatedCookingTime: String(
            recipe.estimatedCookingTime || ""
          ),
          servings: Number(recipe.servings) || 2,
          image: getCanonicalImageForRecipe(title),
          atRiskIngredients: [],
          pantryItems: availableIngredientsList,
          missingIngredients: missingIngredientsList,
          availableIngredientsList,
          missingIngredientsList,
          ingredientsWithQuantities: formattedIngredients,
          steps: Array.isArray(recipe.steps) ? recipe.steps : [],
          substitutions: Array.isArray(recipe.substitutions)
            ? recipe.substitutions
            : [],
          rescueWeight: "0",
          moneySaved: "₹0",
          wasteSavingTip: String(
            recipe.wasteSavingTip ||
              "Use ingredients that are closest to expiry first."
          ),
          matchPercentage: total
            ? Math.round(
                (availableIngredientsList.length / total) * 100
              )
            : 100,
          isAIGenerated: true,
        };
      })
      .filter((recipe: any) => recipe.title);

    if (recipes.length) {
      return res.json({
        recipes,
        source: "gemini-ai",
        message: `Gemini generated ${recipes.length} recipe(s).`,
      });
    }

    return res.status(502).json({
      recipes: [],
      source: "gemini-ai",
      message: "Gemini did not return a usable recipe.",
    });
  } catch (error: any) {
    console.error(
      "Recipe generation failed:",
      error?.message || error
    );

    // Verified catalog fallback.
    try {
      const availableItems = normalizeList(
        Array.isArray(req.body.userInventory) &&
          req.body.userInventory.length
          ? req.body.userInventory
          : Array.isArray(req.body.ingredients)
            ? req.body.ingredients
            : []
      );

      const fallbackRecipes = CANONICAL_RECIPES
        .map((recipe: any) => {
          const required = (recipe.normalizedRequired || []).map(
            normalizeToken
          );

          const matched = required.filter((item: string) =>
            availableItems.includes(item)
          );

          return {
            ...recipe,
            image: getCanonicalImageForRecipe(recipe.title),
            matchPercentage: required.length
              ? Math.round((matched.length / required.length) * 100)
              : 0,
            pantryItems: matched,
            availableIngredientsList: matched,
            missingIngredientsList: required.filter(
              (item: string) => !availableItems.includes(item)
            ),
            isAIGenerated: false,
          };
        })
        .filter((recipe: any) => recipe.matchPercentage > 0)
        .sort(
          (a: any, b: any) =>
            b.matchPercentage - a.matchPercentage
        )
        .slice(0, 5);

      if (fallbackRecipes.length) {
        return res.json({
          recipes: fallbackRecipes,
          source: "smart-shelf-fallback",
          message:
            "AI is temporarily unavailable. Showing catalog recipes.",
        });
      }
    } catch (fallbackError) {
      console.error("Recipe fallback failed:", fallbackError);
    }

    return res.status(502).json({
      recipes: [],
      source: "gemini-error",
      message:
        "AI is temporarily unavailable and no matching catalog recipe was found.",
    });
  }
});

// =====================================================
// RECIPE RECOMMENDATIONS
// =====================================================

app.post("/api/recipes/recommend", async (req, res) => {
  const {
    availableItems = [],
    preferredCuisine = "South Indian",
  } = req.body;

  const ai = getAIClient();

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `Recommend three realistic zero-waste recipes.
Available ingredients: ${JSON.stringify(availableItems)}
Preferred cuisine: ${preferredCuisine}
Prioritize ingredients closest to expiry.
Return JSON array only.`,
        config: {
          responseMimeType: "application/json",
          systemInstruction:
            "You are a South Indian kitchen manager. Return recipes with title, prepTime, description, rescuedIngredients, pantryItems, missingIngredients and difficulty.",
          temperature: 0.3,
        },
      });

      const parsed = JSON.parse(response.text || "[]");

      if (Array.isArray(parsed) && parsed.length) {
        return res.json({
          recipes: parsed,
          source: "gemini-ai",
        });
      }
    } catch (error: any) {
      console.warn(
        "Recommendation AI failed:",
        error?.message || error
      );
    }
  }

  return res.json({
    recipes: CANONICAL_RECIPES
      .slice(0, 3)
      .map((recipe: any) => ({
        ...recipe,
        image: getCanonicalImageForRecipe(recipe.title),
      })),
    source: "smart-shelf-catalog",
  });
});

// =====================================================
// START SERVER — CONNECT TO MONGODB FIRST
// =====================================================

async function startServer() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error(
      "MONGODB_URI is missing. Add your MongoDB Atlas connection string to .env."
    );
  }

  await mongoose.connect(mongoUri);

  console.log("MongoDB connected successfully.");

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");

    app.use(express.static(distPath));

    // IMPORTANT: Frontend fallback must be LAST.
    // API routes above must always respond before this handler.
    app.get(/.*/, (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `Smart Shelf Server running at http://0.0.0.0:${PORT}`
    );
  });
}

startServer().catch((error) => {
  console.error("Failed to start Smart Shelf:", error);
  process.exit(1);
});