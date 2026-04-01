import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import { rateLimit } from "express-rate-limit";
import crypto from "crypto";
import { analyzeMeal, generateRecipe, generateShoppingList } from "./gemini.js";
import { db, auth } from "./firebase.js";
import { onRequest } from "firebase-functions/v2/https";
import { FirestoreStore } from "./firestoreRateLimit.js";

// Debug logging for Firestore connection
console.log("Firestore Client Initialized. Project ID:", db.projectId);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.set("trust proxy", 1); // Trust proxy for rate limiter

app.use(helmet());

// 🛡️ Sentinel Security: Restrict CORS to prevent unauthorized cross-origin access
// In production, we disable CORS (allow only same-origin) unless specific origins are whitelisted.
// In development, we allow all origins to facilitate local testing.
const isProduction = process.env.NODE_ENV === "production";
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map(origin => origin.trim())
  : [];

if (isProduction && allowedOrigins.length === 0) {
  console.warn("⚠️ Sentinel Security Warning: No ALLOWED_ORIGINS set in production. CORS will block all cross-origin requests.");
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || !isProduction) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};
app.use(cors(corsOptions));

// Capture raw body for Lemon Squeezy webhook signature verification
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  }),
);

if (process.argv[1] === __filename) {
  app.use(express.static(path.join(__dirname, "../dist")));
}

// --- Constants ---
const USER_TIER = {
  FREE: 0,
  PLUS: 1,
  ELITE: 2,
};

const SUBSCRIPTION_STATUS = {
  INACTIVE: 0,
  ACTIVE: 1,
  PAST_DUE: 2,
  TRIALING: 3,
};

const MAX_ALLOWED_CALORIES = 5000;
const MAX_PLAN_NAME_LENGTH = 100;
const MAX_PLAN_DESCRIPTION_LENGTH = 5000;
const MAX_INGREDIENT_LENGTH = 200;

// --- Utils: Base64 Encoding/Decoding ---
// Base64-encode data before storing in Firestore to lightly obfuscate the raw
// payload and keep it as a compact, transport-safe string.
const encodeData = (obj) => {
  return Buffer.from(JSON.stringify(obj)).toString("base64");
};

const isValidFirestoreId = (id) => {
  // Validate that the ID is a string, non-empty, and contains only allowed characters
  // allowed: alphanumeric, hyphens, underscores. No slashes or dots to prevent path traversal.
  if (typeof id !== "string") return false;
  if (!id || id.length > 128) return false;
  return /^[a-zA-Z0-9_-]+$/.test(id);
};

const decodeData = (base64Str) => {
  if (typeof base64Str !== "string") {
    throw new TypeError("Expected base64-encoded string");
  }

  try {
    const jsonStr = Buffer.from(base64Str, "base64").toString("utf-8");
    const data = JSON.parse(jsonStr);

    // Basic structural validation: expect a non-null object
    if (data === null || typeof data !== "object") {
      throw new Error("Decoded data has invalid structure");
    }

    return data;
  } catch (error) {
    console.error("Failed to decode base64 JSON data:", error);
    throw new Error("Invalid encoded data");
  }
};

// --- Middleware: Verify Firebase Auth Token ---
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    console.log("[Auth] Missing or invalid header format");
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Auth Error:", error);
    res.status(403).json({ error: "Invalid Token" });
  }
};

// --- Middleware: Attach User Tier ---
const attachUserTier = async (req, res, next) => {
  if (!req.user) return next();

  try {
    const userDoc = await db.collection("users").doc(req.user.uid).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      req.user.tier = userData.tier !== undefined ? userData.tier : USER_TIER.FREE;
      req.user.lemonSqueezyCustomerId = userData.lemonSqueezyCustomerId;
      req.user.subscriptionId = userData.subscriptionId;
    } else {
      req.user.tier = USER_TIER.FREE;
    }
  } catch (error) {
    console.error("Error fetching user tier:", error);
    req.user.tier = USER_TIER.FREE; // Default to free on error
  }
  next();
};

// --- Rate Limiters ---

const freeLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  limit: 10,
  message: { error: "Too many AI requests today. Upgrade to Plus for more!" },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.user ? `${req.user.uid}_daily` : "unknown"),
  store: new FirestoreStore(),
});

const plusLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 15,
  message: { error: "Hourly limit reached." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.user ? `${req.user.uid}_hourly` : "unknown"),
  store: new FirestoreStore(),
});

const eliteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 100,
  message: { error: "Elite hourly limit reached." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.user ? `${req.user.uid}_hourly` : "unknown"),
  store: new FirestoreStore(),
});

// 🛡️ Sentinel Security: Webhook Rate Limiter (DoS Protection)
// Use default MemoryStore to avoid Firestore write costs during an attack.
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 60, // 60 requests per minute per IP
  message: "Too many webhook requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// 🛡️ Sentinel Security: Standard API Rate Limiter
// Protects non-AI endpoints from abuse using in-memory tracking (no DB cost).
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 300,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const dynamicRateLimiter = async (req, res, next) => {
  // Ensure user tier is attached
  if (req.user.tier === USER_TIER.ELITE) {
    return eliteLimiter(req, res, next);
  } else if (req.user.tier === USER_TIER.PLUS) {
    return plusLimiter(req, res, next);
  } else {
    return freeLimiter(req, res, next);
  }
};

// --- Helper: Get API Key based on Tier ---
const getApiKeyForUser = (user) => {
  const tier = user.tier || USER_TIER.FREE;
  if (tier === USER_TIER.ELITE) return process.env.GEMINI_API_KEY_ELITE || process.env.GEMINI_API_KEY_FREE;
  if (tier === USER_TIER.PLUS) return process.env.GEMINI_API_KEY_PLUS || process.env.GEMINI_API_KEY_FREE;
  return process.env.GEMINI_API_KEY_FREE;
};

// --- Routes ---

// Lemon Squeezy Webhook
app.post("/api/webhooks/lemonsqueezy", webhookLimiter, async (req, res) => {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  const hmac = crypto.createHmac("sha256", secret);
  const digest = Buffer.from(hmac.update(req.rawBody).digest("hex"), "utf8");
  const signature = Buffer.from(req.headers["x-signature"] || "", "utf8");

  if (!crypto.timingSafeEqual(digest, signature)) {
    console.error("Webhook signature verification failed.");
    return res.status(400).send("Invalid signature");
  }

  const payload = req.body;
  const { meta, data } = payload;
  const eventName = meta.event_name;

  try {
    console.log(`[Lemon Squeezy] Event received: ${eventName}`);

    if (eventName === "subscription_created") {
      const userId = meta?.custom_data?.user_id || null;
      const attributes = data.attributes;
      
      if (!userId) {
        console.error(
          "[Lemon Squeezy] Missing user_id in meta.custom_data for subscription_created event.",
          { meta }
        );
        return res.status(400).send("Missing user_id in webhook payload");
      }

      console.log(`[Lemon Squeezy] Subscription created for user ${userId}`);
      await db.collection("users").doc(userId).set(
        {
            tier: USER_TIER.PLUS,
            subscriptionStatus: SUBSCRIPTION_STATUS.ACTIVE,
            lemonSqueezyCustomerId: attributes.customer_id,
            subscriptionId: data.id,
          },
          { merge: true },
        );
    } else if (eventName === "order_created") {
      // Handle One-Time Payments (OTP) for Elite Tier
      const userId = meta?.custom_data?.user_id || null;
      const attributes = data.attributes;

      if (!userId) {
         console.error("[Lemon Squeezy] Missing user_id for order_created event.", { meta });
         return res.status(400).send("Missing user_id");
      }

      if (attributes.status === "paid") {
          // Check if this order matches the Elite OTP Variant
          // We can check the variant_id inside `data.relationships.first_order_item.data.attributes.variant_id` 
          // but usually the main order object has enough info or we just trust the product ID if we have multiple.
          // For now, if we receive a paid order with user_id, we assume it's the valid product because we only sell one OTP.
          // Ideally, verify variant_id matches process.env.LEMONSQUEEZY_VARIANT_ID_ELITE_OTP
          
          console.log(`[Lemon Squeezy] OTP Order paid for user ${userId}. Upgrading to Elite.`);
          
          await db.collection("users").doc(userId).set({
              tier: USER_TIER.ELITE,
              // We don't set subscriptionStatus to ACTIVE because it's not a subscription
              // But maybe we should tracking it? Let's leave subscriptionStatus alone or set to special value?
              // The types say 0: Inactive, 1: Active, etc. 
              // Since it's lifetime, maybe we just rely on tier === ELITE.
              lemonSqueezyCustomerId: attributes.customer_id,
          }, { merge: true });
      }
    } else if (eventName === "subscription_updated") {
        const attributes = data.attributes;
        const subscriptionId = data.id;

        const snapshot = await db
            .collection("users")
            .where("subscriptionId", "==", String(subscriptionId)) // Ensure string comparison
            .limit(1)
            .get();
        
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            const statusStr = attributes.status;
            let status = SUBSCRIPTION_STATUS.INACTIVE;
            let tier = USER_TIER.FREE;

            if (statusStr === "active") {
                status = SUBSCRIPTION_STATUS.ACTIVE;
                tier = USER_TIER.PLUS;
            } else if (statusStr === "past_due") {
                status = SUBSCRIPTION_STATUS.PAST_DUE;
                // Map past_due subscriptions to FREE tier; see subscription_feature_plan.md for details.
                tier = USER_TIER.FREE;
            } else if (statusStr === "on_trial") {
                status = SUBSCRIPTION_STATUS.TRIALING;
                tier = USER_TIER.PLUS;
            }

            await doc.ref.update({
                subscriptionStatus: status,
                tier: tier,
            });
        }

    } else if (eventName === "subscription_cancelled" || eventName === "subscription_expired") {
        const subscriptionId = data.id;
        const snapshot = await db
            .collection("users")
            .where("subscriptionId", "==", String(subscriptionId))
            .limit(1)
            .get();

        if (!snapshot.empty) {
             const doc = snapshot.docs[0];
             await doc.ref.update({
                 tier: USER_TIER.FREE,
                 subscriptionStatus: SUBSCRIPTION_STATUS.INACTIVE,
             });
        }
    }

  } catch (error) {
    console.error("Webhook processing error:", error);
    return res.status(500).send("Webhook handler error");
  }

  res.json({ received: true });
});

