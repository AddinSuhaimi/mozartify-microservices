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

exports.uploadMusicFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }
    const result = await musicService.processMusicUpload(req.file);
    res.json(result);
  } catch (error) {
    console.error(
      "Error uploading music file:",
      error
    );
    res.status(500).json({message: error.message});
  }
};

// ABC File Management Controllers
exports.getABCFiles = async (req, res) => {
  try {
    const { sortOrder = "desc", sortBy = "_id" } = req.query;
    const abcFiles = await musicService.getABCFiles(sortOrder, sortBy);
    res.status(200).json(abcFiles);
  } catch (err) {
    console.error("Error fetching ABC files:", err);
    res.status(500).json({ message: "Error fetching files", error: err.message });
  }
};

exports.getABCFileByIdentifier = async (req, res) => {
  try {
    const { identifier } = req.params;
    const abcFile = await musicService.getABCFileByIdentifier(identifier);
    res.status(200).json(abcFile);
  } catch (err) {
    console.error("Error fetching ABC file:", err);
    if (err.message === "File not found") {
      return res.status(404).json({ message: "File not found" });
    }
    res.status(500).json({ message: "Error fetching file", error: err.message });
  }
};

exports.updateABCFileContent = async (req, res) => {
  try {
    const { filename } = req.params;
    const { content } = req.body;
    const abcFile = await musicService.updateABCFileContent(filename, content);
    res.status(200).json({ message: "ABC content updated successfully", abcFile });
  } catch (err) {
    console.error("Error updating ABC content:", err);
    if (err.message === "File not found") {
      return res.status(404).json({ message: "File not found" });
    }
    res.status(500).json({ message: "Error updating ABC content", error: err.message });
  }
};

exports.getCatalogByFilename = async (req, res) => {
  try {
    const { fileName } = req.params;
    const catalogData = await musicService.getCatalogByFilename(fileName);
    res.status(200).json(catalogData);
  } catch (err) {
    console.error("Error fetching catalog data:", err);
    if (err.message === "File not found") {
      return res.status(404).json({ message: "File not found" });
    }
    res.status(500).json({ message: "Error fetching catalog data", error: err.message });
  }
};

exports.saveCatalogMetadata = async (req, res) => {
  try {
    const { filename } = req.body;
    const abcFile = await musicService.saveCatalogMetadata(filename, req.body);
    res.status(200).json({ message: "Metadata saved successfully" });
  } catch (err) {
    console.error("Error saving catalog metadata:", err);
    if (err.message === "Filename is required") {
      return res.status(400).json({ message: "Filename is required" });
    }
    if (err.message === "File not found") {
      return res.status(404).json({ message: "File not found" });
    }
    res.status(500).json({ message: "Error saving metadata", error: err.message });
  }
};

exports.deleteAndTransferABCFile = async (req, res) => {
  try {
    const { filename } = req.body;
    const deletedFile = await musicService.deleteAndTransferABCFile(filename);
    res.status(200).json({
      message: "File successfully transferred to deleted collection",
      deletedFile,
    });
  } catch (err) {
    console.error("Error in delete and transfer:", err);
    if (err.message === "File not found") {
      return res.status(404).json({ message: "File not found" });
    }
    res.status(500).json({
      message: "Error transferring file to deleted collection",
      error: err.message,
    });
  }
};

exports.uploadCoverImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message:
          "No file uploaded",
      });
    }
    const fileUrl = await musicService.uploadCoverImage(req.file);

    res.status(200).json({
      message: "Cover image uploaded successfully",
      fileUrl,
    });

  } catch (err) {
    console.error("Error uploading cover image:", err);
    res.status(500).json({
      message: "Failed to upload cover image",
      error: err.message,
    });
  }
};

exports.uploadMp3 = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message:
          "No file uploaded",
      });
    }
    const fileUrl = await musicService.uploadMp3(req.file);

    res.status(200).json({
      message: "MP3 uploaded successfully",
      fileUrl,
    });

  } catch (err) {
    console.error(
      "Error uploading MP3:",
      err
    );
    res.status(500).json({
      message: "Failed to upload MP3",
      error: err.message,
    });
  }
};

// ========== MUSIC DYNAMIC FIELD CONTROLLERS ==========

exports.getMusicDynamicFields = async (req, res) => {
  try {
    const { showInactive } = req.query;
    const fields = await musicService.getMusicDynamicFields(showInactive === 'true');
    res.status(200).json(fields);
  } catch (err) {
    console.error("Error fetching music dynamic fields:", err);
    res.status(500).json({
      message: "Error fetching music dynamic fields",
      error: err.message,
    });
  }
};

