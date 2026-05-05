const recommendationService = require("./recommendation.service");

exports.getMusicRecommendations = async (req, res) => {
  try {
    const userId = req.session.userId;

    const data = await recommendationService.getMusicRecommendations(userId);

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to get recommendations" });
  }
};

exports.getArtworkRecommendations = async (req, res) => {
  try {
    const userId = req.session.userId;

    const data = await recommendationService.getArtworkRecommendations(userId);

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to get recommendations" });
  }
};