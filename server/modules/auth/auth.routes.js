const router = require("express").Router();
const authController = require("./auth.controller");

router.post("/signup", authController.signup);
router.get("/verify-email", authController.verifyEmail);
router.get("/login", authController.getLoginSession);
router.post("/login", authController.login);
router.get("/logout", authController.logout);

module.exports = router;