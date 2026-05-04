const paymentService = require("./payment.service");

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