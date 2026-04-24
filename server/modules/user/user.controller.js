const userService = require("./user.service");

exports.getMusicPreferencesOptions = async (req, res) => {
  try {
    const data = await userService.getMusicPreferencesOptions();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching preferences:", error);
    res.status(500).json({ error: "Failed to fetch preferences." });
  }
};

exports.getArtPreferencesOptions = async (req, res) => {
    try {
        const data = await userService.getArtPreferencesOptions();
        res.status(200).json(data);
    } catch (error) {
        console.error("Error fetching preferences:", error);
        res.status(500).json({ error: "Failed to fetch preferences." });
    }
};

exports.updateMusicPreferences = async (req, res) => {
    try {
        const userId = req.session.userId;
        const preferences = req.body;
        const updatedUser = await userService.updateMusicPreferences(userId, preferences);
        res.status(200).json({ message: "Preferences updated successfully", user: updatedUser });
    }
    catch (err) {
        console.error("Error updating preferences:", err.message);

        if (err.message === "Invalid user ID") {
        return res.status(400).json({ error: err.message });
        }

        if (err.message.includes("not found")) {
        return res.status(404).json({ error: err.message });
        }

        res.status(500).json({ error: "Failed to update preferences" });
    }
};

exports.updateArtPreferences = async (req, res) => {
    try {
        const userId = req.session.userId;
        const preferences = req.body;
        const updatedUser = await userService.updateArtPreferences(userId, preferences);
        res.status(200).json({ message: "Preferences updated successfully", user: updatedUser });
    } catch (err) {
        console.error("Error updating art preferences:", err.message);

        if (err.message === "Invalid user ID") {
            return res.status(400).json({ error: err.message });
        }

        if (err.message.includes("not found")) {
            return res.status(404).json({ error: err.message });
        }

        res.status(500).json({ error: "Failed to update art preferences" });
    }
};

exports.getUserCart = async (req, res) => {
  try {
    const userId = req.session.userId;

    const cartItems = await userService.getUserCart(userId);

    res.status(200).json(cartItems);
  } catch (error) {
    console.error("Error fetching cart items:", error);
    res.status(500).json({
      error: "Error fetching cart items for the user.",
    });
  }
};