// Subscription Routes
app.post("/api/subscription/create-checkout-session", apiLimiter, verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const userEmail = req.user.email;
    
    if (!process.env.LEMONSQUEEZY_STORE_ID || !process.env.LEMONSQUEEZY_VARIANT_ID) {
      console.error("Missing Lemon Squeezy IDs");
      return res.status(500).json({ error: "Server configuration error: Missing Store or Variant ID" });
    }
    
    // Lemon Squeezy API request
    const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
        method: "POST",
        headers: {
            "Accept": "application/vnd.api+json",
            "Content-Type": "application/vnd.api+json",
            "Authorization": `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`
        },
        body: JSON.stringify({
            data: {
                type: "checkouts",
                attributes: {
                    checkout_data: {
                        custom: {
                            user_id: userId
                        },
                        email: userEmail
                    }
                },
                relationships: {
                    store: {
                        data: {
                            type: "stores",
                            id: process.env.LEMONSQUEEZY_STORE_ID
                        }
                    },
                    variant: {
                        data: {
                            type: "variants",
                            id: process.env.LEMONSQUEEZY_VARIANT_ID
                        }
                    }
                }
            }
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error("Lemon Squeezy API Error:", errText);
        throw new Error(`Lemon Squeezy API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const checkoutUrl = data.data.attributes.url;

    res.json({ url: checkoutUrl });
  } catch (error) {
    console.error("Checkout Creation Error:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

app.post("/api/subscription/create-checkout-session-otp", apiLimiter, verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const userEmail = req.user.email;
    
    // Use the Elite OTP Variant ID
    const variantId = process.env.LEMONSQUEEZY_VARIANT_ID_ELITE_OTP;
    const storeId = process.env.LEMONSQUEEZY_STORE_ID;

    if (!storeId || !variantId) {
      console.error("Missing Lemon Squeezy IDs for OTP");
      return res.status(500).json({ error: "Server configuration error: Missing Store or Variant ID" });
    }
    
    // Lemon Squeezy API request
    const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
        method: "POST",
        headers: {
            "Accept": "application/vnd.api+json",
            "Content-Type": "application/vnd.api+json",
            "Authorization": `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`
        },
        body: JSON.stringify({
            data: {
                type: "checkouts",
                attributes: {
                    checkout_data: {
                        custom: {
                            user_id: userId
                        },
                        email: userEmail
                    }
                },
                relationships: {
                    store: {
                        data: {
                            type: "stores",
                            id: storeId
                        }
                    },
                    variant: {
                        data: {
                            type: "variants",
                            id: variantId
                        }
                    }
                }
            }
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error("Lemon Squeezy API Error (OTP):", errText);
        throw new Error(`Lemon Squeezy API error: ${response.status}`);
    }

    const data = await response.json();
    const checkoutUrl = data.data.attributes.url;

    res.json({ url: checkoutUrl });
  } catch (error) {
    console.error("OTP Checkout Creation Error:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

app.post("/api/subscription/portal", apiLimiter, verifyToken, attachUserTier, async (req, res) => {
  try {
    const subscriptionId = req.user.subscriptionId;
    if (!subscriptionId) {
        return res.status(400).json({ error: "No subscription found" });
    }

    // Fetch subscription details to get the portal URL
    const response = await fetch(`https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`, {
         method: "GET",
         headers: {
            "Accept": "application/vnd.api+json",
            "Content-Type": "application/vnd.api+json",
            "Authorization": `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`
         }
    });
    
    if (!response.ok) {
        // Fallback or error
         console.error("Failed to fetch subscription for portal URL");
         return res.status(500).json({ error: "Could not retrieve portal URL" });
    }

    const data = await response.json();
    const portalUrl = data.data.attributes.urls.customer_portal;

    res.json({ url: portalUrl });
  } catch (error) {
    console.error("Portal Error:", error);
    res.status(500).json({ error: "Failed to create portal session" });
  }
});

// Get User Profile (Tier)
app.get("/api/user/profile", apiLimiter, verifyToken, attachUserTier, async (req, res) => {
  res.json({
    tier: req.user.tier,
    subscriptionStatus: req.user.subscriptionStatus,
  });
});

// Get User Usage (Rate Limit)
app.get("/api/user/usage", apiLimiter, verifyToken, attachUserTier, async (req, res) => {
  try {
    const uid = req.user.uid;
    let key, limit, windowMs;

    if (req.user.tier === USER_TIER.ELITE) {
      key = `${uid}_hourly`;
      limit = 100;
      windowMs = 60 * 60 * 1000;
    } else if (req.user.tier === USER_TIER.PLUS) {
      key = `${uid}_hourly`;
      limit = 15;
      windowMs = 60 * 60 * 1000;
    } else {
      key = `${uid}_daily`;
      limit = 10;
      windowMs = 24 * 60 * 60 * 1000;
    }

    const doc = await db.collection("rate_limits").doc(key).get();
    let hits = 0;
    let resetTime = Date.now() + windowMs;

    if (doc.exists) {
      const data = doc.data();
      // Check if window is still valid
      if (data.resetTime > Date.now()) {
        hits = data.hits || 0;
        resetTime = data.resetTime;
      }
    }

    const remaining = Math.max(0, limit - hits);

    res.json({
      limit,
      remaining,
      resetTime,
    });
  } catch (error) {
    console.error("Error fetching usage:", error);
    res.status(500).json({ error: "Failed to fetch usage" });
  }
});

// --- AI Routes ---

app.post("/api/ai/analyze", verifyToken, attachUserTier, dynamicRateLimiter, async (req, res) => {
  try {
    const { description } = req.body;
    if (!description)
      return res.status(400).json({ error: "Description required" });
    if (description.length > 500)
      return res.status(400).json({ error: "Description too long" });
    
    const apiKey = getApiKeyForUser(req.user);
    const data = await analyzeMeal(description, apiKey);
    res.json(data);
  } catch (error) {
    console.error("Analyze error:", error);
    res.status(500).json({ error: "Failed to analyze meal" });
  }
});

app.post("/api/ai/recipe", verifyToken, attachUserTier, dynamicRateLimiter, async (req, res) => {
  try {
    const { plan, remainingMacros, targetCalories, lang, userPrompt } =
      req.body;

    if (!plan || typeof plan !== "object" || typeof plan.name !== "string" || typeof plan.description !== "string") {
      return res.status(400).json({ error: "Invalid plan data" });
    }

    // 🛡️ Sentinel Security: Strict Input Validation
    if (plan.name.length > MAX_PLAN_NAME_LENGTH) {
      return res.status(400).json({ error: "Plan name too long" });
    }
    if (plan.description.length > MAX_PLAN_DESCRIPTION_LENGTH) {
      return res.status(400).json({ error: "Plan description too long" });
    }

    // 🛡️ Sentinel Security: Ensure targetCalories is a number to prevent injection or errors
    const safeCalories = parseInt(targetCalories, 10);
    if (isNaN(safeCalories) || safeCalories < 0 || safeCalories > MAX_ALLOWED_CALORIES) {
       return res.status(400).json({ error: "Invalid calorie target" });
    }

    if (userPrompt && userPrompt.length > 500) {
      return res.status(400).json({ error: "User prompt too long" });
    }
    
    const apiKey = getApiKeyForUser(req.user);
    const data = await generateRecipe(
      plan,
      remainingMacros,
      safeCalories,
      lang,
      userPrompt,
      apiKey
    );
    res.json(data);
  } catch (error) {
    console.error("Recipe error:", error);
    res.status(500).json({ error: "Failed to generate recipe" });
  }
});

app.post("/api/ai/shopping", verifyToken, attachUserTier, dynamicRateLimiter, async (req, res) => {
  try {
    const { ingredients, lang } = req.body;

    if (!Array.isArray(ingredients)) {
      return res.status(400).json({ error: "Ingredients must be an array" });
    }

    if (ingredients.length > 100) {
      return res.status(400).json({ error: "Too many ingredients" });
    }

    // 🛡️ Sentinel Security: Validate individual ingredient lengths to prevent payload bloat
    if (ingredients.some(i => typeof i !== "string" || i.length > MAX_INGREDIENT_LENGTH)) {
      return res.status(400).json({ error: "Invalid ingredient format or length" });
    }
    
    const apiKey = getApiKeyForUser(req.user);
    const data = await generateShoppingList(ingredients, lang, apiKey);
    res.json(data);
  } catch (error) {
    console.error("Shopping list error:", error);
    res.status(500).json({ error: "Failed to generate shopping list" });
  }
});

// --- Data Routes (Protected & Encoded) ---

// Plans
app.get("/api/data/plans", apiLimiter, verifyToken, async (req, res) => {
  try {
    const snapshot = await db
      .collection("users")
      .doc(req.user.uid)
      .collection("plans")
      .get();
    const plans = snapshot.docs.map((doc) => {
      const d = doc.data();
      return d.data ? decodeData(d.data) : d;
    });
    res.json(plans);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/data/plans", apiLimiter, verifyToken, async (req, res) => {
  try {
    const plan = req.body;
    if (!plan.id || !isValidFirestoreId(plan.id)) {
      return res.status(400).json({ error: "Invalid or missing plan ID" });
    }

    console.log(`[Plans] Saving plan for user ${req.user.uid} with id ${plan.id}`);

    const encodedPayload = { data: encodeData(plan) };

    await db
      .collection("users")
      .doc(req.user.uid)
      .collection("plans")
      .doc(plan.id)
      .set(encodedPayload);

    console.log(`[Plans] Successfully saved plan ${plan.id}`);
    res.json(plan);
  } catch (e) {
    console.error(`[Plans] Error saving plan:`, e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.delete("/api/data/plans/:id", apiLimiter, verifyToken, async (req, res) => {
  try {
    if (!isValidFirestoreId(req.params.id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    await db
      .collection("users")
      .doc(req.user.uid)
      .collection("plans")
      .doc(req.params.id)
      .delete();
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Meals
app.get("/api/data/meals", apiLimiter, verifyToken, async (req, res) => {
  try {
    const snapshot = await db
      .collection("users")
      .doc(req.user.uid)
      .collection("meals")
      .orderBy("timestamp", "desc") 
      .limit(100)
      .get();

    const meals = snapshot.docs.map((doc) => {
      const d = doc.data();
      return d.data ? decodeData(d.data) : d;
    });
    res.json(meals);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/data/meals", apiLimiter, verifyToken, async (req, res) => {
  try {
    const meal = req.body;

    if (!meal.id || !isValidFirestoreId(meal.id)) {
      return res.status(400).json({ error: "Invalid or missing meal ID" });
    }

    const encodedPayload = { data: encodeData(meal) };
    if (meal.timestamp) {
      encodedPayload.timestamp = meal.timestamp;
    }

    await db
      .collection("users")
      .doc(req.user.uid)
      .collection("meals")
      .doc(meal.id)
      .set(encodedPayload);
    res.json(meal);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.delete("/api/data/meals/:id", apiLimiter, verifyToken, async (req, res) => {
  try {
    if (!isValidFirestoreId(req.params.id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    await db
      .collection("users")
      .doc(req.user.uid)
      .collection("meals")
      .doc(req.params.id)
      .delete();
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Recipes
app.get("/api/data/recipes", apiLimiter, verifyToken, async (req, res) => {
  try {
    const snapshot = await db
      .collection("users")
      .doc(req.user.uid)
      .collection("recipes")
      .orderBy("savedAt", "desc")
      .get();
    const recipes = snapshot.docs.map((doc) => {
      const d = doc.data();
      return d.data ? decodeData(d.data) : d;
    });
    res.json(recipes);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/data/recipes", apiLimiter, verifyToken, async (req, res) => {
  try {
    const recipe = req.body;
    if (!recipe.id || !isValidFirestoreId(recipe.id)) {
      return res.status(400).json({ error: "Invalid or missing recipe ID" });
    }

    console.log(`[Recipes] Saving recipe for user ${req.user.uid} with id ${recipe.id}`);

    const encodedPayload = { data: encodeData(recipe) };
    if (recipe.savedAt) {
      encodedPayload.savedAt = recipe.savedAt;
    }

    await db
      .collection("users")
      .doc(req.user.uid)
      .collection("recipes")
      .doc(recipe.id)
      .set(encodedPayload);
    console.log(`[Recipes] Successfully saved recipe ${recipe.id}`);
    res.json(recipe);
  } catch (e) {
    console.error(`[Recipes] Error saving recipe:`, e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.delete("/api/data/recipes/:id", apiLimiter, verifyToken, async (req, res) => {
  try {
    if (!isValidFirestoreId(req.params.id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    await db
      .collection("users")
      .doc(req.user.uid)
      .collection("recipes")
      .doc(req.params.id)
      .delete();
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Shopping List
app.get("/api/data/shopping", apiLimiter, verifyToken, async (req, res) => {
  try {
    const doc = await db
      .collection("users")
      .doc(req.user.uid)
      .collection("lists")
      .doc("shopping")
      .get();

    if (doc.exists) {
      const d = doc.data();
      if (d.data) {
        const items = decodeData(d.data);
        res.json(items);
      } else {
        res.json(d.items || []);
      }
    } else {
      res.json([]);
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/data/shopping", apiLimiter, verifyToken, async (req, res) => {
  try {
    const items = req.body; // Array of items
    const encodedPayload = { data: encodeData(items) };

    await db
      .collection("users")
      .doc(req.user.uid)
      .collection("lists")
      .doc("shopping")
      .set(encodedPayload);
    res.json(items);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Settings (Active Plan)
app.get("/api/data/settings/activePlan", apiLimiter, verifyToken, async (req, res) => {
  try {
    const doc = await db
      .collection("users")
      .doc(req.user.uid)
      .collection("settings")
      .doc("general")
      .get();

    if (doc.exists) {
      const d = doc.data();
      if (d.data) {
        const decoded = decodeData(d.data);
        res.json({ activePlanId: decoded.activePlanId });
      } else {
        res.json({ activePlanId: d.activePlanId });
      }
    } else {
      res.json({ activePlanId: null });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/data/settings/activePlan", apiLimiter, verifyToken, async (req, res) => {
  try {
    const { planId } = req.body;

    if (planId && !isValidFirestoreId(planId)) {
      return res.status(400).json({ error: "Invalid plan ID format" });
    }

    const docRef = db.collection("users").doc(req.user.uid).collection("settings").doc("general");
    const doc = await docRef.get();
    
    let currentSettings = {};
    if (doc.exists) {
      const d = doc.data();
      if (d.data) {
        currentSettings = decodeData(d.data);
      } else {
        // Handle legacy unencoded data if any, though we primarily use data blob now
        currentSettings = { ...d };
        delete currentSettings.data; // Don't include the blob itself if we mixed them
      }
    }

    const updatedSettings = { ...currentSettings, activePlanId: planId };
    const encodedPayload = { data: encodeData(updatedSettings) };

    await docRef.set(encodedPayload, { merge: true }); 

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal Server Error" });
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

export const api = onRequest({ secrets: ["GEMINI_API_KEY", "LEMONSQUEEZY_API_KEY", "LEMONSQUEEZY_WEBHOOK_SECRET", "GEMINI_API_KEY_FREE", "GEMINI_API_KEY_PLUS", "GEMINI_API_KEY_ELITE", "LEMONSQUEEZY_STORE_ID", "LEMONSQUEEZY_VARIANT_ID", "LEMONSQUEEZY_VARIANT_ID_ELITE_OTP"] }, app);
