const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { generateRecommendations } = require('../services/recommendationEngine');

// GET /api/recommendations
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const recommendations = await generateRecommendations(userId);

    return res.json({
      success: true,
      count: recommendations.length,
      recommendations,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
