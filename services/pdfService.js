const PDFDocument = require('pdfkit');

exports.generateMealPlanPDF = (planData, res) => {
    // --- SAFETY CHECK ---
    // If the data is missing or empty, stop immediately.
    // This prevents the "forEach of undefined" crash.
    if (!planData || !planData.weekPlan || !Array.isArray(planData.weekPlan)) {
        throw new Error("Invalid data: 'weekPlan' is missing. Make sure you pasted the JSON response into the Body.");
    }

    const doc = new PDFDocument();

    // Pipe PDF directly to the HTTP response
    doc.pipe(res);

    // Title
    doc.fontSize(25).text('Weekly Meal Plan', { align: 'center' });
    doc.moveDown();

    // Targets Summary
    if (planData.targets) {
        doc.fontSize(12).text(`Daily Targets: ${planData.targets.calories} kcal | P: ${planData.targets.protein}g | C: ${planData.targets.carbs}g | F: ${planData.targets.fat}g`);
        doc.moveDown();
    }

    // Iterate through Days
    planData.weekPlan.forEach(day => {
        doc.fontSize(18).fillColor('blue').text(day.day);
        doc.moveDown(0.5);

        // Iterate through Meals (Breakfast, Lunch...)
        if (day.meals) {
            Object.keys(day.meals).forEach(mealName => {
                const meal = day.meals[mealName];
                
                // Meal Header
                doc.fontSize(14).fillColor('black').text(`${mealName.toUpperCase()}  (${meal.totalCalories} kcal)`, { underline: true });
                
                // Items list
                if (meal.items && meal.items.length > 0) {
                    meal.items.forEach(item => {
                        doc.fontSize(12).text(`• ${item.name} (${item.calories} kcal)`);
                    });
                } else {
                    doc.fontSize(12).fillColor('grey').text(`• No items selected`);
                    doc.fillColor('black'); // Reset color
                }
                
                doc.moveDown(0.5);
            });
        }

        doc.addPage(); // New page for the next day
    });

    // Finalize PDF
    doc.end();
};