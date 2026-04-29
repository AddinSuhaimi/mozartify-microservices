const musicService = require("./music.service");

exports.getMusicRefineSearch = async (req, res) => {
  try {
    const data = await musicService.getMusicRefineSearch();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching music refine search:", error);
    res.status(500).json({ error: "Failed to fetch refine search data." });
  }
};

exports.searchMusic = async (req, res) => {
  try {
    const results = await musicService.searchMusic(req.body, req.query);
    res.status(200).json(results);
  } catch (err) {
    console.error("Search music error:", err);
    res.status(500).json({ error: "Failed to search music" });
  }
};

exports.checkPurchase = async (req, res) => {
  try {
    const { score_id, user_id } = req.body;
    const result = await musicService.checkPurchase({ score_id, user_id });
    return res.json({ success: true, ...result });
  } catch (error) {
    console.error("Error checking purchase:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};