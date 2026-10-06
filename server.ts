import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import {
  CANONICAL_RECIPES,
  isCanonicalRecipeTitle,
  findCanonicalRecipe,
  getCanonicalImageForRecipe,
  CanonicalRecipe,
} from "./src/data/canonicalRecipes";
import {
  initAuthStore,
  signUpUser,
  loginUser,
  logoutUser,
  getUserByToken,
  getUserData,
  saveUserData,
} from "./src/server/authStore";

dotenv.config();

// Initialize backend persistent data directories
initAuthStore();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// Initialize Gemini SDK with telemetry header (lazy initialization)
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    } catch (err) {
      console.error("Failed to initialize GoogleGenAI client:", err);
    }
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    app: "Smart Shelf AI Kitchen Manager",
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString(),
  });
});

// ==========================================
// AUTHENTICATION & USER DATA ENDPOINTS
// ==========================================

// Sign Up Endpoint
app.post("/api/auth/signup", (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match." });
    }
    const result = signUpUser(name, email, password);
    return res.status(201).json(result);
  } catch (err: any) {
    return res.status(err.status || 500).json({ error: err.message || "Failed to create account." });
  }
});

// Login Endpoint
app.post("/api/auth/login", (req, res) => {
  try {
    const { email, password } = req.body;
    const result = loginUser(email, password);
    return res.json(result);
  } catch (err: any) {
    return res.status(err.status || 401).json({ error: err.message || "Invalid email or password." });
  }
});

// Logout Endpoint
app.post("/api/auth/logout", (req, res) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  logoutUser(token);
  return res.json({ success: true, message: "Logged out successfully." });
});

// Get Current User Profile Endpoint
app.get("/api/auth/me", (req, res) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const user = getUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: "Session expired or invalid. Please sign in." });
  }
  return res.json({ user });
});

// Get User Isolated Data Endpoint
app.get("/api/user/data", (req, res) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const user = getUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const data = getUserData(user.id);
  return res.json(data);
});

// Sync User Isolated Data Endpoint
app.post("/api/user/sync", (req, res) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const user = getUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const { inventory, wasteRecords, shoppingItems, chefHistory, preferences } = req.body;
  saveUserData(user.id, { inventory, wasteRecords, shoppingItems, chefHistory, preferences });
  return res.json({ success: true });
});

// Load Starter Sample Pantry for Authenticated User
app.post("/api/user/load-sample", (req, res) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const user = getUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const sampleInventory = [
    {
      id: `inv-${Date.now()}-1`,
      name: "Maggi 2-Minute Masala Noodles",
      category: "Pantry",
      quantity: 3,
      unit: "packs",
      expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      location: "Pantry Shelf",
      confidence: "high",
      addedDate: new Date().toISOString().split("T")[0],
      urgencyStatus: "optimal",
    },
    {
      id: `inv-${Date.now()}-2`,
      name: "Farm Fresh Eggs",
      category: "Dairy & Eggs",
      quantity: 6,
      unit: "pcs",
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      location: "Refrigerator Door",
      confidence: "high",
      addedDate: new Date().toISOString().split("T")[0],
      urgencyStatus: "warning",
    },
    {
      id: `inv-${Date.now()}-3`,
      name: "Country Tomatoes",
      category: "Produce",
      quantity: 1,
      unit: "kg",
      expiryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      location: "Vegetable Crisper",
      confidence: "high",
      addedDate: new Date().toISOString().split("T")[0],
      urgencyStatus: "urgent",
    },
  ];

  saveUserData(user.id, { inventory: sampleInventory });
  return res.json({ success: true, inventory: sampleInventory });
});

