console.log("✅ Arts routes loaded");
const router = require("express").Router();
const artsController = require("./arts.controller");
const { isAuthenticated } = require("../auth/middleware/auth.middleware");
const upload = require("../../shared/upload/upload.middleware");

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

// Artwork Catalog Routes
router.post("/catalogArts", artsController.createOrUpdateArtwork);
router.get("/catalogArts/:id", artsController.getArtworkCatalogByIdentifier);
router.get("/catalogArts", artsController.getAllArtworks);
router.delete("/catalogArts/:id", artsController.deleteArtwork);
router.post("/arts/upload-artwork", upload.single("file"), artsController.uploadArtwork);
router.post("/arts/upload-artwork-image", upload.single("file"), artsController.uploadArtworkImage);

// Arts Dynamic Field Routes
router.get("/arts-dynamic-fields", artsController.getArtsDynamicFields);
router.get("/arts-dynamic-fields/by-tab", artsController.getArtsDynamicFieldsByTab);
router.get("/arts-dynamic-fields/by-tab/:tabId", artsController.getArtsDynamicFieldsByTabId);
router.get("/arts-dynamic-fields/:id", artsController.getArtsDynamicFieldById);
router.post("/arts-dynamic-fields", artsController.createArtsDynamicField);
router.put("/arts-dynamic-fields/:id", artsController.updateArtsDynamicField);
router.delete("/arts-dynamic-fields/:id", artsController.deactivateArtsDynamicField);

// Arts Tab Routes
router.get("/arts-tabs", artsController.getAllArtsTabs);
router.post("/arts-tabs", artsController.createArtsTab);
router.put("/arts-tabs/reorder", artsController.reorderArtsTabs);
router.post("/arts-tabs/initialize", artsController.initializeDefaultArtsTabs);
router.get("/arts-tabs/:id", artsController.getArtsTabById);
router.put("/arts-tabs/:id", artsController.updateArtsTab);
router.delete("/arts-tabs/:id", artsController.deleteArtsTab);

module.exports = router;