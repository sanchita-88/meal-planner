const mealEngine = require('../services/mealEngine');
const calculator = require('../services/nutritionCalculator');
const nutritionService = require('../services/nutritionService');
const pdfService = require('../services/pdfService');
const mlPredictor = require('../services/mlPredictor'); // <--- 1. Import ML Service

// --------------------------------------------------
// GET ALL FOODS
// --------------------------------------------------
exports.getFoods = async (req, res) => {
    try {
        const foods = await nutritionService.loadFoods();
        res.json({ foods });
    } catch (err) {
        res.status(500).json({ error: 'Failed to load foods' });
    }
};

// --------------------------------------------------
// GENERATE WEEKLY PLAN (ML INTEGRATED HERE)
// --------------------------------------------------
exports.generatePlan = async (req, res) => {
    try {
        // 1. Get User Profile from Body
        const { 
            age, gender, height, weight, activity, goal, diet, 
            allergies = [], dislikes = [] 
        } = req.body;

        // Validation
        if (!age || !height || !weight) {
            return res.status(400).json({ error: "Missing biometric data" });
        }

        // 2. Calculate Calories & Macros
        const { dailyCalories } = calculator.calculateNeeds({ age, gender, height, weight, activity, goal });
        const macros = calculator.calculateMacros(dailyCalories, goal);

        const targets = {
            calories: dailyCalories,
            protein: macros.protein,
            carbs: macros.carbs,
            fat: macros.fat
        };

        const preferences = {
            veg: (diet === 'veg' || diet === 'vegan'),
            allergies,
            dislikes
        };

        // 3. Generate The Plan
        const plan = mealEngine.generateWeeklyPlan(targets, preferences);

        // -------------------------------------------------------
        // <--- 4. ML MODEL INTEGRATION --->
        // -------------------------------------------------------
        // We pass the User Profile (req.body) and the Generated Plan
        const satisfactionScore = mlPredictor.predictSatisfaction(req.body, plan);
        
        // Attach the prediction to the response
        plan.meta = {
            ...plan.meta,
            predictedUserSatisfaction: `${satisfactionScore}% Match`,
            aiAnalysis: satisfactionScore > 80 ? "Highly Optimized for your Goal" : "Standard Plan"
        };
        // -------------------------------------------------------

        res.json(plan);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Generation failed" });
    }
};

// --------------------------------------------------
// REGENERATE SINGLE MEAL
// --------------------------------------------------
exports.regenerateMeal = async (req, res) => {
    try {
        const { 
            age, gender, height, weight, activity, goal, diet, allergies, dislikes, 
            mealType, currentFoodId 
        } = req.body;

        const { dailyCalories } = calculator.calculateNeeds({ age, gender, height, weight, activity, goal });
        
        // Target specific meal calories (approximate split)
        const ratios = { breakfast: 0.25, lunch: 0.35, snack: 0.10, dinner: 0.30 };
        const mealCalorieTarget = Math.round(dailyCalories * ratios[mealType]);

        const preferences = { veg: (diet === 'veg' || diet === 'vegan'), allergies, dislikes };

        const newMeal = mealEngine.regenerateSingleMeal(mealType, mealCalorieTarget, preferences, currentFoodId);

        res.json({ meal: newMeal });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Regeneration failed" });
    }
};

// --------------------------------------------------
// EXPORT TO PDF
// --------------------------------------------------
exports.exportPdf = (req, res) => {
    try {
        const planData = req.body; 

        // Validate before calling the service
        if (!planData || Object.keys(planData).length === 0) {
            return res.status(400).json({ error: "Request Body is empty. Please paste the Meal Plan JSON." });
        }
        
        // Set headers so browser knows it's a PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=meal_plan.pdf');

        pdfService.generateMealPlanPDF(planData, res);

    } catch (err) {
        console.error("PDF Generation Error:", err.message);
        // Only send error if headers haven't been sent yet
        if (!res.headersSent) {
            res.status(400).json({ error: err.message });
        }
    }
};