console.log("✅ Arts routes loaded");
const router = require("express").Router();
const artsController = require("./arts.controller");

router.get("/artwork-refine-search", artsController.getArtworkRefineSearch);
router.post("/search-artwork", artsController.searchArtwork);
router.post("/check-artwork-purchase", artsController.checkArtworkPurchase);

module.exports = router;