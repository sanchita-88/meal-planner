// ==========================
// Meal Engine (AI-Powered Version)
// ==========================

// 1. Load Data Correctly
const foodData = require("../data/foods.json");
const foods = Array.isArray(foodData) ? foodData : (foodData.foods || []);

// 2. Import Helper Services
const { filterByMealType } = require("./filters");
const { calculateMealMacros, calculateTotalCalories } = require("./nutritionService");

// ---------------------------
// State
// ---------------------------
let weeklyUsage = {};
let previousDayMeals = {};

function resetWeeklyState() {
    weeklyUsage = {};
    previousDayMeals = {};
}

// ---------------------------
// Helper: Staples
// ---------------------------
function isStaple(food) {
    if (!food || !food.name) return false;
    const name = food.name.toLowerCase();
    return name.includes("roti") || 
           name.includes("naan") || 
           name.includes("rice") || 
           name.includes("bread") ||
           name.includes("toast") ||
           name.includes("idli") ||
           name.includes("poha") ||
           name.includes("upma");
}

// ---------------------------
// Helper: Filter by Category
// ---------------------------
function getCandidatesForMeal(allFoods, mealType) {
    if (!allFoods || allFoods.length === 0) return [];
    return allFoods.filter(f => f.categories && f.categories.includes(mealType));
}

// ---------------------------
// 1. Filter Foods (Strict Preferences)
// ---------------------------
function filterFoods(allFoods, preferences) {
    let filtered = allFoods;

    // Filter Veg
    if (preferences.veg) {
        filtered = filtered.filter(f => f.veg === true);
    }

    // Filter Allergies
    if (preferences.allergies && preferences.allergies.length > 0) {
        filtered = filtered.filter(f => {
            const lowerName = f.name.toLowerCase();
            const tags = f.tags || [];
            return !preferences.allergies.some(allergy => {
                const a = allergy.toLowerCase();
                return lowerName.includes(a) || tags.includes(a);
            });
        });
    }

    // Filter Dislikes (Explicit)
    if (preferences.dislikes && preferences.dislikes.length > 0) {
        filtered = filtered.filter(f => {
            return !preferences.dislikes.includes(f.id) && 
                   !preferences.dislikes.includes(f.name);
        });
    }

    return filtered;
}

// ---------------------------
// 2. Diversity Rules
// ---------------------------
function isFoodAllowed(food, mealType) {
    const usage = weeklyUsage[food.id] || 0;

    // Staples are always allowed
    if (isStaple(food)) return true;

    // Standard items: Max 3 times/week
    if (usage >= 3) return false;

    // No back-to-back repeats
    if (previousDayMeals[mealType] && previousDayMeals[mealType].includes(food.id)) {
        return false;
    }

    return true;
}

// ---------------------------
// 3. Scoring (AI Integrated)
// ---------------------------
function scoreFoodItem(food, targetCalories, userPreferences) {
    // 1. Calorie Match (Gaussian)
    const calorieDiff = Math.abs(food.calories - targetCalories);
    const calorieScore = 100 * Math.exp(-(calorieDiff * calorieDiff) / (2 * 150 * 150));
    
    // 2. Diversity Score (Base logic)
    let diversityScore = 0;
    const usage = weeklyUsage[food.id] || 0;
    if (usage === 0) diversityScore += 10; // Bonus for new items
    else if (usage === 1) diversityScore -= 5;
    else if (usage >= 2) diversityScore -= 20;

    // 3. AI / Personalization Score 🧠
    let aiScore = 0;
    if (userPreferences && userPreferences.tagScores && food.tags) {
        // Look at the user's learned weights for these tags
        food.tags.forEach(tag => {
            // tagScores might be a plain object or a Map depending on how it's passed
            const weight = userPreferences.tagScores[tag] || 0;
            aiScore += weight; 
        });
    }

    const randomScore = Math.random() * 5; 

    // WEIGHTED TOTAL
    // Calorie (60%) + Diversity (20%) + AI Preferences (20%)
    return (0.6 * calorieScore) + (0.2 * diversityScore) + (0.2 * aiScore) + randomScore;
}

// ---------------------------
// 4. Selection (Robust)
// ---------------------------
function pickBestItem(candidates, targetCalories, mealType, userPreferences) {
    // Phase 1: Try strict rules
    let pool = candidates.filter(f => isFoodAllowed(f, mealType));

    // Phase 2: Fallback (Relax rules if pool is empty)
    if (pool.length === 0) {
        pool = candidates; 
    }

    // Phase 3: Absolute Failsafe
    if (pool.length === 0) return null;

    let best = null;
    let bestScore = -Infinity;

    for (let food of pool) {
        // Pass userPreferences to the scoring function
        const s = scoreFoodItem(food, targetCalories, userPreferences);
        if (s > bestScore) {
            bestScore = s;
            best = food;
        }
    }
    return best;
}

