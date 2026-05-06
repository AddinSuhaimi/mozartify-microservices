const analyticsService = require("./analytics.service");

exports.getSystemStats = async (req, res) => {
  try {
    const stats =
      await analyticsService.getSystemStats();

    res.json(stats);
  } catch (error) {
    console.error(
      "Error fetching analytics stats:",
      error
    );

    res.status(500).json({
      error: "Failed to fetch stats",
    });
  }
};