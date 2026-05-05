console.log("✅ User routes loaded");
const router = require("express").Router();
const userController = require("./user.controller");
const { isAuthenticated } = require("../auth/middleware/auth.middleware");

router.get("/preferences-options", userController.getMusicPreferencesOptions);
router.get("/art-preferences-options", userController.getArtPreferencesOptions);
router.post("/preferences", isAuthenticated, userController.updateMusicPreferences);
router.post("/art-preferences", isAuthenticated, userController.updateArtPreferences);
router.get("/user-cart", isAuthenticated, userController.getUserCart);
router.get("/user-library", isAuthenticated, userController.getUserLibrary);
router.get("/user-artwork-library", isAuthenticated, userController.getUserArtworkLibrary);
router.get("/user-composed-scores", isAuthenticated, userController.getUserComposedScores);
router.delete("/user/delete", isAuthenticated, userController.deleteUser);
router.put("/user/update-username", isAuthenticated, userController.updateUsername);
router.put("/user/change-password", isAuthenticated, userController.changePassword);
router.put("/user/update-profile-picture", isAuthenticated, userController.updateProfilePicture);

module.exports = router;