// AI Chef Conversational Query & Cooking Guidance ("Hey Chef")
app.post("/api/chef/ask", async (req, res) => {
  const { query, activeRecipe, currentStep, userInventory = [], pantryItems } = req.body;

  const userQuery = (query || "").trim();
  const qLower = userQuery.toLowerCase();

  // Extract inventory names list for truth checking
  const invList: Array<{ name: string; quantity: number; unit: string }> = Array.isArray(userInventory)
    ? userInventory.map((i: any) => ({
        name: String(i.name || ""),
        quantity: Number(i.quantity || 0),
        unit: String(i.unit || "unit"),
      }))
    : [];

  const invNames = invList.map((i) => i.name.toLowerCase());

  // Check specifically for Maggi / instant noodles
  const isMaggiQuery =
    qLower.includes("maggi") ||
    qLower.includes("maggie") ||
    qLower.includes("noodle") ||
    qLower.includes("noodles");

  const hasMaggiInInventory = invList.some(
    (i) =>
      i.name.toLowerCase().includes("maggi") ||
      i.name.toLowerCase().includes("maggie") ||
      i.name.toLowerCase().includes("noodle")
  );

  const isTamilTanglish =
    /enna|sapadalam|samayikalam|panna|mudiyum|iruku|irukku|kitta|venum|epdi|seiya|sapdanum/i.test(qLower);

  // If user explicitly asks about Maggi, answer specifically about Maggi!
  if (isMaggiQuery) {
    const hasEggs = invList.some((i) => i.name.toLowerCase().includes("egg") || i.name.toLowerCase().includes("muttai"));
    const hasOnion = invList.some((i) => i.name.toLowerCase().includes("onion") || i.name.toLowerCase().includes("vengayam"));
    const hasTomato = invList.some((i) => i.name.toLowerCase().includes("tomato") || i.name.toLowerCase().includes("thakkali"));

    const availableAddons: string[] = [];
    if (hasEggs) availableAddons.push("Eggs");
    if (hasOnion) availableAddons.push("Onions");
    if (hasTomato) availableAddons.push("Tomatoes");

    if (hasMaggiInInventory) {
      let reply = "";
      if (isTamilTanglish) {
        reply = `Unga My Food inventory-la Maggi irukku! 2-3 minutes-la Classic Masala Maggi ready pannalam.`;
        if (availableAddons.length > 0) {
          reply += ` Unga kitta ${availableAddons.join(", ")} kooda irukku, adhanala ${availableAddons[0]} Maggi kooda try pannalam!`;
        }
      } else {
        reply = `You have Maggi in your kitchen! You can make Classic Masala Maggi in 2-3 minutes.`;
        if (availableAddons.length > 0) {
          reply += ` Available in inventory: Maggi, ${availableAddons.join(", ")}. You can also prepare ${availableAddons[0]} Maggi!`;
        }
      }
      return res.json({
        response: reply,
        timerMinutes: 3,
        source: "chef-inventory-truth",
        dish: "Maggi",
        maggiAvailable: true,
      });
    } else {
      // Maggi is MISSING
      let reply = "";
      if (isTamilTanglish) {
        reply = `Unga My Food storage-la ippo Maggi illa (Missing: Maggi 1 pack). Classic Maggi panna 1.5 cup thanni kothikka vechu, tastemaker pottu 2-3 mins medium flame-la cook pannunga. Maggi-ya Smart Shopping list-la add pannidava?`;
      } else {
        reply = `Maggi is currently not in your My Food inventory (Missing: Maggi 1 pack). To cook classic Maggi: boil 1.5 cups water, add tastemaker and noodle cake, and simmer for 2 to 3 minutes on medium flame. Would you like to add Maggi to your Smart Shopping list?`;
      }
      return res.json({
        response: reply,
        timerMinutes: 3,
        source: "chef-inventory-truth",
        dish: "Maggi",
        maggiAvailable: false,
        missingIngredients: ["Maggi Noodles 1 pack"],
      });
    }
  }

  const ai = getAIClient();
  if (ai) {
    try {
      const systemInstruction = `You are "Chef Narayanan", an expert South Indian master chef and AI Kitchen Assistant in Smart Shelf.
CRITICAL TRUTH & INVENTORY RULES:
1. The user's actual inventory is: ${JSON.stringify(invList)}.
2. NEVER claim an ingredient is available unless it exists in the user's inventory list above!
3. If the user asks for a specific dish, prioritize and answer specifically about that dish.
4. Keep spoken responses concise, warmly encouraging, precise, and practical (1-3 sentences max).
5. If the user speaks in Tamil or Tanglish, reply warmly in Tanglish.`;

      const promptContext = `Context:
Current Active Recipe: ${activeRecipe || "Kitchen Guidance"}
Current Step: ${currentStep || "Cooking"}
User Question: "${userQuery || "What can I cook?"}"`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: promptContext,
        config: {
          systemInstruction,
          temperature: 0.6,
        },
      });

      const replyText = response.text?.trim();
      if (replyText) {
        const timerMatch = replyText.match(/(\d+)\s*(?:minute|min|m)/i);
        const timerMinutes = timerMatch ? parseInt(timerMatch[1], 10) : 5;
        return res.json({
          response: replyText,
          timerMinutes,
          source: "gemini-ai",
        });
      }
    } catch (error: any) {
      console.warn("Gemini API error in chef ask:", error?.message || error);
    }
  }

  // Fallback culinary responses based strictly on actual items
  let fallbackReply = `Chef advice: Keep flame on medium heat so spice flavors infuse without burning.`;
  let timerMinutes = 5;

  if (qLower.includes("substitute") || qLower.includes("tamarind")) {
    fallbackReply = "Use 1.5 tbsp fresh lemon juice plus 1/4 teaspoon jaggery to replace tamarind paste. Add it after switching off the flame.";
    timerMinutes = 0;
  } else if (qLower.includes("next step") || qLower.includes("advance")) {
    fallbackReply = "Pour the crackling mustard and curry leaves tadka immediately into the pot and close the lid for 30 seconds to lock in the aroma.";
    timerMinutes = 1;
  } else if (qLower.includes("boil") || qLower.includes("tomato") || qLower.includes("rasam")) {
    fallbackReply = "Simmer the country tomatoes on medium flame for 6 to 8 minutes until skins naturally split and soften. I have started a 7-minute timer for you.";
    timerMinutes = 7;
  }

  return res.json({
    response: fallbackReply,
    timerMinutes,
    source: "culinary-engine",
  });
});

