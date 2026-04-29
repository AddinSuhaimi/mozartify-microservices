const artsService = require("./arts.service");

exports.getArtworkRefineSearch = async (req, res) => {
  try {
    const data = await artsService.getArtworkRefineSearch();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching artwork refine search:", error);
    res.status(500).json({ error: "Failed to fetch artwork filters." });
  }
};

exports.searchArtwork = async (req, res) => {
  try {
    const results = await artsService.searchArtwork(req.body);
    res.status(200).json(results);
  } catch (err) {
    console.error("Artwork search error:", err);
    res.status(500).json({ error: "Failed to search artworks" });
  }
};

exports.checkArtworkPurchase = async (req, res) => {
  try {
    const { artwork_id, user_id } = req.body;
    const result = await artsService.checkArtworkPurchase({ artwork_id, user_id });
    return res.json({ success: true, ...result });
  } catch (error) {
    console.error("Error checking artwork purchase:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.getUserArtworkCart = async (req, res) => {
  try {
    const userId = req.session.userId;

    const cartItems = await artsService.getUserArtworkCart(userId);

    res.status(200).json(cartItems);
  } catch (error) {
    console.error("Error fetching artwork cart:", error.message);
    res.status(500).json({ error: "Failed to fetch artwork cart" });
  }
};