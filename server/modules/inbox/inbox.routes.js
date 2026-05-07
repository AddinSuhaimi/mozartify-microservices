console.log("✅ Inbox routes loaded");
const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer();
const inboxController = require("./inbox.controller");

router.get("/admin/feedbacks", inboxController.getPendingFeedbacks);
router.post("/music-feedback", upload.none(), inboxController.createMusicFeedback);
router.get("/music-feedback", inboxController.getMusicFeedbacks);
router.post("/artwork-feedback", upload.none(), inboxController.createArtworkFeedback);
router.get("/artwork-feedback", inboxController.getArtworkFeedbacks);
router.delete("/music-feedback/:id", inboxController.deleteMusicFeedback);
router.delete("/artwork-feedback/:id", inboxController.deleteArtworkFeedback);
router.post("/music-feedback/reply/:id", inboxController.replyToMusicFeedback);
router.post("/artwork-feedback/reply/:id", inboxController.replyToArtworkFeedback);
router.patch("/music-feedback/status/:id", inboxController.updateMusicFeedbackStatus);
router.patch("/artwork-feedback/status/:id", inboxController.updateArtworkFeedbackStatus);
router.put("/music-feedback/:id/mark-read-customer", inboxController.markMusicFeedbackReadByCustomer);
router.put("/artwork-feedback/:id/mark-read-customer", inboxController.markArtworkFeedbackReadByCustomer);
router.put("/music-feedback/:id/mark-read-admin", inboxController.markMusicFeedbackReadByAdmin);
router.put("/artwork-feedback/:id/mark-read-admin", inboxController.markArtworkFeedbackReadByAdmin);

module.exports = router;