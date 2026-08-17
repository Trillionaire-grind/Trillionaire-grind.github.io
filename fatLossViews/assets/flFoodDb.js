/**
 * Boy Kibble ingredient menus only — auto math works for these foods.
 * Per 100g unless `perUnit` is set (eggs, slices, scoops, pieces).
 */
export const BOY_KIBBLE_FOODS = [
  {
    id: "chicken-breast-raw",
    name: "Chicken breast (raw)",
    aliases: ["chicken breast", "chicken", "chicken breast raw", "raw chicken breast"],
    per100g: { calories: 120, protein: 22 },
    prefer: "raw",
  },
  {
    id: "chicken-breast-cooked",
    name: "Chicken breast (cooked)",
    aliases: [
      "cooked chicken breast",
      "chicken breast cooked",
      "grilled chicken breast",
      "baked chicken breast",
    ],
    per100g: { calories: 165, protein: 31 },
    prefer: "cooked",
  },
  {
    id: "ground-beef-93-raw",
    name: "Lean ground beef 93/7 (raw)",
    aliases: ["ground beef", "lean ground beef", "93/7 ground beef", "beef raw"],
    per100g: { calories: 152, protein: 21 },
    prefer: "raw",
  },
  {
    id: "shrimp-raw",
    name: "Shrimp (raw, peeled)",
    aliases: ["shrimp", "shrimp raw", "raw shrimp"],
    per100g: { calories: 85, protein: 20 },
    prefer: "raw",
  },
  {
    id: "tilapia-raw",
    name: "White fish / tilapia (raw)",
    aliases: ["tilapia", "white fish", "fish raw", "cod", "fish"],
    per100g: { calories: 96, protein: 20 },
    prefer: "raw",
  },
  {
    id: "tuna-canned",
    name: "Canned tuna in water (drained)",
    aliases: ["tuna", "canned tuna", "tuna drained"],
    per100g: { calories: 116, protein: 26 },
  },
  {
    id: "egg-large",
    name: "Egg (large)",
    aliases: ["egg", "eggs", "large egg"],
    perUnit: { calories: 72, protein: 6, grams: 50, label: "egg" },
  },
  {
    id: "egg-whites",
    name: "Egg whites",
    aliases: ["egg white", "egg whites", "whites"],
    per100g: { calories: 52, protein: 11 },
  },
  {
    id: "greek-yogurt",
    name: "Nonfat Greek yogurt",
    aliases: ["greek yogurt", "yogurt", "nonfat greek yogurt"],
    per100g: { calories: 59, protein: 10 },
  },
  {
    id: "whey-scoop",
    name: "Whey protein (scoop)",
    aliases: ["whey", "protein powder", "whey protein", "scoop whey", "protein scoop"],
    perUnit: { calories: 120, protein: 24, grams: 30, label: "scoop" },
  },
  {
    id: "rice-dry",
    name: "White rice (dry)",
    aliases: ["rice dry", "dry rice", "white rice", "rice raw"],
    per100g: { calories: 365, protein: 7 },
    prefer: "dry",
  },
  {
    id: "rice-cooked",
    name: "White rice (cooked)",
    aliases: ["cooked rice", "rice cooked"],
    per100g: { calories: 130, protein: 2.7 },
    prefer: "cooked",
  },
  {
    id: "potato-raw",
    name: "Potato (raw)",
    aliases: ["potato", "potatoes", "potato raw", "raw potato"],
    per100g: { calories: 77, protein: 2 },
    prefer: "raw",
  },
  {
    id: "sweet-potato-raw",
    name: "Sweet potato (raw)",
    aliases: ["sweet potato", "sweet potatoes", "yam"],
    per100g: { calories: 86, protein: 1.6 },
    prefer: "raw",
  },
  {
    id: "oats-dry",
    name: "Oats (dry)",
    aliases: ["oats", "oatmeal", "oats dry", "dry oats"],
    per100g: { calories: 379, protein: 13 },
    prefer: "dry",
  },
  {
    id: "pasta-dry",
    name: "Pasta (dry)",
    aliases: ["pasta dry", "dry pasta", "pasta raw"],
    per100g: { calories: 371, protein: 13 },
    prefer: "dry",
  },
  {
    id: "pasta-cooked",
    name: "Pasta (cooked)",
    aliases: ["cooked pasta", "pasta cooked"],
    per100g: { calories: 158, protein: 5.8 },
    prefer: "cooked",
  },
  {
    id: "beans-cooked",
    name: "Black / pinto beans (cooked)",
    aliases: ["beans", "black beans", "pinto beans", "beans cooked"],
    per100g: { calories: 127, protein: 8.7 },
  },
  {
    id: "bread-slice",
    name: "Bread (slice)",
    aliases: ["bread", "slice bread", "bread slice"],
    perUnit: { calories: 75, protein: 3, grams: 30, label: "slice" },
  },
  {
    id: "apple",
    name: "Apple",
    aliases: ["apple", "apples"],
    perUnit: { calories: 95, protein: 0.5, grams: 182, label: "apple" },
  },
  {
    id: "banana",
    name: "Banana",
    aliases: ["banana", "bananas"],
    perUnit: { calories: 105, protein: 1.3, grams: 118, label: "banana" },
  },
  {
    id: "broccoli",
    name: "Broccoli",
    aliases: ["broccoli"],
    per100g: { calories: 34, protein: 2.8 },
  },
  {
    id: "green-beans",
    name: "Green beans",
    aliases: ["green beans", "green bean"],
    per100g: { calories: 31, protein: 1.8 },
  },
  {
    id: "bell-pepper",
    name: "Bell pepper",
    aliases: ["bell pepper", "pepper", "peppers"],
    per100g: { calories: 26, protein: 1 },
  },
  {
    id: "zucchini",
    name: "Zucchini",
    aliases: ["zucchini"],
    per100g: { calories: 17, protein: 1.2 },
  },
  {
    id: "spinach",
    name: "Spinach",
    aliases: ["spinach"],
    per100g: { calories: 23, protein: 2.9 },
  },
  {
    id: "cucumber",
    name: "Cucumber",
    aliases: ["cucumber"],
    per100g: { calories: 15, protein: 0.7 },
  },
  {
    id: "lettuce",
    name: "Lettuce / leafy greens",
    aliases: ["lettuce", "greens", "salad", "leafy greens"],
    per100g: { calories: 15, protein: 1.4 },
  },
  {
    id: "olive-oil",
    name: "Olive oil",
    aliases: ["olive oil", "oil"],
    per100g: { calories: 857, protein: 0 },
    perUnit: { calories: 120, protein: 0, grams: 14, label: "tbsp" },
  },
  {
    id: "butter",
    name: "Butter",
    aliases: ["butter"],
    perUnit: { calories: 102, protein: 0.1, grams: 14, label: "tbsp" },
  },
  {
    id: "peanut-butter",
    name: "Peanut butter",
    aliases: ["peanut butter", "pb"],
    per100g: { calories: 588, protein: 25 },
  },
  {
    id: "avocado",
    name: "Avocado",
    aliases: ["avocado"],
    per100g: { calories: 160, protein: 2 },
  },
  {
    id: "almonds",
    name: "Almonds / nuts",
    aliases: ["almonds", "nuts", "almond"],
    per100g: { calories: 579, protein: 21 },
  },
  {
    id: "cheese",
    name: "Cheese",
    aliases: ["cheese"],
    per100g: { calories: 400, protein: 25 },
  },
];

