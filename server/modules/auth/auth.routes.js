console.log("✅ Auth routes loaded");
const router = require("express").Router();
const authController = require("./auth.controller");
const { isAuthenticated } = require("./middleware/auth.middleware");

router.post("/signup", authController.signup);
router.get("/verify-email", authController.verifyEmail);
router.get("/login", authController.getLoginSession);
router.post("/login", authController.login);
router.get("/logout", authController.logout);
router.get("/current-user", isAuthenticated, authController.getCurrentUser);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.get("/clear-session", authController.clearSession);

module.exports = router;