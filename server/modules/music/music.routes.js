const router = require("express").Router();
const musicController = require("./music.controller");

router.get("/refine-search", musicController.getMusicRefineSearch);

module.exports = router;