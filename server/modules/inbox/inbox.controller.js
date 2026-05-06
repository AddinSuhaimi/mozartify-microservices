const inboxService = require("./inbox.service");

exports.replyToFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { replyMessage } = req.body;

    if (!replyMessage) {
      return res.status(400).json({
        error: "Reply message is required",
      });
    }

    const updatedFeedback =
      await inboxService.replyToFeedback(
        id,
        replyMessage
      );

    res.status(200).json(updatedFeedback);
  } catch (error) {
    console.error("Error adding reply:", error);

    if (error.message === "Feedback not found") {
      return res.status(404).json({
        error: "Feedback not found",
      });
    }

    res.status(500).json({
      error: "Failed to add reply",
    });
  }
};

exports.getPendingFeedbacks = async (req, res) => {
  try {
    const result = await inboxService.getPendingFeedbacks();
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    res.status(500).json({ error: "Failed to fetch feedbacks" });
  }
};