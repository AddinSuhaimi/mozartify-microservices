console.log("✅ Music routes loaded");
const router = require("express").Router();
const musicController = require("./music.controller");
const { isAuthenticated } = require("../../shared/auth/auth.middleware");
const upload = require("./music.upload");
const uploadCatalog = require("../../shared/upload/upload.middleware");

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
router.post("/music/upload-cover-image", uploadCatalog.single("file"), musicController.uploadCoverImage);
router.post("/music/upload-mp3", uploadCatalog.single("file"), musicController.uploadMp3);

// Music Dynamic Field Routes
router.get("/music-dynamic-fields", musicController.getMusicDynamicFields);
router.get("/music-dynamic-fields/by-tab/:tabId", musicController.getMusicDynamicFieldsByTabId);
router.get("/music-dynamic-fields/:id", musicController.getMusicDynamicFieldById);
router.post("/music-dynamic-fields", musicController.createMusicDynamicField);
router.put("/music-dynamic-fields/:id", musicController.updateMusicDynamicField);
router.delete("/music-dynamic-fields/:id", musicController.deactivateMusicDynamicField);

// Music Tab Routes
router.get("/music-tabs", musicController.getAllMusicTabs);
router.post("/music-tabs", musicController.createMusicTab);
router.put("/music-tabs/reorder", musicController.reorderMusicTabs);
router.post("/music-tabs/initialize", musicController.initializeDefaultMusicTabs);
router.get("/music-tabs/:id", musicController.getMusicTabById);
router.put("/music-tabs/:id", musicController.updateMusicTab);
router.delete("/music-tabs/:id", musicController.deleteMusicTab);

module.exports = router;