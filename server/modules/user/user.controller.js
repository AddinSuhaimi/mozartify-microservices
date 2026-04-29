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

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.session.userId;

    await userService.deleteUser(userId);

    res.status(200).json({
      message: "Account deleted successfully",
    });
  } catch (err) {
    console.error("Delete user error:", err.message);

    if (err.message === "User not found") {
      return res.status(404).json({ message: err.message });
    }

    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

exports.updateUsername = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { username } = req.body;

    const updatedUser = await userService.updateUsername(userId, username);

    res.status(200).json({
      message: "Username updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Update username error:", err.message);

    if (err.message === "User not found") {
      return res.status(404).json({ message: err.message });
    }

    if (err.message === "Username already taken") {
      return res.status(400).json({ message: err.message });
    }

    res.status(500).json({ message: "Server error", error: err.message });
  }
};


exports.changePassword = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { currentPassword, newPassword } = req.body;

    await userService.changePassword(userId, currentPassword, newPassword);

    res.status(200).json({
      message: "Password updated successfully",
    });
  } catch (err) {
    console.error("Change password error:", err.message);

    if (
      err.message === "User not found" ||
      err.message === "Current password is incorrect"
    ) {
      return res.status(400).json({ message: err.message });
    }

    if (err.message === "Invalid password format") {
      return res.status(400).json({ message: err.message });
    }

    res.status(500).json({ message: "Server error", error: err.message });
  }
};


exports.updateProfilePicture = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { profile_picture_url } = req.body;

    const updatedUser = await userService.updateProfilePicture(
      userId,
      profile_picture_url
    );

    res.status(200).json({
      message: "Profile picture updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Update profile picture error:", err.message);

    if (err.message === "User not found") {
      return res.status(404).json({ message: err.message });
    }

    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getUserLibrary = async (req, res) => {
  try {
    const userId = req.session.userId;

    const library = await userService.getUserLibrary(userId);
    res.status(200).json(library);
  } catch (error) {
    console.error("Error fetching user library:", error);
    res.status(500).json({ error: "Failed to fetch user library" });
  }
};

exports.getUserArtworkLibrary = async (req, res) => {
  try {
    const userId = req.session.userId;

    const library = await userService.getUserArtworkLibrary(userId);
    res.status(200).json(library);
  } catch (error) {
    console.error("Error fetching user artwork library:", error);
    res.status(500).json({ error: "Failed to fetch user artwork library" });
  }
};