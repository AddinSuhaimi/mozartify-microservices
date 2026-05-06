console.log("✅ Payment routes loaded");
const router = require("express").Router();
const paymentController = require("./payment.controller");
const { isAuthenticated } = require("../auth/middleware/auth.middleware");
const bodyParser = require("body-parser");

router.get("/user-purchases", isAuthenticated, paymentController.getUserPurchases);
router.get("/user-artwork-purchases", isAuthenticated, paymentController.getUserArtworkPurchases);
router.post("/submit-rating-music", isAuthenticated, paymentController.submitMusicRating);
router.post("/submit-rating-artwork", isAuthenticated, paymentController.submitArtworkRating);
router.post("/webhook", bodyParser.raw({ type: "application/json" }), paymentController.handleWebhook);
router.post("/create-checkout-session-music", paymentController.createMusicCheckoutSession);
router.post("/create-checkout-session-artwork", paymentController.createArtworkCheckoutSession);
router.post("/complete-purchase-music", isAuthenticated, paymentController.completePurchaseMusic);
router.post("/complete-purchase-artwork", isAuthenticated, paymentController.completePurchaseArtwork);

module.exports = router;