console.log("✅ Recommendation routes loaded");
const router = require("express").Router();
const controller = require("./recommendation.controller");
const { isAuthenticated } = require("../auth/middleware/auth.middleware");

router.get("/recommendations-music", isAuthenticated, controller.getMusicRecommendations);
router.get("/recommendations-artwork", isAuthenticated, controller.getArtworkRecommendations);

module.exports = router;