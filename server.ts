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