exports.getMusicDynamicFieldById = async (req, res) => {
  try {
    const field = await musicService.getMusicDynamicFieldById(req.params.id);
    res.status(200).json(field);
  } catch (err) {
    console.error("Error fetching dynamic field:", err);
    if (err.message === "Dynamic field not found") {
      return res.status(404).json({ message: "Dynamic field not found" });
    }
    res.status(500).json({ message: "Error fetching dynamic field", error: err.message });
  }
};

exports.createMusicDynamicField = async (req, res) => {
  try {
    const newField = await musicService.createMusicDynamicField(req.body);
    res.status(201).json(newField);
  } catch (err) {
    console.error("Error creating dynamic field:", err);
    res.status(500).json({ message: "Error creating dynamic field", error: err.message });
  }
};

exports.updateMusicDynamicField = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedField = await musicService.updateMusicDynamicField(id, req.body);
    res.status(200).json(updatedField);
  } catch (err) {
    console.error("Error updating dynamic field:", err);
    if (err.message === "Dynamic field not found") {
      return res.status(404).json({ message: "Dynamic field not found" });
    }
    res.status(500).json({ message: "Error updating dynamic field", error: err.message });
  }
};

exports.deactivateMusicDynamicField = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await musicService.deactivateMusicDynamicField(id);
    res.status(200).json(result);
  } catch (err) {
    console.error("Error deactivating dynamic field:", err);
    if (err.message === "Dynamic field not found") {
      return res.status(404).json({ message: "Dynamic field not found" });
    }
    res.status(500).json({
      message: "Error deactivating dynamic field",
      error: err.message,
    });
  }
};

exports.getMusicDynamicFieldsByTabId = async (req, res) => {
  try {
    const { tabId } = req.params;
    const fields = await musicService.getMusicDynamicFieldsByTabId(tabId);
    res.status(200).json(fields);
  } catch (err) {
    console.error("Error fetching fields by tab:", err);
    res.status(500).json({
      message: "Error fetching fields by tab",
      error: err.message,
    });
  }
};

// ========== MUSIC TAB CONTROLLERS ==========

exports.getAllMusicTabs = async (req, res) => {
  try {
    const tabs = await musicService.getAllMusicTabs();
    res.status(200).json(tabs);
  } catch (err) {
    console.error("Error fetching music tabs:", err);
    res.status(500).json({
      message: "Error fetching music tabs",
      error: err.message,
    });
  }
};

exports.getMusicTabById = async (req, res) => {
  try {
    const { id } = req.params;
    const tab = await musicService.getMusicTabById(id);
    res.status(200).json(tab);
  } catch (err) {
    console.error("Error fetching tab:", err);
    if (err.message === "Tab not found") {
      return res.status(404).json({ message: "Tab not found" });
    }
    res.status(500).json({ message: "Error fetching tab", error: err.message });
  }
};

exports.createMusicTab = async (req, res) => {
  try {
    const newTab = await musicService.createMusicTab(req.body);
    res.status(201).json(newTab);
  } catch (err) {
    console.error("Error creating tab:", err);
    res.status(500).json({ message: "Error creating tab", error: err.message });
  }
};

exports.updateMusicTab = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedTab = await musicService.updateMusicTab(id, req.body);
    res.status(200).json(updatedTab);
  } catch (err) {
    console.error("Error updating tab:", err);
    if (err.message === "Tab not found") {
      return res.status(404).json({ message: "Tab not found" });
    }
    res.status(500).json({ message: "Error updating tab", error: err.message });
  }
};

exports.deleteMusicTab = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await musicService.deleteMusicTab(id);
    res.status(200).json(result);
  } catch (err) {
    console.error("Error deleting tab:", err);
    if (err.message.includes("Cannot delete tab with fields")) {
      return res.status(400).json({ message: err.message });
    }
    if (err.message === "Tab not found") {
      return res.status(404).json({ message: "Tab not found" });
    }
    res.status(500).json({ message: "Error deleting tab", error: err.message });
  }
};

exports.reorderMusicTabs = async (req, res) => {
  try {
    const { tabs } = req.body;
    const updatedTabs = await musicService.reorderMusicTabs(tabs);
    res.status(200).json(updatedTabs);
  } catch (err) {
    console.error("Error reordering tabs:", err);
    if (err.message.includes("Invalid request format")) {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: "Error reordering tabs", error: err.message });
  }
};

exports.initializeDefaultMusicTabs = async (req, res) => {
  try {
    const result = await musicService.initializeDefaultMusicTabs();
    res.status(201).json(result);
  } catch (err) {
    console.error("Error initializing tabs:", err);
    if (err.message === "Tabs are already initialized") {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: "Error initializing tabs", error: err.message });
  }
};