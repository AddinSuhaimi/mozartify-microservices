const Feedback = require("../../models/Feedback");
const Feedback2 = require("../../models/Feedback2");
const uploadService = require("../../shared/upload/upload.service");

exports.getPendingFeedbacks = async () => {
  const pendingFeedbacks = await Feedback.find({ status: "pending" });
  return {
    feedbacks: pendingFeedbacks,
    totalFeedbacks: pendingFeedbacks.length,
  };
};

// ================= MUSIC FEEDBACK =================

exports.createMusicFeedback = async (feedbackData) => {
  const {
    username,
    title,
    detail,
    user_id,
    attachment_url,
  } = feedbackData;

  const feedback = new Feedback({
    username,
    title,
    detail,
    attachment_url,
    user_id,
    status: "pending",
  });

  return await feedback.save();
};

exports.getMusicFeedbacks = async (userId) => {
  if (userId) {
    return await Feedback.find({
      user_id: userId,
    });
  }

  return await Feedback.find();
};

// ================= ARTWORK FEEDBACK =================

exports.createArtworkFeedback = async (feedbackData) => {
  const {
    username,
    title,
    detail,
    user_id,
    attachment_url,
  } = feedbackData;

  const feedback = new Feedback2({
    username,
    title,
    detail,
    attachment_url,
    user_id,
    status: "pending",
  });

  return await feedback.save();
};

exports.getArtworkFeedbacks = async (userId) => {
  if (userId) {
    return await Feedback2.find({
      user_id: userId,
    });
  }

  return await Feedback2.find();
};

exports.deleteMusicFeedback = async (feedbackId) => {
  await Feedback.findByIdAndDelete(
    feedbackId
  );
};

exports.deleteArtworkFeedback = async (feedbackId) => {
  await Feedback2.findByIdAndDelete(
    feedbackId
  );
};

exports.replyToMusicFeedback = async (feedbackId, message, sender) => {
  const updateFields = {
    $push: {
      replies: {
        message,
        date: new Date(),
        sender:
          sender || "customer",
      },
    },
  };

  if (sender === "customer") {
    updateFields.$set = {
      isReadAdmin: false,
    };
  } else if (sender === "admin") {
    updateFields.$set = {
      isReadCustomer: false,
    };
  }

  const updatedFeedback =
    await Feedback.findByIdAndUpdate(
      feedbackId,
      updateFields,
      {
        new: true,
        runValidators: true,
      }
    );

  if (!updatedFeedback) {
    throw new Error(
      "Feedback not found"
    );
  }

  return updatedFeedback;
};

exports.replyToArtworkFeedback = async (feedbackId, message, sender) => {
  const updateFields = {
    $push: {
      replies: {
        message,
        date: new Date(),
        sender:
          sender || "customer",
      },
    },
  };

  if (sender === "customer") {
    updateFields.$set = {
      isReadAdmin: false,
    };
  } else if (sender === "admin") {
    updateFields.$set = {
      isReadCustomer: false,
    };
  }

  const updatedFeedback =
    await Feedback2.findByIdAndUpdate(
      feedbackId,
      updateFields,
      {
        new: true,
        runValidators: true,
      }
    );

  if (!updatedFeedback) {
    throw new Error(
      "Feedback not found"
    );
  }

  return updatedFeedback;
};

// ================= STATUS =================

exports.updateMusicFeedbackStatus = async (feedbackId, status) => {
  if (!status || !["pending", "resolved"].includes(status)) {
    throw new Error("Invalid status");
  }

  const updatedFeedback = await Feedback.findByIdAndUpdate(
    feedbackId,
    { status },
    { new: true, runValidators: true }
  );

  if (!updatedFeedback) {
    throw new Error("Feedback not found");
  }

  return updatedFeedback;
};

exports.updateArtworkFeedbackStatus = async (feedbackId, status) => {
  if (!status || !["pending", "resolved"].includes(status)) {
    throw new Error("Invalid status");
  }

  const updatedFeedback = await Feedback2.findByIdAndUpdate(
    feedbackId,
    { status },
    { new: true, runValidators: true }
  );

  if (!updatedFeedback) {
    throw new Error("Feedback not found");
  }

  return updatedFeedback;
};

// ================= READ STATUS =================

exports.markMusicFeedbackReadByCustomer = async (feedbackId) => {
  await Feedback.findByIdAndUpdate(feedbackId, {
    isReadCustomer: true,
  });

  return {
    message: "Feedback marked as read by customer",
  };
};

exports.markArtworkFeedbackReadByCustomer = async (feedbackId) => {
  await Feedback2.findByIdAndUpdate(feedbackId, {
    isReadCustomer: true,
  });

  return {
    message: "Feedback marked as read by customer",
  };
};

exports.markMusicFeedbackReadByAdmin = async (feedbackId) => {
  await Feedback.findByIdAndUpdate(feedbackId, {
    isReadAdmin: true,
  });

  return {
    message: "Feedback marked as read by admin",
  };
};

exports.markArtworkFeedbackReadByAdmin = async (feedbackId) => {
  await Feedback2.findByIdAndUpdate(feedbackId, {
    isReadAdmin: true,
  });

  return {
    message: "Feedback marked as read by admin",
  };
};

exports.uploadFeedbackAttachment = async (file) => {
  const fileUrl =
    await uploadService.uploadFileToFirebase(
      file,
      "feedback_attachments"
    );

  return fileUrl;
};