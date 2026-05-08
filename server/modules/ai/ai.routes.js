console.log("✅ AI routes loaded");
const router = require("express").Router();
const aiController = require("./ai.controller");

router.post("/predictEmotion", aiController.predictEmotion);
router.post("/predictGender", aiController.predictGender);
router.post("/predictGenre", aiController.predictGenre);
// router.post("/predictInstrument", aiController.predictInstrument);

module.exports = router;
