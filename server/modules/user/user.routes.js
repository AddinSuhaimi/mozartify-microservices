console.log("✅ User routes loaded");
const router = require("express").Router();
const userController = require("./user.controller");
const { isAuthenticated } = require("../auth/middleware/auth.middleware");

router.get("/preferences-options", userController.getMusicPreferencesOptions);
router.get("/art-preferences-options", userController.getArtPreferencesOptions);
router.post("/preferences", isAuthenticated, userController.updateMusicPreferences);
router.post("/art-preferences", isAuthenticated, userController.updateArtPreferences);
router.get("/user-cart", isAuthenticated, userController.getUserCart);

module.exports = router;