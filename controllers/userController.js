// controllers/userController.js
const User = require('../models/User');
const foods = require('../data/foods.json'); // Load food data to look up tags

// @desc    Record user feedback (Like/Dislike/Reject)
// @route   POST /api/user/feedback
exports.recordFeedback = async (req, res) => {
    try {
        const { foodId, action } = req.body; // action: 'liked', 'disliked', 'rejected'
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        // 1. Record the Interaction
        user.preferences.interactionHistory.push({
            foodId,
            action,
            timestamp: Date.now()
        });

        // 2. The "Learning" Step (Update Weights)
        // Find the food to get its tags
        // (Note: In your real app, foods might be in DB, here we look in JSON)
        // Adjust logic if foodData structure is { foods: [...] } vs [...]
        const foodList = Array.isArray(foods) ? foods : foods.foods;
        const foodItem = foodList.find(f => f.id === foodId);

        if (foodItem && foodItem.tags) {
            const weight = (action === 'liked') ? 2 : (action === 'disliked' || action === 'rejected') ? -2 : 0;
            
            foodItem.tags.forEach(tag => {
                // Get current score or 0
                const currentScore = user.preferences.tagScores.get(tag) || 0;
                // Update score
                user.preferences.tagScores.set(tag, currentScore + weight);
            });
        }

        await user.save();
        res.json({ success: true, msg: "Feedback recorded & preferences updated" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server Error" });
    }
};

// @desc    Get User Profile (Frontend needs this)
// @route   GET /api/user/profile
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: "Server Error" });
    }
};