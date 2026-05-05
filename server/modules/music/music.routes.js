console.log("✅ Music routes loaded");
const router = require("express").Router();
const musicController = require("./music.controller");
const { isAuthenticated } = require("../auth/middleware/auth.middleware");

router.get("/refine-search", musicController.getMusicRefineSearch);
router.post("/search-music", musicController.searchMusic);
router.post("/check-purchase", musicController.checkPurchase);
router.get("/user-music-cart", isAuthenticated, musicController.getUserMusicCart);
router.get("/music-score/:id", musicController.getMusicScoreById);
router.get("/customer-music-score-view/:id", musicController.getMusicScoreById);
router.get("/music-scores", musicController.getMusicScoresByIds);
router.get("/popular-music-scores", musicController.getPopularMusicScores);
router.get("/user-liked-scores", isAuthenticated, musicController.getUserLikedMusicScores);
router.post("/add-to-cart-music", isAuthenticated, musicController.addToCart);
router.delete("/remove-score-from-cart/:id", isAuthenticated, musicController.removeFromCart);
router.post("/set-favorites-music", isAuthenticated, musicController.setFavoritesMusic);

module.exports = router;