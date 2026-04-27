const router = require("express").Router();
const artsController = require("./arts.controller");

router.get("/artwork-refine-search", artsController.getArtworkRefineSearch);

module.exports = router;