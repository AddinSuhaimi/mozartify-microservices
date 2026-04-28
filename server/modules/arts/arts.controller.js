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