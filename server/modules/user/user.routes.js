console.log("✅ User routes loaded");
const router = require("express").Router();
const userController = require("./user.controller");
const { isAuthenticated } = require("../../shared/auth/auth.middleware");
const upload = require("../../shared/upload/upload.middleware");

router.get("/preferences-options", userController.getMusicPreferencesOptions);
router.get("/art-preferences-options", userController.getArtPreferencesOptions);
router.post("/preferences", isAuthenticated, userController.updateMusicPreferences);
router.post("/art-preferences", isAuthenticated, userController.updateArtPreferences);
router.get("/user-library", isAuthenticated, userController.getUserLibrary);
router.get("/user-artwork-library", isAuthenticated, userController.getUserArtworkLibrary);
router.get("/user-composed-scores", isAuthenticated, userController.getUserComposedScores);
router.delete("/user/delete", isAuthenticated, userController.deleteUser);
router.put("/user/update-username", isAuthenticated, userController.updateUsername);
router.put("/user/change-password", isAuthenticated, userController.changePassword);
router.post("/user/upload-profile-picture", upload.single("file"), userController.uploadProfilePicture);
router.put("/user/update-profile-picture", isAuthenticated, userController.updateProfilePicture);

// ========== ADMIN USER MANAGEMENT ROUTES ==========
router.get("/users", userController.getAllUsers);                       // Get all users
router.get("/users/:id", userController.getUserById);                   // Get user by ID
router.post("/users", userController.createUser);                       // Create new user
router.put("/users/:id", userController.updateUser);                    // Update user details
router.put("/users/:id/approval", userController.updateApprovalStatus); // Update user approval status
router.delete("/users/:id", userController.deleteUserAdmin);            // Delete user (admin)
router.post("/deletedusers", userController.addToDeletedUsers);         // Add user to deletedusers 

module.exports = router;