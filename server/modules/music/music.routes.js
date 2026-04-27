console.log("✅ Music routes loaded");
const router = require("express").Router();
const musicController = require("./music.controller");

router.get("/refine-search", musicController.getMusicRefineSearch);
router.post("/search-music", musicController.searchMusic);

module.exports = router;