// AI Recipe Generation Endpoint — Generates recipes dynamically from user ingredients
app.post("/api/recipes/generate", async (req, res) => {
  const {
    ingredients = [],
    userInventory = [],
    cuisinePreference = "All",
    dietaryPreference = "Flexible",
    searchQuery = "",
  } = req.body;

  // Natural language ingredient normalization (English, Tamil, Tanglish)
  const tamilToEnglishMap: Record<string, string> = {
    maggi: "maggi",
    maggie: "maggi",
    maggy: "maggi",
    maggis: "maggi",
    noodles: "maggi",
    "instant noodles": "maggi",
    ramen: "maggi",
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
    paneer: "cheese",
  };

  const normalizeToken = (token: string): string => {
    const cleaned = token.toLowerCase().trim();
    return tamilToEnglishMap[cleaned] || cleaned;
  };

  // Compile full list of user ingredients
  let inputList: string[] = [];
  if (Array.isArray(ingredients) && ingredients.length > 0) {
    inputList = ingredients.map((i: any) => normalizeToken(String(i))).filter(Boolean);
  } else if (typeof searchQuery === "string" && searchQuery.trim()) {
    inputList = searchQuery
      .replace(/^(i have|i got|we have|enkitta|en kitta|ennidam|use|with|make|cook|recipe for)s+/i, "")
      .replace(/\s+(and|irukku|iruku|vechu|vachu|enna panna mudiyum|venum|sollu|epdi|seiya|how to|cook|make)\b/gi, ",")
      .split(/[,+]/)
      .map((s) => normalizeToken(s))
      .filter(Boolean);
  }

  // Extract keywords directly from raw query
  const rawQueryLower = (searchQuery || "").toLowerCase();
  const searchKeywords: string[] = [];
  if (rawQueryLower.includes("maggi") || rawQueryLower.includes("maggie") || rawQueryLower.includes("noodle")) {
    searchKeywords.push("maggi");
  }
  if (rawQueryLower.includes("chicken") || rawQueryLower.includes("kozhi") || rawQueryLower.includes("koli")) {
    searchKeywords.push("chicken");
  }
  if (rawQueryLower.includes("rice") || rawQueryLower.includes("biryani") || rawQueryLower.includes("briyani")) {
    searchKeywords.push("rice");
  }
  if (rawQueryLower.includes("egg") || rawQueryLower.includes("muttai")) {
    searchKeywords.push("egg");
  }
  if (rawQueryLower.includes("tomato") || rawQueryLower.includes("thakkali")) {
    searchKeywords.push("tomato");
  }
  if (rawQueryLower.includes("vegetable") || rawQueryLower.includes("veggie")) {
    searchKeywords.push("vegetables");
  }
  if (rawQueryLower.includes("cheese")) {
    searchKeywords.push("cheese");
  }
  if (rawQueryLower.includes("garlic") || rawQueryLower.includes("poondu")) {
    searchKeywords.push("garlic");
  }

  const allTargetTokens = Array.from(new Set([...inputList, ...searchKeywords]));

  // User kitchen inventory ingredients
  const inventoryTokens = Array.isArray(userInventory)
    ? userInventory.map((item: any) => normalizeToken(typeof item === "string" ? item : item.name)).filter(Boolean)
    : [];

  // Check if query expressed possession ("i have ...", "enkitta ... irukku", "with ...")
  const hasPossessionIntent =
    /^(i have|i got|we have|enkitta|en kitta|ennidam|use|with)\b/i.test(searchQuery || "") ||
    (!/epdi|seiya|recipe|how to|venum|sollu|panna/i.test(searchQuery || "") && ingredients.length > 0);

  const declaredPossessed = hasPossessionIntent ? inputList : [];
  const userPossessedSet = new Set([...inventoryTokens, ...declaredPossessed]);

  // CANONICAL SEARCH: Find matching recipes in CANONICAL_RECIPES
  const candidateRecipes = CANONICAL_RECIPES.filter((recipe) => {
    const req = (recipe.normalizedRequired || []).map((s) => s.toLowerCase());
    const opt = (recipe.normalizedOptional || []).map((s) => s.toLowerCase());
    const title = recipe.title.toLowerCase();
    const aliases = (recipe.canonicalAliases || []).map((a) => a.toLowerCase());

    return allTargetTokens.some(
      (token) =>
        req.includes(token) ||
        opt.includes(token) ||
        title.includes(token) ||
        aliases.some((a) => a.includes(token))
    );
  });

  // RULE 12: NEVER HALLUCINATE A RECIPE TO AVOID SHOWING "NO RESULTS"
  if (candidateRecipes.length === 0) {
    return res.json({
      recipes: [],
      source: "canonical-verifier",
      message: "I couldn't find a verified recipe matching your ingredients.",
    });
  }

  // Rank candidate recipes based on target tokens and inventory possession
  const rankedCandidates = [...candidateRecipes].sort((a, b) => {
    const aReq = (a.normalizedRequired || []).map((s) => s.toLowerCase());
    const bReq = (b.normalizedRequired || []).map((s) => s.toLowerCase());

    // Matches with target query tokens
    const aTargetMatches = allTargetTokens.filter((t) => aReq.includes(t)).length;
    const bTargetMatches = allTargetTokens.filter((t) => bReq.includes(t)).length;
    if (bTargetMatches !== aTargetMatches) {
      return bTargetMatches - aTargetMatches;
    }

    // Possession matches
    const aAvail = aReq.filter((item) => userPossessedSet.has(item)).length;
    const bAvail = bReq.filter((item) => userPossessedSet.has(item)).length;
    return bAvail - aAvail;
  });

  const selectedCanonicalRecipes = rankedCandidates.slice(0, 5);

  const ai = getAIClient();
  if (ai) {
    try {
      const allowedTitles = selectedCanonicalRecipes.map((r) => r.title);
      const prompt = `Available kitchen items: ${JSON.stringify(Array.from(userPossessedSet))}
User query: "${searchQuery}"
ALLOWED VERIFIED CANONICAL RECIPES:
${selectedCanonicalRecipes.map((r) => `- ${r.title} (Cuisine: ${r.cuisine}, Category: ${r.category})`).join("\n")}

You must return a JSON array of up to ${selectedCanonicalRecipes.length} recipe objects conforming strictly to the allowed titles list.
CRITICAL INTEGRITY ENFORCEMENT:
1. ONLY return recipe names from this approved list: ${JSON.stringify(allowedTitles)}.
2. NEVER invent recipe names (NEVER generate "Maggi Poriyal", "Maggi Kootu", "Maggi Curry", "Maggi Tawa Pulao", or any invented combination).
3. Set isAvailable: true ONLY if the item is present in user's available kitchen items. Otherwise set isAvailable: false and put in missingIngredients.
4. Personalize only realistic ingredient quantities, steps, substitutions, and tips for these verified dishes.`;

      const systemInstruction = `You are the expert AI Chef engine for Smart Shelf AI Kitchen Manager.
STRICT DATA INTEGRITY RULES:
1. CANONICAL NAMES ONLY: You are strictly forbidden from creating new recipe names. Every recipe you output MUST match an approved canonical recipe title.
2. ACCURATE CUISINES: Never label Maggi recipes as "South Indian" or "Traditional". Keep Maggi labeled as "Indian Street Food / Snack".
3. TRUTHFUL INVENTORY MATCHING: Put missing ingredients under missingIngredients and mark isAvailable: false. Never pretend missing ingredients are available.`;

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Gemini API call timed out after 10s")), 10000)
      );

      const response: any = await Promise.race([
        ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            systemInstruction,
          },
        }),
        timeoutPromise,
      ]);

      let jsonStr = response.text?.trim() || "";
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
      }

      const parsed = JSON.parse(jsonStr);
      const rawRecipes = Array.isArray(parsed) ? parsed : parsed.recipes || [parsed];

      if (Array.isArray(rawRecipes) && rawRecipes.length > 0) {
        // VALIDATE EVERY AI RECIPE AGAINST CANONICAL DATABASE (RULE 9)
        const validatedRecipes = rawRecipes
          .map((r: any, idx: number) => {
            const rawTitle = String(r.recipeName || r.title || "").trim();
            const canonicalMatch = findCanonicalRecipe(rawTitle) || selectedCanonicalRecipes[idx % selectedCanonicalRecipes.length];

            // If the AI generated an invented recipe name that does not exist in canonical database,
            // reject it and substitute the verified canonical recipe!
            const verifiedTitle = canonicalMatch.title;
            const verifiedImage = getCanonicalImageForRecipe(verifiedTitle);
            const verifiedCuisine = canonicalMatch.cuisine;

            const ingList = Array.isArray(r.ingredientsWithQuantities) && r.ingredientsWithQuantities.length > 0
              ? r.ingredientsWithQuantities
              : canonicalMatch.ingredientsWithQuantities || [];

            // Calculate actual truthful availability against user inventory
            const formattedIngredients = ingList.map((i: any) => {
              const ingName = String(i.name || "");
              const isAvail = userPossessedSet.size > 0
                ? userPossessedSet.has(normalizeToken(ingName)) || Boolean(i.isAvailable && userPossessedSet.has(normalizeToken(ingName)))
                : Boolean(i.isAvailable);
              return {
                name: ingName,
                quantity: String(i.quantity || "as required"),
                isAvailable: isAvail,
              };
            });

            const availCount = formattedIngredients.filter((i: any) => i.isAvailable).length;
            const totalCount = formattedIngredients.length || 1;
            const matchPercentage = Math.round((availCount / totalCount) * 100);

            const missingIngredients = formattedIngredients
              .filter((i: any) => !i.isAvailable)
              .map((i: any) => `${i.name} (${i.quantity})`);

            return {
              id: `canonical-ai-${canonicalMatch.id}-${idx}`,
              title: verifiedTitle,
              subtitle: r.description || canonicalMatch.subtitle,
              prepTime: r.prepTime || canonicalMatch.prepTime,
              cookTime: r.cookTime || canonicalMatch.cookTime,
              estimatedCookingTime: r.estimatedCookingTime || canonicalMatch.estimatedCookingTime,
              servings: typeof r.servings === "number" ? r.servings : canonicalMatch.servings,
              description: r.description || canonicalMatch.description,
              cuisine: verifiedCuisine,
              category: canonicalMatch.category,
              image: verifiedImage,
              atRiskIngredients: [],
              pantryItems: formattedIngredients.filter((i: any) => i.isAvailable).map((i: any) => i.name),
              missingIngredients,
              rescueWeight: canonicalMatch.rescueWeight,
              moneySaved: canonicalMatch.moneySaved,
              wasteSavingTip: r.wasteSavingTip || canonicalMatch.wasteSavingTip,
              steps: Array.isArray(r.steps) && r.steps.length > 0 ? r.steps : canonicalMatch.steps,
              ingredientsWithQuantities: formattedIngredients,
              substitutions: Array.isArray(r.substitutions) && r.substitutions.length > 0 ? r.substitutions : canonicalMatch.substitutions,
              matchPercentage,
              isAIGenerated: true,
            };
          })
          .filter(Boolean);

        if (validatedRecipes.length > 0) {
          return res.json({
            recipes: validatedRecipes,
            source: "gemini-ai",
            message: `Personalized ${validatedRecipes.length} verified canonical recipes.`,
          });
        }
      }
    } catch (err: any) {
      console.warn("Gemini AI personalization failed; serving verified canonical recipes directly:", err?.message || err);
    }
  }

  // CANONICAL FALLBACK GENERATOR: Formats matching canonical recipes with truthful inventory logic
  const formattedCanonical = selectedCanonicalRecipes.map((canonical, idx) => {
    const requiredItems = canonical.normalizedRequired || [];
    const ingList = canonical.ingredientsWithQuantities || [];

    const formattedIngredients = ingList.map((i) => {
      const token = normalizeToken(i.name);
      const isAvailable = userPossessedSet.has(token);
      return {
        ...i,
        isAvailable,
      };
    });

    const availReqCount = requiredItems.filter((req) => userPossessedSet.has(req.toLowerCase())).length;
    const totalReqCount = requiredItems.length || 1;
    const matchPercentage = totalReqCount === 0 ? 100 : Math.round((availReqCount / totalReqCount) * 100);

    const missingIngredients = formattedIngredients
      .filter((i) => !i.isAvailable)
      .map((i) => `${i.name} (${i.quantity})`);

    return {
      id: `canonical-${canonical.id}-${idx}`,
      title: canonical.title,
      subtitle: canonical.subtitle,
      prepTime: canonical.prepTime,
      cookTime: canonical.cookTime,
      estimatedCookingTime: canonical.estimatedCookingTime,
      servings: canonical.servings,
      description: canonical.description,
      cuisine: canonical.cuisine,
      category: canonical.category,
      image: canonical.image,
      atRiskIngredients: [],
      pantryItems: formattedIngredients.filter((i) => i.isAvailable).map((i) => i.name),
      missingIngredients,
      rescueWeight: canonical.rescueWeight,
      moneySaved: canonical.moneySaved,
      wasteSavingTip: canonical.wasteSavingTip,
      steps: canonical.steps,
      ingredientsWithQuantities: formattedIngredients,
      substitutions: canonical.substitutions || [],
      matchPercentage,
      isAIGenerated: false,
    };
  });

  return res.json({
    recipes: formattedCanonical,
    source: "smart-shelf-canonical",
    message: `Generated ${formattedCanonical.length} authentic verified recipes.`,
  });
});

