const authService = require("./auth.service");

exports.signup = async (req, res) => {
  try {
    const result = await authService.signup(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const result = await authService.verifyEmail(req.query.token);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getLoginSession = async (req, res) => {
  try {
    const result = await authService.getLoginSession(req.session);
    res.json(result);
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const result = await authService.login(req.body, req.session);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.logout = async (req, res) => {
  try {
    const result = await authService.logout(req.session);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {    
    const userId = req.session.userId;
    const user = await authService.getCurrentUser(userId);
    res.status(200).json(user);
  } catch (err) {
    console.error("Error fetching current user:", err.message);

    if (err.message === "User not found") {
      return res.status(404).json({ error: err.message });
    }

    res.status(500).json({ error: "Server error" });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    await authService.forgotPassword(email);

    res.status(200).json({
      message: "Password reset link sent to your email",
    });
  } catch (err) {
    console.error("Forgot password error:", err.message);

    if (err.message === "Invalid email format") {
      return res.status(400).json({ message: err.message });
    }

    if (err.message === "Email not found") {
      return res.status(400).json({ message: err.message });
    }

    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    await authService.resetPassword(token, newPassword);

    res.status(200).json({
      message: "Password reset successfully",
    });
  } catch (err) {
    console.error("Reset password error:", err.message);

    if (
      err.message === "Invalid or expired token" ||
      err.message === "Token has expired" ||
      err.message === "Invalid token"
    ) {
      return res.status(400).json({ message: err.message });
    }

    if (err.message === "Invalid password format") {
      return res.status(400).json({ message: err.message });
    }

    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};