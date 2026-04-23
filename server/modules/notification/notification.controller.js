const notificationService = require("./notification.service");

exports.sendVerificationEmail = async (req, res) => {
  try {
    await notificationService.sendVerificationEmail(req.body);
    res.json({ message: "Email sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send email" });
  }
};