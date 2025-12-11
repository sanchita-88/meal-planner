// =====================
// FILTERS SERVICE
// =====================

// Filter foods by meal category
exports.filterByMealType = (foods, mealType) => {
    return foods.filter(item => 
        (item.categories || []).includes(mealType)
    );
};

// Additional filters (veg, allergies, dislikes)
exports.applyFilters = (foods, { veg = null, allergies = [], dislikes = [] }) => {
    const allergiesLower = allergies.map(a => a.toLowerCase());
    const dislikesLower = dislikes.map(d => d.toLowerCase());

    return foods.filter(item => {
        if (veg === true && item.veg === false) return false;

        for (const a of allergiesLower) {
            if (item.name.toLowerCase().includes(a)) return false;
            if ((item.tags || []).some(t => t.toLowerCase().includes(a))) return false;
        }

        for (const d of dislikesLower) {
            if (item.name.toLowerCase().includes(d)) return false;
            if ((item.tags || []).some(t => t.toLowerCase().includes(d))) return false;
        }

        return true;
    });
};
