const inboxService = require("./inbox.service");

exports.getPendingFeedbacks = async (req, res) => {
  try {
    const result = await inboxService.getPendingFeedbacks();
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    res.status(500).json({ error: "Failed to fetch feedbacks" });
  }
};

// ================= MUSIC FEEDBACK =================

exports.createMusicFeedback = async (req, res) => {
  try {
    const savedFeedback =
      await inboxService.createMusicFeedback(
        req.body
      );

    res.status(201).json(savedFeedback);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

exports.getMusicFeedbacks = async (req, res) => {
  try {
    const { userId } = req.query;

    const feedbacks =
      await inboxService.getMusicFeedbacks(
        userId
      );

    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error,
    });
  }
};

// ================= ARTWORK FEEDBACK =================

exports.createArtworkFeedback = async (req, res) => {
  try {
    const savedFeedback =
      await inboxService.createArtworkFeedback(
        req.body
      );

    res.status(201).json(savedFeedback);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

exports.getArtworkFeedbacks = async (req, res) => {
  try {
    const { userId } = req.query;

    const feedbacks =
      await inboxService.getArtworkFeedbacks(
        userId
      );

    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error,
    });
  }
};

exports.deleteMusicFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    await inboxService.deleteMusicFeedback(
      id
    );

    res.status(200).json({
      message:
        "Feedback deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

exports.deleteArtworkFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    await inboxService.deleteArtworkFeedback(
      id
    );

    res.status(200).json({
      message:
        "Feedback deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

exports.replyToMusicFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, sender } =
      req.body;

    if (!message) {
      return res.status(400).json({
        message: "Message is required",
      });
    }

    const updatedFeedback =
      await inboxService.replyToMusicFeedback(
        id,
        message,
        sender
      );

    res.status(200).json(
      updatedFeedback
    );
  } catch (error) {
    console.error(
      "Error replying to music feedback:",
      error
    );

    res.status(400).json({
      message: error.message,
    });
  }
};

exports.replyToArtworkFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, sender } =
      req.body;

    if (!message) {
      return res.status(400).json({
        message: "Message is required",
      });
    }

    const updatedFeedback =
      await inboxService.replyToArtworkFeedback(
        id,
        message,
        sender
      );

    res.status(200).json(
      updatedFeedback
    );
  } catch (error) {
    console.error(
      "Error replying to artwork feedback:",
      error
    );

    res.status(400).json({
      message: error.message,
    });
  }
};

// ================= STATUS =================

exports.updateMusicFeedbackStatus = async (req, res) => {
  try {
    const updatedFeedback =
      await inboxService.updateMusicFeedbackStatus(
        req.params.id,
        req.body.status
      );

    res.status(200).json(updatedFeedback);
  } catch (error) {
    console.error("Error updating feedback status:", error);

    res.status(400).json({
      message: error.message,
    });
  }
};

exports.updateArtworkFeedbackStatus = async (req, res) => {
  try {
    const updatedFeedback =
      await inboxService.updateArtworkFeedbackStatus(
        req.params.id,
        req.body.status
      );

    res.status(200).json(updatedFeedback);
  } catch (error) {
    console.error("Error updating feedback status:", error);

    res.status(400).json({
      message: error.message,
    });
  }
};

// ================= READ STATUS =================

exports.markMusicFeedbackReadByCustomer = async (req, res) => {
  try {
    const result =
      await inboxService.markMusicFeedbackReadByCustomer(
        req.params.id
      );

    res.json(result);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error,
    });
  }
};

exports.markArtworkFeedbackReadByCustomer = async (req, res) => {
  try {
    const result =
      await inboxService.markArtworkFeedbackReadByCustomer(
        req.params.id
      );

    res.json(result);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error,
    });
  }
};

exports.markMusicFeedbackReadByAdmin = async (req, res) => {
  try {
    const result =
      await inboxService.markMusicFeedbackReadByAdmin(
        req.params.id
      );

    res.json(result);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error,
    });
  }
};

exports.markArtworkFeedbackReadByAdmin = async (req, res) => {
  try {
    const result =
      await inboxService.markArtworkFeedbackReadByAdmin(
        req.params.id
      );

    res.json(result);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error,
    });
  }
};