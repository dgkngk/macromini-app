import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import { analyzeMeal, generateRecipe } from "./gemini.js";
import { db, auth } from "./firebase.js";
import { onRequest } from "firebase-functions/v2/https";

// Debug logging for Firestore connection
console.log("Firestore Client Initialized. Project ID:", db.projectId);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
if (process.argv[1] === __filename) {
  app.use(express.static(path.join(__dirname, "../dist")));
}

// --- Middleware: Verify Firebase Auth Token ---
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log(`[Auth] Header present: ${!!authHeader}`);
  if (!authHeader?.startsWith("Bearer ")) {
    console.log("[Auth] Missing or invalid header format");
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    console.log(`[Auth] Verified user: ${req.user.uid}`);
    next();
  } catch (error) {
    console.error("Auth Error:", error);
    res.status(403).json({ error: "Invalid Token" });
  }
};

// --- AI Routes (No Auth required for demo, but recommended in prod) ---

app.post("/api/ai/analyze", async (req, res) => {
  try {
    const { description } = req.body;
    if (!description)
      return res.status(400).json({ error: "Description required" });
    const data = await analyzeMeal(description);
    res.json(data);
  } catch (error) {
    console.error("Analyze error:", error);
    res.status(500).json({ error: "Failed to analyze meal" });
  }
});

app.post("/api/ai/recipe", async (req, res) => {
  try {
    const { plan, remainingMacros, targetCalories, lang, userPrompt } =
      req.body;
    const data = await generateRecipe(
      plan,
      remainingMacros,
      targetCalories,
      lang,
      userPrompt,
    );
    res.json(data);
  } catch (error) {
    console.error("Recipe error:", error);
    res.status(500).json({ error: "Failed to generate recipe" });
  }
});

// --- Data Routes (Protected) ---

// Plans
app.get("/api/data/plans", verifyToken, async (req, res) => {
  try {
    const snapshot = await db
      .collection("users")
      .doc(req.user.uid)
      .collection("plans")
      .get();
    const plans = snapshot.docs.map((doc) => doc.data());
    res.json(plans);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/data/plans", verifyToken, async (req, res) => {
  try {
    const plan = req.body;
    console.log(
      `[Plans] Debug Info: ProjectID=${db.projectId}, GCLOUD_PROJECT=${process.env.GCLOUD_PROJECT}`,
    );
    console.log(`[Plans] Saving plan for user ${req.user.uid}`, plan);
    await db
      .collection("users")
      .doc(req.user.uid)
      .collection("plans")
      .doc(plan.id)
      .set(plan);
    console.log(`[Plans] Successfully saved plan ${plan.id}`);
    res.json(plan);
  } catch (e) {
    console.error(`[Plans] Error saving plan:`, e);
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/data/plans/:id", verifyToken, async (req, res) => {
  try {
    await db
      .collection("users")
      .doc(req.user.uid)
      .collection("plans")
      .doc(req.params.id)
      .delete();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Meals
app.get("/api/data/meals", verifyToken, async (req, res) => {
  try {
    // Ideally use pagination or date filtering in real prod
    const snapshot = await db
      .collection("users")
      .doc(req.user.uid)
      .collection("meals")
      .orderBy("timestamp", "desc")
      .limit(100)
      .get();
    const meals = snapshot.docs.map((doc) => doc.data());
    res.json(meals);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/data/meals", verifyToken, async (req, res) => {
  try {
    const meal = req.body;
    await db
      .collection("users")
      .doc(req.user.uid)
      .collection("meals")
      .doc(meal.id)
      .set(meal);
    res.json(meal);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/data/meals/:id", verifyToken, async (req, res) => {
  try {
    await db
      .collection("users")
      .doc(req.user.uid)
      .collection("meals")
      .doc(req.params.id)
      .delete();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Recipes
app.get("/api/data/recipes", verifyToken, async (req, res) => {
  try {
    const snapshot = await db
      .collection("users")
      .doc(req.user.uid)
      .collection("recipes")
      .orderBy("savedAt", "desc")
      .get();
    const recipes = snapshot.docs.map((doc) => doc.data());
    res.json(recipes);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/data/recipes", verifyToken, async (req, res) => {
  try {
    const recipe = req.body;
    console.log(`[Recipes] Saving recipe for user ${req.user.uid}`, recipe);
    await db
      .collection("users")
      .doc(req.user.uid)
      .collection("recipes")
      .doc(recipe.id)
      .set(recipe);
    console.log(`[Recipes] Successfully saved recipe ${recipe.id}`);
    res.json(recipe);
  } catch (e) {
    console.error(`[Recipes] Error saving recipe:`, e);
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/data/recipes/:id", verifyToken, async (req, res) => {
  try {
    await db
      .collection("users")
      .doc(req.user.uid)
      .collection("recipes")
      .doc(req.params.id)
      .delete();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Shopping List (Stored as a single doc for simplicity, or collection of items)
app.get("/api/data/shopping", verifyToken, async (req, res) => {
  try {
    const doc = await db
      .collection("users")
      .doc(req.user.uid)
      .collection("lists")
      .doc("shopping")
      .get();
    res.json(doc.exists ? doc.data().items : []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/data/shopping", verifyToken, async (req, res) => {
  try {
    const items = req.body; // Array of items
    await db
      .collection("users")
      .doc(req.user.uid)
      .collection("lists")
      .doc("shopping")
      .set({ items });
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Settings (Active Plan)
app.get("/api/data/settings/activePlan", verifyToken, async (req, res) => {
  try {
    const doc = await db
      .collection("users")
      .doc(req.user.uid)
      .collection("settings")
      .doc("general")
      .get();
    res.json({ activePlanId: doc.exists ? doc.data().activePlanId : null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/data/settings/activePlan", verifyToken, async (req, res) => {
  try {
    const { planId } = req.body;
    await db
      .collection("users")
      .doc(req.user.uid)
      .collection("settings")
      .doc("general")
      .set({ activePlanId: planId }, { merge: true });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- Catch-all ---
if (process.argv[1] === __filename) {
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../dist/index.html"));
  });
}

if (process.argv[1] === __filename) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export const api = onRequest({ secrets: ["GEMINI_API_KEY"] }, app);