// ---------------------------
// 5. Build Meal (Stacking Logic)
// ---------------------------
function buildMeal(mealType, targetCalories, availableFoods, userPreferences) {
    const candidates = getCandidatesForMeal(availableFoods, mealType);
    
    if (candidates.length === 0) {
        return { items: [], totalCalories: 0, macros: { protein:0, carbs:0, fat:0 } };
    }

    let mealItems = [];

    // --- 1. Main Dish ---
    const mainDish = pickBestItem(candidates, targetCalories, mealType, userPreferences);
    
    if (!mainDish) return { items: [], totalCalories: 0, macros: { protein:0, carbs:0, fat:0 } };

    mealItems.push(mainDish);
    weeklyUsage[mainDish.id] = (weeklyUsage[mainDish.id] || 0) + 1;

    // --- 2. Fill the Gap ---
    let loops = 0;
    while (loops < 3) { 
        let currentCals = calculateTotalCalories(mealItems);
        let gap = targetCalories - currentCals;

        if (gap < 80) break; // Close enough

        // Filter out items already used in this specific meal
        const currentIds = mealItems.map(i => i.id);
        const sideCandidates = candidates.filter(f => !currentIds.includes(f.id));

        // Pass userPreferences here too
        const sideDish = pickBestItem(sideCandidates, gap, mealType, userPreferences);

        if (sideDish) {
            mealItems.push(sideDish);
            weeklyUsage[sideDish.id] = (weeklyUsage[sideDish.id] || 0) + 1;
        } else {
            break;
        }
        loops++;
    }

    return {
        items: mealItems,
        totalCalories: calculateTotalCalories(mealItems),
        macros: calculateMealMacros(mealItems),
    };
}

// ---------------------------
// Generators
// ---------------------------
function generateDayPlan(targets, availableFoods, userPreferences) {
    const dayPlan = {
        breakfast: buildMeal("breakfast", targets.breakfast, availableFoods, userPreferences),
        lunch: buildMeal("lunch", targets.lunch, availableFoods, userPreferences),
        snack: buildMeal("snack", targets.snack, availableFoods, userPreferences),
        dinner: buildMeal("dinner", targets.dinner, availableFoods, userPreferences),
    };

    previousDayMeals = {
        breakfast: dayPlan.breakfast.items.map(i => i.id),
        lunch: dayPlan.lunch.items.map(i => i.id),
        snack: dayPlan.snack.items.map(i => i.id),
        dinner: dayPlan.dinner.items.map(i => i.id),
    };

    return dayPlan;
}

// Updated to accept userModelData for AI
function generateWeeklyPlan(targets, preferences = {}, userModelData = null) {
    resetWeeklyState();
    
    // Filter Master List
    const safeFoods = filterFoods(foods, preferences);

    // Extract AI Preferences (Tag Scores) if they exist
    let aiPrefs = null;
    if (userModelData && userModelData.preferences && userModelData.preferences.tagScores) {
        // Convert Mongoose Map to standard object if necessary, or pass as is
        // Usually safer to normalize it here
        const tagScores = userModelData.preferences.tagScores instanceof Map 
            ? Object.fromEntries(userModelData.preferences.tagScores) 
            : userModelData.preferences.tagScores;

        aiPrefs = { tagScores: tagScores || {} };
    }

    const weekPlan = [];
    const dayNames = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

    // Distribute Targets
    const mealTargets = {
        breakfast: Math.round(targets.calories * 0.25),
        lunch: Math.round(targets.calories * 0.35),
        snack: Math.round(targets.calories * 0.10),
        dinner: Math.round(targets.calories * 0.30),
    };

    for (let i = 0; i < 7; i++) {
        // Pass aiPrefs to the daily generator
        const dayPlan = generateDayPlan(mealTargets, safeFoods, aiPrefs);
        weekPlan.push({
            day: dayNames[i],
            meals: dayPlan,
        });
    }

    return { 
        targets: targets,
        weekPlan: weekPlan 
    };
}

// NEW: Regenerate a single meal (Now with AI support)
function regenerateSingleMeal(mealType, targetCalories, preferences, avoidFoodId, userModelData = null) {
    const safeFoods = filterFoods(foods, preferences);

    if (avoidFoodId) {
        weeklyUsage[avoidFoodId] = 99; 
    }

    let aiPrefs = null;
    if (userModelData && userModelData.preferences && userModelData.preferences.tagScores) {
        const tagScores = userModelData.preferences.tagScores instanceof Map 
            ? Object.fromEntries(userModelData.preferences.tagScores) 
            : userModelData.preferences.tagScores;
        aiPrefs = { tagScores: tagScores || {} };
    }

    return buildMeal(mealType, targetCalories, safeFoods, aiPrefs);
}

module.exports = { generateWeeklyPlan, regenerateSingleMeal };