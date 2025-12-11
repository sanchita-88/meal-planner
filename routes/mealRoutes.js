const express = require('express');
const router = express.Router();
const mealController = require('../controllers/mealController');

router.post('/generate-plan', mealController.generatePlan);
router.get('/foods', mealController.getFoods);
router.post('/regenerate', mealController.regenerateMeal);
router.post('/export-pdf', mealController.exportPdf);

module.exports = router;
