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

exports.getArtworkById = async (req, res) => {
  try {
    const { id } = req.params;
    const artwork = await artsService.getArtworkById(id);
    res.status(200).json(artwork);
  } catch (error) {
    console.error("Error fetching artwork:", error);
    if (error.message === "Artwork not found") {
      return res.status(404).json({ message: "Artwork not found" });
    }
    res.status(500).json({ error: "Error fetching artwork." });
  }
};

exports.getArtworksByIds = async (req, res) => {
  try {
    const { artworkIds } = req.query;

    if (!artworkIds) {
      return res.status(400).json({ message: "No artwork IDs provided" });
    }

    let artworkIdArray;

    if (Array.isArray(artworkIds)) {
      artworkIdArray = artworkIds;
    } else if (typeof artworkIds === "string") {
      artworkIdArray = artworkIds.split(",");
    } else {
      return res.status(400).json({ message: "Invalid artwork IDs format" });
    }

    const artworks = await artsService.getArtworksByIds(artworkIdArray);
    res.status(200).json(artworks);
  } catch (error) {
    console.error("Error fetching artworks:", error);
    if (error.message === "No artworks found") {
      return res.status(404).json({ message: "No artworks found" });
    }
    res.status(500).json({ error: "Error fetching artworks." });
  }
};

exports.getPopularArtworks = async (req, res) => {
  try {
    const popularArtworks = await artsService.getPopularArtworks();
    res.status(200).json(popularArtworks);
  } catch (error) {
    console.error("Error fetching popular artworks:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getUserLikedArtworks = async (req, res) => {
  try {
    const userId = req.session.userId;
    const likedArtworks = await artsService.getUserLikedArtworks(userId);
    res.status(200).json(likedArtworks);
  } catch (error) {
    console.error("Error fetching liked artworks:", error);
    if (error.message === "No liked artworks found") {
      return res.status(404).json({ message: "No liked artworks found" });
    }
    res.status(500).json({ message: "Error fetching liked artworks." });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { artworkId } = req.body;

    await artsService.addToCart(userId, artworkId);

    res.status(200).json({ message: "Artwork added to cart" });
  } catch (error) {
    console.error("Error updating artwork cart:", error.message);
    res.status(500).json({ error: "Failed to update artwork cart" });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.session.userId;
    const artworkId = req.params.id;

    const updatedCart = await artsService.removeFromCart(userId, artworkId);

    res.status(200).json(updatedCart);
  } catch (error) {
    console.error("Error removing artwork from cart:", error.message);

    if (error.message === "Cart not found") {
      return res.status(404).json({ message: "No cart found for the user." });
    }

    res.status(500).json({ error: "Failed to remove item from cart" });
  }
};

exports.setFavoritesArtwork = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { artworkId, action } = req.body;

    const result = await artsService.setFavoritesArtwork(userId, artworkId, action);

    res.status(200).json(result);
  } catch (error) {
    console.error("Error setting artwork favorite:", error.message);

    if (error.message === "Invalid artworkId format") {
      return res.status(400).json({ message: "Invalid artworkId format" });
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

// Artwork Catalog Controllers
exports.createOrUpdateArtwork = async (req, res) => {
  try {
    const artwork = await artsService.createOrUpdateArtwork(req.body);
    const statusCode = req.body._id ? 200 : 201;
    res.status(statusCode).json(artwork);
  } catch (err) {
    console.error("Error in /catalogArts:", err);
    if (err.message === "Artwork not found") {
      return res.status(404).json({ message: "Artwork not found" });
    }
    res.status(500).json({ message: "Error processing artwork", error: err.message });
  }
};

exports.getArtworkCatalogByIdentifier = async (req, res) => {
  try {
    const { id } = req.params;
    const artwork = await artsService.getArtworkCatalogByIdentifier(id);
    res.status(200).json(artwork);
  } catch (err) {
    console.error("Error fetching artwork:", err);
    if (err.message === "Artwork not found") {
      return res.status(404).json({ message: "Artwork not found" });
    }
    res.status(500).json({ message: "Error fetching artwork", error: err.message });
  }
};

exports.getAllArtworks = async (req, res) => {
  try {
    const artworks = await artsService.getAllArtworks();
    res.status(200).json(artworks);
  } catch (err) {
    console.error("Error fetching artworks:", err);
    res.status(500).json({ message: "Error fetching artworks", error: err.message });
  }
};

exports.deleteArtwork = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await artsService.deleteArtwork(id);
    res.status(200).json(result);
  } catch (err) {
    console.error("Error deleting artwork:", err);
    if (err.message === "Artwork not found") {
      return res.status(404).json({ message: "Artwork not found" });
    }
    res.status(500).json({ message: "Error deleting artwork", error: err.message });
  }
};

exports.getArtsDynamicFields = async (req, res) => {
  try {
    const fields =
      await artsService.getArtsDynamicFields();

    res.status(200).json(fields);
  } catch (err) {
    console.error(
      "Error fetching dynamic fields:",
      err
    );

    res.status(500).json({
      message:
        "Error fetching dynamic fields",
      error: err.message,
    });
  }
};

exports.getArtsDynamicFieldById = async (req, res) => {
  try {
    const field =
      await artsService.getArtsDynamicFieldById(
        req.params.id
      );

    res.status(200).json(field);
  } catch (err) {
    console.error(
      "Error fetching dynamic field:",
      err
    );

    if (
      err.message ===
      "Dynamic field not found"
    ) {
      return res.status(404).json({
        message:
          "Dynamic field not found",
      });
    }

    res.status(500).json({
      message:
        "Error fetching dynamic field",
      error: err.message,
    });
  }
};

exports.createArtsDynamicField = async (req, res) => {
  try {
    const field =
      await artsService.createArtsDynamicField(
        req.body
      );

    res.status(201).json(field);
  } catch (err) {
    console.error(
      "Error creating dynamic field:",
      err
    );

    res.status(500).json({
      message:
        "Error creating dynamic field",
      error: err.message,
    });
  }
};

exports.updateArtsDynamicField = async (req, res) => {
  try {
    const field =
      await artsService.updateArtsDynamicField(
        req.params.id,
        req.body
      );

    res.status(200).json(field);
  } catch (err) {
    console.error(
      "Error updating dynamic field:",
      err
    );

    if (
      err.message ===
      "Dynamic field not found"
    ) {
      return res.status(404).json({
        message:
          "Dynamic field not found",
      });
    }

    res.status(500).json({
      message:
        "Error updating dynamic field",
      error: err.message,
    });
  }
};

exports.deactivateArtsDynamicField = async (req, res) => {
  try {
    await artsService.deactivateArtsDynamicField(
      req.params.id
    );

    res.status(200).json({
      message:
        "Dynamic field deactivated successfully",
    });
  } catch (err) {
    console.error(
      "Error deactivating dynamic field:",
      err
    );

    if (
      err.message ===
      "Dynamic field not found"
    ) {
      return res.status(404).json({
        message:
          "Dynamic field not found",
      });
    }

    res.status(500).json({
      message:
        "Error deactivating dynamic field",
      error: err.message,
    });
  }
};

exports.getArtsDynamicFieldsByTab = async (req, res) => {
  try {
    const fields =
      await artsService.getArtsDynamicFieldsByTab();

    res.status(200).json(fields);
  } catch (err) {
    console.error(
      "Error fetching fields by tab:",
      err
    );

    res.status(500).json({
      message:
        "Error fetching fields by tab",
      error: err.message,
    });
  }
};