/** @deprecated use BOY_KIBBLE_FOODS */
export const FOODS = BOY_KIBBLE_FOODS;

/** Minimum match score (0–100) before auto-calculating from Boy Kibble menus. */
export const BOY_KIBBLE_MIN_SCORE = 55;

export function searchFoods(query) {
  const q = normalizeFoodQuery(query);
  if (!q) return [];
  return BOY_KIBBLE_FOODS.map((food) => ({
    food,
    score: scoreFoodMatch(q, food),
  }))
    .filter((row) => row.score >= BOY_KIBBLE_MIN_SCORE)
    .sort((a, b) => b.score - a.score);
}

export function findBestFood(query, hints = {}) {
  const matches = searchFoods(query);
  if (!matches.length) return null;

  const prefer = hints.prefer;
  if (prefer) {
    const preferred = matches.find((row) => row.food.prefer === prefer);
    if (preferred) return preferred.food;
  }

  const q = normalizeFoodQuery(query);
  const cookedish = /(cooked|grilled|baked|steamed|boiled|roasted)\b/.test(q);
  const rawish = /(raw|dry|drained|uncooked)\b/.test(q);

  if (cookedish) {
    const cooked = matches.find((row) => row.food.prefer === "cooked");
    if (cooked) return cooked.food;
  }
  if (rawish || /\bdry\b/.test(q)) {
    const raw = matches.find((row) => row.food.prefer === "raw" || row.food.prefer === "dry");
    if (raw) return raw.food;
  }

  return matches[0].food;
}

export function isBoyKibbleFood(query) {
  return searchFoods(query).length > 0;
}

function normalizeFoodQuery(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9/\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreFoodMatch(query, food) {
  const name = normalizeFoodQuery(food.name);
  if (query === name) return 100;
  if (name.includes(query) || query.includes(name)) return 90;

  let best = 0;
  for (const alias of food.aliases) {
    const a = normalizeFoodQuery(alias);
    if (query === a) best = Math.max(best, 95);
    else if (a.includes(query) || query.includes(a)) best = Math.max(best, 80);
    else {
      const qTokens = query.split(" ").filter(Boolean);
      const aTokens = new Set(a.split(" "));
      const overlap = qTokens.filter((t) => aTokens.has(t)).length;
      if (overlap >= 2) best = Math.max(best, 60 + overlap * 5);
      else if (overlap === 1 && qTokens.length <= 2) best = Math.max(best, 35);
    }
  }
  return best;
}
