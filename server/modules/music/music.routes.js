console.log("✅ Music routes loaded");
const router = require("express").Router();
const musicController = require("./music.controller");

router.get("/refine-search", musicController.getMusicRefineSearch);
router.post("/search-music", musicController.searchMusic);
router.post("/check-purchase", musicController.checkPurchase);

module.exports = router;