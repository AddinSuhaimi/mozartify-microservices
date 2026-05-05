console.log("✅ Arts routes loaded");
const router = require("express").Router();
const artsController = require("./arts.controller");
const { isAuthenticated } = require("../auth/middleware/auth.middleware");

router.get("/artwork-refine-search", artsController.getArtworkRefineSearch);
router.post("/search-artwork", artsController.searchArtwork);
router.post("/check-artwork-purchase", artsController.checkArtworkPurchase);
router.get("/user-artwork-cart", isAuthenticated, artsController.getUserArtworkCart);
router.get("/artwork/:id", artsController.getArtworkById);
router.get("/customer-artwork-view/:id", artsController.getArtworkById);
router.get("/artworks", artsController.getArtworksByIds);
router.get("/popular-artworks", artsController.getPopularArtworks);
router.get("/user-liked-artworks", isAuthenticated, artsController.getUserLikedArtworks);
router.post("/add-to-cart-artwork", isAuthenticated, artsController.addToCart);
router.delete("/remove-artwork-from-cart/:id", isAuthenticated, artsController.removeFromCart);
router.post("/set-favorites-artwork", isAuthenticated, artsController.setFavoritesArtwork);

module.exports = router;