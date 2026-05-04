console.log("✅ Payment routes loaded");
const router = require("express").Router();
const paymentController = require("./payment.controller");
const { isAuthenticated } = require("../auth/middleware/auth.middleware");

router.get("/user-purchases", isAuthenticated, paymentController.getUserPurchases);
router.get("/user-artwork-purchases", isAuthenticated, paymentController.getUserArtworkPurchases);
router.post("/submit-rating-music", isAuthenticated, paymentController.submitMusicRating);
router.post("/submit-rating-artwork", isAuthenticated, paymentController.submitArtworkRating);

module.exports = router;