app.post("/api/recipes/recommend", async (req, res) => {
  const { availableItems, preferredCuisine } = req.body;

  const ai = getAIClient();
  if (ai) {
    try {
      const prompt = `Based on these available kitchen inventory items: ${JSON.stringify(availableItems || ["Tomatoes", "Coriander", "Toor Dal", "Carrots", "Coconut", "Mustard Seeds", "Curry Leaves"])}, recommend 3 authentic ${preferredCuisine || "South Indian"} zero-waste recipes prioritizing items closest to expiration. Return JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          systemInstruction: `You are an AI kitchen manager specialized in South Indian zero-waste cooking.
Provide an array of recipes with title, prepTime, description, rescuedIngredients (list with urgency), pantryItems, missingIngredients (if any), and difficulty.`,
        },
      });

      const parsed = JSON.parse(response.text || "[]");
      if (Array.isArray(parsed) && parsed.length > 0) {
        return res.json({ recipes: parsed, source: "gemini-ai" });
      }
    } catch (error: any) {
      console.warn("Gemini recipe recommendation error, falling back:", error?.message || error);
    }
  }

  // Pre-configured rich South Indian authentic recipes matching the exact designs
  return res.json({
    recipes: [
      {
        id: "tomato-rasam",
        title: "Tomato Rasam",
        subtitle: "Tangy Tomato Rasam (Lemon Infused)",
        prepTime: "25 min",
        servings: 4,
        description: "A comforting, tangy South Indian soup perfect for clearing out overripe tomatoes.",
        atRiskIngredients: [
          { name: "Tomatoes", urgency: "2 days", status: "critical" },
          { name: "Cilantro", urgency: "1 day", status: "urgent" },
        ],
        pantryItems: ["Mustard Seeds", "Curry Leaves", "Hing", "Pepper & Cumin"],
        missingIngredients: [],
        rescueWeight: "560g",
        moneySaved: "₹185",
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80",
      },
      {
        id: "veg-poriyal",
        title: "Vegetable Poriyal",
        prepTime: "20 min",
        servings: 3,
        description: "A quick stir-fry of mixed vegetables finished with fresh coconut.",
        pantryItems: ["Carrots", "Green Beans", "Coconut", "Urad Dal"],
        atRiskIngredients: [
          { name: "Carrots", urgency: "3 days", status: "warning" },
          { name: "Fresh Grated Coconut", urgency: "16h left", status: "urgent" },
        ],
        missingIngredients: [],
        rescueWeight: "400g",
        moneySaved: "₹95",
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80",
      },
      {
        id: "veg-sambar",
        title: "Mixed Vegetable Sambar",
        prepTime: "30 min",
        servings: 5,
        description: "A staple South Indian lentil stew packed with drumsticks, carrots, and shallots.",
        pantryItems: ["Toor Dal", "Tamarind", "Drumstick", "Sambar Powder"],
        atRiskIngredients: [
          { name: "Sambar Onions (Shallots)", urgency: "2 days", status: "warning" },
        ],
        missingIngredients: ["Drumstick"],
        rescueWeight: "650g",
        moneySaved: "₹140",
        image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80",
      },
    ],
    source: "smart-shelf-catalog",
  });
});

// Vite middleware & Static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Smart Shelf Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
