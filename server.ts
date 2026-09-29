import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

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

// AI Chef Conversational Query & Cooking Guidance ("Hey Chef")
app.post("/api/chef/ask", async (req, res) => {
  const { query, activeRecipe, currentStep, pantryItems } = req.body;

  const defaultPrompt = query || "How long should I boil the tomatoes for the Rasam?";

  const ai = getAIClient();
  if (ai) {
    try {
      const systemInstruction = `You are "Chef Narayanan", an expert South Indian master chef and AI Kitchen Assistant in Smart Shelf.
The user is cooking hands-free in a kitchen. Keep spoken responses concise, warmly encouraging, precise, and practical (1-3 sentences max).
Include exact cooking times, flame levels (low/medium/high), and smart waste-saving tips when applicable.
If the user asks for a timer, specify an exact timer in minutes in your reply.`;

      const promptContext = `Context:
Current Active Recipe: ${activeRecipe || "Tangy Tomato Rasam (Lemon Infused)"}
Current Cooking Step: ${currentStep || "Step 4: Tadka Pour & Garnish"}
Pantry At-Risk Items: ${JSON.stringify(pantryItems || ["Tomatoes (2 days)", "Coriander (1 day)"])}
User Question: "${defaultPrompt}"`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: promptContext,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const replyText = response.text?.trim() || "Simmer the country tomatoes on medium flame for 6 to 8 minutes until skins naturally split and soften. I have initiated an active timer for 7 minutes for you.";
      
      // Check if a timer was mentioned
      const timerMatch = replyText.match(/(\d+)\s*(?:minute|min|m)/i);
      const timerMinutes = timerMatch ? parseInt(timerMatch[1], 10) : 7;

      return res.json({
        response: replyText,
        timerMinutes,
        source: "gemini-ai",
      });
    } catch (error: any) {
      console.warn("Gemini API error, using smart fallback:", error?.message || error);
    }
  }

  // High-fidelity fallback South Indian culinary knowledge base
  const qLower = (defaultPrompt || "").toLowerCase();
  let fallbackReply = "Simmer the country tomatoes on medium flame for 6 to 8 minutes until skins naturally split and soften. I have initiated an active timer for 7 minutes for you.";
  let timerMinutes = 7;

  if (qLower.includes("substitute") || qLower.includes("tamarind")) {
    fallbackReply = "Use 1.5 tbsp fresh lemon juice plus 1/4 teaspoon jaggery to replace tamarind paste. Add it after switching off the flame to preserve vitamin C and bright acidity.";
    timerMinutes = 0;
  } else if (qLower.includes("next step") || qLower.includes("advance")) {
    fallbackReply = "Pour the crackling mustard and curry leaves tadka immediately into the rasam pot and close the lid for 30 seconds to lock in the aroma.";
    timerMinutes = 1;
  } else if (qLower.includes("ingredients") || qLower.includes("list")) {
    fallbackReply = "You are currently rescuing 4 items: Country Tomatoes (350g), Fresh Coriander (2 tbsp), Lemon (1 whole), and Curry Leaves (1 sprig).";
    timerMinutes = 0;
  } else if (qLower.includes("boil") || qLower.includes("tomato") || qLower.includes("rasam")) {
    fallbackReply = "Simmer the country tomatoes on medium flame for 6 to 8 minutes until skins naturally split and soften. I have initiated an active timer for 7 minutes for you.";
    timerMinutes = 7;
  } else if (qLower.includes("tadka") || qLower.includes("tempering")) {
    fallbackReply = "Heat cold-pressed sesame oil to 160°C. Sputter mustard seeds, add curry leaves and a pinch of hing, then pour right away!";
    timerMinutes = 2;
  } else {
    fallbackReply = `Chef advice: For ${activeRecipe || "your South Indian dish"}, maintain gentle heat so the spice aromas infuse deeply without turning bitter.`;
    timerMinutes = 5;
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
    thakkali: "tomato",
    thakkalipazham: "tomato",
    vengayam: "onion",
    vengaayam: "onion",
    vengaiyam: "onion",
    muttai: "egg",
    mutta: "egg",
    koli: "chicken",
    kozhi: "chicken",
    chickan: "chicken",
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
    inji: "ginger",
    kadugu: "mustard seeds",
    seeragam: "cumin seeds",
    milagu: "black pepper",
  };

  const normalizeToken = (token: string): string => {
    const cleaned = token.toLowerCase().trim();
    return tamilToEnglishMap[cleaned] || cleaned;
  };

  // Compile full list of user ingredients
  let inputList: string[] = [];
  if (Array.isArray(ingredients) && ingredients.length > 0) {
    inputList = ingredients.map((i: any) => normalizeToken(String(i)));
  } else if (typeof searchQuery === "string" && searchQuery.trim()) {
    inputList = searchQuery
      .replace(/^(i have|i got|we have|enkitta|en kitta|ennidam|use|with|make|cook|recipe for)\s+/i, "")
      .replace(/\s+(and|irukku|iruku|vechu|vachu|enna panna mudiyum|venum|sollu)\b/gi, ",")
      .split(/[,+]/)
      .map((s) => normalizeToken(s))
      .filter(Boolean);
  }

  // Combine with available inventory if available
  const inventoryNames = Array.isArray(userInventory)
    ? userInventory.map((item: any) => normalizeToken(typeof item === "string" ? item : item.name)).filter(Boolean)
    : [];

  const combinedIngredients = Array.from(new Set([...inputList, ...inventoryNames]));
  const primaryInput = inputList.length > 0 ? inputList : combinedIngredients;

  if (primaryInput.length === 0) {
    return res.status(400).json({
      error: "Please enter at least one ingredient to generate recipes.",
      recipes: [],
    });
  }

  const isBiryaniRequested = /briyani|biryani|dum biryani/i.test(searchQuery);

  const ai = getAIClient();
  if (ai) {
    try {
      const prompt = `User available ingredients: ${JSON.stringify(primaryInput)}
Full kitchen inventory: ${JSON.stringify(combinedIngredients)}
Preferred Cuisine: ${cuisinePreference}
User Query: "${searchQuery}"
Is Biryani Requested: ${isBiryaniRequested}

You must return a valid JSON array of 3 distinct recipe objects.
Conform strictly to this JSON schema:
[
  {
    "recipeName": "string",
    "description": "string",
    "cuisine": "South Indian" | "Indian" | "International" | "Asian",
    "category": "Breakfast" | "Lunch" | "Dinner" | "Snack" | "Side",
    "prepTime": "string (e.g. 15 min)",
    "cookTime": "string (e.g. 25 min)",
    "estimatedCookingTime": "string (e.g. 40 min total)",
    "servings": number,
    "ingredientsWithQuantities": [
      {
        "name": "string",
        "quantity": "string (e.g. 500g, 2 cups, 1 tsp)",
        "isAvailable": boolean
      }
    ],
    "missingIngredients": ["string"],
    "substitutions": [
      {
        "original": "string",
        "substitute": "string",
        "note": "string"
      }
    ],
    "steps": [
      {
        "stepNumber": number,
        "title": "string",
        "duration": "string",
        "instructions": ["string"]
      }
    ],
    "wasteSavingTip": "string",
    "rescueWeight": "string (e.g. 450g)",
    "moneySaved": "string (e.g. ₹150)"
  }
]`;

      const systemInstruction = `You are the expert AI Chef engine for Smart Shelf AI Kitchen Manager, tailored specifically for Indian and especially South Indian households.

CRITICAL RECIPE GENERATION RULES:
1. ALWAYS prioritize recipes that naturally and genuinely use the user's available ingredients.
2. SOUTH INDIAN & INDIAN PRIORITY:
   Smart Shelf is designed for Indian users, especially South Indian users.
   When the available ingredients support it, prioritize familiar South Indian/Indian dishes (e.g. Chicken Biryani, Chettinad Chicken Curry / Kozhi Kuzhambu, Chicken 65, Tomato Rice, Tomato Rasam, Tomato Chutney, Egg Curry, Egg Podimas, Potato Masala, Sambar, Poriyal, Dosa/Idli sides, Variety Rice, etc.).
3. DO NOT GENERATE RANDOM OR OVERLY GENERIC RECIPES:
   If the user has chicken, DO NOT automatically return generic recipes like 'Chicken Soup' or 'Chicken Saute'.
   Consider familiar dishes such as Chicken Biryani, Chicken Curry, Chicken 65, Chicken Fried Rice, Chicken Masala, or Chicken Pepper Roast.
4. BIRYANI RULE:
   - If chicken and rice are available, Chicken Biryani MUST be considered as one of the generated recipes.
   - If chicken is available but rice is missing: Chicken Biryani MAY still be suggested if adding rice completes it. Put rice strictly under missingIngredients ('You'll also need') and mark isAvailable: false. Never pretend an ingredient is available if not in the user's input/inventory!
5. INGREDIENT MATCHING & SEPARATION:
   Every recipe must clearly separate:
   - ingredients the user already has (isAvailable: true)
   - ingredients that are missing (isAvailable: false, and listed in missingIngredients)
   NEVER invent or claim an ingredient is available unless it exists in the user's input or inventory.
6. MISSING INGREDIENT LIMIT:
   Prefer recipes that require no missing ingredients. If a recipe needs missing ingredients, allow at most 1–2 important missing ingredients.
7. ONE-INGREDIENT INPUT:
   Even if the user enters only one ingredient (e.g. 'tomato' or 'potato' or 'chicken' or 'egg'), NEVER return 'No recipes found'. Instead, generate 3 useful, authentic dishes using that ingredient and show the minimum additional ingredients required.
8. USER REQUEST HAS PRIORITY:
   If the user explicitly asks for 'biryani', 'briyani', 'sambar', 'rasam', etc., generate that requested dish directly!
9. OUTPUT:
   Return ONLY a valid JSON array of 3 recipe objects. No extra markdown wrap or explanations.`;

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Gemini API call timed out after 12s")), 12000)
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
      const rawRecipes = Array.isArray(parsed) ? parsed : (parsed.recipes || [parsed]);

      if (Array.isArray(rawRecipes) && rawRecipes.length > 0) {
        const foodImagePool = [
          "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80", // Biryani
          "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&auto=format&fit=crop&q=80", // Indian Curry
          "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80", // South Indian Curry
          "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80", // Sambar/Rice
          "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80", // Poriyal/Salad
        ];

        const formattedRecipes = rawRecipes.map((r: any, idx: number) => {
          const ingList = Array.isArray(r.ingredientsWithQuantities) ? r.ingredientsWithQuantities : [];
          const availCount = ingList.filter((i: any) => i.isAvailable !== false).length;
          const totalCount = ingList.length || 1;
          const matchPercentage = Math.round((availCount / totalCount) * 100);

          return {
            id: `ai-gen-${Date.now()}-${idx}`,
            title: r.recipeName || r.title || `Authentic Recipe ${idx + 1}`,
            subtitle: r.description || `Specially crafted for your kitchen ingredients`,
            prepTime: r.prepTime || "15 min",
            cookTime: r.cookTime || "20 min",
            estimatedCookingTime: r.estimatedCookingTime || `${r.prepTime || "15 min"} prep, ${r.cookTime || "20 min"} cook`,
            servings: typeof r.servings === "number" ? r.servings : 3,
            description: r.description || "A delicious, authentic homestyle meal made with your ingredients.",
            cuisine: r.cuisine || "South Indian",
            category: r.category || "Lunch",
            image: foodImagePool[idx % foodImagePool.length],
            atRiskIngredients: [],
            pantryItems: ingList.filter((i: any) => i.isAvailable !== false).map((i: any) => i.name),
            missingIngredients: Array.isArray(r.missingIngredients) ? r.missingIngredients.slice(0, 2) : [],
            rescueWeight: r.rescueWeight || "400g",
            moneySaved: r.moneySaved || "₹120",
            wasteSavingTip: r.wasteSavingTip || "Store leftover spices in an airtight jar to retain aroma.",
            steps: Array.isArray(r.steps) && r.steps.length > 0
              ? r.steps.map((st: any, sIdx: number) => ({
                  stepNumber: st.stepNumber || sIdx + 1,
                  title: st.title || `Step ${sIdx + 1}`,
                  duration: st.duration || "5 min",
                  instructions: Array.isArray(st.instructions) ? st.instructions : [String(st.instructions || st)],
                }))
              : [
                  {
                    stepNumber: 1,
                    title: "Prepare Ingredients",
                    duration: "5 min",
                    instructions: ["Clean, cut, and temper the ingredients as directed."],
                  },
                  {
                    stepNumber: 2,
                    title: "Simmer & Cook",
                    duration: "15 min",
                    instructions: ["Cook on medium flame until tender, aromatic, and thoroughly done."],
                  },
                ],
            ingredientsWithQuantities: ingList.map((i: any) => ({
              name: String(i.name || ""),
              quantity: String(i.quantity || "as required"),
              isAvailable: Boolean(i.isAvailable !== false),
            })),
            substitutions: Array.isArray(r.substitutions)
              ? r.substitutions.map((sub: any) => ({
                  original: String(sub.original || ""),
                  substitute: String(sub.substitute || ""),
                  note: String(sub.note || ""),
                }))
              : [],
            matchPercentage,
            isAIGenerated: true,
          };
        });

        return res.json({
          recipes: formattedRecipes,
          source: "gemini-ai",
          message: `Generated ${formattedRecipes.length} recipes using Gemini AI`,
        });
      }
    } catch (err: any) {
      console.warn("Gemini recipe generation failed or rate-limited; switching to authentic Indian fallback generator:", err?.message || err);
    }
  }

  // Authentic South Indian & Indian Fallback Generator (Strict adherence to Biryani and Indian culinary rules)
  const normInput = primaryInput.map((i) => i.toLowerCase());
  const hasChicken = normInput.some((i) => i.includes("chicken") || i.includes("kozhi") || i.includes("koli") || i.includes("chickan"));
  const hasRice = normInput.some((i) => i.includes("rice") || i.includes("arisi") || i.includes("sadham") || i.includes("saatham") || i.includes("chawal"));
  const hasEgg = normInput.some((i) => i.includes("egg") || i.includes("muttai") || i.includes("mutta"));
  const hasTomato = normInput.some((i) => i.includes("tomato") || i.includes("thakkali"));
  const hasPotato = normInput.some((i) => i.includes("potato") || i.includes("urulai") || i.includes("aloo"));
  const hasOnion = normInput.some((i) => i.includes("onion") || i.includes("vengayam"));
  const hasMilk = normInput.some((i) => i.includes("milk") || i.includes("paal"));
  const hasMango = normInput.some((i) => i.includes("mango") || i.includes("maanga") || i.includes("manga"));

  let fallbackRecipes: any[] = [];

  // 1. CHICKEN + RICE OR EXPLICIT BIRYANI REQUEST
  if (hasChicken && (hasRice || isBiryaniRequested)) {
    fallbackRecipes = [
      {
        id: `fb-biryani-${Date.now()}-1`,
        title: "Authentic Chicken Biryani",
        subtitle: "Fragrant, spiced South Indian style Chicken Dum Biryani",
        prepTime: "20 min",
        cookTime: "30 min",
        estimatedCookingTime: "50 min total",
        servings: 4,
        description: "Layered basmati or seeraga samba rice cooked with succulent chicken, mint, coriander, and aromatic biryani spices.",
        cuisine: "South Indian / Hyderabadi",
        category: "Lunch",
        image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80",
        pantryItems: ["chicken", "rice", ...(hasOnion ? ["onion"] : []), ...(hasTomato ? ["tomato"] : [])],
        missingIngredients: hasRice ? [] : ["2 cups Basmati Rice"],
        rescueWeight: "650g",
        moneySaved: "₹280",
        wasteSavingTip: "Use bone-in chicken cuts to enrich the natural stock of the biryani.",
        steps: [
          {
            stepNumber: 1,
            title: "Marinate Chicken",
            duration: "15 min",
            instructions: ["Marinate chicken with curd, ginger-garlic paste, chili powder, turmeric, and biryani spices."],
          },
          {
            stepNumber: 2,
            title: "Cook Rice",
            duration: "10 min",
            instructions: ["Boil rice in water with whole spices until 70% cooked; drain thoroughly."],
          },
          {
            stepNumber: 3,
            title: "Dum & Simmer",
            duration: "25 min",
            instructions: ["Sauté onions and tomatoes, add marinated chicken, layer with rice, seal pot and cook on low dum."],
          },
        ],
        ingredientsWithQuantities: [
          { name: "Chicken", quantity: "500g (cut into medium pieces)", isAvailable: true },
          { name: "Rice (Basmati or Seeraga Samba)", quantity: "2 cups", isAvailable: hasRice },
          { name: "Onions (sliced)", quantity: "2 medium", isAvailable: hasOnion },
          { name: "Tomatoes (chopped)", quantity: "2 medium", isAvailable: hasTomato },
          { name: "Biryani Spices & Herbs", quantity: "1 tbsp", isAvailable: true },
        ],
        substitutions: [
          { original: "Basmati Rice", substitute: "Seeraga Samba or Sona Masoori Rice", note: "Authentic South Indian flavor." },
          { original: "Ghee", substitute: "Cooking Oil with 1 tsp butter", note: "Lighter everyday alternative." },
        ],
        matchPercentage: hasRice ? 100 : 80,
        isAIGenerated: false,
      },
      {
        id: `fb-curry-${Date.now()}-2`,
        title: "South Indian Chicken Curry (Kozhi Kuzhambu)",
        subtitle: "Homestyle aromatic chicken curry with rich gravy",
        prepTime: "15 min",
        cookTime: "20 min",
        estimatedCookingTime: "35 min total",
        servings: 3,
        description: "Tender chicken simmered in a spiced onion-tomato gravy with freshly ground spices and curry leaves.",
        cuisine: "South Indian",
        category: "Dinner",
        image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&auto=format&fit=crop&q=80",
        pantryItems: ["chicken", ...(hasOnion ? ["onion"] : []), ...(hasTomato ? ["tomato"] : [])],
        missingIngredients: [],
        rescueWeight: "500g",
        moneySaved: "₹180",
        wasteSavingTip: "Simmer on low heat with lid closed to retain all natural chicken juices.",
        steps: [
          {
            stepNumber: 1,
            title: "Sauté Aromatics",
            duration: "5 min",
            instructions: ["Heat oil, add fennel seeds, curry leaves, and sauté sliced onions until golden brown."],
          },
          {
            stepNumber: 2,
            title: "Add Tomatoes & Spices",
            duration: "5 min",
            instructions: ["Add ginger garlic, tomatoes, chili powder, coriander powder, and turmeric. Cook till mushy."],
          },
          {
            stepNumber: 3,
            title: "Cook Chicken",
            duration: "15 min",
            instructions: ["Add chicken pieces and 1 cup water. Cover and cook on medium flame for 15 minutes."],
          },
        ],
        ingredientsWithQuantities: [
          { name: "Chicken", quantity: "500g", isAvailable: true },
          { name: "Onions", quantity: "2 medium", isAvailable: hasOnion },
          { name: "Tomatoes", quantity: "1 large", isAvailable: hasTomato },
          { name: "Curry Powder & Spices", quantity: "2 tsp", isAvailable: true },
        ],
        substitutions: [
          { original: "Coconut Milk", substitute: "Whisked Curd or Cashew paste", note: "Adds rich creamy consistency." },
        ],
        matchPercentage: 100,
        isAIGenerated: false,
      },
      {
        id: `fb-fry-${Date.now()}-3`,
        title: "Madras Chicken 65 / Pepper Roast",
        subtitle: "Crispy, spicy street-style chicken starter",
        prepTime: "10 min",
        cookTime: "15 min",
        estimatedCookingTime: "25 min total",
        servings: 3,
        description: "Bite-sized chicken tossed with black pepper, crushed garlic, and crispy curry leaves.",
        cuisine: "South Indian",
        category: "Snack",
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80",
        pantryItems: ["chicken"],
        missingIngredients: [],
        rescueWeight: "400g",
        moneySaved: "₹160",
        wasteSavingTip: "Fry fresh curry leaves at the end for vibrant green color and crunchy texture.",
        steps: [
          {
            stepNumber: 1,
            title: "Coat Chicken",
            duration: "5 min",
            instructions: ["Mix chicken with pepper powder, ginger-garlic paste, cornflour or rice flour, and salt."],
          },
          {
            stepNumber: 2,
            title: "Pan Fry or Roast",
            duration: "12 min",
            instructions: ["Shallow fry chicken pieces in hot oil until deeply browned and crisp."],
          },
          {
            stepNumber: 3,
            title: "Toss with Curry Leaves",
            duration: "2 min",
            instructions: ["Toss with flash-fried green chilies and curry leaves. Serve with lemon wedges."],
          },
        ],
        ingredientsWithQuantities: [
          { name: "Chicken", quantity: "400g (boneless or small cut)", isAvailable: true },
          { name: "Black Pepper & Spices", quantity: "1.5 tsp", isAvailable: true },
          { name: "Curry Leaves & Green Chili", quantity: "a handful", isAvailable: true },
        ],
        substitutions: [
          { original: "Cornflour", substitute: "Rice Flour or Gram Flour (Besan)", note: "Provides extra crispness." },
        ],
        matchPercentage: 100,
        isAIGenerated: false,
      },
    ];
  }
  // 2. CHICKEN ONLY (NO RICE ENTERED)
  else if (hasChicken) {
    fallbackRecipes = [
      {
        id: `fb-chickencurry-${Date.now()}-1`,
        title: "South Indian Chicken Curry (Kozhi Kuzhambu)",
        subtitle: "Aromatic homestyle gravy pairing with rice, chapati, or dosa",
        prepTime: "15 min",
        cookTime: "20 min",
        estimatedCookingTime: "35 min total",
        servings: 3,
        description: "Juicy chicken pieces simmered in freshly ground coriander, chili, and onion-tomato gravy.",
        cuisine: "South Indian",
        category: "Lunch",
        image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&auto=format&fit=crop&q=80",
        pantryItems: ["chicken", ...(hasOnion ? ["onion"] : []), ...(hasTomato ? ["tomato"] : [])],
        missingIngredients: [],
        rescueWeight: "500g",
        moneySaved: "₹190",
        wasteSavingTip: "Make extra gravy; it tastes even richer the next day!",
        steps: [
          { stepNumber: 1, title: "Sauté Spices", duration: "5 min", instructions: ["Sauté onions, curry leaves, and ginger-garlic paste."] },
          { stepNumber: 2, title: "Add Masala", duration: "5 min", instructions: ["Cook chopped tomatoes and ground spices until oil separates."] },
          { stepNumber: 3, title: "Simmer Chicken", duration: "15 min", instructions: ["Add chicken and simmer covered until chicken is tender."] },
        ],
        ingredientsWithQuantities: [
          { name: "Chicken", quantity: "500g", isAvailable: true },
          { name: "Onion", quantity: "2 medium", isAvailable: hasOnion },
          { name: "Tomato", quantity: "1 medium", isAvailable: hasTomato },
          { name: "Ginger Garlic Paste", quantity: "1 tbsp", isAvailable: true },
        ],
        substitutions: [
          { original: "Ginger Garlic Paste", substitute: "Finely minced fresh ginger & garlic", note: "Fresh aromatics." },
        ],
        matchPercentage: 100,
        isAIGenerated: false,
      },
      {
        id: `fb-chicken65-${Date.now()}-2`,
        title: "Crispy Chicken 65 / Pepper Roast",
        subtitle: "Fiery, crunchy South Indian spiced chicken",
        prepTime: "10 min",
        cookTime: "15 min",
        estimatedCookingTime: "25 min total",
        servings: 3,
        description: "Quick-marinated chicken spiced with freshly crushed pepper and fried to golden perfection.",
        cuisine: "South Indian",
        category: "Snack",
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80",
        pantryItems: ["chicken"],
        missingIngredients: [],
        rescueWeight: "400g",
        moneySaved: "₹150",
        wasteSavingTip: "Finish with a squeeze of fresh lemon to tenderize the meat.",
        steps: [
          { stepNumber: 1, title: "Marinate", duration: "8 min", instructions: ["Toss chicken with chili, pepper, turmeric, and pinch of salt."] },
          { stepNumber: 2, title: "Roast", duration: "12 min", instructions: ["Pan roast in 2 tbsp oil till crispy outside and juicy inside."] },
        ],
        ingredientsWithQuantities: [
          { name: "Chicken", quantity: "400g", isAvailable: true },
          { name: "Chili & Pepper Powder", quantity: "1.5 tsp", isAvailable: true },
        ],
        substitutions: [],
        matchPercentage: 100,
        isAIGenerated: false,
      },
      {
        id: `fb-chickenbiryani-needed-${Date.now()}-3`,
        title: "Homestyle Chicken Biryani",
        subtitle: "Beloved weekend feast dish (Add Rice to complete)",
        prepTime: "20 min",
        cookTime: "30 min",
        estimatedCookingTime: "50 min total",
        servings: 4,
        description: "Layered spiced chicken biryani. Add 2 cups of rice to complete this iconic South Indian meal.",
        cuisine: "South Indian",
        category: "Dinner",
        image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80",
        pantryItems: ["chicken"],
        missingIngredients: ["2 cups Basmati or Seeraga Samba Rice"],
        rescueWeight: "500g",
        moneySaved: "₹240",
        wasteSavingTip: "Brown onions slowly; deeply caramelized onions give the biryani its signature golden hue.",
        steps: [
          { stepNumber: 1, title: "Chicken Masala Base", duration: "15 min", instructions: ["Cook chicken with onions, yogurt, and biryani spices until rich gravy forms."] },
          { stepNumber: 2, title: "Layer with Rice", duration: "10 min", instructions: ["Cook Basmati rice till 70% done and layer atop the chicken."] },
          { stepNumber: 3, title: "Dum Cooking", duration: "20 min", instructions: ["Cover tightly and steam on low flame for 20 minutes."] },
        ],
        ingredientsWithQuantities: [
          { name: "Chicken", quantity: "500g", isAvailable: true },
          { name: "Basmati or Seeraga Samba Rice", quantity: "2 cups", isAvailable: false },
          { name: "Biryani Spices & Aromatics", quantity: "1 tbsp", isAvailable: true },
        ],
        substitutions: [
          { original: "Basmati Rice", substitute: "Seeraga Samba Rice or Regular Cooked Rice", note: "Authentic South Indian flavor." },
        ],
        matchPercentage: 67,
        isAIGenerated: false,
      },
    ];
  }
  // 3. EGG DISHES
  else if (hasEgg) {
    fallbackRecipes = [
      {
        id: `fb-egg-1-${Date.now()}`,
        title: "South Indian Egg Curry (Muttai Kuzhambu)",
        subtitle: "Spicy, tangy onion-tomato gravy with boiled eggs",
        prepTime: "10 min",
        cookTime: "15 min",
        estimatedCookingTime: "25 min total",
        servings: 3,
        description: "Boiled eggs simmered in a fragrant South Indian onion-tomato gravy seasoned with fennel and curry leaves.",
        cuisine: "South Indian",
        category: "Dinner",
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80",
        pantryItems: ["egg", ...(hasOnion ? ["onion"] : []), ...(hasTomato ? ["tomato"] : [])],
        missingIngredients: [],
        rescueWeight: "350g",
        moneySaved: "₹90",
        wasteSavingTip: "Prick the boiled eggs with a fork before adding to the gravy so flavors penetrate deep.",
        steps: [
          { stepNumber: 1, title: "Boil Eggs", duration: "8 min", instructions: ["Boil eggs for 8 minutes, cool in cold water, peel and slice shallow slits."] },
          { stepNumber: 2, title: "Prepare Gravy", duration: "10 min", instructions: ["Sauté onions, tomatoes, and Indian spices until fragrant."] },
          { stepNumber: 3, title: "Simmer Eggs", duration: "5 min", instructions: ["Add boiled eggs into the gravy and simmer for 5 minutes."] },
        ],
        ingredientsWithQuantities: [
          { name: "Eggs", quantity: "4 eggs", isAvailable: true },
          { name: "Onion", quantity: "2 medium", isAvailable: hasOnion },
          { name: "Tomato", quantity: "1 medium", isAvailable: hasTomato },
        ],
        substitutions: [
          { original: "Tomato", substitute: "Tamarind water or lemon juice", note: "Provides authentic sourness." },
        ],
        matchPercentage: 100,
        isAIGenerated: false,
      },
      {
        id: `fb-egg-2-${Date.now()}`,
        title: "Spicy Egg Podimas (South Indian Scrambled Eggs)",
        subtitle: "Quick 10-minute scrambled egg fry with onions and green chilies",
        prepTime: "5 min",
        cookTime: "8 min",
        estimatedCookingTime: "13 min total",
        servings: 2,
        description: "Fluffy scrambled eggs tossed with sautéed shallots, green chilies, turmeric, and black pepper.",
        cuisine: "South Indian",
        category: "Breakfast",
        image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop&q=80",
        pantryItems: ["egg", ...(hasOnion ? ["onion"] : [])],
        missingIngredients: [],
        rescueWeight: "300g",
        moneySaved: "₹70",
        wasteSavingTip: "Do not overcook; turn off the heat while eggs are still soft and moist.",
        steps: [
          { stepNumber: 1, title: "Sauté Veggies", duration: "3 min", instructions: ["Sauté finely chopped onions and green chilies in 1 tbsp oil."] },
          { stepNumber: 2, title: "Scramble", duration: "5 min", instructions: ["Whisk eggs with salt and turmeric, pour into pan, and gently stir until scrambled."] },
        ],
        ingredientsWithQuantities: [
          { name: "Eggs", quantity: "3 eggs", isAvailable: true },
          { name: "Onion", quantity: "1 small, chopped", isAvailable: hasOnion },
        ],
        substitutions: [],
        matchPercentage: 100,
        isAIGenerated: false,
      },
      {
        id: `fb-egg-3-${Date.now()}`,
        title: "Boiled Egg Pepper Roast",
        subtitle: "Crispy pan-fried eggs coated in cracked pepper and curry leaves",
        prepTime: "5 min",
        cookTime: "10 min",
        estimatedCookingTime: "15 min total",
        servings: 2,
        description: "Hard-boiled eggs halved and pan-roasted with freshly cracked black pepper and ghee.",
        cuisine: "South Indian",
        category: "Side",
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80",
        pantryItems: ["egg"],
        missingIngredients: [],
        rescueWeight: "250g",
        moneySaved: "₹60",
        wasteSavingTip: "Roast cut-side down first for a crisp exterior.",
        steps: [
          { stepNumber: 1, title: "Slice Eggs", duration: "2 min", instructions: ["Halve the boiled eggs lengthwise."] },
          { stepNumber: 2, title: "Roast", duration: "8 min", instructions: ["Heat oil or ghee, add pepper, turmeric, and roast eggs till crisp."] },
        ],
        ingredientsWithQuantities: [
          { name: "Eggs", quantity: "3 boiled eggs", isAvailable: true },
          { name: "Black Pepper & Ghee", quantity: "1 tsp", isAvailable: true },
        ],
        substitutions: [],
        matchPercentage: 100,
        isAIGenerated: false,
      },
    ];
  }
  // 4. TOMATO SPECIALTIES
  else if (hasTomato) {
    fallbackRecipes = [
      {
        id: `fb-tomato-1-${Date.now()}`,
        title: "South Indian Tomato Rice (Thakkali Sadam)",
        subtitle: "Tangy, spiced variety rice with mustard and curry leaves",
        prepTime: "10 min",
        cookTime: "15 min",
        estimatedCookingTime: "25 min total",
        servings: 3,
        description: "A beloved South Indian lunchbox classic made with ripe tomatoes, mustard tempering, and curry leaves.",
        cuisine: "South Indian",
        category: "Lunch",
        image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80",
        pantryItems: ["tomato", ...(hasRice ? ["rice"] : []), ...(hasOnion ? ["onion"] : [])],
        missingIngredients: hasRice ? [] : ["1 cup Cooked Rice"],
        rescueWeight: "400g",
        moneySaved: "₹100",
        wasteSavingTip: "Overripe soft tomatoes give the sweetest, deepest tomato rice flavor.",
        steps: [
          { stepNumber: 1, title: "Tempering", duration: "3 min", instructions: ["Heat oil, crackle mustard seeds, urad dal, and curry leaves."] },
          { stepNumber: 2, title: "Tomato Masala", duration: "10 min", instructions: ["Add chopped onions and tomatoes with turmeric and chili powder. Cook until oil leaves sides."] },
          { stepNumber: 3, title: "Mix Rice", duration: "2 min", instructions: ["Gently fold in cooked rice until well blended."] },
        ],
        ingredientsWithQuantities: [
          { name: "Tomatoes", quantity: "3 ripe medium", isAvailable: true },
          { name: "Cooked Rice", quantity: "2 cups", isAvailable: hasRice },
          { name: "Onion", quantity: "1 medium", isAvailable: hasOnion },
        ],
        substitutions: [
          { original: "Cooked Rice", substitute: "Rava (Semolina) for Tomato Upma or Bread slices", note: "Quick delicious variation." },
        ],
        matchPercentage: hasRice ? 100 : 75,
        isAIGenerated: false,
      },
      {
        id: `fb-tomato-2-${Date.now()}`,
        title: "Spicy Tomato Kara Chutney",
        subtitle: "Bold, tangy tiffin chutney for Idli, Dosa, and Chapati",
        prepTime: "5 min",
        cookTime: "10 min",
        estimatedCookingTime: "15 min total",
        servings: 4,
        description: "Savory roadside hotel style tomato chutney made with garlic, shallots, and dry red chilies.",
        cuisine: "South Indian",
        category: "Side",
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80",
        pantryItems: ["tomato", ...(hasOnion ? ["onion"] : [])],
        missingIngredients: [],
        rescueWeight: "350g",
        moneySaved: "₹75",
        wasteSavingTip: "Grind with minimal water; it stays fresh in the fridge for up to 4 days.",
        steps: [
          { stepNumber: 1, title: "Sauté", duration: "6 min", instructions: ["Sauté onions, garlic, tomatoes, and dry red chilies in oil until soft."] },
          { stepNumber: 2, title: "Grind & Temper", duration: "4 min", instructions: ["Cool and grind into a coarse chutney. Temper with mustard and curry leaves."] },
        ],
        ingredientsWithQuantities: [
          { name: "Tomatoes", quantity: "3 ripe medium", isAvailable: true },
          { name: "Onions", quantity: "1 medium", isAvailable: hasOnion },
        ],
        substitutions: [],
        matchPercentage: 100,
        isAIGenerated: false,
      },
      {
        id: `fb-tomato-3-${Date.now()}`,
        title: "Chettinad Tomato Rasam",
        subtitle: "Soothing, pepper-garlic infused tangy soup",
        prepTime: "5 min",
        cookTime: "12 min",
        estimatedCookingTime: "17 min total",
        servings: 4,
        description: "Traditional steaming rasam infused with crushed garlic, cumin, pepper, and ripe crushed tomatoes.",
        cuisine: "South Indian",
        category: "Dinner",
        image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80",
        pantryItems: ["tomato"],
        missingIngredients: [],
        rescueWeight: "300g",
        moneySaved: "₹65",
        wasteSavingTip: "Crush tomatoes by hand with salt to extract maximum pulp and flavor.",
        steps: [
          { stepNumber: 1, title: "Pulp Tomatoes", duration: "3 min", instructions: ["Crush tomatoes by hand in 2 cups of water with turmeric and crushed garlic."] },
          { stepNumber: 2, title: "Simmer & Froth", duration: "8 min", instructions: ["Simmer on medium until rasam froths up at the top; do not boil aggressively."] },
          { stepNumber: 3, title: "Temper", duration: "2 min", instructions: ["Temper with mustard, cumin seeds, and fresh coriander."] },
        ],
        ingredientsWithQuantities: [
          { name: "Tomatoes", quantity: "2 ripe tomatoes", isAvailable: true },
          { name: "Garlic & Black Pepper", quantity: "1 tsp crushed", isAvailable: true },
        ],
        substitutions: [],
        matchPercentage: 100,
        isAIGenerated: false,
      },
    ];
  }
  // 5. POTATO SPECIALTIES
  else if (hasPotato) {
    fallbackRecipes = [
      {
        id: `fb-potato-1-${Date.now()}`,
        title: "South Indian Potato Masala (Poori/Dosa Masal)",
        subtitle: "Mild, fragrant mashed potato side with mustard and turmeric",
        prepTime: "10 min",
        cookTime: "15 min",
        estimatedCookingTime: "25 min total",
        servings: 3,
        description: "Soft boiled potatoes mashed and sautéed with onions, green chilies, ginger, and golden turmeric.",
        cuisine: "South Indian",
        category: "Breakfast",
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80",
        pantryItems: ["potato", ...(hasOnion ? ["onion"] : [])],
        missingIngredients: [],
        rescueWeight: "450g",
        moneySaved: "₹85",
        wasteSavingTip: "Boil potatoes with skin on to save nutrients, then peel smoothly.",
        steps: [
          { stepNumber: 1, title: "Boil & Mash", duration: "10 min", instructions: ["Boil potatoes until fork tender, peel and lightly crumble."] },
          { stepNumber: 2, title: "Tempering", duration: "5 min", instructions: ["Sauté mustard, ginger, onions, green chili, and turmeric in oil."] },
          { stepNumber: 3, title: "Simmer", duration: "5 min", instructions: ["Add mashed potatoes, 1/2 cup water, simmer until moist and thickened."] },
        ],
        ingredientsWithQuantities: [
          { name: "Potatoes", quantity: "3 large", isAvailable: true },
          { name: "Onion", quantity: "1 medium", isAvailable: hasOnion },
        ],
        substitutions: [],
        matchPercentage: 100,
        isAIGenerated: false,
      },
      {
        id: `fb-potato-2-${Date.now()}`,
        title: "Crispy Potato Fry (Urulaikilangu Varuval)",
        subtitle: "Crunchy golden spiced potato roast for Sambar or Curd rice",
        prepTime: "8 min",
        cookTime: "15 min",
        estimatedCookingTime: "23 min total",
        servings: 3,
        description: "Thinly diced potatoes pan-roasted with red chili powder, turmeric, and asafoetida until deeply crisped.",
        cuisine: "South Indian",
        category: "Lunch",
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80",
        pantryItems: ["potato"],
        missingIngredients: [],
        rescueWeight: "400g",
        moneySaved: "₹75",
        wasteSavingTip: "Pat potatoes dry with a cloth before frying for ultimate crispness.",
        steps: [
          { stepNumber: 1, title: "Dice Potatoes", duration: "5 min", instructions: ["Cut potatoes into even 1/2-inch cubes."] },
          { stepNumber: 2, title: "Pan Roast", duration: "15 min", instructions: ["Roast in 2 tbsp oil on medium flame with chili powder and salt until golden-brown."] },
        ],
        ingredientsWithQuantities: [
          { name: "Potatoes", quantity: "3 medium", isAvailable: true },
          { name: "Chili Powder & Turmeric", quantity: "1 tsp", isAvailable: true },
        ],
        substitutions: [],
        matchPercentage: 100,
        isAIGenerated: false,
      },
      {
        id: `fb-potato-3-${Date.now()}`,
        title: "Potato & Onion Sambar / Kootu",
        subtitle: "Hearty homestyle lentil stew with potato cubes",
        prepTime: "10 min",
        cookTime: "18 min",
        estimatedCookingTime: "28 min total",
        servings: 4,
        description: "Comforting lentil stew packed with tender potato chunks and seasoned with sambar powder.",
        cuisine: "South Indian",
        category: "Lunch",
        image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80",
        pantryItems: ["potato", ...(hasOnion ? ["onion"] : [])],
        missingIngredients: ["1/2 cup Toor Dal (Lentils)"],
        rescueWeight: "400g",
        moneySaved: "₹95",
        wasteSavingTip: "Add a pinch of hing (asafoetida) while cooking for easy digestion.",
        steps: [
          { stepNumber: 1, title: "Cook Dal & Potato", duration: "12 min", instructions: ["Cook dal and diced potatoes in water until soft."] },
          { stepNumber: 2, title: "Add Sambar Masala", duration: "6 min", instructions: ["Add sambar powder, salt, and simmer with onions."] },
        ],
        ingredientsWithQuantities: [
          { name: "Potatoes", quantity: "2 medium", isAvailable: true },
          { name: "Toor Dal", quantity: "1/2 cup", isAvailable: false },
        ],
        substitutions: [
          { original: "Toor Dal", substitute: "Moong Dal or Masoor Dal", note: "Cooks even faster!" },
        ],
        matchPercentage: 75,
        isAIGenerated: false,
      },
    ];
  }
  // 6. DEFAULT / ALL OTHER INGREDIENTS (HOMESTYLE INDIAN SPECIALS)
  else {
    const primaryName = primaryInput[0] || "Vegetable";
    const capitalName = primaryName.charAt(0).toUpperCase() + primaryName.slice(1);
    const secondaryName = primaryInput[1] ? (primaryInput[1].charAt(0).toUpperCase() + primaryInput[1].slice(1)) : "";

    fallbackRecipes = [
      {
        id: `fb-homestyle-1-${Date.now()}`,
        title: secondaryName ? `Homestyle ${capitalName} & ${secondaryName} Poriyal` : `South Indian ${capitalName} Poriyal`,
        subtitle: `Wholesome South Indian vegetable stir-fry finished with coconut`,
        prepTime: "10 min",
        cookTime: "12 min",
        estimatedCookingTime: "22 min total",
        servings: 3,
        description: `Delicately spiced ${capitalName} tempered with mustard, urad dal, and curry leaves.`,
        cuisine: "South Indian",
        category: "Lunch",
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80",
        pantryItems: primaryInput,
        missingIngredients: [],
        rescueWeight: "350g",
        moneySaved: "₹80",
        wasteSavingTip: "Cook on medium flame with lid on to retain crunch and bright color.",
        steps: [
          { stepNumber: 1, title: "Dice Veggies", duration: "5 min", instructions: [`Finely chop ${primaryInput.join(" and ")}.`] },
          { stepNumber: 2, title: "Temper & Sauté", duration: "7 min", instructions: ["Heat oil, add mustard seeds, curry leaves, and sauté veggies with turmeric and salt."] },
        ],
        ingredientsWithQuantities: [
          ...primaryInput.map((name) => ({ name, quantity: "1 to 2 cups", isAvailable: true })),
        ],
        substitutions: [
          { original: "Mustard Seeds", substitute: "Cumin Seeds", note: "Earthy aromatic replacement." },
        ],
        matchPercentage: 100,
        isAIGenerated: false,
      },
      {
        id: `fb-homestyle-2-${Date.now()}`,
        title: `Homestyle ${capitalName} Curry / Kootu`,
        subtitle: `Rich, comforting South Indian style vegetable gravy`,
        prepTime: "10 min",
        cookTime: "15 min",
        estimatedCookingTime: "25 min total",
        servings: 3,
        description: `Hearty homestyle gravy featuring ${capitalName} simmered with lentils and spices.`,
        cuisine: "South Indian",
        category: "Dinner",
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80",
        pantryItems: primaryInput,
        missingIngredients: [],
        rescueWeight: "400g",
        moneySaved: "₹90",
        wasteSavingTip: "Pair with steamed rice or hot chapati.",
        steps: [
          { stepNumber: 1, title: "Simmer", duration: "10 min", instructions: [`Cook ${primaryInput.join(" and ")} with a pinch of turmeric and salt.`] },
          { stepNumber: 2, title: "Temper", duration: "5 min", instructions: ["Finish with mustard, red chili, and curry leaf tempering."] },
        ],
        ingredientsWithQuantities: [
          ...primaryInput.map((name) => ({ name, quantity: "1 to 2 cups", isAvailable: true })),
        ],
        substitutions: [],
        matchPercentage: 100,
        isAIGenerated: false,
      },
      {
        id: `fb-homestyle-3-${Date.now()}`,
        title: `Quick ${capitalName} Tawa Pulao / Fried Rice`,
        subtitle: `Fast, flavorful one-pot Indian rice dish`,
        prepTime: "10 min",
        cookTime: "12 min",
        estimatedCookingTime: "22 min total",
        servings: 2,
        description: `Spiced rice dish tossed on high heat with ${capitalName} and aromatic Indian spices.`,
        cuisine: "Indian",
        category: "Lunch",
        image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80",
        pantryItems: primaryInput,
        missingIngredients: hasRice ? [] : ["1 cup Cooked Rice"],
        rescueWeight: "300g",
        moneySaved: "₹70",
        wasteSavingTip: "Leftover cold rice works best for fried rice or pulao.",
        steps: [
          { stepNumber: 1, title: "Sauté", duration: "6 min", instructions: [`Sauté ${primaryInput.join(" and ")} on medium-high heat with cumin and garam masala.`] },
          { stepNumber: 2, title: "Toss Rice", duration: "4 min", instructions: ["Fold in cooked rice and toss gently until piping hot."] },
        ],
        ingredientsWithQuantities: [
          ...primaryInput.map((name) => ({ name, quantity: "1 cup", isAvailable: true })),
          { name: "Cooked Rice", quantity: "2 cups", isAvailable: hasRice },
        ],
        substitutions: [],
        matchPercentage: hasRice ? 100 : 70,
        isAIGenerated: false,
      },
    ];
  }

  return res.json({
    recipes: fallbackRecipes,
    source: "smart-shelf-fallback",
    message: "Generated authentic homestyle recipes tailored to your ingredients.",
  });
});

// AI Recipe Recommendation Endpoint based on available inventory
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
