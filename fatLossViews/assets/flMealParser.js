import { findBestFood } from "./flFoodDb.js";

const OZ_TO_G = 28.3495;

/**
 * Parse lines like:
 * - 400g cooked chicken breast
 * - 250 g chicken breast raw
 * - 2 eggs
 * - 1 scoop whey
 * - 90g rice dry
 */
export function parseMealInput(input) {
  const raw = String(input || "").trim();
  if (!raw) {
    return { ok: false, error: "Enter what you ate with a weight." };
  }

  const countFirst = raw.match(
    /^(\d+(?:\.\d+)?)\s+(egg|eggs|scoop|scoops|slice|slices|apple|apples|banana|bananas|tbsp|tablespoon|tablespoons)\b\s*(.*)$/i,
  );
  if (countFirst) {
    const unit = countFirst[2].toLowerCase().replace(/s$/, "");
    const normalizedUnit =
      unit === "tablespoon" || unit === "tablespoons" ? "tbsp" : unit === "scoop" ? "scoop" : unit;
    return buildMealFromAmount(
      Number(countFirst[1]),
      normalizedUnit,
      (countFirst[3] || countFirst[2]).trim(),
      raw,
    );
  }

  const unitMatch = raw.match(
    /^(\d+(?:\.\d+)?)\s*(g|gram|grams|oz|ounce|ounces|lb|lbs|pound|pounds|tbsp|tablespoon|tablespoons|scoop|scoops|slice|slices|egg|eggs|apple|apples|banana|bananas)?\s*(.*)$/i,
  );

  if (unitMatch) {
    const amount = Number(unitMatch[1]);
    const unitToken = (unitMatch[2] || "g").toLowerCase();
    const foodText = (unitMatch[3] || "").trim();
    return buildMealFromAmount(amount, unitToken, foodText, raw);
  }

  return { ok: false, error: "Try format: 400g cooked chicken breast" };
}

function buildMealFromAmount(amount, unit, foodText, raw) {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Enter a valid amount." };
  }

  let grams = amount;
  let countUnit = null;

  if (unit.startsWith("oz") || unit.startsWith("ounce")) grams = amount * OZ_TO_G;
  else if (unit.startsWith("lb") || unit.startsWith("pound")) grams = amount * OZ_TO_G * 16;
  else if (
    ["egg", "eggs", "scoop", "scoops", "slice", "slices", "apple", "apples", "banana", "bananas"].includes(
      unit,
    )
  ) {
    countUnit = unit.replace(/s$/, "");
    if (unit === "eggs") countUnit = "egg";
    if (unit === "scoops") countUnit = "scoop";
    if (unit === "slices") countUnit = "slice";
    if (unit === "apples") countUnit = "apple";
    if (unit === "bananas") countUnit = "banana";
    foodText = foodText || unit;
  } else if (unit.startsWith("tbsp") || unit.startsWith("tablespoon")) {
    countUnit = "tbsp";
  }

  const query = foodText || raw;
  const hints = {};
  if (/cooked|grilled|baked|steamed|boiled|roasted/i.test(raw)) hints.prefer = "cooked";
  if (/raw|dry|drained|uncooked/i.test(raw)) hints.prefer = /dry\b/i.test(raw) ? "dry" : "raw";

  const food = findBestFood(query, hints);
  if (!food) {
    return {
      ok: false,
      error: `Couldn't match "${query}". Try chicken breast, rice dry, eggs, etc.`,
    };
  }

  let calories = 0;
  let protein = 0;
  let displayAmount = "";

  if (food.perUnit && countUnit && food.perUnit.label === countUnit) {
    calories = Math.round(food.perUnit.calories * amount);
    protein = round1(food.perUnit.protein * amount);
    grams = Math.round((food.perUnit.grams || 0) * amount) || grams;
    displayAmount = `${amount} ${countUnit}${amount === 1 ? "" : "s"}`;
  } else if (food.perUnit && !food.per100g && food.perUnit.label) {
    calories = Math.round(food.perUnit.calories * amount);
    protein = round1(food.perUnit.protein * amount);
    displayAmount = `${amount} ${food.perUnit.label}${amount === 1 ? "" : "s"}`;
  } else if (food.per100g) {
    const factor = grams / 100;
    calories = Math.round(food.per100g.calories * factor);
    protein = round1(food.per100g.protein * factor);
    displayAmount = `${Math.round(grams)}g`;
  } else if (food.perUnit) {
    calories = Math.round(food.perUnit.calories * amount);
    protein = round1(food.perUnit.protein * amount);
    displayAmount = `${amount} ${food.perUnit.label}`;
  }

  return {
    ok: true,
    meal: {
      id: crypto.randomUUID(),
      input: raw,
      foodId: food.id,
      foodName: food.name,
      amountLabel: displayAmount,
      grams: Math.round(grams),
      calories,
      protein,
    },
  };
}

export function sumMeals(meals) {
  const list = Array.isArray(meals) ? meals : [];
  return list.reduce(
    (acc, meal) => ({
      calories: acc.calories + (Number(meal.calories) || 0),
      protein: round1(acc.protein + (Number(meal.protein) || 0)),
      count: acc.count + 1,
    }),
    { calories: 0, protein: 0, count: 0 },
  );
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

export function suggestMeals(query) {
  const q = String(query || "").trim();
  if (q.length < 2) return [];
  const parsed = parseMealInput(q);
  if (parsed.ok) return [parsed.meal];
  return [];
}
