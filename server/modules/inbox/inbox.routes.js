const express = require("express");
const router = express.Router();

const inboxController = require("./inbox.controller");

router.get("/feedbacks", inboxController.getPendingFeedbacks);
router.post("/feedback/:id/reply", inboxController.replyToFeedback);

module.exports = router;