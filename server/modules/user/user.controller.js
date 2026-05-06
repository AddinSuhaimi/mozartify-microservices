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

exports.getUserComposedScores = async (req, res) => {
  try {
    const userId = req.session.userId;

    const composedScores = await userService.getUserComposedScores(userId);
    res.status(200).json(composedScores);
  } catch (error) {
    console.error("Error fetching composed scores:", error);

    if (error.message === "No composed scores found") {
      return res.status(404).json({ message: "No composed scores found" });
    }

    res.status(500).json({ error: "Failed to fetch composed scores" });
  }
};

// ========== ADMIN USER MANAGEMENT ==========

exports.getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);

    if (error.message === "User not found") {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(500).json({ error: "Failed to fetch user" });
  }
};

exports.createUser = async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    console.error("Error creating user:", error.message);

    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern).join(", ");
      return res.status(400).json({
        error: `Duplicate entry for ${duplicateField}. A user with this ${duplicateField} already exists.`,
      });
    }

    if (error.message.includes("already exists")) {
      return res.status(400).json({ error: error.message });
    }

    if (error.message === "All fields are required") {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: "Failed to create user" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    res.json(user);
  } catch (error) {
    console.error("Error updating user:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        error: "Duplicate entry. A user with this email or username already exists.",
      });
    }

    if (error.message === "User not found") {
      return res.status(404).json({ error: "User not found" });
    }

    if (error.message.includes("required")) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: "Failed to update user" });
  }
};

exports.updateApprovalStatus = async (req, res) => {
  try {
    const { approval } = req.body;
    const user = await userService.updateApprovalStatus(req.params.id, approval);
    res.json(user);
  } catch (error) {
    console.error("Error updating approval status:", error);

    if (error.message === "User not found") {
      return res.status(404).json({ error: "User not found" });
    }

    if (error.message === "Invalid approval status") {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: "Failed to update approval status" });
  }
};

exports.deleteUserAdmin = async (req, res) => {
  try {
    const result = await userService.deleteUserAdmin(req.params.id);
    res.json(result);
  } catch (error) {
    console.error("Error deleting user:", error);

    if (error.message === "User not found") {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(500).json({ error: "Failed to delete user" });
  }
};

exports.addToDeletedUsers = async (req, res) => {
  try {
    const deletedUser = await userService.addToDeletedUsers(req.body);
    res.status(201).json(deletedUser);
  } catch (error) {
    console.error("Error adding to deletedusers:", error);

    if (error.message.includes("required")) {
      return res.status(400).json({ error: error.message });
    }

    if (error.message.includes("already exists")) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: "Failed to add user to deletedusers" });
  }
};