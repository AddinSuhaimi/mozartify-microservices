const Feedback = require("../../models/Feedback");

exports.replyToFeedback = async (
  feedbackId,
  replyMessage
) => {
  const updatedFeedback =
    await Feedback.findByIdAndUpdate(
      feedbackId,
      {
        replyMessage,
        replyDate: new Date(),
      },
      { new: true }
    );

  if (!updatedFeedback) {
    throw new Error("Feedback not found");
  }

  return updatedFeedback;
};

exports.getPendingFeedbacks = async () => {
  const pendingFeedbacks = await Feedback.find({ status: "pending" });
  return {
    feedbacks: pendingFeedbacks,
    totalFeedbacks: pendingFeedbacks.length,
  };
};