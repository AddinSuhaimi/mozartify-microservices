const router = require("express").Router();
const controller = require("./notification.controller");

router.post("/send-verification-email", controller.sendVerificationEmail);
router.post("/send-admin-approval-email", controller.sendAdminApprovalEmail);

module.exports = router;