console.log("✅ Music routes loaded");
const router = require("express").Router();
const musicController = require("./music.controller");
const { isAuthenticated } = require("../auth/middleware/auth.middleware");
const upload = require("./music.upload");

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
router.post("/upload", upload.single("file"), musicController.uploadMusicFile);
router.get("/abc-file", musicController.getABCFiles);
router.get("/abc-file/:identifier", musicController.getABCFileByIdentifier);
router.put("/abc-file/:filename/content", musicController.updateABCFileContent);
router.get("/catalog/:fileName", musicController.getCatalogByFilename);
router.post("/catalog", musicController.saveCatalogMetadata);
router.post("/delete-and-transfer-abc-file", musicController.deleteAndTransferABCFile);

module.exports = router;