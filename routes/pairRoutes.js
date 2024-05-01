const express = require("express");
const {
  getPairHistory,
  savePairHistory,
} = require("../controllers/pairController");

const router = express.Router();

router.get("/:teacherId", getPairHistory);
router.post("/", savePairHistory);

module.exports = router;
