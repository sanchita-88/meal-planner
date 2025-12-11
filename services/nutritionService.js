exports.calculateNeeds = (profile) => {
    let { age, gender, height, weight, activity, goal } = profile;
    
    // Default to Sedentary (Safer default)
    activity = activity || 'sedentary';
    gender = gender || 'male';
    goal = goal || 'maintenance';
    
    // 1. BMR Calculation (Mifflin-St Jeor)
    let bmr = (10 * weight) + (6.25 * height) - (5 * age) + (gender === 'male' ? 5 : -161);

    // 2. BMI Adjustment (Reality Check)
    // High BMI often overestimates calorie burn because fat burns less energy than muscle.
    const bmi = weight / ((height / 100) ** 2);
    if (bmi > 30) { 
        bmr = bmr * 0.85; // Reduce BMR by 15% for obese individuals
    }

    // 3. Activity Multipliers
    const multipliers = {
        sedentary: 1.2,      // Desk job
        light: 1.375,        // Light exercise 1-3 days
        moderate: 1.55,      // Moderate exercise 3-5 days
        active: 1.725,       // Heavy exercise
        very_active: 1.9
    };
    
    const tdee = bmr * (multipliers[activity] || 1.2);

    // 4. Goal Adjustment
    let target = tdee;
    if (goal === 'weight_loss') target = tdee - 500;
    else if (goal === 'muscle_gain') target = tdee + 300;

    // 5. --- THE SANITY CAP (New Fix) ---
    // If goal is weight loss, we cap the max calories to reasonable limits
    // regardless of how heavy the person is.
    if (goal === 'weight_loss') {
        const maxCap = gender === 'male' ? 2200 : 1800;
        if (target > maxCap) target = maxCap;
    }

    // 6. Safety Floor (Don't starve)
    const minFloor = gender === 'male' ? 1500 : 1200;
    if (target < minFloor) target = minFloor;

    // Round to nearest 50
    target = Math.round(target / 50) * 50;

    // 7. Macro Split
    let pRatio = 0.3, fRatio = 0.3, cRatio = 0.4;
    if (goal === 'weight_loss') { pRatio = 0.4; fRatio = 0.3; cRatio = 0.3; }
    if (goal === 'muscle_gain') { pRatio = 0.3; fRatio = 0.25; cRatio = 0.45; }

    return {
        dailyCalories: target,
        protein: Math.round((target * pRatio) / 4),
        fat: Math.round((target * fRatio) / 9),
        carbs: Math.round((target * cRatio) / 4)
    };
};

exports.calculateTotalCalories = (items) => items.reduce((acc, i) => acc + (i.calories || 0), 0);
exports.calculateMealMacros = (items) => items.reduce((acc, i) => ({
    protein: acc.protein + (i.protein || 0),
    carbs: acc.carbs + (i.carbs || 0),
    fat: acc.fat + (i.fat || 0)
}), { protein: 0, carbs: 0, fat: 0 });