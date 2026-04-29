console.log("✅ Arts routes loaded");
const router = require("express").Router();
const artsController = require("./arts.controller");
const { isAuthenticated } = require("../auth/middleware/auth.middleware");

router.get("/artwork-refine-search", artsController.getArtworkRefineSearch);
router.post("/search-artwork", artsController.searchArtwork);
router.post("/check-artwork-purchase", artsController.checkArtworkPurchase);
router.get("/user-artwork-cart", isAuthenticated, artsController.getUserArtworkCart);

module.exports = router;