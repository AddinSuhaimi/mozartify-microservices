console.log("✅ Analytics routes loaded");
const express = require("express");
const router = express.Router();

const analyticsController = require("./analytics.controller");

router.get("/admin/stats", analyticsController.getSystemStats);

module.exports = router;