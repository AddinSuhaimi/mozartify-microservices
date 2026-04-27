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