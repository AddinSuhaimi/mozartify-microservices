const router = require("express").Router();
const controller = require("./notification.controller");

router.post("/send-verification-email", controller.sendVerificationEmail);

module.exports = router;