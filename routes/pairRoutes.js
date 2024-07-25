const express = require("express");
const {
  getPairHistory,
  getPairHistoryList,
  getSelectedPairHistory,
  savePairHistory,
} = require("../controllers/pairController");

const router = express.Router();

router.get("/:teacherId", getPairHistory);
router.get("/list/:teacherId", getPairHistoryList);
router.get("/:teacherId/:historyId", getSelectedPairHistory);
router.post("/", savePairHistory);

module.exports = router;
