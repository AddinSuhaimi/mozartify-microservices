console.log("✅ Music routes loaded");
const router = require("express").Router();
const musicController = require("./music.controller");
const { isAuthenticated } = require("../auth/middleware/auth.middleware");

router.get("/refine-search", musicController.getMusicRefineSearch);
router.post("/search-music", musicController.searchMusic);
router.post("/check-purchase", musicController.checkPurchase);
router.get("/user-music-cart", isAuthenticated, musicController.getUserMusicCart);

module.exports = router;