const paymentService = require("./payment.service");
const stripe = require("../../config/stripe");

exports.getUserPurchases = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const purchases = await paymentService.getUserPurchases(userId);
    res.status(200).json(purchases);
  } catch (error) {
    console.error("Error fetching user purchases:", error);
    res.status(500).json({ error: "Failed to fetch purchases" });
  }
};

exports.getUserArtworkPurchases = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const purchases = await paymentService.getUserArtworkPurchases(userId);
    res.status(200).json(purchases);
  } catch (error) {
    console.error("Error fetching user artwork purchases:", error);
    res.status(500).json({ error: "Failed to fetch artwork purchases" });
  }
};

exports.submitMusicRating = async (req, res) => {
  try {
    const { rating, scoreId } = req.body;
    const userId = req.session.userId;

    await paymentService.submitMusicRating(userId, scoreId, rating);

    res.status(200).json({
      success: true,
      message: "Rating submitted!",
    });
  } catch (error) {
    console.error("Error submitting music rating:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.submitArtworkRating = async (req, res) => {
  try {
    const { rating, artworkId } = req.body;
    const userId = req.session.userId;

    await paymentService.submitArtworkRating(userId, artworkId, rating);

    res.status(200).json({
      success: true,
      message: "Rating submitted!",
    });
  } catch (error) {
    console.error("Error submitting artwork rating:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(
      `Webhook Error: ${err.message}`
    );
  }

  console.log("Stripe event received:", event.type);

  res.json({ received: true });
};

exports.createMusicCheckoutSession = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { cartItems } = req.body;

    const paymentSession =
      await paymentService.createMusicCheckoutSession(
        userId,
        cartItems
      );

    res.json({ id: paymentSession.id });
  } catch (error) {
    console.error("Checkout session error:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
};

exports.createArtworkCheckoutSession = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { cartItems } = req.body;

    const paymentSession =
      await paymentService.createArtworkCheckoutSession(
        userId,
        cartItems
      );

    res.json({ id: paymentSession.id });
  } catch (error) {
    console.error("Artwork checkout session error:", error);
    res.status(500).json({
      error: "Failed to create artwork checkout session",
    });
  }
};

exports.completePurchaseMusic = async (req, res) => {
  try {
    const userId = req.session.userId;

    const result = await paymentService.completePurchaseMusic(userId);
    res.json(result);
  } catch (error) {
    console.error("Error completing music purchase:", error);
    res.status(500).json({ message: "Failed to complete purchase" });
  }
};

exports.completePurchaseArtwork = async (req, res) => {
  try {
    const userId = req.session.userId;

    const result = await paymentService.completePurchaseArtwork(userId);
    res.json(result);
  } catch (error) {
    console.error("Error completing artwork purchase:", error);
    res.status(500).json({ message: "Failed to complete purchase" });
  }
};