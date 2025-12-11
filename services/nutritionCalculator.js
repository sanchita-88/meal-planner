// services/nutritionCalculator.js

const ACTIVITY_MULTIPLIERS = {
    sedentary: 1.2,      // Little or no exercise
    light: 1.375,        // Light exercise 1-3 days/week
    moderate: 1.55,      // Moderate exercise 3-5 days/week
    active: 1.725,       // Hard exercise 6-7 days/week
    very_active: 1.9     // Very hard exercise & physical job
};

const GOAL_MODIFIERS = {
    weight_loss: -400,   // Deficit
    maintenance: 0,
    muscle_gain: 300     // Surplus
};

exports.calculateNeeds = (profile) => {
    const { weight, height, age, gender, activity, goal } = profile;

    // 1. Calculate BMR (Mifflin-St Jeor)
    // Formula: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + s
    // s is +5 for males, -161 for females
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    bmr += (gender === 'male' ? 5 : -161);

    // 2. Calculate TDEE (Total Daily Energy Expenditure)
    const multiplier = ACTIVITY_MULTIPLIERS[activity] || 1.2;
    let tdee = Math.round(bmr * multiplier);

    // 3. Adjust for Goal
    const adjustment = GOAL_MODIFIERS[goal] || 0;
    const dailyCalories = tdee + adjustment;

    return { bmr, tdee, dailyCalories };
};

exports.calculateMacros = (calories, presetType) => {
    let ratios = { p: 0.25, c: 0.50, f: 0.25 }; // Default Balanced

    if (presetType === 'muscle_gain') {
        ratios = { p: 0.30, c: 0.45, f: 0.25 };
    } else if (presetType === 'weight_loss') {
        ratios = { p: 0.35, c: 0.35, f: 0.30 }; // Higher protein/fat for satiety
    } else if (presetType === 'keto') {
        ratios = { p: 0.25, c: 0.05, f: 0.70 };
    }

    // Convert Percentages to Grams
    // Protein = 4 cal/g, Carbs = 4 cal/g, Fat = 9 cal/g
    return {
        protein: Math.round((calories * ratios.p) / 4),
        carbs:   Math.round((calories * ratios.c) / 4),
        fat:     Math.round((calories * ratios.f) / 9)
    };
};