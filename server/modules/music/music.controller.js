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

exports.getUserMusicCart = async (req, res) => {
  try {
    const userId = req.session.userId;

    const cartItems = await musicService.getUserMusicCart(userId);

    res.status(200).json(cartItems);
  } catch (error) {
    console.error("Error fetching music cart:", error.message);
    res.status(500).json({ error: "Failed to fetch music cart" });
  }
};

exports.getMusicScoreById = async (req, res) => {
  try {
    const { id } = req.params;
    const musicScore = await musicService.getMusicScoreById(id);
    res.status(200).json(musicScore);
  } catch (error) {
    console.error("Error fetching music score:", error);
    if (error.message === "Music score not found") {
      return res.status(404).json({ message: "Music score not found" });
    }
    res.status(500).json({ error: "Error fetching music score." });
  }
};

exports.getMusicScoresByIds = async (req, res) => {
  try {
    const { scoreIds } = req.query;

    if (!scoreIds) {
      return res.status(400).json({ message: "No score IDs provided" });
    }

    let scoreIdArray;

    if (Array.isArray(scoreIds)) {
      scoreIdArray = scoreIds;
    } else if (typeof scoreIds === "string") {
      scoreIdArray = scoreIds.split(",");
    } else {
      return res.status(400).json({ message: "Invalid score IDs format" });
    }

    const musicScores = await musicService.getMusicScoresByIds(scoreIdArray);
    res.status(200).json(musicScores);
  } catch (error) {
    console.error("Error fetching music scores:", error);
    if (error.message === "No music scores found") {
      return res.status(404).json({ message: "No music scores found" });
    }
    res.status(500).json({ error: "Error fetching music scores." });
  }
};

exports.getPopularMusicScores = async (req, res) => {
  try {
    const popularScores = await musicService.getPopularMusicScores();
    res.status(200).json(popularScores);
  } catch (error) {
    console.error("Error fetching popular music scores:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getUserLikedMusicScores = async (req, res) => {
  try {
    const userId = req.session.userId;
    const likedScores = await musicService.getUserLikedMusicScores(userId);
    res.status(200).json(likedScores);
  } catch (error) {
    console.error("Error fetching liked music scores:", error);
    if (error.message === "No liked scores found") {
      return res.status(404).json({ message: "No liked scores found" });
    }
    res.status(500).json({ message: "Error fetching liked music scores." });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { musicScoreId } = req.body;

    await musicService.addToCart(userId, musicScoreId);

    res.status(200).json({ message: "Score added to cart" });
  } catch (error) {
    console.error("Error updating music cart:", error.message);
    res.status(500).json({ error: "Failed to update music cart" });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.session.userId;
    const scoreId = req.params.id;

    const updatedCart = await musicService.removeFromCart(userId, scoreId);

    res.status(200).json(updatedCart);
  } catch (error) {
    console.error("Error removing score from cart:", error.message);

    if (error.message === "Cart not found") {
      return res.status(404).json({ message: "No cart found for the user." });
    }

    res.status(500).json({ error: "Failed to remove item from cart" });
  }
};

exports.setFavoritesMusic = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { musicScoreId, action } = req.body;

    const result = await musicService.setFavoritesMusic(userId, musicScoreId, action);

    res.status(200).json(result);
  } catch (error) {
    console.error("Error setting music favorite:", error.message);

    if (error.message === "Invalid musicScoreId format") {
      return res.status(400).json({ message: "Invalid musicScoreId format" });
    }

    if (error.message === "User not found") {
      return res.status(404).json({ message: "User not found" });
    }

    if (error.message === "Invalid action specified") {
      return res.status(400).json({ message: "Invalid action specified" });
    }

    res.status(500).json({ message: "Server error", error: error.message });
  }
};