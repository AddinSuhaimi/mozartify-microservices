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